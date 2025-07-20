import { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';

// 本地缓存键
const OFFLINE_OPERATIONS_KEY = 'cloud_storage_offline_operations';
const LAST_SYNC_KEY = 'cloud_storage_last_sync';

// 离线操作类型
interface OfflineOperation {
  id: string;
  docId: string;
  update: string; // Base64编码的更新数据
  timestamp: number;
  workspaceId: string;
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
  serverUrl = 'http://localhost:9092'
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

  // 本地缓存操作管理
  const saveOfflineOperation = (docId: string, update: Uint8Array) => {
    if (!currentWorkspaceId) return;
    
    const operation: OfflineOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      docId,
      update: uint8ArrayToBase64(update),
      timestamp: Date.now(),
      workspaceId: currentWorkspaceId
    };

    // 从localStorage读取现有操作
    const existing = localStorage.getItem(OFFLINE_OPERATIONS_KEY);
    const operations: OfflineOperation[] = existing ? JSON.parse(existing) : [];
    
    // 添加新操作
    operations.push(operation);
    
    // 保存回localStorage
    localStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(operations));
    setOfflineOperationsCount(operations.length);
    
    console.log('💾 [云存储管理器] 离线操作已保存:', operation.id);
  };

  const getOfflineOperations = (): OfflineOperation[] => {
    const existing = localStorage.getItem(OFFLINE_OPERATIONS_KEY);
    return existing ? JSON.parse(existing) : [];
  };

  const clearOfflineOperations = () => {
    localStorage.removeItem(OFFLINE_OPERATIONS_KEY);
    setOfflineOperationsCount(0);
  };

  // 同步离线操作
  const syncOfflineOperations = async (): Promise<void> => {
    if (!currentWorkspaceId || !socket?.connected) {
      console.warn('⚠️ [云存储管理器] 无法同步：缺少workspace或连接');
      return;
    }

    const operations = getOfflineOperations()
      .filter(op => op.workspaceId === currentWorkspaceId) // 只同步当前workspace的操作
      .sort((a, b) => a.timestamp - b.timestamp); // 按时间顺序排序

    if (operations.length === 0) {
      console.log('✅ [云存储管理器] 没有离线操作需要同步');
      return;
    }

    console.log(`🔄 [云存储管理器] 开始同步 ${operations.length} 个离线操作`);

    let successCount = 0;
    let failureCount = 0;

    for (const operation of operations) {
      try {
        const result = await socket.emitWithAck('space:push-doc-update', {
          spaceType: 'userspace',
          spaceId: operation.workspaceId,
          docId: operation.docId,
          update: operation.update
        });

        if ('error' in result) {
          throw new Error(result.error.message);
        }

        successCount++;
        console.log(`✅ [云存储管理器] 离线操作同步成功: ${operation.id}`);
        
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
      console.log(`🎉 [云存储管理器] 所有 ${successCount} 个离线操作同步成功`);
    } else {
      // 有失败的操作，只移除成功的操作
      const remainingOperations = getOfflineOperations()
        .filter(op => !operations.some(syncOp => syncOp.id === op.id) || op.workspaceId !== currentWorkspaceId);
      localStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(remainingOperations));
      setOfflineOperationsCount(remainingOperations.length);
      console.log(`⚠️ [云存储管理器] 同步完成: ${successCount} 成功, ${failureCount} 失败`);
    }
  };

  // 初始化时读取离线操作数量
  useEffect(() => {
    const operations = getOfflineOperations();
    setOfflineOperationsCount(operations.length);
  }, []);

  // 动态获取当前workspaceId
  const currentWorkspaceId = useMemo(() => {
    // 从URL路由参数获取
    if (params.workspaceId) {
      return params.workspaceId;
    }
    
    // 从localStorage获取最后访问的workspace
    const lastWorkspaceId = localStorage.getItem('last_workspace_id');
    if (lastWorkspaceId) {
      return lastWorkspaceId;
    }
    
    // 如果都没有，返回null表示无法确定当前workspace
    return null;
  }, [params.workspaceId]);

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [云存储管理器] 网络恢复在线');
      setIsOnline(true);
      // 网络恢复时立即尝试重连
      if (!isConnected && currentWorkspaceId) {
        reconnectAttempts.current = 0;
        connectToSocket();
      }
    };

    const handleOffline = () => {
      console.log('🚫 [云存储管理器] 网络离线');
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

    console.log(`🔄 [云存储管理器] 处理 ${operations.length} 个排队操作`);

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
      console.log('🔄 [云存储管理器] 工作空间变化，重新连接:', currentWorkspaceId);
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

  // 转换Uint8Array到Base64
  const uint8ArrayToBase64 = (array: Uint8Array): string => {
    const binaryString = Array.from(array, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
  };

  // 推送文档更新 - 增强版本支持队列
  const pushDocUpdate = async (docId: string, update: Uint8Array): Promise<number> => {
    console.log('🚀 [云存储管理器-推送] 开始处理文档更新推送');
    console.log(`  📊 请求参数: docId=${docId}, updateSize=${update.length}字节`);
    console.log(`  🔗 当前状态: workspaceId=${currentWorkspaceId}, online=${isOnline}, socketConnected=${socket?.connected}, isConnected=${isConnected}`);
    
    // 详细分析前端发送的原始数据
    console.log('🔍 [云存储管理器-推送] 详细数据分析:');
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
      console.log('📦 [云存储管理器-推送] 网络离线，将操作加入队列');
      saveOfflineOperation(docId, update);
      return new Promise((resolve, reject) => {
        pendingOperations.current.push({ docId, update, resolve, reject });
      });
    }

    if (!socket?.connected || !isConnected) {
      // 如果Socket未连接但网络在线，尝试重连并将操作加入队列
      console.log('🔄 [云存储管理器-推送] Socket未连接，将操作加入队列并尝试重连');
      console.log(`  📊 重连状态: attempts=${reconnectAttempts.current}/${maxReconnectAttempts}, socket?.connected=${socket?.connected}, isConnected=${isConnected}`);
      
      // 异步触发重连
      if (reconnectAttempts.current < maxReconnectAttempts) {
        console.log('  🔄 异步触发重连...');
        setTimeout(() => connectToSocket(), 0);
      } else {
        console.warn('  ⚠️ 已达到最大重连次数，不再重连');
      }
      
      return new Promise((resolve, reject) => {
        pendingOperations.current.push({ docId, update, resolve, reject });
      });
    }

    const updateBase64 = uint8ArrayToBase64(update);
    
    // 详细记录Base64编码过程
    console.log('🔄 [云存储管理器-推送] Base64编码过程:');
    console.log(`  📊 编码前: ${update.length}字节`);
    console.log(`  📊 编码后: ${updateBase64.length}字符`);
    console.log(`  🔤 Base64前50字符: ${updateBase64.substring(0, 50)}...`);
    console.log(`  🔍 Base64最后50字符: ...${updateBase64.substring(Math.max(0, updateBase64.length - 50))}`);
    
    // 验证Base64编码的可逆性
    try {
      const decoded = new Uint8Array(atob(updateBase64).split('').map(c => c.charCodeAt(0)));
      const isIdentical = decoded.length === update.length && decoded.every((v, i) => v === update[i]);
      console.log(`  ✅ Base64编码验证: 长度匹配=${decoded.length === update.length}, 内容匹配=${isIdentical}`);
      if (!isIdentical) {
        console.log(`  ⚠️ 编码前后数据不匹配! 原始前10字节: [${Array.from(update.slice(0, 10)).join(',')}]`);
        console.log(`  ⚠️ 编码前后数据不匹配! 解码前10字节: [${Array.from(decoded.slice(0, 10)).join(',')}]`);
      }
    } catch (e) {
      console.error(`  ❌ Base64编码验证失败: ${e.message}`);
    }
    
    console.log('🚀 [云存储管理器-推送] 准备发送Socket.IO请求');
    console.log(`  📦 数据详情: originalSize=${update.length}字节, base64Size=${updateBase64.length}字符`);
    console.log(`  🔗 Socket状态: id=${socket.id}, connected=${socket.connected}`);

    try {
      console.log('  📤 发送space:push-doc-update事件...');
      const requestData = {
        spaceType: 'userspace',
        spaceId: currentWorkspaceId,
        docId: docId,
        update: updateBase64
      };
      
      // 详细记录请求数据
      console.log('  📋 Socket.IO请求详情:');
      console.log(`    🏢 spaceType: "${requestData.spaceType}"`);
      console.log(`    🆔 spaceId: "${requestData.spaceId}"`);
      console.log(`    📄 docId: "${requestData.docId}"`);
      console.log(`    📦 update数据长度: ${requestData.update.length}字符`);
      console.log(`    📝 update数据样本: "${requestData.update.substring(0, 100)}..."`);
      
      // 记录发送时间
      const sendTime = performance.now();
      console.log(`  ⏰ 发送时间戳: ${sendTime}ms`);
      
      const result = await socket.emitWithAck('space:push-doc-update', requestData);
      
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
      console.log('✅ [云存储管理器-推送] 文档更新成功');
      console.log(`  📊 处理结果: timestamp=${result.timestamp}, 最后同步时间=${new Date(result.timestamp).toLocaleTimeString()}`);
      return result.timestamp;
    } catch (error) {
      console.error('❌ [云存储管理器-推送] 文档更新失败');
      console.error('  🔍 错误详情:', error);
      console.error('  📚 完整错误对象:', error);
      
      // 保存为离线操作
      console.log('  💾 保存为离线操作...');
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
      console.error('❌ [云存储管理器] 超过最大重连次数，停止重连');
      setStorageMode('local');
      return;
    }

    try {
      console.log('🔗 [云存储管理器] 开始连接...', { 
        serverUrl, 
        workspaceId: currentWorkspaceId,
        attempt: reconnectAttempts.current + 1
      });
      setStorageMode('detecting');

      const { io } = await import('socket.io-client');
      
      const newSocket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: false, // 我们手动处理重连
      });

      // 连接成功
      newSocket.on('connect', () => {
        console.log('✅ [云存储管理器] Socket连接成功');
        setIsConnected(true);
        setSocket(newSocket);
        reconnectAttempts.current = 0;
        
        // 加入工作空间
        newSocket.emit('space:join', {
          spaceType: 'userspace',
          spaceId: currentWorkspaceId,
          clientVersion: '0.21.0'
        }, (response) => {
          if ('error' in response) {
            console.error('❌ [云存储管理器] 空间加入失败:', response.error);
            setStorageMode('error');
          } else {
            console.log('✅ [云存储管理器] 空间加入成功:', currentWorkspaceId);
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
        console.log('🔌 [云存储管理器] 连接断开:', reason);
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
          console.warn('⏰ [云存储管理器] 连接超时');
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
    
    console.log(`⏱️ [云存储管理器] ${delay}ms后进行第${reconnectAttempts.current + 1}次重连`);
    setStorageMode('detecting');
    
    reconnectTimeout.current = setTimeout(() => {
      reconnectAttempts.current++;
      connectToSocket();
    }, delay);
  };

  // 手动重连
  const reconnect = async (): Promise<void> => {
    console.log('🔄 [云存储管理器] 手动重连');
    
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