# WebSocket 频繁连接断开问题分析

## 问题现象

从后端日志可以看到：
```
2025-11-04 21:13:18.991 - 🔗 客户端连接: clientId=9b9e0682-ff03-4601-b423-e26ef65d7800
2025-11-04 21:13:18.991 - 🏠 客户端加入空间: spaceId=8ebbf6ff-103a-4f98-8545-0aae7d4d72ab
2025-11-04 21:13:18.991 - ✅ 客户端已加入房间
2025-11-04 21:13:18.991 - ❌ 客户端断开: clientId=9b9e0682-ff03-4601-b423-e26ef65d7800
2025-11-04 21:13:19.011 - 🔗 客户端连接: clientId=1fba30c3-1ccd-473d-bd85-f6d70e5d080f
2025-11-04 21:13:19.011 - 🔗 客户端连接: clientId=1fba30c3-1ccd-473d-bd85-f6d70e5d080f (重复)
2025-11-04 21:13:19.127 - 🏠 客户端加入空间
2025-11-04 21:13:19.127 - ❌ 客户端断开
```

**特征**：
- 连接后立即断开（同一毫秒内）
- 同一 clientId 会多次连接
- 加入空间后立即断开

## 根本原因分析

### 1. 双重连接管理系统（核心问题）

前端存在两套独立的 Socket 连接管理系统：

#### 系统1：CloudStorageProvider（全局连接）
**位置**：`packages/frontend/core/src/modules/cloud-storage/provider.tsx`

```typescript
// 第701-759行：useEffect 管理连接
useEffect(() => {
  if (!currentWorkspaceId) {
    // 清理连接
    return;
  }
  
  // workspaceId变化时，断开旧连接，创建新连接
  if (socket) {
    socket.disconnect();
    setSocket(null);
  }
  
  const connectTimer = setTimeout(() => {
    connectToSocket(); // 创建新的 Socket.IO 连接
  }, 100);
  
  return () => {
    clearTimeout(connectTimer);
    if (socket) {
      socket.disconnect();
    }
  };
}, [serverUrl, currentWorkspaceId, connectToSocket, socket]);
```

**问题**：
- 依赖项包含 `socket`，当 `socket` 变化时会重新执行
- `connectToSocket` 是一个 `useCallback`，依赖可能频繁变化
- 100ms 延迟可能导致状态竞态

#### 系统2：CloudDocStorageConnection（文档存储连接）
**位置**：`packages/common/nbstore/src/impls/cloud/doc.ts`

```typescript
// 第287-345行：每个 CloudDocStorage 实例都会创建自己的连接
class CloudDocStorageConnection extends SocketConnection {
  override async doConnect(signal?: AbortSignal) {
    const { socket, disconnect } = await super.doConnect(signal);
    // 发送 space:join 事件
    const res = await socket.emitWithAck('space:join', joinData);
    // ...
  }
}
```

**问题**：
- 每个 `CloudDocStorage` 实例都会创建独立的 Socket 连接
- Worker 线程可能创建多个 `CloudDocStorage` 实例
- 主线程的 `CloudStorageProvider` 也在创建连接
- **两套系统都在连接同一个 Socket.IO 端点，但使用不同的连接实例**

### 2. SocketManager 的 refCount 机制问题

**位置**：`packages/common/nbstore/src/impls/cloud/socket.ts`

```typescript
// 第230-276行
connect() {
  this.refCount++;
  this.socket.connect();
  
  return {
    socket: this.socket,
    disconnect: () => {
      this.refCount--;
      if (this.refCount === 0) {
        this.socket.disconnect(); // 真正的断开
      }
    }
  };
}
```

**问题**：
- 多个地方调用 `connect()` 会增加 `refCount`
- 如果某个地方调用 `disconnect()`，`refCount` 可能归零
- 这会导致 Socket 在仍有其他地方使用时被断开

### 3. useEffect 依赖项不稳定

**位置**：`provider.tsx` 第701行

```typescript
useEffect(() => {
  // ...
}, [serverUrl, currentWorkspaceId, connectToSocket, socket]);
```

**问题**：
- `connectToSocket` 是 `useCallback`，依赖 `[currentWorkspaceId, isOnline, serverUrl, normalizedLocalSessionId]`
- 如果这些依赖频繁变化，`connectToSocket` 会重新创建
- `socket` 在 `useEffect` 中变化会触发重新执行
- **形成循环依赖**：socket 变化 → useEffect 执行 → 断开旧连接 → 创建新连接 → socket 变化

### 4. 组件生命周期导致的重复连接

**位置**：多个文件使用 `CloudStorageProvider`

```typescript
// 以下文件都使用了 CloudStorageProvider：
// - packages/frontend/apps/web/src/app.tsx
// - packages/frontend/core/src/desktop/pages/workspace/index.tsx (多个地方)
// - packages/frontend/apps/electron-renderer/src/app/app.tsx
// - packages/frontend/apps/electron-renderer/src/shell/app.tsx
```

**问题**：
- 多个组件可能同时渲染 `CloudStorageProvider`
- 每个 `CloudStorageProvider` 都会尝试创建连接
- React 18 的并发渲染可能导致组件多次挂载/卸载

### 5. workspaceId 频繁变化

**位置**：`provider.tsx` 第179-205行

