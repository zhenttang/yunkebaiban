import { useState, useEffect, useRef, createContext, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { normalizeDocId } from '@yunke/nbstore/utils/doc-id';
import {
  getOrCreateSessionId,
  emitSessionActivity,
  NBSTORE_SESSION_ACTIVITY_EVENT,
  sanitizeSessionIdentifier,
  type SessionActivityDetail,
} from '@yunke/nbstore';
import { uint8ArrayToBase64, isEmptyUpdate, isValidYjsUpdate, logYjsUpdateInfo } from './utils';
import { getSocketIOUrl as getUnifiedSocketIOUrl } from '@yunke/config';

// 安全的 Storage 访问包装器（兼容 Electron sandbox）
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      // 优先使用 Electron 的 sharedStorage (globalState)
      if (typeof window !== 'undefined' && (window as any).__sharedStorage?.globalState) {
        return (window as any).__sharedStorage.globalState.get(key) ?? null;
      }
      // 回退到 localStorage
      return localStorage?.getItem(key) ?? null;
    } catch (error) {
      console.warn('[SafeStorage] getItem 失败:', key, error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      // 优先使用 Electron 的 sharedStorage (globalState)
      if (typeof window !== 'undefined' && (window as any).__sharedStorage?.globalState) {
        (window as any).__sharedStorage.globalState.set(key, value);
        return;
      }
      // 回退到 localStorage
      localStorage?.setItem(key, value);
    } catch (error) {
      console.warn('[SafeStorage] setItem 失败:', key, error);
    }
  },
  removeItem: (key: string): void => {
    try {
      // 优先使用 Electron 的 sharedStorage (globalState)
      if (typeof window !== 'undefined' && (window as any).__sharedStorage?.globalState) {
        (window as any).__sharedStorage.globalState.del(key);
        return;
      }
      // 回退到 localStorage
      localStorage?.removeItem(key);
    } catch (error) {
      console.warn('[SafeStorage] removeItem 失败:', key, error);
    }
  }
};

// 日志限流工具
class LogThrottle {
  private lastLogTime = new Map<string, number>();
  private logCount = new Map<string, number>();
  private readonly throttleMs = 1000; // 1秒内最多1条相同日志
  
  log(key: string, logFn: () => void) {
    const now = Date.now();
    const lastTime = this.lastLogTime.get(key) || 0;
    if (now - lastTime > this.throttleMs) {
      logFn();
      this.lastLogTime.set(key, now);
      this.logCount.set(key, 1);
    } else {
      const count = (this.logCount.get(key) || 0) + 1;
      this.logCount.set(key, count);
    }
  }
}

/**
 * 获取Socket.IO连接URL
 * 使用@yunke/config统一管理网络配置
 */
function getSocketIOUrl(): string {
  // 使用统一的网络配置管理
  const url = getUnifiedSocketIOUrl();
  return url;
}

// 本地缓存键
const OFFLINE_OPERATIONS_KEY = 'cloud_storage_offline_operations';
const MAX_OFFLINE_OPERATIONS = 500;
const MAX_OFFLINE_STORAGE_BYTES = 2 * 1024 * 1024;

const awaitWithTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      timer = null;
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then(result => {
        if (timer !== null) {
          clearTimeout(timer);
        }
        resolve(result);
      })
      .catch(error => {
        if (timer !== null) {
          clearTimeout(timer);
        }
        reject(error);
      });
  });
};

// 离线操作类型 - 严格按照YUNKE格式
interface OfflineOperation {
  id: string;
  docId: string;
  update: string; // Base64编码的更新数据
  timestamp: number;
  spaceId: string; // 使用spaceId而不是workspaceId
  spaceType: 'workspace' | 'userspace'; // 添加空间类型
  sessionId: string;
  clientId?: string | null;
}

interface SessionDisplayInfo {
  sessionId: string;
  label: string;
  clientId: string | null;
  isLocal: boolean;
  lastSeen: number;
}

const SESSION_ACTIVITY_TTL = 5 * 60 * 1000;

export interface CloudStorageStatus {
  isConnected: boolean;
  storageMode: 'detecting' | 'local' | 'cloud' | 'error';
  lastSync: Date | null;
  socket: Socket | null;
  reconnect: () => Promise<void>;
  pushDocUpdate: (docId: string, update: Uint8Array) => Promise<number>;
  currentWorkspaceId: string | null;
  isOnline: boolean;
  pendingOperationsCount: number;
  offlineOperationsCount: number;
  syncOfflineOperations: () => Promise<void>;
  sessionId: string;
  clientId: string | null;
  sessions: SessionDisplayInfo[];
}

const CloudStorageContext = createContext<CloudStorageStatus | null>(null);

export const useCloudStorage = () => {
  const context = useContext(CloudStorageContext);
  if (!context) {
    throw new Error('useCloudStorage must be used within CloudStorageProvider');
  }
  return context;
};

interface CloudStorageProviderProps {
  children: React.ReactNode;
  serverUrl?: string;
  enabled?: boolean;
}

