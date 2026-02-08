import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { normalizeDocId } from '@yunke/nbstore/utils/doc-id';
import {
  emitSessionActivity,
  sanitizeSessionIdentifier,
} from '@yunke/nbstore';
import { DebugLogger } from '@yunke/debug';

import { uint8ArrayToBase64 } from '../utils';
import { emitStorageError } from '../../storage/storage-events';
import {
  type OfflineOperation,
  saveOfflineOperationIDB,
  getOfflineOperationsIDB,
  clearOfflineOperationsIDB,
  getDocOperationsCountIDB,
  deleteOldestDocOperationIDB,
  trimOfflineOperationsIDB,
  migrateFromLocalStorage,
  initOfflineStorage,
  isIndexedDBStorageAvailable,
  MAX_OFFLINE_OPERATIONS_IDB,
} from '../utils/offline-storage';
import { safeStorage, LogThrottle } from '../utils/safe-storage';
import {
  SYNC_STATUS_RESET_DELAY_MS,
  MAX_OFFLINE_SYNC_DELAY_MS,
  RECONNECT_BASE_DELAY_MS,
  MAX_OFFLINE_SYNC_FAILURES,
} from '../constants';

const logger = new DebugLogger('yunke:cloud-storage:offline');

// localStorage 回退用常量
const OFFLINE_OPERATIONS_KEY = 'cloud_storage_offline_operations';
const MAX_OFFLINE_OPERATIONS = 500;
const MAX_OFFLINE_STORAGE_BYTES = 2 * 1024 * 1024;

export interface UseOfflineOperationsParams {
  currentWorkspaceId: string | null;
  sessionId: string;
  normalizedLocalSessionId: string;
  socketRef: React.MutableRefObject<Socket | null>;
  clientIdRef: React.MutableRefObject<string | null>;
  cloudEnabledRef: React.MutableRefObject<boolean>;
  setLastSync: (date: Date) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error') => void;
  setSyncError: (error: string | null) => void;
}

/**
 * 离线操作管理 Hook
 * 负责离线操作的保存、读取、清理、同步，支持 IndexedDB + localStorage 双后端
 */