```typescript
const currentWorkspaceId = useMemo(() => {
  // 从URL路由参数获取
  if (params.workspaceId) {
    // ...
  }
  // 从localStorage获取
  const lastWorkspaceId = safeStorage.getItem('last_workspace_id');
  // ...
}, [params.workspaceId]);
```

**问题**：
- 路由参数变化会导致 `currentWorkspaceId` 变化
- `currentWorkspaceId` 变化会触发 `useEffect` 重新连接
- 如果路由参数不稳定或频繁变化，会导致频繁重连

## 问题触发流程

```
1. CloudStorageProvider 组件挂载
   ↓
2. useEffect 执行，调用 connectToSocket()
   ↓
3. 创建 Socket.IO 连接，发送 space:join
   ↓
4. CloudDocStorage 实例化，也创建 Socket 连接
   ↓
5. 两个连接可能共享同一个 SocketManager（通过 endpoint）
   ↓
6. refCount 增加，但某个地方调用 disconnect()
   ↓
7. refCount 归零，Socket 断开
   ↓
8. useEffect 检测到 socket 变化，重新执行
   ↓
9. 重复步骤 2-8
```

## 修复建议

### 优先级1：统一连接管理（必须）

**方案A：禁用 CloudStorageProvider 的连接功能**
- `CloudStorageProvider` 只负责状态管理
- 所有连接由 `CloudDocStorageConnection` 统一管理
- 使用单例模式确保只有一个连接实例

**方案B：使用全局连接管理器**
- 创建一个全局的 `SocketConnectionManager`
- `CloudStorageProvider` 和 `CloudDocStorage` 都使用这个管理器
- 通过 `refCount` 或订阅机制管理连接生命周期

### 优先级2：修复 useEffect 依赖（必须）

```typescript
// 移除 socket 依赖，避免循环
useEffect(() => {
  // ...
}, [serverUrl, currentWorkspaceId, connectToSocket]); // 移除 socket

// 或者使用 useRef 存储 socket，避免依赖
const socketRef = useRef<Socket | null>(null);
```

### 优先级3：优化 SocketManager refCount（重要）

```typescript
// 添加连接状态检查
connect() {
  if (this.socket.connected && this.refCount > 0) {
    // 已连接，只增加引用计数
    this.refCount++;
    return { socket: this.socket, disconnect: () => { this.refCount--; } };
  }
  
  this.refCount++;
  this.socket.connect();
  // ...
}
```

### 优先级4：防止重复连接（重要）

```typescript
// 在 connectToSocket 中添加更严格的检查
const connectToSocket = useCallback(async () => {
  if (socket?.connected) {
    return; // 已连接，不重复连接
  }
  
  if (isConnectingRef.current) {
    return; // 连接中，等待完成
  }
  
  // ...
}, [socket?.connected]); // 只依赖连接状态
```

### 优先级5：添加连接去重（可选）

```typescript
// 使用全局连接池
const connectionPool = new Map<string, Socket>();

const getOrCreateConnection = (endpoint: string) => {
  if (connectionPool.has(endpoint)) {
    return connectionPool.get(endpoint)!;
  }
  const socket = io(endpoint);
  connectionPool.set(endpoint, socket);
  return socket;
};
```

## 排查步骤

1. **检查浏览器控制台日志**
   - 查找 `🔌 [SocketManager.connect]` 日志
   - 查找 `🔌 [SocketConnection.doConnect]` 日志
   - 查找 `🔄 [云存储管理器] Workspace变化` 日志

2. **检查 React DevTools**
   - 查看 `CloudStorageProvider` 组件的渲染次数
   - 查看 `currentWorkspaceId` 的变化频率
   - 查看 `socket` 状态的变化

3. **添加调试日志**
   ```typescript
   useEffect(() => {
     console.log('🔍 [DEBUG] useEffect 触发', {
       currentWorkspaceId,
       serverUrl,
       socketId: socket?.id,
       isConnected: socket?.connected,
       stack: new Error().stack
     });
   }, [serverUrl, currentWorkspaceId, connectToSocket, socket]);
   ```

4. **检查路由变化**
   - 确认 `params.workspaceId` 是否频繁变化
   - 确认路由跳转是否导致组件重新挂载

## 临时缓解措施

如果暂时无法修复，可以添加：

1. **连接防抖**
   ```typescript
   const connectDebounceRef = useRef<NodeJS.Timeout>();
   const connectToSocketDebounced = () => {
     if (connectDebounceRef.current) {
       clearTimeout(connectDebounceRef.current);
     }
     connectDebounceRef.current = setTimeout(() => {
       connectToSocket();
     }, 500); // 500ms 防抖
   };
   ```

2. **最小连接间隔**
   ```typescript
   const lastConnectTimeRef = useRef(0);
   const connectToSocket = () => {
     const now = Date.now();
     if (now - lastConnectTimeRef.current < 1000) {
       return; // 1秒内不重复连接
     }
     lastConnectTimeRef.current = now;
     // ...
   };
   ```

## 相关文件

- `packages/frontend/core/src/modules/cloud-storage/provider.tsx` - CloudStorageProvider
- `packages/common/nbstore/src/impls/cloud/doc.ts` - CloudDocStorage
- `packages/common/nbstore/src/impls/cloud/socket.ts` - SocketConnection, SocketManager
- `packages/frontend/core/src/modules/workspace-engine/impls/cloud.ts` - 创建 CloudDocStorage

