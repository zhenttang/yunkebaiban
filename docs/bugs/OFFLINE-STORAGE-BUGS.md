# 云客白板前端离线存储功能 Bug 分析报告

**分析日期**: 2026-01-28  
**分析范围**: `baibanfront/packages/frontend/core/src/modules/cloud-storage/`  
**涉及文件**: `provider.tsx`, `utils/yjs-utils.ts`

---

## 一、概述

离线存储功能旨在实现"离线优先"(Offline-First)的数据持久化策略。当网络断开时，用户的编辑操作应被缓存到本地，待网络恢复后自动同步到云端。

经过代码审查，发现以下关键问题导致离线数据**无法正确同步**。

---

## 二、Bug 清单

### Bug #1: 网络恢复后不会自动同步离线操作

**严重程度**: 🔴 P0 - 严重  
**影响**: 离线期间的所有编辑操作永远不会自动同步到云端

**问题位置**: `provider.tsx` 第 530-542 行

**问题代码**:
```typescript
const handleOnline = () => {
  setIsOnline(true);
  isOnlineRef.current = true;
  // 网络恢复时立即尝试重连
  const currentSocket = socketRef.current;
  if (!currentSocket?.connected && currentWorkspaceId) {
    reconnectAttempts.current = 0;
    if (connectToSocketRef.current) {
      connectToSocketRef.current();  // ❌ 只重连，没有同步离线操作
    }
  }
  // ❌ 缺少: syncOfflineOperations() 调用
};
```

**根本原因**:  
`handleOnline` 事件处理函数在网络恢复时只触发 Socket 重连，但没有调用 `syncOfflineOperations()` 来同步 localStorage 中缓存的离线操作。

**预期行为**:  
网络恢复后应自动将离线队列中的所有操作同步到云端。

**修复方案**:
```typescript
const handleOnline = () => {
  setIsOnline(true);
  isOnlineRef.current = true;
  const currentSocket = socketRef.current;
  if (!currentSocket?.connected && currentWorkspaceId) {
    reconnectAttempts.current = 0;
    if (connectToSocketRef.current) {
      connectToSocketRef.current();
    }
  } else if (currentSocket?.connected) {
    // ✅ 网络恢复且已连接时，立即同步离线操作
    syncOfflineOperations();
  }
};
```

---

### Bug #2: Socket 连接成功后不会同步离线操作

**严重程度**: 🔴 P0 - 严重  
**影响**: 即使重连成功，离线队列中的数据也不会被同步

**问题位置**: `provider.tsx` 第 727-730 行 (space:join 成功后的处理)

**问题代码**:
```typescript
// space:join 成功后
if (pendingOperations.current.length > 0) {
  processPendingOperations();  // ✅ 处理 pending 操作
}
// ❌ 缺少: syncOfflineOperations() 调用
finalizeJoinAttempt();
```

**根本原因**:  
`space:join` 成功后只处理了内存中的 `pendingOperations`，没有调用 `syncOfflineOperations()` 来同步 localStorage 中的离线队列。

**预期行为**:  
Socket 重连并加入工作区成功后，应自动同步离线队列。

**修复方案**:
```typescript
if (pendingOperations.current.length > 0) {
  processPendingOperations();
}
// ✅ 同步离线队列
syncOfflineOperations();
finalizeJoinAttempt();
```

**注意**: 此修复需要在两处 `space:join` 成功的代码路径中都添加（第 727-730 行和第 744-750 行）。

---

### Bug #3: `syncOfflineOperations` 使用了可能过期的 `socket` 状态

**严重程度**: 🟡 P1 - 中等  
**影响**: 同步操作可能使用错误的 socket 实例，导致同步失败

**问题位置**: `provider.tsx` 第 422-509 行

**问题代码**:
```typescript
const syncOfflineOperations = useCallback(async (): Promise<void> => {
  // ...
  if (!currentWorkspaceId || !socket?.connected) {  // ❌ 使用 socket 状态
    console.warn('⚠️ [云存储管理器] 无法同步：缺少workspace或连接');
    return;
  }
  // ...
  const result = await socket.emitWithAck('space:push-doc-update', {...});  // ❌ 使用 socket 状态
  // ...
}, [currentWorkspaceId, socket, sessionId, normalizedLocalSessionId]);
```

**根本原因**:  
函数通过 `useCallback` 依赖 `socket` 状态变量，但代码中其他地方使用 `socketRef.current`。由于 React 状态更新的异步性，`socket` 状态和 `socketRef.current` 可能不同步。

