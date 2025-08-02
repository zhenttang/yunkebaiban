import { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import { uint8ArrayToBase64, base64ToUint8Array, isEmptyUpdate, isValidYjsUpdate, logYjsUpdateInfo } from './utils/yjs-utils';

/**
 * 获取Socket.IO连接URL
 * 统一的配置获取逻辑
 */
function getSocketIOUrl(): string {
  // 优先使用环境变量
  const envSocketUrl = import.meta.env?.VITE_SOCKETIO_URL;
  if (envSocketUrl) {
    return envSocketUrl;
  }

  // 根据环境自动检测
  if (typeof window !== 'undefined') {
    const buildConfig = (window as any).BUILD_CONFIG;
    if (buildConfig?.isAndroid || buildConfig?.platform === 'android') {
      return 'http://localhost:9092';
    }
    
    if (window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      return 'https://your-domain.com:9092';
    }
  }
  
  return 'http://localhost:9092';
}

// 本地缓存键
const OFFLINE_OPERATIONS_KEY = 'cloud_storage_offline_operations';
const LAST_SYNC_KEY = 'cloud_storage_last_sync';

// 离线操作类型 - 严格按照AFFiNE格式
interface OfflineOperation {
  id: string;
  docId: string;
  update: string; // Base64编码的更新数据
  timestamp: number;
  spaceId: string; // 使用spaceId而不是workspaceId
  spaceType: 'workspace' | 'userspace'; // 添加空间类型
}

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
  const [isConnected, setIsConnected] = useState(false);
  const [storageMode, setStorageMode] = useState<CloudStorageStatus['storageMode']>('detecting');
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

  // 保存离线操作 - 按照AFFiNE标准格式
  const saveOfflineOperation = async (docId: string, update: Uint8Array) => {
    if (!currentWorkspaceId) return;
    
    const updateBase64 = await uint8ArrayToBase64(update);
    
    const operation: OfflineOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      docId,
      update: updateBase64, // 保存Base64编码的数据
      timestamp: Date.now(),
      spaceId: currentWorkspaceId, // 使用spaceId
      spaceType: 'workspace' // 添加空间类型
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
    return existing ? JSON.parse(existing) : [];
  };

  const clearOfflineOperations = () => {
    localStorage.removeItem(OFFLINE_OPERATIONS_KEY);
    setOfflineOperationsCount(0);
  };

  // 同步离线操作 - 按照AFFiNE标准格式
  const syncOfflineOperations = async (): Promise<void> => {
    if (!currentWorkspaceId || !socket?.connected) {
      console.warn('⚠️ [云存储管理器] 无法同步：缺少workspace或连接');
      return;
    }

    const operations = getOfflineOperations()
      .filter(op => op.spaceId === currentWorkspaceId) // 使用spaceId过滤
      .sort((a, b) => a.timestamp - b.timestamp); // 按时间顺序排序

    if (operations.length === 0) {
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const operation of operations) {
      try {
        // 按照AFFiNE标准格式发送
        const result = await socket.emitWithAck('space:push-doc-update', {
          spaceType: operation.spaceType || 'workspace',
          spaceId: operation.spaceId,
          docId: operation.docId,
          update: operation.update // 直接使用Base64字符串
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
    console.log('🔍 [currentWorkspaceId] 开始计算当前工作空间ID...');
    console.log('  📋 URL params.workspaceId:', params.workspaceId);
    
    // 从URL路由参数获取
    if (params.workspaceId) {
      console.log('  ✅ 使用URL参数作为workspaceId:', params.workspaceId);
      console.log('  🔍 URL参数格式验证: 长度=', params.workspaceId.length, '包含连字符=', params.workspaceId.includes('-'));
      
      // 🔧 [CRITICAL-FIX] 确保workspaceId始终为长UUID格式
      const workspaceId = params.workspaceId;
      if (workspaceId.length === 36 && workspaceId.includes('-')) {
        console.log('  ✅ [ID-VERIFICATION] 确认为标准UUID格式');
        // 保存到localStorage供其他组件使用
        localStorage.setItem('last_workspace_id', workspaceId);
        return workspaceId;
      } else if (workspaceId.length === 21 && !workspaceId.includes('-')) {
        console.error('  🚨 [ID-ERROR] 检测到短ID格式，这应该不会发生！');
        console.error('  🔍 短ID详情: length=', workspaceId.length, 'value=', workspaceId);
        // 尝试从localStorage获取对应的长UUID
        const storedLongId = localStorage.getItem('last_workspace_id');
        if (storedLongId && storedLongId.length === 36 && storedLongId.includes('-')) {
          console.warn('  ⚠️ [ID-FALLBACK] 使用localStorage中的长UUID:', storedLongId);
          return storedLongId;
        }
      }
      
      return workspaceId;
    }
    
    // 从localStorage获取最后访问的workspace
    const lastWorkspaceId = localStorage.getItem('last_workspace_id');
    console.log('  📋 localStorage last_workspace_id:', lastWorkspaceId);
    
    if (lastWorkspaceId) {
      console.log('  ⚠️ 使用localStorage作为workspaceId:', lastWorkspaceId);
      console.log('  🔍 localStorage格式验证: 长度=', lastWorkspaceId.length, '包含连字符=', lastWorkspaceId.includes('-'));
      return lastWorkspaceId;
    }
    
    console.log('  ❌ 无法确定当前workspace，返回null');
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

  // 推送文档更新 - 增强版本支持队列
  const pushDocUpdate = async (docId: string, update: Uint8Array): Promise<number> => {
    // console.log('🚀 [云存储管理器-推送] 开始处理文档更新推送');
    // console.log(`  📊 请求参数: docId=${docId}, updateSize=${update.length}字节`);
    // console.log(`  🔗 当前状态: workspaceId=${currentWorkspaceId}, online=${isOnline}, socketConnected=${socket?.connected}, isConnected=${isConnected}`);
    
    // 详细分析前端发送的原始数据
    console.log(`  📦 原始数据类型: ${update.constructor.name}`);
    console.log(`  📊 数据长度: ${update.length}字节`);
    console.log(`  🔢 前20字节数值: [${Array.from(update.slice(0, 20)).join(', ')}]`);
    console.log(`  🔤 前20字节十六进制: ${Array.from(update.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
    
    // 尝试将数据解读为不同格式
    try {
      const asString = new TextDecoder('utf-8', { fatal: false }).decode(update.slice(0, 100));
      console.log(`  📝 UTF-8解码尝试(前100字节): "${asString}"`);
    } catch (e) {
      console.log(`  ⚠️ UTF-8解码失败: ${e.message}`);
    }
    
    // 查找可能的文本内容模式
    const dataView = new DataView(update.buffer, update.byteOffset, update.byteLength);
    console.log(`  🧮 DataView长度: ${dataView.byteLength}`);
    
    // 扫描数据中的可打印字符
    let printableChars = '';
    for (let i = 0; i < Math.min(200, update.length); i++) {
      const byte = update[i];
      if (byte >= 32 && byte <= 126) { // ASCII可打印字符
        printableChars += String.fromCharCode(byte);
      } else if (printableChars.length > 0) {
        printableChars += '.';
      }
    }
    if (printableChars.length > 0) {
      console.log(`  📄 可打印字符序列: "${printableChars}"`);
    }
    
    // 检查是否包含中文字符
    const chineseRegex = /[\u4e00-\u9fff]/g;
    const fullString = new TextDecoder('utf-8', { fatal: false }).decode(update);
    const chineseMatches = fullString.match(chineseRegex);
    if (chineseMatches) {
      console.log(`  🈳 发现中文字符: ${chineseMatches.slice(0, 10).join('')}${chineseMatches.length > 10 ? '...' : ''} (共${chineseMatches.length}个)`);
    }
    
    // 查找重复字符模式
    const repeatedPattern = fullString.match(/([1-9])\1{10,}/g);
    if (repeatedPattern) {
      console.log(`  🔁 发现重复字符模式: ${repeatedPattern.slice(0, 3).map(p => `"${p.substring(0, 20)}..."`).join(', ')}`);
    }
    
    if (!currentWorkspaceId) {
      const error = 'No current workspace available';
      console.error('❌ [云存储管理器-推送] 错误:', error);
      throw new Error(error);
    }

    // 如果网络离线，将操作加入队列
    if (!isOnline) {
      saveOfflineOperation(docId, update);
      return new Promise((resolve, reject) => {
        pendingOperations.current.push({ docId, update, resolve, reject });
      });
    }

    if (!socket?.connected || !isConnected) {
      // 如果Socket未连接但网络在线，尝试重连并将操作加入队列
      
      // 异步触发重连
      if (reconnectAttempts.current < maxReconnectAttempts) {
        // 异步触发重连
        setTimeout(() => connectToSocket(), 0);
      } else {
        // 已达到最大重连次数，不再重连
      }
      
      return new Promise((resolve, reject) => {
        pendingOperations.current.push({ docId, update, resolve, reject });
      });
    }

    // 删除重复的Base64编码 - 已在上面的代码中处理

    try {
      console.log('🎯🎯🎯 [云存储管理器-推送] CRITICAL: 开始发送Socket.IO事件!!!');
      console.log('  🎯 事件名称: space:push-doc-update');
      console.log('  🎯 Socket状态: connected=' + socket.connected + ', id=' + socket.id);
      console.log('  📤 发送space:push-doc-update事件...');
      
      // 检测空更新并跳过
      if (isEmptyUpdate(update)) {
        console.log('  🔄 检测到空更新，跳过发送');
        return Date.now();
      }
      
      // 按照AFFiNE标准格式编码数据
      const updateBase64 = await uint8ArrayToBase64(update);
      
      // 验证编码结果
      if (!isValidYjsUpdate(updateBase64)) {
        throw new Error('生成的Base64数据无效');
      }
      
      logYjsUpdateInfo('发送前', update, updateBase64);
      
      const requestData = {
        spaceType: 'workspace' as const,  // 按照AFFiNE标准：spaceType
        spaceId: currentWorkspaceId,      // 按照AFFiNE标准：spaceId而不是workspaceId
        docId: docId,
        update: updateBase64              // 按照AFFiNE标准：update单个Base64字符串
      };
      
      console.log('🎯🎯🎯 [AFFiNE-Standard] Socket.IO请求数据:');
      console.log('  🌟 spaceType:', requestData.spaceType);
      console.log('  🆔 spaceId:', requestData.spaceId);
      console.log('  🔍 spaceId格式: 长度=', requestData.spaceId?.length, '包含连字符=', requestData.spaceId?.includes('-'));
      console.log('  📄 docId:', requestData.docId);
      console.log('  📊 update类型:', typeof requestData.update);
      
      // 详细记录请求数据
      console.log('  📋 AFFiNE标准请求详情:');
      console.log(`    🌟 spaceType: "${requestData.spaceType}"`);
      console.log(`    🆔 spaceId: "${requestData.spaceId}"`);
      console.log(`    📄 docId: "${requestData.docId}"`);
      console.log(`    📝 update长度: ${requestData.update.length}字符`);
      console.log(`    🔤 update前50字符: "${requestData.update.substring(0, 50)}..."`);
      
      // 记录发送时间
      const sendTime = performance.now();
      console.log(`  ⏰ 发送时间戳: ${sendTime}ms`);
      
      console.log('🎯🎯🎯 [云存储管理器-推送] 即将调用socket.emitWithAck!!!');
      console.log('  🎯 最终请求数据:', JSON.stringify(requestData, null, 2));
      
      const result = await socket.emitWithAck('space:push-doc-update', requestData);
      
      console.log('🎯🎯🎯 [云存储管理器-推送] Socket.IO调用完成, 收到响应!!!', result);
      
      // 记录响应时间
      const responseTime = performance.now();
      const latency = responseTime - sendTime;
      console.log(`  ⏱️ 响应延迟: ${latency.toFixed(2)}ms`);
      
      console.log('  📥 收到服务器响应:');
      console.log(`    📊 响应类型: ${typeof result}`);
      console.log(`    🔍 响应内容: ${JSON.stringify(result, null, 2)}`);
      
      // 详细分析响应数据
      if (result && typeof result === 'object') {
        console.log('  🔬 响应数据分析:');
        Object.keys(result).forEach(key => {
          const value = result[key];
          console.log(`    ${key}: ${typeof value} = ${JSON.stringify(value)}`);
        });
      }

      if ('error' in result) {
        console.error('❌ [云存储管理器-推送] 服务器返回错误:', result.error);
        throw new Error(result.error.message);
      }

      setLastSync(new Date(result.timestamp));
      return result.timestamp;
    } catch (error) {
      console.error('❌ [云存储管理器-推送] 文档更新失败:', error);
      
      // 保存为离线操作
      saveOfflineOperation(docId, update);
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
        
        // 加入工作空间 - 严格按照AFFiNE标准格式
        newSocket.emit('space:join', {
          spaceType: 'workspace',
          spaceId: currentWorkspaceId,
          clientVersion: '1.0.0'  // 添加AFFiNE标准要求的clientVersion
        }, (response) => {
          // 修复：检查response是否存在
          if (!response) {
            console.error('❌ [云存储管理器] 空间加入失败: 服务器无响应');
            setStorageMode('error');
          } else if (response && 'error' in response) {
            console.error('❌ [云存储管理器] 空间加入失败:', response.error);
            setStorageMode('error');
          } else {
            setStorageMode('cloud');
            setLastSync(new Date());
            
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
  };

  // 将云存储管理器暴露到全局对象，供CloudDocStorage使用
  useEffect(() => {
    (window as any).__CLOUD_STORAGE_MANAGER__ = value;
    
    return () => {
      delete (window as any).__CLOUD_STORAGE_MANAGER__;
    };
  }, [value]);

  return (
    <CloudStorageContext.Provider value={value}>
      {children}
    </CloudStorageContext.Provider>
  );
};