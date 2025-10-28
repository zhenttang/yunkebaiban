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
import { uint8ArrayToBase64, isEmptyUpdate, isValidYjsUpdate, logYjsUpdateInfo } from './utils/yjs-utils';

/**
 * 获取Socket.IO连接URL
 * 统一的配置获取逻辑 - 使用@yunke/config统一管理
 */
function getSocketIOUrl(): string {
  // 优先使用环境变量
  const envSocketUrl = import.meta.env?.VITE_SOCKETIO_URL;
  if (envSocketUrl) {
    return envSocketUrl;
  }

  // 使用统一的网络配置管理
  try {
    // 动态导入配置（避免循环依赖）
    if (typeof window !== 'undefined') {
      const buildConfig = (window as any).BUILD_CONFIG;
      
      // Android环境：使用Socket.IO服务器地址
      if (buildConfig?.isAndroid || buildConfig?.platform === 'android') {
        return 'http://192.168.2.4:9092';
      }
      
      // 生产环境
      if (window.location.hostname !== 'localhost' && 
          window.location.hostname !== '127.0.0.1') {
        return `${window.location.protocol}//${window.location.hostname}:9092`;
      }
    }
  } catch (error) {
    console.warn('获取配置失败，使用默认值:', error);
  }
  
  return 'http://localhost:9092';
}

// 本地缓存键
const OFFLINE_OPERATIONS_KEY = 'cloud_storage_offline_operations';
const LAST_SYNC_KEY = 'cloud_storage_last_sync';

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
}