**预期行为**:  
应统一使用 `socketRef.current` 来确保获取最新的 socket 实例。

**修复方案**:
```typescript
const syncOfflineOperations = useCallback(async (): Promise<void> => {
  const currentSocket = socketRef.current;  // ✅ 使用 ref
  if (!currentWorkspaceId || !currentSocket?.connected) {
    console.warn('⚠️ [云存储管理器] 无法同步：缺少workspace或连接');
    return;
  }
  // ...
  const result = await currentSocket.emitWithAck('space:push-doc-update', {...});  // ✅ 使用 ref
  // ...
}, [currentWorkspaceId, sessionId, normalizedLocalSessionId]);  // ✅ 移除 socket 依赖
```

---

### Bug #4: Socket 断开但网络在线时数据未保存到离线队列

**严重程度**: 🟡 P1 - 中等  
**影响**: Socket 断开时的编辑操作在页面刷新后会丢失

**问题位置**: `provider.tsx` 第 864-877 行

**问题代码**:
```typescript
// 情况1: 网络离线
if (!isOnlineRef.current) {
  await saveOfflineOperation(normalizedDocId, update);  // ✅ 保存到离线队列
  return enqueuePending();
}

// 情况2: 网络在线但 socket 断开
const currentSocket = socketRef.current;
if (!currentSocket?.connected) {
  if (reconnectAttempts.current < maxReconnectAttempts) {
    setTimeout(() => connectToSocket(), 0);
  }
  return enqueuePending();  // ❌ 只排队到内存，没有保存到离线队列
}
```

**根本原因**:  
代码区分了"网络离线"和"网络在线但 socket 断开"两种情况，但只在网络离线时保存到 localStorage。当网络在线但 socket 断开时，数据只存在于内存中的 `pendingOperations`，页面刷新后会丢失。

**预期行为**:  
只要无法立即发送到云端，都应该保存到持久化存储。

**修复方案**:
```typescript
// 网络离线 或 socket 断开
if (!isOnlineRef.current || !currentSocket?.connected) {
  await saveOfflineOperation(normalizedDocId, update);  // ✅ 统一保存
  
  if (!currentSocket?.connected && reconnectAttempts.current < maxReconnectAttempts) {
    setTimeout(() => connectToSocket(), 0);
  }
  return enqueuePending();
}
```

---

### Bug #5: `processPendingOperations` 失败时数据丢失

**严重程度**: 🟡 P1 - 中等  
**影响**: 同步失败的操作会被永久丢弃

**问题位置**: `provider.tsx` 第 561-573 行

**问题代码**:
```typescript
const processPendingOperations = async () => {
  const operations = [...pendingOperations.current];
  pendingOperations.current = [];  // 清空队列

  for (const operation of operations) {
    try {
      const timestamp = await pushDocUpdate(operation.docId, operation.update);
      operation.resolve(timestamp);
    } catch (error) {
      operation.reject(error);  // ❌ 失败后数据丢失
    }
  }
};
```

**根本原因**:  
当 `pushDocUpdate` 失败时，操作直接被 reject，没有重新入队或保存到离线队列，导致数据丢失。

**预期行为**:  
同步失败的操作应该被保存到离线队列以便后续重试。

**修复方案**:
```typescript
const processPendingOperations = async () => {
  const operations = [...pendingOperations.current];
  pendingOperations.current = [];

  for (const operation of operations) {
    try {
      const timestamp = await pushDocUpdate(operation.docId, operation.update);
      operation.resolve(timestamp);
    } catch (error) {
      // ✅ 失败时保存到离线队列
      await saveOfflineOperation(operation.docId, operation.update);
      operation.reject(error);
    }
  }
};
```

---

### Bug #6: `connectToSocket` 中 `isConnected` 闭包问题

**严重程度**: 🟢 P2 - 低  
**影响**: 可能导致不必要的状态更新

**问题位置**: `provider.tsx` 第 596-604 行

**问题代码**:
```typescript
const connectToSocket = useCallback(async (): Promise<void> => {
  // ...
  if (currentSocket?.connected && currentWorkspaceId === lastWorkspaceIdRef.current) {
    if (!isConnected) {  // ❌ isConnected 可能是旧值
      setTimeout(() => setIsConnected(true), 0);
    }
    return;
  }
  // ...
}, [currentWorkspaceId, normalizedLocalSessionId, removeSessionInfo]);
// ❌ 依赖数组没有 isConnected
```

**根本原因**:  
`isConnected` 是 React 状态，在 `useCallback` 闭包中可能是旧值，但依赖数组没有包含它。