export function useOfflineOperations({
  currentWorkspaceId,
  sessionId,
  normalizedLocalSessionId,
  socketRef,
  clientIdRef,
  cloudEnabledRef,
  setLastSync,
  setSyncStatus,
  setSyncError,
}: UseOfflineOperationsParams) {
  const [offlineOperationsCount, setOfflineOperationsCount] = useState(0);
  const offlineSyncStatsRef = useRef<{
    failures: number;
    nextRetryAt: number;
  }>({
    failures: 0,
    nextRetryAt: 0,
  });
  const logThrottle = useRef(new LogThrottle());
  const syncOfflineOperationsRef = useRef<(() => Promise<void>) | null>(null);

  // --- 工具函数 ---

  const trimOfflineOperationsLS = (operations: OfflineOperation[]) => {
    let trimmed = operations;
    if (trimmed.length > MAX_OFFLINE_OPERATIONS) {
      trimmed = trimmed.slice(trimmed.length - MAX_OFFLINE_OPERATIONS);
    }
    let raw = JSON.stringify(trimmed);
    if (raw.length > MAX_OFFLINE_STORAGE_BYTES) {
      while (trimmed.length > 0 && raw.length > MAX_OFFLINE_STORAGE_BYTES) {
        trimmed = trimmed.slice(1);
        raw = JSON.stringify(trimmed);
      }
    }
    return { trimmed, raw };
  };

  // --- 核心操作 ---

  const saveOfflineOperation = useCallback(
    async (docId: string, update: Uint8Array) => {
      if (!currentWorkspaceId) return;

      const normalizedDocId = normalizeDocId(docId);
      const updateBase64 = await uint8ArrayToBase64(update);

      const operation: OfflineOperation = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        docId: normalizedDocId,
        update: updateBase64,
        timestamp: Date.now(),
        spaceId: currentWorkspaceId,
        spaceType: 'workspace',
        sessionId: sanitizeSessionIdentifier(sessionId) ?? sessionId,
        clientId:
          sanitizeSessionIdentifier(clientIdRef.current) ?? undefined,
      };

      // 优先使用 IndexedDB
      if (isIndexedDBStorageAvailable()) {
        try {
          const MAX_OPERATIONS_PER_DOC = 50;
          const docCount =
            await getDocOperationsCountIDB(normalizedDocId);
          if (docCount >= MAX_OPERATIONS_PER_DOC) {
            await deleteOldestDocOperationIDB(normalizedDocId);
            logger.debug(
              '同一文档操作过多，移除最旧操作',
              normalizedDocId
            );
          }

          await saveOfflineOperationIDB(operation);

          const trimmedCount = await trimOfflineOperationsIDB();
          if (trimmedCount > 0) {
            emitStorageError({
              type: 'offline-overflow',
              message: `离线操作队列已满，${trimmedCount} 条旧操作已被丢弃。建议尽快连接网络同步数据。`,
              details: {
                discardedCount: trimmedCount,
                maxOperations: MAX_OFFLINE_OPERATIONS_IDB,
              },
            });
          }

          const operations = await getOfflineOperationsIDB();
          setOfflineOperationsCount(operations.length);
          return;
        } catch (error) {
          logger.warn('IndexedDB 保存失败，回退到 localStorage', error);
        }
      }

      // 回退到 localStorage
      const existing = safeStorage.getItem(OFFLINE_OPERATIONS_KEY);
      let operations: OfflineOperation[] = [];
      if (existing) {
        try {
          operations = JSON.parse(existing);
        } catch (error) {
          logger.warn('解析离线操作失败，重置缓存', error);
          operations = [];
        }
      }

      const MAX_OPERATIONS_PER_DOC = 10;
      const sameDocOps = operations.filter(
        op => op.docId === normalizedDocId
      );
      if (sameDocOps.length >= MAX_OPERATIONS_PER_DOC) {
        const oldest = sameDocOps.sort(
          (a, b) => a.timestamp - b.timestamp
        )[0];
        operations = operations.filter(op => op.id !== oldest.id);
        logger.debug(
          '同一文档操作过多，移除最旧操作',
          normalizedDocId
        );
      }

      operations.push(operation);

      const { trimmed, raw } = trimOfflineOperationsLS(operations);
      if (trimmed.length !== operations.length) {
        const discardedCount = operations.length - trimmed.length;
        logger.warn(
          '离线操作数量过多，已裁剪至上限',
          MAX_OFFLINE_OPERATIONS
        );
        emitStorageError({
          type: 'offline-overflow',
          message: `离线操作队列已满，${discardedCount} 条旧操作已被丢弃。建议尽快连接网络同步数据。`,
          details: {
            discardedCount,
            maxOperations: MAX_OFFLINE_OPERATIONS,
          },
        });
      }
      safeStorage.setItem(OFFLINE_OPERATIONS_KEY, raw);
      setOfflineOperationsCount(trimmed.length);
    },
    [currentWorkspaceId, sessionId, clientIdRef]
  );

  const getOfflineOperations = useCallback(async (): Promise<
    OfflineOperation[]
  > => {
    if (isIndexedDBStorageAvailable()) {
      try {
        const operations = await getOfflineOperationsIDB();
        return operations.map(op => ({
          ...op,
          docId: normalizeDocId(op.docId),
          sessionId:
            sanitizeSessionIdentifier(op.sessionId) ?? sessionId,
          clientId:
            sanitizeSessionIdentifier(op.clientId) ?? undefined,
        }));
      } catch (error) {
        logger.warn(
          'IndexedDB 读取失败，回退到 localStorage',
          error
        );
      }
    }

    const existing = safeStorage.getItem(OFFLINE_OPERATIONS_KEY);
    if (!existing) {
      return [];
    }
    try {
      const parsed: OfflineOperation[] = JSON.parse(existing);
      return parsed.map(op => ({
        ...op,
        docId: normalizeDocId(op.docId),
        sessionId:
          sanitizeSessionIdentifier(op.sessionId) ?? sessionId,
        clientId:
          sanitizeSessionIdentifier(op.clientId) ?? undefined,
      }));
    } catch (error) {
      logger.warn('解析离线操作失败，重置缓存', error);
      safeStorage.removeItem(OFFLINE_OPERATIONS_KEY);
      return [];
    }
  }, [sessionId]);

  const clearOfflineOperations = useCallback(async () => {
    if (isIndexedDBStorageAvailable()) {
      try {
        await clearOfflineOperationsIDB();
      } catch (error) {
        logger.warn('IndexedDB 清空失败', error);
      }
    }
    safeStorage.removeItem(OFFLINE_OPERATIONS_KEY);
    setOfflineOperationsCount(0);
  }, []);

  const syncOfflineOperations = useCallback(async (): Promise<void> => {
    if (!cloudEnabledRef.current) {
      return;
    }
    const currentSocket = socketRef.current;
    if (!currentWorkspaceId || !currentSocket?.connected) {
      logger.warn('无法同步：缺少workspace或连接');
      return;
    }

    const now = Date.now();
    if (offlineSyncStatsRef.current.nextRetryAt > now) {
      const waitMs = offlineSyncStatsRef.current.nextRetryAt - now;
      logThrottle.current.log('offline-sync-backoff', () => {
        logger.warn('离线同步等待退避窗口', { waitMs });
      });
      return;
    }

    const allOperations = await getOfflineOperations();
    const operations = allOperations
      .filter(op => op.spaceId === currentWorkspaceId)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (operations.length === 0) {
      offlineSyncStatsRef.current = { failures: 0, nextRetryAt: 0 };
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);

    const failedOperationIds = new Set<string>();

    for (const operation of operations) {
      try {
        emitSessionActivity({
          sessionId:
            sanitizeSessionIdentifier(operation.sessionId) ??
            normalizedLocalSessionId,
          clientId:
            sanitizeSessionIdentifier(operation.clientId) ??
            sanitizeSessionIdentifier(clientIdRef.current) ??
            null,
          source: 'local',
        });
        const result = await currentSocket.emitWithAck(
          'space:push-doc-update',
          {
            spaceType: operation.spaceType || 'workspace',
            spaceId: operation.spaceId,
            docId: normalizeDocId(operation.docId),
            update: operation.update,
            sessionId:
              sanitizeSessionIdentifier(operation.sessionId) ??
              sessionId,
            clientId:
              sanitizeSessionIdentifier(operation.clientId) ??
              sanitizeSessionIdentifier(clientIdRef.current) ??
              undefined,
          }
        );

        if ('error' in result) {
          throw new Error(result.error.message);
        }
      } catch (error) {
        failedOperationIds.add(operation.id);
        logger.error(`离线操作同步失败: ${operation.id}`, error);
      }
    }

    if (failedOperationIds.size === 0) {
      await clearOfflineOperations();
      setLastSync(new Date());
      offlineSyncStatsRef.current = { failures: 0, nextRetryAt: 0 };
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), SYNC_STATUS_RESET_DELAY_MS);
      return;
    }

    // 部分失败：保留失败的操作
    const attemptedIds = new Set(operations.map(op => op.id));
    const latestOperations = await getOfflineOperations();
    const remainingOperations = latestOperations.filter(op => {
      const attempted = attemptedIds.has(op.id);
      const failed = failedOperationIds.has(op.id);
      return !attempted || failed;
    });

    if (isIndexedDBStorageAvailable()) {
      try {
        await clearOfflineOperationsIDB();
        for (const op of remainingOperations) {
          await saveOfflineOperationIDB(op);
        }
      } catch (error) {
        logger.warn(
          'IndexedDB 更新失败，回退到 localStorage',
          error
        );
        safeStorage.setItem(
          OFFLINE_OPERATIONS_KEY,
          JSON.stringify(remainingOperations)
        );
      }
    } else {
      safeStorage.setItem(
        OFFLINE_OPERATIONS_KEY,
        JSON.stringify(remainingOperations)
      );
    }
    setOfflineOperationsCount(remainingOperations.length);

    const nextFailures = Math.min(
      offlineSyncStatsRef.current.failures + 1,
      MAX_OFFLINE_SYNC_FAILURES
    );
    const delay = Math.min(MAX_OFFLINE_SYNC_DELAY_MS, Math.pow(2, nextFailures) * RECONNECT_BASE_DELAY_MS);
    offlineSyncStatsRef.current = {
      failures: nextFailures,
      nextRetryAt: Date.now() + delay,
    };

    setSyncStatus('error');
    setSyncError(
      `${failedOperationIds.size} 个离线操作同步失败，将在 ${Math.round(delay / 1000)} 秒后重试`
    );

    logThrottle.current.log('offline-sync-scheduled', () => {
      logger.warn('离线同步失败，计划重试', { delay });
    });
  }, [
    currentWorkspaceId,
    sessionId,
    normalizedLocalSessionId,
    getOfflineOperations,
    clearOfflineOperations,
    socketRef,
    clientIdRef,
    cloudEnabledRef,
    setLastSync,
    setSyncStatus,
    setSyncError,
  ]);

  // 同步 ref
  useEffect(() => {
    syncOfflineOperationsRef.current = syncOfflineOperations;
  }, [syncOfflineOperations]);

  // 初始化时读取离线操作数量并执行迁移
  useEffect(() => {
    const initStorage = async () => {
      await initOfflineStorage();
      await migrateFromLocalStorage(OFFLINE_OPERATIONS_KEY, safeStorage);
      const operations = await getOfflineOperations();
      setOfflineOperationsCount(operations.length);
    };
    initStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    offlineOperationsCount,
    saveOfflineOperation,
    getOfflineOperations,
    clearOfflineOperations,
    syncOfflineOperations,
    syncOfflineOperationsRef,
  };
}