export const CloudStorageProvider = ({ 
  children, 
  serverUrl = getSocketIOUrl()  // 使用内联配置管理
}: CloudStorageProviderProps) => {
  const params = useParams();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const normalizedLocalSessionId = useMemo(
    () => sanitizeSessionIdentifier(sessionId) ?? sessionId,
    [sessionId]
  );
  const [isConnected, setIsConnected] = useState(false);
  const [storageMode, setStorageMode] = useState<CloudStorageStatus['storageMode']>('detecting');
  const lastUpdateBroadcastAt = useRef(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5; // 增加最大重连次数
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const pendingOperations = useRef<Array<{
    docId: string;
    update: Uint8Array;
    resolve: (value: number) => void;
    reject: (reason: any) => void;
  }>>([]);
  const [offlineOperationsCount, setOfflineOperationsCount] = useState(0);
  const clientIdRef = useRef<string | null>(null);
  const sessionsRef = useRef<Map<string, SessionDisplayInfo>>(new Map());
  const sessionAliasRef = useRef<Map<string, number>>(new Map());
  const sessionAliasCounterRef = useRef(1);
  const [sessions, setSessions] = useState<SessionDisplayInfo[]>([]);

  const upsertSessionInfo = useCallback(
    (sessionIdRaw: string | null, clientIdRaw: string | null, source: SessionActivityDetail['source']) => {
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

      const ordered = Array.from(sessionsRef.current.values()).sort((a, b) => {
        if (a.isLocal !== b.isLocal) {
          return a.isLocal ? -1 : 1;
        }
        return a.label.localeCompare(b.label, 'zh-Hans');
      });

      setSessions(ordered);
    },
    [normalizedLocalSessionId]
  );

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

    // 从localStorage读取现有操作
    const existing = localStorage.getItem(OFFLINE_OPERATIONS_KEY);
    const operations: OfflineOperation[] = existing ? JSON.parse(existing) : [];
    
    // 添加新操作
    operations.push(operation);
    
    // 保存回localStorage
    localStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(operations));
    setOfflineOperationsCount(operations.length);
    
  };

  const getOfflineOperations = (): OfflineOperation[] => {
    const existing = localStorage.getItem(OFFLINE_OPERATIONS_KEY);
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
      localStorage.removeItem(OFFLINE_OPERATIONS_KEY);
      return [];
    }
  };

  const clearOfflineOperations = () => {
    localStorage.removeItem(OFFLINE_OPERATIONS_KEY);
    setOfflineOperationsCount(0);
  };

  // 同步离线操作 - 按照YUNKE标准格式
  const syncOfflineOperations = async (): Promise<void> => {
    if (!currentWorkspaceId || !socket?.connected) {
      console.warn('⚠️ [云存储管理器] 无法同步：缺少workspace或连接');
      return;
    }

    const operations = getOfflineOperations()
      .filter(op => op.spaceId === currentWorkspaceId)
      .sort((a, b) => a.timestamp - b.timestamp); // 按时间顺序排序

    if (operations.length === 0) {
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const operation of operations) {
      try {
        // 按照YUNKE标准格式发送
        emitSessionActivity({
          sessionId: sanitizeSessionIdentifier(operation.sessionId) ?? normalizedLocalSessionId,
          clientId:
            sanitizeSessionIdentifier(operation.clientId) ??
            sanitizeSessionIdentifier(clientIdRef.current) ??
            null,
          source: 'local',
        });
        const result = await socket.emitWithAck('space:push-doc-update', {
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

        successCount++;
        
      } catch (error) {
        failureCount++;
        console.error(`❌ [云存储管理器] 离线操作同步失败: ${operation.id}`, error);
        // 暂时保留失败的操作，下次继续尝试
      }
    }

    if (failureCount === 0) {
      // 所有操作都成功，清除离线缓存
      clearOfflineOperations();
      setLastSync(new Date());
    } else {
      // 有失败的操作，只移除成功的操作
      const remainingOperations = getOfflineOperations()
        .filter(op => !operations.some(syncOp => syncOp.id === op.id) || op.spaceId !== currentWorkspaceId);
      localStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(remainingOperations));
      setOfflineOperationsCount(remainingOperations.length);
    }
  };

  // 初始化时读取离线操作数量
  useEffect(() => {
    const operations = getOfflineOperations();
    setOfflineOperationsCount(operations.length);
  }, []);

  // 动态获取当前workspaceId
  const currentWorkspaceId = useMemo(() => {
    // concise: remove noisy logs
    
    // 从URL路由参数获取
    if (params.workspaceId) {
      // use URL workspaceId
      
      // 🔧 [CRITICAL-FIX] 确保workspaceId始终为长UUID格式
      const workspaceId = params.workspaceId;
      if (workspaceId.length === 36 && workspaceId.includes('-')) {
        // verified uuid
        // 保存到localStorage供其他组件使用
        localStorage.setItem('last_workspace_id', workspaceId);
        return workspaceId;
      } else if (workspaceId.length === 21 && !workspaceId.includes('-')) {
        // short id fallback
        // 尝试从localStorage获取对应的长UUID
        const storedLongId = localStorage.getItem('last_workspace_id');
        if (storedLongId && storedLongId.length === 36 && storedLongId.includes('-')) {
          // fallback to last id
          return storedLongId;
        }
      }
      
      return workspaceId;
    }
    
    // 从localStorage获取最后访问的workspace
    const lastWorkspaceId = localStorage.getItem('last_workspace_id');
    
    if (lastWorkspaceId) {
      // use last workspace id
      return lastWorkspaceId;
    }
    
    // no workspace id found
    // 如果都没有，返回null表示无法确定当前workspace
    return null;
  }, [params.workspaceId]);

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 网络恢复时立即尝试重连
      if (!isConnected && currentWorkspaceId) {
        reconnectAttempts.current = 0;
        connectToSocket();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStorageMode('local');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, currentWorkspaceId]);

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

  // 监听workspaceId变化，重新连接
  useEffect(() => {
    if (currentWorkspaceId) {
      // 重置连接状态
      setIsConnected(false);
      setStorageMode('detecting');
      reconnectAttempts.current = 0;
      
      // 断开旧连接
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      
      // 清除旧的重连定时器
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      
      // 建立新连接
      setTimeout(connectToSocket, 100);
    }
  }, [currentWorkspaceId]);

  // 推送文档更新（含离线与排队逻辑）
  const pushDocUpdate = async (docId: string, update: Uint8Array): Promise<number> => {
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

    if (!isOnline) {
      await saveOfflineOperation(normalizedDocId, update);
      return enqueuePending();
    }

    if (!socket?.connected || !isConnected) {
      if (reconnectAttempts.current < maxReconnectAttempts) {
        setTimeout(() => connectToSocket(), 0);
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
    const result = await socket.emitWithAck('space:push-doc-update', requestData);

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
  };

  // 连接Socket.IO - 增强版本支持指数退避
  const connectToSocket = async (): Promise<void> => {
    if (!currentWorkspaceId) {
      console.warn('⚠️ [云存储管理器] 无法连接：缺少workspaceId');
      setStorageMode('local');
      return;
    }

    // 如果网络离线，不尝试连接
    if (!isOnline) {
      console.warn('⚠️ [云存储管理器] 网络离线，跳过连接');
      setStorageMode('local');
      return;
    }

    // 检查是否超过最大重连次数
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setStorageMode('local');
      return;
    }

    try {
      // console.log('🔗 [云存储管理器] 开始连接...', { 
      //   serverUrl, 
      //   workspaceId: currentWorkspaceId,
      //   attempt: reconnectAttempts.current + 1
      // });
      setStorageMode('detecting');

      const { io } = await import('socket.io-client');
      
      const newSocket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: false, // 我们手动处理重连
        auth: {
          // 开发环境可以提供一个临时token
          token: 'dev-token-' + Date.now()
        }
      });

      // 连接成功
      newSocket.on('connect', () => {
        console.log('🎯🎯🎯 [云存储管理器-连接] Socket.IO连接成功!!!');
        console.log('  🎯 Socket ID:', newSocket.id);
        console.log('  🎯 当前工作空间ID:', currentWorkspaceId);
        
        setIsConnected(true);
        setSocket(newSocket);
        reconnectAttempts.current = 0;
        
        // 加入工作空间 - 严格按照YUNKE标准格式
        newSocket.emit('space:join', {
          spaceType: 'workspace',
          spaceId: currentWorkspaceId,
          clientVersion: '1.0.0'  // 添加YUNKE标准要求的clientVersion
        }, (response) => {
          // 修复：检查response是否存在
          if (!response) {
            console.error('❌ [云存储管理器] 空间加入失败: 服务器无响应');
            setStorageMode('error');
          } else if (response && 'error' in response) {
            console.error('❌ [云存储管理器] 空间加入失败:', response.error);
            setStorageMode('error');
          } else {
            clientIdRef.current = sanitizeSessionIdentifier((response as any).clientId);
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
          }
        });
      });

      // 连接失败
      newSocket.on('connect_error', (error) => {
        console.warn('⚠️ [云存储管理器] 连接失败:', error.message);
        setIsConnected(false);
        newSocket.disconnect();
        
        // 智能重连：指数退避
        scheduleReconnect();
      });

      // 连接断开
      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        clientIdRef.current = null;
        
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
          // console.warn('⏰ [云存储管理器] 连接超时');
          newSocket.disconnect();
          scheduleReconnect();
        }
      }, 5000);

    } catch (error) {
      console.error('❌ [云存储管理器] 初始化失败:', error);
      scheduleReconnect();
    }
  };

  // 智能重连调度 - 指数退避算法
  const scheduleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('❌ [云存储管理器] 超过最大重连次数，停止重连');
      setStorageMode('local');
      return;
    }

    // 清除之前的重连定时器
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    // 指数退避：2^attempts * 1000ms，最长30秒
    const delay = Math.min(Math.pow(2, reconnectAttempts.current) * 1000, 30000);
    
    // console.log(`⏱️ [云存储管理器] ${delay}ms后进行第${reconnectAttempts.current + 1}次重连`);
    setStorageMode('detecting');
    
    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current++;
      connectToSocket();
    }, delay);
  };

  // 手动重连
  const reconnect = async (): Promise<void> => {
    
    // 清除重连定时器
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    reconnectAttempts.current = 0;
    await connectToSocket();
  };

  // 组件挂载时自动连接
  useEffect(() => {
    connectToSocket();
    
    return () => {
      // 清理连接和定时器
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (socket) {
        socket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, currentWorkspaceId]);

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

  const value: CloudStorageStatus = {
    isConnected,
    storageMode,
    lastSync,
    socket,
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
  };

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
