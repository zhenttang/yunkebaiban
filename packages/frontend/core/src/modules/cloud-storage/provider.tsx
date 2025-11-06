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
  private lastLogTime = 0;
  private logCount = 0;
  private readonly throttleMs = 1000; // 1秒内最多1条相同日志
  
  log(_key: string, logFn: () => void) {
    const now = Date.now();
    if (now - this.lastLogTime > this.throttleMs) {
      logFn();
      this.lastLogTime = now;
      this.logCount = 1;
    } else {
      this.logCount++;
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
  // 🔍 调试日志：显示实际使用的 Socket.IO URL
  console.log('🔍 [Socket.IO配置] 获取Socket.IO URL:', url);
  console.log('🔍 [Socket.IO配置] 环境变量 VITE_SOCKETIO_URL:', import.meta.env?.VITE_SOCKETIO_URL);
  console.log('🔍 [Socket.IO配置] 环境变量 VITE_SOCKETIO_PORT:', import.meta.env?.VITE_SOCKETIO_PORT);
  return url;
}

// 本地缓存键
const OFFLINE_OPERATIONS_KEY = 'cloud_storage_offline_operations';

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
  const [offlineOperationsCount, setOfflineOperationsCount] = useState(0);
  const clientIdRef = useRef<string | null>(null);
  const sessionsRef = useRef<Map<string, SessionDisplayInfo>>(new Map());
  const sessionAliasRef = useRef<Map<string, number>>(new Map());
  const sessionAliasCounterRef = useRef(1);
  const [sessions, setSessions] = useState<SessionDisplayInfo[]>([]);
  
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

    // 从safeStorage读取现有操作
    const existing = safeStorage.getItem(OFFLINE_OPERATIONS_KEY);
    const operations: OfflineOperation[] = existing ? JSON.parse(existing) : [];
    
    // 添加新操作
    operations.push(operation);
    
    // 保存回safeStorage
    safeStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(operations));
    setOfflineOperationsCount(operations.length);
    
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
  const syncOfflineOperations = useCallback(async (): Promise<void> => {
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
      safeStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(remainingOperations));
      setOfflineOperationsCount(remainingOperations.length);
    }
  }, [currentWorkspaceId, socket, sessionId, normalizedLocalSessionId]); // 🔧 socket 依赖保留，因为需要在同步时检查连接状态

  // 初始化时读取离线操作数量
  useEffect(() => {
    const operations = getOfflineOperations();
    setOfflineOperationsCount(operations.length);
  }, []);

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

  // 🔧 修复1: 已删除重复的useEffect，合并到下方统一的连接管理useEffect中

  // 🔧 修复2&3&4: 连接Socket.IO - 添加状态保护、闭包修复、日志限流
  // 🔧 必须定义在 pushDocUpdate 之前，因为 pushDocUpdate 依赖它
  const connectToSocket = useCallback(async (): Promise<void> => {
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
      logThrottle.current.log('already-connected', () => {
        console.log('✅ [云存储管理器] Socket 已连接，跳过重复连接', {
          socketId: currentSocket.id,
          workspaceId: currentWorkspaceId
        });
      });
      // 确保状态同步
      if (!isConnected) {
        setIsConnected(true);
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

    // 如果网络离线，不尝试连接
    if (!isOnline) {
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
        // 🔧 日志限流，避免刷屏
        logThrottle.current.log('connect-success', () => {
          console.log('✅ [云存储管理器] Socket.IO连接成功', {
            socketId: newSocket.id,
            workspaceId: currentWorkspaceId,
          });
        });
        
        setIsConnected(true);
        setSocket(newSocket);
        socketRef.current = newSocket; // 🔧 同步更新 ref
        lastWorkspaceIdRef.current = currentWorkspaceId; // 🔧 记录当前 workspaceId
        reconnectAttempts.current = 0;
        isConnectingRef.current = false; // 🔧 连接成功，重置标记
        
        // 加入工作空间 - 严格按照YUNKE标准格式
        newSocket.emit('space:join', {
          spaceType: 'workspace',
          spaceId: currentWorkspaceId,
          clientVersion: '1.0.0'  // 添加YUNKE标准要求的clientVersion
        }, (response: unknown) => {
          // 修复：检查response是否存在
          if (!response) {
            console.error('❌ [云存储管理器] 空间加入失败: 服务器无响应');
            setStorageMode('error');
          } else if (typeof response === 'object' && response && 'error' in response) {
            console.error('❌ [云存储管理器] 空间加入失败:', (response as { error: unknown }).error);
            setStorageMode('error');
          } else if (typeof response === 'object' && response && 'clientId' in response) {
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
          }
        });
      });

      // 连接失败
      newSocket.on('connect_error', (error) => {
        logThrottle.current.log('connect-error', () => {
          console.warn('⚠️ [云存储管理器] 连接失败:', error.message);
        });
        setIsConnected(false);
        isConnectingRef.current = false; // 🔧 连接失败，重置标记
        newSocket.disconnect();
        
        // 智能重连：指数退避
        scheduleReconnect();
      });

      // 连接断开
      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        clientIdRef.current = null;
        isConnectingRef.current = false; // 🔧 断开连接，重置标记
        
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
  }, [currentWorkspaceId, isOnline, serverUrl, normalizedLocalSessionId]);

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

    if (!isOnline) {
      await saveOfflineOperation(normalizedDocId, update);
      return enqueuePending();
    }

    if (!socket?.connected || !isConnected) {
      const currentSocket = socketRef.current;
      if (!currentSocket?.connected || !isConnected) {
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => connectToSocket(), 0);
        }
        return enqueuePending();
      }
      // socket 已连接，继续使用 ref 中的 socket
    }

    // 🔧 确保使用最新的 socket
    const currentSocket = socketRef.current || socket;
    if (!currentSocket?.connected) {
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
  }, [currentWorkspaceId, isOnline, isConnected, sessionId, connectToSocket]); // 🔧 移除 socket 依赖，添加 connectToSocket

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
    logThrottle.current.log('manual-reconnect', () => {
      console.log('🔄 [云存储管理器] 手动重连');
    });
    
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

    // 🔧 检查 workspaceId 是否真的变化了
    if (currentWorkspaceId === lastWorkspaceIdRef.current) {
      // workspaceId 未变化，检查连接状态
      const currentSocket = socketRef.current;
      if (currentSocket?.connected && isConnected) {
        // 已连接且 workspaceId 未变化，不需要重连
        return;
      }
    }

    // workspaceId或serverUrl变化时，重置并重新连接
    logThrottle.current.log('workspace-change', () => {
      console.log('🔄 [云存储管理器] Workspace变化，重新建立连接', {
        workspaceId: currentWorkspaceId,
        previousWorkspaceId: lastWorkspaceIdRef.current,
      });
    });

    // 重置连接状态
    setIsConnected(false);
    setStorageMode('detecting');
    reconnectAttempts.current = 0;
    isConnectingRef.current = false;
    
    // 断开旧连接（如果 workspaceId 变化）
    const currentSocket = socketRef.current;
    if (currentSocket && currentWorkspaceId !== lastWorkspaceIdRef.current) {
      currentSocket.disconnect();
      setSocket(null);
      socketRef.current = null;
    }
    
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
  }, [serverUrl, currentWorkspaceId, connectToSocket]); // 🔧 移除 socket 依赖

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
        console.log('🧹 [CloudStorageProvider] 组件卸载，清理连接');
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
  const value = useMemo<CloudStorageStatus>(() => ({
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
  }), [
    isConnected,
    storageMode,
    lastSync,
    socket,
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

