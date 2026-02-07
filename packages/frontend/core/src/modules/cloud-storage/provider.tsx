import { useState, useEffect, useRef, createContext, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { normalizeDocId } from '@yunke/nbstore/utils/doc-id';
import {
  getOrCreateSessionId,
  emitSessionActivity,
  sanitizeSessionIdentifier,
} from '@yunke/nbstore';
import { DebugLogger } from '@yunke/debug';
import { uint8ArrayToBase64, isEmptyUpdate, isValidYjsUpdate, logYjsUpdateInfo } from './utils';
import { getSocketIOUrl as getUnifiedSocketIOUrl } from '@yunke/config';
import * as styles from './session-overlay.css';

// 从拆分的模块导入类型和工具
import type {
  CloudStorageStatus,
  CloudStorageDebugWindow,
} from './types';
export type { CloudStorageStatus } from './types';
import {
  safeStorage,
  isCloudSyncEnabled as _isCloudSyncEnabled,
  setCloudSyncEnabled as _setCloudSyncEnabled,
  LogThrottle,
  awaitWithTimeout,
} from './utils/safe-storage';

// 从拆分的模块导入
import { useSessionManagement } from './hooks/use-session-management';
import { useOfflineOperations } from './hooks/use-offline-operations';
import {
  SOCKET_CONNECT_TIMEOUT_MS,
  SOCKET_JOIN_TIMEOUT_MS,
  CONNECTION_CHECK_TIMEOUT_MS,
  CONNECT_DELAY_MS,
  MAX_RECONNECT_ATTEMPTS,
  MAX_RECONNECT_DELAY_MS,
  RECONNECT_BASE_DELAY_MS,
} from './constants';

// 重新导出供外部使用
export const isCloudSyncEnabled = _isCloudSyncEnabled;
export const setCloudSyncEnabled = _setCloudSyncEnabled;

const logger = new DebugLogger('yunke:cloud-storage');

function getSocketIOUrl(): string {
  return getUnifiedSocketIOUrl();
}

function getDebugWindow(): CloudStorageDebugWindow {
  return window as unknown as CloudStorageDebugWindow;
}

const CloudStorageContext = createContext<CloudStorageStatus | null>(null);

export const useCloudStorage = () => {
  const context = useContext(CloudStorageContext);
  if (!context) {
    return {
      isConnected: false,
      storageMode: 'local' as const,
      lastSync: null,
      socket: null,
      reconnect: async () => {},
      pushDocUpdate: async () => 0,
      currentWorkspaceId: null,
      isOnline: false,
      pendingOperationsCount: 0,
      offlineOperationsCount: 0,
      syncOfflineOperations: async () => {},
      sessionId: '',
      clientId: null,
      sessions: [],
      syncStatus: 'idle' as const,
      syncError: null,
      cloudSyncEnabled: false,
      setCloudSyncEnabled: () => {},
    } as CloudStorageStatus;
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
  enabled,
}: CloudStorageProviderProps) => {
  // ====== 基础状态 ======
  const cloudEnabled = useMemo(() => {
    if (enabled !== undefined) return enabled;
    return isCloudSyncEnabled();
  }, [enabled]);

  const serverUrl = useMemo(() => {
    if (serverUrlProp) return serverUrlProp;
    if (!cloudEnabled) return '';
    return getSocketIOUrl();
  }, [serverUrlProp, cloudEnabled]);

  const params = useParams();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const normalizedLocalSessionId = useMemo(
    () => sanitizeSessionIdentifier(sessionId) ?? sessionId,
    [sessionId]
  );

  // ====== 连接状态 ======
  const [isConnected, setIsConnected] = useState(false);
  const [storageMode, setStorageMode] = useState<CloudStorageStatus['storageMode']>(
    () => cloudEnabled ? 'detecting' : 'local'
  );
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOnline, setIsOnline] = useState(() => {
    try {
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    } catch { return true; }
  });

  // ====== Refs ======
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingOperations = useRef<Array<{
    docId: string; update: Uint8Array;
    resolve: (value: number) => void; reject: (reason: unknown) => void;
  }>>([]);
  const clientIdRef = useRef<string | null>(null);
  const isConnectingRef = useRef(false);
  const logThrottle = useRef(new LogThrottle());
  const socketRef = useRef<Socket | null>(null);
  const lastWorkspaceIdRef = useRef<string | null>(null);
  const lastServerUrlRef = useRef<string | null>(null);
  const isOnlineRef = useRef(isOnline);
  const serverUrlRef = useRef(serverUrl);
  const connectToSocketRef = useRef<(() => Promise<void>) | null>(null);
  const activeJoinAttemptRef = useRef<symbol | null>(null);
  const cloudEnabledRef = useRef(cloudEnabled);
  const socketEventHandlersRef = useRef<{
    handleConnect: (() => void) | null;
    handleConnectError: ((error: Error) => void) | null;
    handleDisconnect: ((reason: string) => void) | null;
    handleSessionEnded: ((message: { spaceId?: string; sessionId?: string }) => void) | null;
  }>({
    handleConnect: null, handleConnectError: null,
    handleDisconnect: null, handleSessionEnded: null,
  });

  // ====== WorkspaceId 计算 ======
  const currentWorkspaceId = useMemo(() => {
    if (params.workspaceId) {
      const wid = params.workspaceId;
      if (wid.length === 36 && wid.includes('-')) {
        safeStorage.setItem('last_workspace_id', wid);
        return wid;
      }
      if (wid.length === 21 && !wid.includes('-')) {
        const stored = safeStorage.getItem('last_workspace_id');
        if (stored && stored.length === 36 && stored.includes('-')) return stored;
      }
      return wid;
    }
    return safeStorage.getItem('last_workspace_id') || null;
  }, [params.workspaceId]);

  // ====== 会话管理（抽取的 hook） ======
  const { sessions, upsertSessionInfo, removeSessionInfo } =
    useSessionManagement(normalizedLocalSessionId);

  // ====== 离线操作管理（抽取的 hook） ======
  const {
    offlineOperationsCount,
    saveOfflineOperation,
    syncOfflineOperations,
    syncOfflineOperationsRef,
  } = useOfflineOperations({
    currentWorkspaceId,
    sessionId,
    normalizedLocalSessionId,
    socketRef,
    clientIdRef,
    cloudEnabledRef,
    setLastSync,
    setSyncStatus,
    setSyncError,
  });

  // ====== Ref 同步 effects ======
  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);
  useEffect(() => { serverUrlRef.current = serverUrl; }, [serverUrl]);
  useEffect(() => {
    cloudEnabledRef.current = cloudEnabled;
    if (!cloudEnabled) {
      setStorageMode('local');
      setIsConnected(false);
      const s = socketRef.current;
      if (s) { s.disconnect(); socketRef.current = null; setSocket(null); }
      logger.info('云同步已禁用，使用本地模式');
    }
  }, [cloudEnabled]);

  // ====== 网络状态监听 ======
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      isOnlineRef.current = true;
      const s = socketRef.current;
      if (!s?.connected && currentWorkspaceId) {
        reconnectAttempts.current = 0;
        connectToSocketRef.current?.();
      } else if (s?.connected) {
        syncOfflineOperationsRef.current?.();
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
  }, [currentWorkspaceId, syncOfflineOperationsRef]);

  // ====== 排队操作处理 ======
  const processPendingOperations = async () => {
    const ops = [...pendingOperations.current];
    pendingOperations.current = [];
    for (const op of ops) {
      try {
        const ts = await pushDocUpdate(op.docId, op.update);
        op.resolve(ts);
      } catch (error) {
        logger.warn('processPendingOperations 失败，保存到离线队列', { docId: op.docId });
        await saveOfflineOperation(op.docId, op.update);
        op.reject(error);
      }
    }
  };

  // ====== Socket.IO 连接（最核心逻辑） ======
  const connectToSocket = useCallback(async (): Promise<void> => {
    if (!cloudEnabledRef.current) {
      setIsConnected(false); setStorageMode('local'); return;
    }
    if (isConnectingRef.current) {
      logThrottle.current.log('duplicate-connect', () => logger.warn('连接进行中，跳过重复连接'));
      return;
    }
    const cs = socketRef.current;
    if (cs?.connected && currentWorkspaceId === lastWorkspaceIdRef.current) {
      if (!isConnected) setTimeout(() => setIsConnected(true), 0);
      return;
    }
    if (!currentWorkspaceId) {
      logThrottle.current.log('no-workspace', () => logger.warn('无法连接：缺少workspaceId'));
      setStorageMode('local'); return;
    }
    if (!isOnlineRef.current) {
      logThrottle.current.log('offline', () => logger.warn('网络离线，跳过连接'));
      setStorageMode('local'); return;
    }
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      logThrottle.current.log('max-retries', () => logger.warn('超过最大重连次数，切换到本地模式'));
      setStorageMode('local'); return;
    }

    try {
      isConnectingRef.current = true;
      setStorageMode('detecting');
      const { io } = await import('socket.io-client');
      const currentServerUrl = serverUrlRef.current;
      const authToken = safeStorage.getItem('yunke-admin-token') ?? safeStorage.getItem('yunke-access-token');
      const newSocket = io(currentServerUrl, {
        transports: ['websocket', 'polling'],
        timeout: SOCKET_CONNECT_TIMEOUT_MS,
        reconnection: false,
        auth: authToken ? { token: authToken } : {},
        query: authToken ? { token: authToken } : {},
      });

      const handleSessionEnded = (message: { spaceId?: string; sessionId?: string }) => {
        if (!message?.sessionId) return;
        if (message.spaceId && message.spaceId !== currentWorkspaceId) return;
        removeSessionInfo(message.sessionId);
      };

      const cleanupSocketListeners = (s: Socket) => {
        const h = socketEventHandlersRef.current;
        if (h.handleConnect) s.off('connect', h.handleConnect);
        if (h.handleConnectError) s.off('connect_error', h.handleConnectError);
        if (h.handleDisconnect) s.off('disconnect', h.handleDisconnect);
        if (h.handleSessionEnded) s.off('space:session-ended', h.handleSessionEnded);
        socketEventHandlersRef.current = {
          handleConnect: null, handleConnectError: null,
          handleDisconnect: null, handleSessionEnded: null,
        };
      };

      const handleConnect = () => {
        setIsConnected(true);
        setSocket(newSocket);
        socketRef.current = newSocket;
        lastWorkspaceIdRef.current = currentWorkspaceId;
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;

        (async () => {
          try {
            const joinAttemptId = Symbol('space:join');
            activeJoinAttemptRef.current = joinAttemptId;
            const finalizeJoinAttempt = () => {
              if (activeJoinAttemptRef.current === joinAttemptId) activeJoinAttemptRef.current = null;
            };
            const joinPromise = newSocket.emitWithAck('space:join', {
              spaceType: 'workspace' as const, spaceId: currentWorkspaceId, clientVersion: '1.0.0',
            });
            const response = await awaitWithTimeout(joinPromise, SOCKET_JOIN_TIMEOUT_MS, `space:join timeout after ${SOCKET_JOIN_TIMEOUT_MS}ms`);
            if (activeJoinAttemptRef.current !== joinAttemptId) return;

            const finishJoinSuccess = (cid: string | null) => {
              clientIdRef.current = sanitizeSessionIdentifier(cid);
              setStorageMode('cloud');
              setLastSync(new Date());
              emitSessionActivity({
                sessionId: normalizedLocalSessionId,
                clientId: clientIdRef.current,
                source: 'local',
              });
              if (pendingOperations.current.length > 0) processPendingOperations();
              syncOfflineOperationsRef.current?.();
              finalizeJoinAttempt();
            };

            if (typeof response === 'object' && response) {
              if ('error' in response) {
                logger.error('空间加入失败', response.error);
                setStorageMode('error');
                finalizeJoinAttempt();
                return;
              }
              if ('data' in response && response.data) {
                finishJoinSuccess((response.data as { clientId?: string | null }).clientId ?? null);
                return;
              }
              if ('clientId' in response) {
                finishJoinSuccess((response as { clientId: string | null }).clientId);
                return;
              }
            }
            // 未知格式但已连接
            setStorageMode('cloud');
            setLastSync(new Date());
            syncOfflineOperationsRef.current?.();
            finalizeJoinAttempt();
          } catch (error) {
            logger.error('space:join 失败', error);
            if (activeJoinAttemptRef.current) activeJoinAttemptRef.current = null;
            setStorageMode('error');
            newSocket.disconnect();
          }
        })();
      };

      const handleConnectError = (error: Error) => {
        logThrottle.current.log('connect-error', () => logger.warn('连接失败', { message: error.message }));
        setIsConnected(false);
        activeJoinAttemptRef.current = null;
        isConnectingRef.current = false;
        cleanupSocketListeners(newSocket);
        newSocket.disconnect();
        scheduleReconnect();
      };

      const handleDisconnect = (reason: string) => {
        setIsConnected(false);
        clientIdRef.current = null;
        activeJoinAttemptRef.current = null;
        isConnectingRef.current = false;
        cleanupSocketListeners(newSocket);
        if (socketRef.current === newSocket) socketRef.current = null;
        if (reason !== 'io client disconnect') {
          scheduleReconnect();
        } else {
          setStorageMode('local');
        }
      };

      socketEventHandlersRef.current = {
        handleConnect, handleConnectError, handleDisconnect, handleSessionEnded,
      };
      newSocket.on('space:session-ended', handleSessionEnded);
      newSocket.on('connect', handleConnect);
      newSocket.on('connect_error', handleConnectError);
      newSocket.on('disconnect', handleDisconnect);

      setTimeout(() => {
        if (!newSocket.connected) {
          logThrottle.current.log('connect-timeout', () => logger.warn('连接超时'));
          isConnectingRef.current = false;
          newSocket.disconnect();
          scheduleReconnect();
        }
      }, CONNECTION_CHECK_TIMEOUT_MS);
    } catch (error) {
      logger.error('初始化失败', error);
      isConnectingRef.current = false;
      scheduleReconnect();
    }
  }, [currentWorkspaceId, normalizedLocalSessionId, removeSessionInfo, isConnected, syncOfflineOperationsRef]);

  useEffect(() => { connectToSocketRef.current = connectToSocket; }, [connectToSocket]);

  // ====== 文档推送 ======
  const pushDocUpdate = useCallback(async (docId: string, update: Uint8Array): Promise<number> => {
    const nDocId = normalizeDocId(docId);
    if (!currentWorkspaceId) throw new Error('No current workspace available');
    if (isEmptyUpdate(update)) return Date.now();

    const enqueuePending = () =>
      new Promise<number>((resolve, reject) => {
        pendingOperations.current.push({ docId: nDocId, update, resolve, reject });
      });

    const cs = socketRef.current;
    if (!isOnlineRef.current || !cs?.connected) {
      await saveOfflineOperation(nDocId, update);
      if (isOnlineRef.current && !cs?.connected && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => connectToSocket(), 0);
      }
      return enqueuePending();
    }

    try {
      const updateBase64 = await uint8ArrayToBase64(update);
      if (!isValidYjsUpdate(updateBase64)) throw new Error('Invalid Yjs update payload');
      logYjsUpdateInfo('发送前', update, updateBase64);
      const start = performance.now();
      const result = await cs.emitWithAck('space:push-doc-update', {
        spaceType: 'workspace' as const, spaceId: currentWorkspaceId,
        docId: nDocId, update: updateBase64,
        sessionId: sanitizeSessionIdentifier(sessionId) ?? sessionId,
        clientId: sanitizeSessionIdentifier(clientIdRef.current) ?? undefined,
      });
      if (result && typeof result === 'object' && 'error' in result) throw new Error(result.error.message);
      const timestamp = typeof result?.timestamp === 'number' ? result.timestamp : Date.now();
      setLastSync(new Date(timestamp));
      logger.debug('pushDocUpdate success', { docId: nDocId, latency: Math.round(performance.now() - start) });
      return timestamp;
    } catch (error) {
      logger.warn('pushDocUpdate failed, enqueue offline', error);
      await saveOfflineOperation(nDocId, update);
      throw error;
    }
  }, [currentWorkspaceId, sessionId, connectToSocket, saveOfflineOperation]);

  // ====== 重连调度 ======
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      logThrottle.current.log('max-reconnect', () => logger.error('超过最大重连次数，停止重连'));
      setStorageMode('local'); return;
    }
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    const delay = Math.min(Math.pow(2, reconnectAttempts.current) * RECONNECT_BASE_DELAY_MS, MAX_RECONNECT_DELAY_MS);
    setStorageMode('detecting');
    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current++;
      connectToSocket();
    }, delay);
  }, [connectToSocket]);

  const reconnect = useCallback(async (): Promise<void> => {
    if (reconnectTimeout.current) { clearTimeout(reconnectTimeout.current); reconnectTimeout.current = null; }
    const s = socketRef.current;
    if (s) { s.disconnect(); setSocket(null); socketRef.current = null; }
    isConnectingRef.current = false;
    reconnectAttempts.current = 0;
    lastWorkspaceIdRef.current = null;
    await connectToSocket();
  }, [connectToSocket]);

  // ====== 统一连接管理 effect ======
  useEffect(() => {
    if (!cloudEnabled) {
      const s = socketRef.current;
      if (s) { s.disconnect(); setSocket(null); socketRef.current = null; }
      lastWorkspaceIdRef.current = null;
      if (reconnectTimeout.current) { clearTimeout(reconnectTimeout.current); reconnectTimeout.current = null; }
      isConnectingRef.current = false;
      setIsConnected(false); setStorageMode('local');
      return;
    }
    if (!currentWorkspaceId) {
      const s = socketRef.current;
      if (s) { s.disconnect(); setSocket(null); socketRef.current = null; }
      lastWorkspaceIdRef.current = null;
      if (reconnectTimeout.current) { clearTimeout(reconnectTimeout.current); reconnectTimeout.current = null; }
      isConnectingRef.current = false;
      setStorageMode('local');
      return;
    }

    const widChanged = currentWorkspaceId !== lastWorkspaceIdRef.current;
    const urlChanged = serverUrl !== lastServerUrlRef.current;
    if (!widChanged && !urlChanged) {
      const s = socketRef.current;
      if (s?.connected) {
        if (!isConnected) setTimeout(() => setIsConnected(true), 0);
        return;
      }
    }

    setIsConnected(false); setStorageMode('detecting');
    reconnectAttempts.current = 0; isConnectingRef.current = false;
    const s = socketRef.current;
    if (s && (widChanged || urlChanged)) { s.disconnect(); setSocket(null); socketRef.current = null; }
    lastWorkspaceIdRef.current = currentWorkspaceId;
    lastServerUrlRef.current = serverUrl;
    if (reconnectTimeout.current) { clearTimeout(reconnectTimeout.current); reconnectTimeout.current = null; }

    const connectTimer = setTimeout(() => connectToSocket(), CONNECT_DELAY_MS);
    return () => {
      clearTimeout(connectTimer);
      if (reconnectTimeout.current) { clearTimeout(reconnectTimeout.current); reconnectTimeout.current = null; }
    };
  }, [cloudEnabled, serverUrl, currentWorkspaceId, connectToSocket, isConnected, storageMode]);

  // ====== 组件卸载清理 ======
  useEffect(() => {
    return () => {
      const s = socketRef.current;
      if (s) {
        const h = socketEventHandlersRef.current;
        if (h.handleConnect) s.off('connect', h.handleConnect);
        if (h.handleConnectError) s.off('connect_error', h.handleConnectError);
        if (h.handleDisconnect) s.off('disconnect', h.handleDisconnect);
        if (h.handleSessionEnded) s.off('space:session-ended', h.handleSessionEnded);
        s.disconnect();
        socketRef.current = null;
      }
      socketEventHandlersRef.current = {
        handleConnect: null, handleConnectError: null,
        handleDisconnect: null, handleSessionEnded: null,
      };
      lastWorkspaceIdRef.current = null;
      if (reconnectTimeout.current) { clearTimeout(reconnectTimeout.current); reconnectTimeout.current = null; }
      isConnectingRef.current = false;
    };
  }, []);

  // ====== 云同步开关 ======
  const handleSetCloudSyncEnabled = useCallback((en: boolean) => {
    setCloudSyncEnabled(en);
    if (en) {
      setStorageMode('detecting');
      reconnectAttempts.current = 0;
      connectToSocketRef.current?.();
      logger.info('云同步已启用，开始连接...');
    }
  }, []);

  // ====== Context value ======
  const value = useMemo<CloudStorageStatus>(() => ({
    isConnected, storageMode, lastSync,
    socket: socketRef.current ?? socket,
    reconnect, pushDocUpdate, currentWorkspaceId, isOnline,
    pendingOperationsCount: pendingOperations.current.length,
    offlineOperationsCount, syncOfflineOperations,
    sessionId: normalizedLocalSessionId,
    clientId: sanitizeSessionIdentifier(clientIdRef.current),
    sessions, syncStatus, syncError,
    cloudSyncEnabled: cloudEnabled,
    setCloudSyncEnabled: handleSetCloudSyncEnabled,
  }), [
    isConnected, storageMode, lastSync, socket, reconnect, pushDocUpdate,
    currentWorkspaceId, isOnline, offlineOperationsCount, syncOfflineOperations,
    normalizedLocalSessionId, sessions, syncStatus, syncError,
    cloudEnabled, handleSetCloudSyncEnabled,
  ]);

  // ====== 调试窗口 ======
  useEffect(() => {
    const dw = getDebugWindow();
    dw.__CLOUD_STORAGE_MANAGER__ = value;
    return () => { delete dw.__CLOUD_STORAGE_MANAGER__; };
  }, [value]);

  useEffect(() => {
    const dw = getDebugWindow();
    dw.__NBSTORE_SESSION_ID__ = normalizedLocalSessionId;
    return () => {
      if (dw.__NBSTORE_SESSION_ID__ === normalizedLocalSessionId) delete dw.__NBSTORE_SESSION_ID__;
    };
  }, [normalizedLocalSessionId]);

  // ====== 渲染 ======
  const sessionOverlay = (() => {
    const hasRemote = sessions.some(s => !s.isLocal);
    if (!hasRemote) return null;
    return (
      <div className={styles.overlayContainer}>
        <div className={styles.overlayTitle}>实时协作者</div>
        {sessions.map(s => (
          <div key={s.sessionId} className={s.isLocal ? styles.sessionItemLocal : styles.sessionItem}>
            <span className={s.isLocal ? styles.sessionLabelLocal : styles.sessionLabel}>{s.label}</span>
            <span className={styles.sessionId}>{s.sessionId.slice(-6)}</span>
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