**修复方案**:  
使用 ref 来跟踪连接状态，或将 `isConnected` 添加到依赖数组。

```typescript
// 方案1: 使用 ref
const isConnectedRef = useRef(isConnected);
useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

// 方案2: 添加到依赖数组（可能导致更多重渲染）
}, [currentWorkspaceId, normalizedLocalSessionId, removeSessionInfo, isConnected]);
```

---

### Bug #7: 离线操作未合并相同文档的更新

**严重程度**: 🟢 P2 - 低  
**影响**: 离线队列可能包含大量冗余数据

**问题位置**: `provider.tsx` 第 351-394 行

**问题代码**:
```typescript
const saveOfflineOperation = async (docId: string, update: Uint8Array) => {
  // ...
  const operation: OfflineOperation = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    docId: normalizedDocId,
    update: updateBase64,
    // ...
  };
  
  operations.push(operation);  // ❌ 不检查是否已存在相同 docId
  // ...
};
```

**根本原因**:  
每次保存都创建新的操作记录，没有合并或替换相同 `docId` 的已有操作。

**潜在问题**:
1. 离线队列快速膨胀
2. 同步时发送大量冗余数据
3. 可能超过 `MAX_OFFLINE_OPERATIONS` 限制导致旧数据被丢弃

**修复方案**:
```typescript
const saveOfflineOperation = async (docId: string, update: Uint8Array) => {
  // ...
  
  // ✅ 查找是否已存在相同 docId 的操作
  const existingIndex = operations.findIndex(op => op.docId === normalizedDocId);
  
  if (existingIndex >= 0) {
    // ✅ 合并更新（使用 Yjs mergeUpdates）
    const existingUpdate = base64ToUint8Array(operations[existingIndex].update);
    const mergedUpdate = mergeUpdates([existingUpdate, update]);
    operations[existingIndex] = {
      ...operations[existingIndex],
      update: await uint8ArrayToBase64(mergedUpdate),
      timestamp: Date.now(),
    };
  } else {
    operations.push(operation);
  }
  // ...
};
```

---

## 三、Bug 严重程度汇总

| ID | 问题描述 | 严重程度 | 优先级 |
|----|---------|---------|--------|
| #1 | 网络恢复后不同步离线操作 | 🔴 严重 | P0 |
| #2 | Socket 重连后不同步离线操作 | 🔴 严重 | P0 |
| #3 | syncOfflineOperations 使用过期 socket | 🟡 中等 | P1 |
| #4 | Socket 断开时数据未持久化 | 🟡 中等 | P1 |
| #5 | 同步失败时数据丢失 | 🟡 中等 | P1 |
| #6 | connectToSocket 闭包问题 | 🟢 低 | P2 |
| #7 | 离线操作未合并 | 🟢 低 | P2 |

---

## 四、修复顺序建议

1. **第一阶段 (P0)**: 修复 Bug #1 和 #2，确保离线数据能够被同步
2. **第二阶段 (P1)**: 修复 Bug #3, #4, #5，提高数据可靠性
3. **第三阶段 (P2)**: 修复 Bug #6, #7，优化性能和代码质量

---

## 五、测试验证方案

### 场景 1: 基本离线同步
1. 打开应用，连接到云端
2. 断开网络（模拟离线）
3. 进行编辑操作
4. 恢复网络
5. **预期**: 离线期间的编辑自动同步到云端

### 场景 2: Socket 断开重连
1. 打开应用，连接到云端
2. 服务器重启或网络抖动导致 Socket 断开
3. 在断开期间进行编辑
4. Socket 自动重连
5. **预期**: 断开期间的编辑自动同步

### 场景 3: 页面刷新后恢复
1. 断开网络
2. 进行编辑操作
3. 刷新页面
4. 恢复网络
5. **预期**: localStorage 中的离线操作被同步

### 场景 4: 同步失败重试
1. 连接到云端
2. 进行编辑
3. 服务器返回错误
4. **预期**: 失败的操作被保存，后续自动重试

---

## 六、相关文件

- `packages/frontend/core/src/modules/cloud-storage/provider.tsx` - 主要逻辑
- `packages/frontend/core/src/modules/cloud-storage/utils/yjs-utils.ts` - 工具函数
- `packages/common/nbstore/` - 底层存储实现

---

## 七、参考资料

- [Yjs CRDT 文档](https://docs.yjs.dev/)
- [Socket.IO 客户端文档](https://socket.io/docs/v4/client-api/)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
