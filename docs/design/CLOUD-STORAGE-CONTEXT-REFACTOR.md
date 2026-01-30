# CloudStorageContext 重构设计文档

## 1. 问题背景

当前 `CloudStorageContext` 将 16 个属性放在单一 Context 中，导致：
- 任何状态变化都会触发所有消费者重新渲染
- 高频变化的状态（如 `pendingOperationsCount`）影响低频组件
- 不必要的性能开销

## 2. 当前状态分析

### 2.1 Context 属性分类

| 分类 | 属性 | 变化频率 | 说明 |
|------|------|---------|------|
| **连接状态** | `isConnected` | 中 | 连接/断开时变化 |
| | `storageMode` | 低 | 模式切换时变化 |
| | `isOnline` | 低 | 网络状态变化 |
| | `socket` | 低 | 连接建立时设置 |
| **同步状态** | `lastSync` | 高 | 每次同步后更新 |
| | `syncStatus` | 高 | 同步过程中频繁变化 |
| | `syncError` | 低 | 仅错误时设置 |
| | `pendingOperationsCount` | 高 | 操作队列变化 |
| | `offlineOperationsCount` | 中 | 离线操作变化 |
| **会话信息** | `sessionId` | 极低 | 初始化后不变 |
| | `clientId` | 极低 | 初始化后不变 |
| | `sessions` | 低 | 用户加入/离开 |
| | `currentWorkspaceId` | 低 | 切换工作区 |
| **操作方法** | `reconnect` | 不变 | 函数引用稳定 |
| | `pushDocUpdate` | 不变 | 函数引用稳定 |
| | `syncOfflineOperations` | 不变 | 函数引用稳定 |
| | `cloudSyncEnabled` | 极低 | 用户手动切换 |
| | `setCloudSyncEnabled` | 不变 | 函数引用稳定 |

### 2.2 消费者使用分析

| 组件 | 使用的属性 | 最佳 Context |
|------|-----------|-------------|
| `cloud-storage-indicator.tsx` | isConnected, storageMode, lastSync, reconnect, pendingOperationsCount | Connection + Sync + Actions |
| `cloud-storage-status.tsx` | storageMode, isConnected, isOnline, lastSync, pendingOperationsCount, reconnect | Connection + Sync + Actions |
| `workspace-cloud-status.tsx` | storageMode, isConnected, isOnline, lastSync, pendingOperationsCount, reconnect | Connection + Sync + Actions |
| `root-app-sidebar/index.tsx` | isConnected, storageMode | Connection |
| `save-status-indicator.tsx` | pushDocUpdate, isConnected | Actions + Connection |

## 3. 重构方案

### 3.1 Context 拆分设计

```typescript
// 1️⃣ 连接状态 Context（中频变化）
export interface CloudStorageConnection {
  isConnected: boolean;
  storageMode: 'detecting' | 'local' | 'cloud' | 'error';
  isOnline: boolean;
  socket: Socket | null;
}

// 2️⃣ 同步状态 Context（高频变化）
export interface CloudStorageSync {
  lastSync: Date | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  pendingOperationsCount: number;
  offlineOperationsCount: number;
}

// 3️⃣ 会话信息 Context（低频变化）
export interface CloudStorageSession {
  sessionId: string;
  clientId: string | null;
  sessions: SessionDisplayInfo[];
  currentWorkspaceId: string | null;
}

// 4️⃣ 操作方法 Context（几乎不变）
export interface CloudStorageActions {
  reconnect: () => Promise<void>;
  pushDocUpdate: (docId: string, update: Uint8Array) => Promise<number>;
  syncOfflineOperations: () => Promise<void>;
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;
}
```

### 3.2 Provider 嵌套结构

```tsx
// 按变化频率从低到高排列
// 外层（低频）包裹内层（高频），确保高频变化不影响外层消费者
return (
  <CloudStorageActionsContext.Provider value={actionsValue}>
    <CloudStorageSessionContext.Provider value={sessionValue}>
      <CloudStorageConnectionContext.Provider value={connectionValue}>
        <CloudStorageSyncContext.Provider value={syncValue}>
          {/* 向后兼容的聚合 Context */}
          <CloudStorageContext.Provider value={value}>
            {children}
          </CloudStorageContext.Provider>
        </CloudStorageSyncContext.Provider>
      </CloudStorageConnectionContext.Provider>
    </CloudStorageSessionContext.Provider>
  </CloudStorageActionsContext.Provider>
);
```

### 3.3 新增 Hooks

```typescript
// 细粒度 Hooks（推荐使用）
export const useCloudStorageConnection = (): CloudStorageConnection;
export const useCloudStorageSync = (): CloudStorageSync;
export const useCloudStorageSession = (): CloudStorageSession;
export const useCloudStorageActions = (): CloudStorageActions;

// 向后兼容（逐步废弃）
export const useCloudStorage = (): CloudStorageStatus;
```

## 4. 迁移策略

### 4.1 阶段一：添加新 Hooks（无破坏性）

1. 在 `provider.tsx` 中添加 4 个新的 Context
2. 添加 4 个新的细粒度 Hooks
3. 保留原有 `useCloudStorage` Hook 不变
4. 更新 `index.ts` 导出新 Hooks

### 4.2 阶段二：逐步迁移消费者

| 组件 | 当前 | 迁移后 |
|------|------|--------|
| `root-app-sidebar` | `useCloudStorage` | `useCloudStorageConnection` |
| `save-status-indicator` | `useCloudStorage` | `useCloudStorageConnection` + `useCloudStorageActions` |
| `cloud-storage-indicator` | `useCloudStorage` | `useCloudStorageConnection` + `useCloudStorageSync` + `useCloudStorageActions` |

### 4.3 阶段三：清理（可选）

1. 为 `useCloudStorage` 添加 deprecation 警告
2. 最终移除聚合 Context

## 5. 预期收益

### 5.1 性能提升

| 场景 | 优化前 | 优化后 |
|------|--------|--------|
| 同步状态变化 | 所有 5 个消费者重新渲染 | 仅使用 Sync Context 的组件 |
| 连接状态变化 | 所有 5 个消费者重新渲染 | 仅使用 Connection Context 的组件 |
| 调用操作方法 | 不触发重新渲染 | 不触发重新渲染 |

### 5.2 代码质量

- 更清晰的职责分离
- 更容易理解每个组件依赖什么数据
- 便于测试和 mock

## 6. 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| 引入新 bug | 保留向后兼容的 `useCloudStorage`，逐步迁移 |
| 增加代码复杂度 | 提供清晰的文档和使用示例 |
| 迁移成本 | 分阶段实施，不强制迁移 |

## 7. 实施计划

- [ ] **PR 1**: 添加新 Context 和 Hooks（本文档）
- [ ] **PR 2**: 迁移 `root-app-sidebar`（最简单的消费者）
- [ ] **PR 3**: 迁移状态指示器组件
- [ ] **PR 4**: 迁移保存状态组件
- [ ] **PR 5**: 添加 deprecation 警告（可选）

## 8. 参考资料

- [React Context 性能优化](https://react.dev/learn/passing-data-deeply-with-context#optimizing-re-renders-when-passing-objects-and-functions)
- [Kent C. Dodds - How to use React Context effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