export const CloudStorageProvider = ({ 
  children, 
  serverUrl: serverUrlProp,
  enabled = true,
}: CloudStorageProviderProps) => {
  // 🔧 修复：将 serverUrl 默认值计算移到组件内部，避免在函数参数中执行副作用
  const serverUrl = useMemo(() => {
    return serverUrlProp ?? getSocketIOUrl();
  }, [serverUrlProp]);
  const cloudEnabled = enabled;
  const params = useParams();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const normalizedLocalSessionId = useMemo(
    () => sanitizeSessionIdentifier(sessionId) ?? sessionId,
    [sessionId]
  );
  const [isConnected, setIsConnected] = useState(false);
  const [storageMode, setStorageMode] = useState<CloudStorageStatus['storageMode']>('detecting');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5; // 增加最大重连次数
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isOnline, setIsOnline] = useState(() => {
    try {
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    } catch {
      return true; // 默认假设在线
    }
  });
  const pendingOperations = useRef<Array<{
    docId: string;
    update: Uint8Array;
    resolve: (value: number) => void;
    reject: (reason: any) => void;
  }>>([]);
  const offlineSyncStatsRef = useRef<{ failures: number; nextRetryAt: number }>({
    failures: 0,
    nextRetryAt: 0,
  });
  const [offlineOperationsCount, setOfflineOperationsCount] = useState(0);
  const clientIdRef = useRef<string | null>(null);
  const sessionsRef = useRef<Map<string, SessionDisplayInfo>>(new Map());
  const sessionAliasRef = useRef<Map<string, number>>(new Map());
  const sessionAliasCounterRef = useRef(1);
  const [sessions, setSessions] = useState<SessionDisplayInfo[]>([]);
  const updateSessionsState = useCallback(() => {
    const ordered = Array.from(sessionsRef.current.values()).sort((a, b) => {
      if (a.isLocal !== b.isLocal) {
        return a.isLocal ? -1 : 1;
      }
      return a.label.localeCompare(b.label, 'zh-Hans');
    });
    setSessions(ordered);
  }, []);
  
  // 动态获取当前workspaceId，需在依赖该值的hook之前定义
  const currentWorkspaceId = useMemo(() => {
    // 从URL路由参数获取
    if (params.workspaceId) {
      const workspaceId = params.workspaceId;
      if (workspaceId.length === 36 && workspaceId.includes('-')) {
        safeStorage.setItem('last_workspace_id', workspaceId);
        return workspaceId;
      }

      if (workspaceId.length === 21 && !workspaceId.includes('-')) {
        const storedLongId = safeStorage.getItem('last_workspace_id');
        if (storedLongId && storedLongId.length === 36 && storedLongId.includes('-')) {
          return storedLongId;
        }
      }

      return workspaceId;
    }

    const lastWorkspaceId = safeStorage.getItem('last_workspace_id');
    if (lastWorkspaceId) {
      return lastWorkspaceId;
    }

    return null;
  }, [params.workspaceId]);

  // 🔧 修复1: 添加连接状态保护，防止重复连接
  const isConnectingRef = useRef(false);
  const logThrottle = useRef(new LogThrottle());
  const socketRef = useRef<Socket | null>(null); // 🔧 使用 ref 存储 socket，避免 useEffect 依赖
  const lastWorkspaceIdRef = useRef<string | null>(null); // 🔧 跟踪上次的 workspaceId，避免不必要的重连
  const lastServerUrlRef = useRef<string | null>(null); // 🔧 跟踪上次的 serverUrl，避免不必要的重连
  const isOnlineRef = useRef(isOnline); // 🔧 使用 ref 存储 isOnline，避免 connectToSocket 频繁重新创建
  const serverUrlRef = useRef(serverUrl); // 🔧 使用 ref 存储 serverUrl，避免 connectToSocket 频繁重新创建
  const connectToSocketRef = useRef<(() => Promise<void>) | null>(null); // 🔧 存储 connectToSocket 引用，用于网络状态监听
  const syncOfflineOperationsRef = useRef<(() => Promise<void>) | null>(null); // 🔧 存储 syncOfflineOperations 引用，用于网络恢复时同步
  const activeJoinAttemptRef = useRef<symbol | null>(null);
  const cloudEnabledRef = useRef(cloudEnabled);

  const upsertSessionInfo = useCallback(
    (sessionIdRaw: string | null, clientIdRaw: string | null, _source: SessionActivityDetail['source']) => {
      const sessionIdSanitized = sanitizeSessionIdentifier(sessionIdRaw) ?? null;
      if (!sessionIdSanitized) {
        return;
      }

      const now = Date.now();
      const isLocal = sessionIdSanitized === normalizedLocalSessionId;

      let label: string;
      if (isLocal) {
        label = '当前浏览器';
      } else {
        let alias = sessionAliasRef.current.get(sessionIdSanitized);
        if (!alias) {
          alias = sessionAliasCounterRef.current++;
          sessionAliasRef.current.set(sessionIdSanitized, alias);
        }
        label = `其它浏览器 ${alias}`;
      }

      const clientId = sanitizeSessionIdentifier(clientIdRaw) ?? null;
      const existing = sessionsRef.current.get(sessionIdSanitized);
      sessionsRef.current.set(sessionIdSanitized, {
        sessionId: sessionIdSanitized,
        label,
        clientId: clientId ?? existing?.clientId ?? null,
        isLocal,
        lastSeen: now,
      });

      // 清理超时的远程会话
      for (const [id, info] of sessionsRef.current.entries()) {
        if (!info.isLocal && now - info.lastSeen > SESSION_ACTIVITY_TTL) {
          sessionsRef.current.delete(id);
          sessionAliasRef.current.delete(id);
        }
      }

      updateSessionsState();
    },
    [normalizedLocalSessionId, updateSessionsState]
  );

  const removeSessionInfo = useCallback(
    (sessionIdRaw: string | null) => {
      const sessionIdSanitized = sanitizeSessionIdentifier(sessionIdRaw) ?? null;
      if (!sessionIdSanitized) {
        return;
      }

      const existed = sessionsRef.current.delete(sessionIdSanitized);
      sessionAliasRef.current.delete(sessionIdSanitized);

      if (existed) {
        updateSessionsState();
      }
    },
    [updateSessionsState]
  );

  const trimOfflineOperations = (operations: OfflineOperation[]) => {
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

  // 保存离线操作 - 按照YUNKE标准格式
  const saveOfflineOperation = async (docId: string, update: Uint8Array) => {
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
      clientId: sanitizeSessionIdentifier(clientIdRef.current),
    };

    // 从safeStorage读取现有操作
    const existing = safeStorage.getItem(OFFLINE_OPERATIONS_KEY);
    let operations: OfflineOperation[] = [];
    if (existing) {
      try {
        operations = JSON.parse(existing);
      } catch (error) {
        console.warn('[cloud-storage] 解析离线操作失败，重置缓存', error);
        operations = [];
      }
    }
    
    // 添加新操作
    operations.push(operation);
    
    // 保存回safeStorage
    const { trimmed, raw } = trimOfflineOperations(operations);
    if (trimmed.length !== operations.length) {
      console.warn(
        '[cloud-storage] 离线操作数量过多，已裁剪至上限:',
        MAX_OFFLINE_OPERATIONS
      );
    }
    safeStorage.setItem(OFFLINE_OPERATIONS_KEY, raw);
    setOfflineOperationsCount(trimmed.length);
    
  };

  const getOfflineOperations = (): OfflineOperation[] => {
    const existing = safeStorage.getItem(OFFLINE_OPERATIONS_KEY);
    if (!existing) {
      return [];
    }
    try {
      const parsed: OfflineOperation[] = JSON.parse(existing);
      return parsed.map(op => ({
        ...op,
        docId: normalizeDocId(op.docId),
        sessionId: sanitizeSessionIdentifier(op.sessionId) ?? sessionId,
        clientId: sanitizeSessionIdentifier(op.clientId),
      }));
    } catch (error) {
      console.warn('[cloud-storage] 解析离线操作失败，重置缓存', error);
      safeStorage.removeItem(OFFLINE_OPERATIONS_KEY);
      return [];
    }
  };

  const clearOfflineOperations = () => {
    safeStorage.removeItem(OFFLINE_OPERATIONS_KEY);
    setOfflineOperationsCount(0);
  };

  // 🔧 修复5: 同步离线操作 - 使用useCallback
  // 🔧 Bug #3 修复：使用 socketRef.current 替代 socket 状态，避免闭包问题
  const syncOfflineOperations = useCallback(async (): Promise<void> => {
    if (!cloudEnabledRef.current) {
      return;
    }
    // 🔧 Bug #3 修复：使用 socketRef.current 获取最新 socket 实例
    const currentSocket = socketRef.current;
    if (!currentWorkspaceId || !currentSocket?.connected) {
      console.warn('⚠️ [云存储管理器] 无法同步：缺少workspace或连接');
      return;
    }

    const now = Date.now();
    if (offlineSyncStatsRef.current.nextRetryAt > now) {
      const waitMs = offlineSyncStatsRef.current.nextRetryAt - now;
      logThrottle.current.log('offline-sync-backoff', () => {
        console.warn('⚠️ [云存储管理器] 离线同步等待退避窗口，剩余(ms):', waitMs);
      });
      return;
    }

    const operations = getOfflineOperations()
      .filter(op => op.spaceId === currentWorkspaceId)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (operations.length === 0) {
      offlineSyncStatsRef.current = { failures: 0, nextRetryAt: 0 };
      return;
    }

    const failedOperationIds = new Set<string>();

    for (const operation of operations) {
      try {
        emitSessionActivity({
          sessionId: sanitizeSessionIdentifier(operation.sessionId) ?? normalizedLocalSessionId,
          clientId:
            sanitizeSessionIdentifier(operation.clientId) ??
            sanitizeSessionIdentifier(clientIdRef.current) ??
            null,
          source: 'local',
        });
        // 🔧 Bug #3 修复：使用 currentSocket 发送请求
        const result = await currentSocket.emitWithAck('space:push-doc-update', {
          spaceType: operation.spaceType || 'workspace',
          spaceId: operation.spaceId,
          docId: normalizeDocId(operation.docId),
          update: operation.update,
          sessionId: sanitizeSessionIdentifier(operation.sessionId) ?? sessionId,
          clientId:
            sanitizeSessionIdentifier(operation.clientId) ??
            sanitizeSessionIdentifier(clientIdRef.current) ??
            undefined,
        });

        if ('error' in result) {
          throw new Error(result.error.message);
        }
      } catch (error) {
        failedOperationIds.add(operation.id);
        console.error(`❌ [云存储管理器] 离线操作同步失败: ${operation.id}`, error);
      }
    }

    if (failedOperationIds.size === 0) {
      clearOfflineOperations();
      setLastSync(new Date());
      offlineSyncStatsRef.current = { failures: 0, nextRetryAt: 0 };
      return;
    }

    const attemptedIds = new Set(operations.map(op => op.id));
    const remainingOperations = getOfflineOperations().filter(op => {
      const attempted = attemptedIds.has(op.id);
      const failed = failedOperationIds.has(op.id);
      return !attempted || failed;
    });

    safeStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(remainingOperations));
    setOfflineOperationsCount(remainingOperations.length);

    const nextFailures = Math.min(offlineSyncStatsRef.current.failures + 1, 5);
    const delay = Math.min(30000, Math.pow(2, nextFailures) * 1000);
    offlineSyncStatsRef.current = {
      failures: nextFailures,
      nextRetryAt: Date.now() + delay,
    };

    logThrottle.current.log('offline-sync-scheduled', () => {
      console.warn('⚠️ [云存储管理器] 离线同步失败，计划', delay, 'ms后重试');
    });
  }, [currentWorkspaceId, sessionId, normalizedLocalSessionId]); // 🔧 Bug #3 修复：移除 socket 依赖

  // 初始化时读取离线操作数量
  useEffect(() => {
    const operations = getOfflineOperations();
    setOfflineOperationsCount(operations.length);
  }, []);

  // 🔧 修复：同步 isOnlineRef 和 serverUrlRef
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);
  useEffect(() => {
    cloudEnabledRef.current = cloudEnabled;
  }, [cloudEnabled]);
  
  useEffect(() => {
    serverUrlRef.current = serverUrl;
  }, [serverUrl]);

  // 🔧 Bug #1 修复：同步 syncOfflineOperationsRef
  useEffect(() => {
    syncOfflineOperationsRef.current = syncOfflineOperations;
  }, [syncOfflineOperations]);

  // 🔧 修复：网络状态监听 - 使用 ref 避免闭包问题
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      isOnlineRef.current = true;
      // 网络恢复时立即尝试重连 - 使用 ref 获取最新值
      const currentSocket = socketRef.current;
      if (!currentSocket?.connected && currentWorkspaceId) {
        reconnectAttempts.current = 0;
        // 使用 ref 中的 connectToSocket，避免闭包问题
        if (connectToSocketRef.current) {
          connectToSocketRef.current();
        }
      } else if (currentSocket?.connected) {
        // 🔧 Bug #1 修复：网络恢复且已连接时，立即同步离线操作
        if (syncOfflineOperationsRef.current) {
          syncOfflineOperationsRef.current();
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      isOnlineRef.current = false;
      setStorageMode('local');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentWorkspaceId]); // 🔧 移除 isConnected 依赖，使用 socketRef 检查连接状态

  // 处理排队的操作
  const processPendingOperations = async () => {
    const operations = [...pendingOperations.current];
    pendingOperations.current = [];


    for (const operation of operations) {
      try {
        const timestamp = await pushDocUpdate(operation.docId, operation.update);
        operation.resolve(timestamp);
      } catch (error) {
        operation.reject(error);
      }
    }
  };

  // 🔧 修复1: 已删除重复的useEffect，合并到下方统一的连接管理useEffect中

  // 🔧 修复2&3&4: 连接Socket.IO - 添加状态保护、闭包修复、日志限流
  // 🔧 必须定义在 pushDocUpdate 之前，因为 pushDocUpdate 依赖它
  const connectToSocket = useCallback(async (): Promise<void> => {
    if (!cloudEnabledRef.current) {
      setIsConnected(false);
      setStorageMode('local');
      return;
    }
    // 🔧 防止重复连接
    if (isConnectingRef.current) {
      logThrottle.current.log('duplicate-connect', () => {
        console.warn('⚠️ [云存储管理器] 连接进行中，跳过重复连接');
      });
      return;
    }

    // 🔧 检查是否已连接且 workspaceId 未变化
    const currentSocket = socketRef.current;
    if (currentSocket?.connected && currentWorkspaceId === lastWorkspaceIdRef.current) {
      // 🔧 修复：确保状态同步，但避免不必要的状态更新
      // 只在状态确实不同步时才更新，减少连锁反应
      if (!isConnected) {
        // 使用 setTimeout 延迟更新，避免在 connectToSocket 执行过程中触发其他 useEffect
        setTimeout(() => setIsConnected(true), 0);
      }
      return;
    }

    if (!currentWorkspaceId) {
      logThrottle.current.log('no-workspace', () => {
        console.warn('⚠️ [云存储管理器] 无法连接：缺少workspaceId');
      });
      setStorageMode('local');
      return;
    }

    // 如果网络离线，不尝试连接 - 使用 ref 获取最新值
    if (!isOnlineRef.current) {
      logThrottle.current.log('offline', () => {
        console.warn('⚠️ [云存储管理器] 网络离线，跳过连接');
      });
      setStorageMode('local');
      return;
    }

    // 检查是否超过最大重连次数
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      logThrottle.current.log('max-retries', () => {
        console.warn('⚠️ [云存储管理器] 超过最大重连次数，切换到本地模式');
      });
      setStorageMode('local');
      return;
    }

    try {
      isConnectingRef.current = true; // 🔧 标记连接中
      setStorageMode('detecting');

      const { io } = await import('socket.io-client');

      // 🔧 使用 ref 获取最新的 serverUrl，避免闭包问题
      const currentServerUrl = serverUrlRef.current;

      // 🔐 获取真实的JWT token用于Socket.IO认证
      const authToken =
        safeStorage.getItem('yunke-admin-token') ??
        safeStorage.getItem('yunke-access-token');

      const newSocket = io(currentServerUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: false, // 我们手动处理重连
        auth: authToken ? { token: authToken } : {},
        // 同时在query参数中传递token（后端支持从query获取）
        query: authToken ? { token: authToken } : {}
      });
      const handleRemoteSessionEnded = (message: { spaceId?: string; sessionId?: string }) => {
        if (!message?.sessionId) {
          return;
        }
        if (message.spaceId && message.spaceId !== currentWorkspaceId) {
          return;
        }
        removeSessionInfo(message.sessionId);
      };
      newSocket.on('space:session-ended', handleRemoteSessionEnded);

      // 连接成功
      newSocket.on('connect', () => {
        setIsConnected(true);
        setSocket(newSocket);
        socketRef.current = newSocket; // 🔧 同步更新 ref
        lastWorkspaceIdRef.current = currentWorkspaceId; // 🔧 记录当前 workspaceId
        reconnectAttempts.current = 0;
        isConnectingRef.current = false; // 🔧 连接成功，重置标记
        
        // 🔧 修复：改用 emitWithAck 确保响应格式一致，并添加超时处理
        // 使用 emitWithAck 而不是 emit，因为服务器可能返回 { data: { clientId: ... } } 格式
        (async () => {
          try {
            const joinData = {
              spaceType: 'workspace' as const,
              spaceId: currentWorkspaceId,
              clientVersion: '1.0.0'
            };
            
            const joinAttemptId = Symbol('space:join');
            activeJoinAttemptRef.current = joinAttemptId;
            const finalizeJoinAttempt = () => {
              if (activeJoinAttemptRef.current === joinAttemptId) {
                activeJoinAttemptRef.current = null;
              }
            };

            const joinPromise = newSocket.emitWithAck('space:join', joinData);
            const response = await awaitWithTimeout(
              joinPromise,
              10000,
              'space:join timeout after 10s'
            );

            if (activeJoinAttemptRef.current !== joinAttemptId) {
              return;
            }
            
            // 处理响应 - 兼容多种响应格式
            if (typeof response === 'object' && response) {
              // 格式1: { error: ... }
              if ('error' in response) {
                console.error('❌ [云存储管理器] 空间加入失败:', response.error);
                setStorageMode('error');
                finalizeJoinAttempt();
                return;
              }
              
              // 格式2: { data: { clientId: ... } } - emitWithAck 标准格式
              if ('data' in response && response.data) {
                const data = response.data as { clientId?: string | null };
                clientIdRef.current = sanitizeSessionIdentifier(data.clientId ?? null);
                setStorageMode('cloud');
                setLastSync(new Date());
                
                emitSessionActivity({
                  sessionId: normalizedLocalSessionId,
                  clientId: clientIdRef.current,
                  source: 'local',
                });
                
                // 处理排队的操作
                if (pendingOperations.current.length > 0) {
                  processPendingOperations();
                }
                // 🔧 Bug #2 修复：连接成功后同步离线操作
                if (syncOfflineOperationsRef.current) {
                  syncOfflineOperationsRef.current();
                }
                finalizeJoinAttempt();
                return;
              }
              
              // 格式3: { clientId: ... } - 直接格式
              if ('clientId' in response) {
                clientIdRef.current = sanitizeSessionIdentifier((response as { clientId: string | null }).clientId);
                setStorageMode('cloud');
                setLastSync(new Date());
                
                emitSessionActivity({
                  sessionId: normalizedLocalSessionId,
                  clientId: clientIdRef.current,
                  source: 'local',
                });
                
                // 处理排队的操作
                if (pendingOperations.current.length > 0) {
                  processPendingOperations();
                }
                // 🔧 Bug #2 修复：连接成功后同步离线操作
                if (syncOfflineOperationsRef.current) {
                  syncOfflineOperationsRef.current();
                }
                finalizeJoinAttempt();
                return;
              }
            }
            
            // 未知响应格式 - 但 socket 已连接，设置为 cloud 模式
            logThrottle.current.log('space-join-unknown-format', () => {
              console.warn('⚠️ [云存储管理器] space:join 响应格式未知，但 socket 已连接，设置为 cloud 模式', {
                response,
                responseType: typeof response,
                isObject: typeof response === 'object',
                keys: typeof response === 'object' ? Object.keys(response) : []
              });
            });
            // 🔧 修复：即使响应格式未知，也尝试设置为 cloud 模式，避免一直卡在 detecting
            // 因为 socket 已连接，只是响应格式可能不同
            setStorageMode('cloud');
            setLastSync(new Date());
            // 🔧 Bug #2 修复：连接成功后同步离线操作
            if (syncOfflineOperationsRef.current) {
              syncOfflineOperationsRef.current();
            }
            finalizeJoinAttempt();
            
          } catch (error) {
            console.error('❌ [云存储管理器] space:join 失败:', error);
            if (activeJoinAttemptRef.current) {
              activeJoinAttemptRef.current = null;
            }
            // 🔧 修复：连接超时或失败时，设置为 error 状态
            // 重连逻辑会在 disconnect 事件或 connect_error 事件中处理
            setStorageMode('error');
            // 断开连接，触发重连逻辑
            newSocket.disconnect();
          }
        })();
      });

      // 连接失败
      newSocket.on('connect_error', (error) => {
        logThrottle.current.log('connect-error', () => {
          console.warn('⚠️ [云存储管理器] 连接失败:', error.message);
        });
        setIsConnected(false);
        activeJoinAttemptRef.current = null;
        isConnectingRef.current = false; // 🔧 连接失败，重置标记
        newSocket.off('space:session-ended', handleRemoteSessionEnded);
        newSocket.disconnect();
        
        // 智能重连：指数退避
        scheduleReconnect();
      });

      // 连接断开
      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        clientIdRef.current = null;
        activeJoinAttemptRef.current = null;
        isConnectingRef.current = false; // 🔧 断开连接，重置标记
        newSocket.off('space:session-ended', handleRemoteSessionEnded);
        
        // 🔧 清理 ref
        if (socketRef.current === newSocket) {
          socketRef.current = null;
        }
        
        // 如果是意外断开，尝试重连
        if (reason !== 'io client disconnect') {
          scheduleReconnect();
        } else {
          setStorageMode('local');
        }
      });

      // 设置连接超时
      setTimeout(() => {
        if (!newSocket.connected) {
          logThrottle.current.log('connect-timeout', () => {
            console.warn('⏰ [云存储管理器] 连接超时');
          });
          isConnectingRef.current = false; // 🔧 超时，重置标记
          newSocket.disconnect();
          scheduleReconnect();
        }
      }, 5000);

    } catch (error) {
      console.error('❌ [云存储管理器] 初始化失败:', error);
      isConnectingRef.current = false; // 🔧 异常，重置标记
      scheduleReconnect();
    }
  }, [currentWorkspaceId, normalizedLocalSessionId, removeSessionInfo]); // 🔧 移除 isOnline 和 serverUrl 依赖，使用 ref 获取最新值
  
  // 🔧 修复：同步 connectToSocketRef
  useEffect(() => {
    connectToSocketRef.current = connectToSocket;
  }, [connectToSocket]);

  // 🔧 修复5: 推送文档更新（含离线与排队逻辑）- 使用useCallback
  // 🔧 定义在 connectToSocket 之后，因为依赖 connectToSocket
  const pushDocUpdate = useCallback(async (docId: string, update: Uint8Array): Promise<number> => {
    const normalizedDocId = normalizeDocId(docId);

    if (!currentWorkspaceId) {
      const error = new Error('No current workspace available');
      console.error('[cloud-storage] pushDocUpdate failed:', error.message);
      throw error;
    }

    if (isEmptyUpdate(update)) {
      return Date.now();
    }

    const enqueuePending = () =>
      new Promise<number>((resolve, reject) => {
        pendingOperations.current.push({ docId: normalizedDocId, update, resolve, reject });
      });

    // 🔧 修复：优先使用 ref 检查网络状态和连接状态，避免闭包问题
    // 🔧 Bug #4 修复：统一处理离线和 socket 断开的情况，都保存到离线队列
    const currentSocket = socketRef.current;
    if (!isOnlineRef.current || !currentSocket?.connected) {
      // 🔧 Bug #4 修复：不管是网络离线还是 socket 断开，都保存到离线队列
      await saveOfflineOperation(normalizedDocId, update);
      
      // 如果 socket 断开但网络在线，尝试重连
      if (isOnlineRef.current && !currentSocket?.connected) {
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => connectToSocket(), 0);
        }
      }
      return enqueuePending();
    }

    try {
      const updateBase64 = await uint8ArrayToBase64(update);

      if (!isValidYjsUpdate(updateBase64)) {
        throw new Error('Invalid Yjs update payload');
      }

      logYjsUpdateInfo('发送前', update, updateBase64);

    const requestData = {
      spaceType: 'workspace' as const,
      spaceId: currentWorkspaceId,
      docId: normalizedDocId,
      update: updateBase64,
      sessionId: sanitizeSessionIdentifier(sessionId) ?? sessionId,
      clientId: sanitizeSessionIdentifier(clientIdRef.current) ?? undefined,
    };

    const start = performance.now();
    const result = await currentSocket.emitWithAck('space:push-doc-update', requestData);

      if (result && typeof result === 'object' && 'error' in result) {
        throw new Error(result.error.message);
      }

      const timestamp = typeof result?.timestamp === 'number' ? result.timestamp : Date.now();
      setLastSync(new Date(timestamp));

      const latency = performance.now() - start;
      console.debug('[cloud-storage] pushDocUpdate success', {
        docId: normalizedDocId,
        latency: Math.round(latency),
      });

      return timestamp;
    } catch (error) {
      console.warn('[cloud-storage] pushDocUpdate failed, enqueue offline', error);
      await saveOfflineOperation(normalizedDocId, update);
      throw error;
    }
  }, [currentWorkspaceId, sessionId, connectToSocket]); // 🔧 移除 isOnline、isConnected、socket 依赖，使用 ref 获取最新值

  // 🔧 修复5: 智能重连调度 - 使用useCallback包装
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      logThrottle.current.log('max-reconnect', () => {
        console.error('❌ [云存储管理器] 超过最大重连次数，停止重连');
      });
      setStorageMode('local');
      return;
    }

    // 清除之前的重连定时器
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    // 指数退避：2^attempts * 1000ms，最长30秒
    const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 30000);
    
    setStorageMode('detecting');
    
    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current++;
      connectToSocket();
    }, delay);
  }, [connectToSocket]);

  // 🔧 修复5: 手动重连 - 使用useCallback包装
  const reconnect = useCallback(async (): Promise<void> => {
    // 清除重连定时器
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    const currentSocket = socketRef.current;
    if (currentSocket) {
      currentSocket.disconnect();
      setSocket(null);
      socketRef.current = null;
    }
    
    isConnectingRef.current = false; // 🔧 重置连接标记
    reconnectAttempts.current = 0;
    lastWorkspaceIdRef.current = null; // 🔧 重置 workspaceId
    await connectToSocket();
  }, [connectToSocket]); // 🔧 移除 socket 依赖

  // 🔧 修复1: 统一的连接管理 - 处理组件挂载、workspaceId变化、serverUrl变化
  // 🔧 修复：移除 socket 依赖，避免循环依赖，使用 socketRef 替代
  useEffect(() => {
    if (!cloudEnabled) {
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.disconnect();
        setSocket(null);
        socketRef.current = null;
      }
      lastWorkspaceIdRef.current = null;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      isConnectingRef.current = false;
      setIsConnected(false);
      setStorageMode('local');
      return;
    }
    if (!currentWorkspaceId) {
      // 如果没有workspaceId，清理现有连接
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.disconnect();
        setSocket(null);
        socketRef.current = null;
      }
      lastWorkspaceIdRef.current = null;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      isConnectingRef.current = false;
      setStorageMode('local');
      return;
    }

    // 🔧 修复：检查 workspaceId 和 serverUrl 是否真的变化了 - 优先使用 socketRef 检查连接状态
    const workspaceIdChanged = currentWorkspaceId !== lastWorkspaceIdRef.current;
    const serverUrlChanged = serverUrl !== lastServerUrlRef.current;
    
    if (!workspaceIdChanged && !serverUrlChanged) {
      // workspaceId 和 serverUrl 都未变化，检查连接状态 - 统一使用 socketRef，避免状态不同步
      const currentSocket = socketRef.current;
      if (currentSocket?.connected) {
        // 已连接且 workspaceId/serverUrl 未变化，不需要重连
        // 🔧 确保状态同步，但避免不必要的更新
        if (!isConnected) {
          setTimeout(() => setIsConnected(true), 0);
        }
        // 🔧 修复：如果 storageMode 还是 detecting，但 socket 已连接，说明 space:join 可能已经完成但状态没更新
        // 这种情况下不应该重连，而是等待 space:join 完成
        if (storageMode === 'detecting') {
          // 不重连，等待 space:join 完成
          return;
        }
        return;
      }
    }

    // workspaceId 或 serverUrl 变化时，重置并重新连接
    // 重置连接状态
    setIsConnected(false);
    setStorageMode('detecting');
    reconnectAttempts.current = 0;
    isConnectingRef.current = false;
    
    // 断开旧连接（如果 workspaceId 或 serverUrl 变化）
    const currentSocket = socketRef.current;
    if (currentSocket && (workspaceIdChanged || serverUrlChanged)) {
      currentSocket.disconnect();
      setSocket(null);
      socketRef.current = null;
    }
    
    // 🔧 更新 ref，记录当前值
    lastWorkspaceIdRef.current = currentWorkspaceId;
    lastServerUrlRef.current = serverUrl;
    
    // 清除旧的重连定时器
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    // 延迟一点再连接，避免状态更新冲突
    const connectTimer = setTimeout(() => {
      connectToSocket();
    }, 100);
    
    return () => {
      // 清理连接和定时器
      clearTimeout(connectTimer);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      // 🔧 注意：不在这里断开连接，因为可能被新的连接复用
      // 只在 cleanup 时（组件卸载）才断开
    };
  }, [cloudEnabled, serverUrl, currentWorkspaceId, connectToSocket]); // 🔧 保留 serverUrl 依赖，因为 serverUrl 变化时需要重连

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<SessionActivityDetail>;
      const detail = customEvent.detail;
      if (!detail?.sessionId) {
        return;
      }
      upsertSessionInfo(detail.sessionId, detail.clientId ?? null, detail.source);
    };

    window.addEventListener(NBSTORE_SESSION_ACTIVITY_EVENT, handler as EventListener);

    upsertSessionInfo(normalizedLocalSessionId, clientIdRef.current, 'local');

    return () => {
      window.removeEventListener(NBSTORE_SESSION_ACTIVITY_EVENT, handler as EventListener);
    };
  }, [normalizedLocalSessionId, upsertSessionInfo]);

  // 🔧 添加组件卸载时的清理逻辑
  useEffect(() => {
    return () => {
      // 组件卸载时清理连接
      const currentSocket = socketRef.current;
      if (currentSocket) {
        currentSocket.disconnect();
        socketRef.current = null;
      }
      lastWorkspaceIdRef.current = null;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      isConnectingRef.current = false;
    };
  }, []); // 只在组件卸载时执行
  // 🔧 修复：优化 useMemo 依赖项
  // 注意：socket 状态仍然保留，因为某些组件可能依赖它，但我们已经减少了不必要的依赖
  const value = useMemo<CloudStorageStatus>(() => ({
    isConnected,
    storageMode,
    lastSync,
    socket: socketRef.current ?? socket, // 🔧 优先使用 ref，回退到状态
    reconnect,
    pushDocUpdate,
    currentWorkspaceId,
    isOnline,
    pendingOperationsCount: pendingOperations.current.length,
    offlineOperationsCount,
    syncOfflineOperations,
    sessionId: normalizedLocalSessionId,
    clientId: sanitizeSessionIdentifier(clientIdRef.current),
    sessions,
  }), [
    isConnected,
    storageMode,
    lastSync,
    socket, // 🔧 保留 socket 依赖，但通过优先使用 ref 减少不必要的更新
    reconnect,
    pushDocUpdate,
    currentWorkspaceId,
    isOnline,
    offlineOperationsCount,
    syncOfflineOperations,
    normalizedLocalSessionId,
    sessions,
  ]);

  // 将云存储管理器暴露到全局对象，供CloudDocStorage使用
  useEffect(() => {
    (window as any).__CLOUD_STORAGE_MANAGER__ = value;
    
    return () => {
      delete (window as any).__CLOUD_STORAGE_MANAGER__;
    };
  }, [value]);

  useEffect(() => {
    (window as any).__NBSTORE_SESSION_ID__ = normalizedLocalSessionId;
    return () => {
      if ((window as any).__NBSTORE_SESSION_ID__ === normalizedLocalSessionId) {
        delete (window as any).__NBSTORE_SESSION_ID__;
      }
    };
  }, [normalizedLocalSessionId]);

  const sessionOverlay = (() => {
    const hasRemoteSessions = sessions.some(session => !session.isLocal);
    if (!hasRemoteSessions) {
      return null;
    }

    return (
      <div
        style={{
          position: 'fixed',
          right: 16,
          bottom: 72,
          zIndex: 9999,
          background: 'rgba(17, 24, 39, 0.86)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 12,
          boxShadow: '0 16px 32px rgba(15, 23, 42, 0.35)',
          pointerEvents: 'none',
          maxWidth: 280,
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 6,
            letterSpacing: '0.02em',
          }}
        >
          实时协作者
        </div>
        {sessions.map(session => (
          <div
            key={session.sessionId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              padding: '4px 0',
              opacity: session.isLocal ? 0.78 : 1,
            }}
          >
            <span
              style={{
                fontWeight: session.isLocal ? 500 : 600,
              }}
            >
              {session.label}
            </span>
            <span
              style={{
                fontFamily:
                  'SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                opacity: 0.65,
              }}
            >
              {session.sessionId.slice(-6)}
            </span>
          </div>
        ))}
      </div>
    );
  })();

  return (
    <CloudStorageContext.Provider value={value}>
      {sessionOverlay}
      {children}
    </CloudStorageContext.Provider>
  );
};
