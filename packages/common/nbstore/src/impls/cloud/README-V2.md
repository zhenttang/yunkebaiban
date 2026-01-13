# Cloud Storage V2 架构 - 使用指南

## 概述

V2架构是对原有CloudDocStorage和CloudAwarenessStorage的重构，解决了多客户端同步的race condition问题。

### 核心改进

1. **消除Race Condition** - Socket监听器在`space:join`之前注册
2. **资源共享** - idConverter、clientId等资源只加载一次，所有Storage共享
3. **架构解耦** - Connection负责连接，Storage负责业务逻辑
4. **性能优化** - 减少重复的Socket连接、join操作、idConverter加载

### 架构对比

**旧架构（V1）**：
```
CloudDocStorage          CloudAwarenessStorage
      ↓                          ↓
CloudDocStorageConnection  独立的SocketConnection
      ↓                          ↓
各自的Socket连接（重复！）
各自的space:join（重复！）
各自的idConverter加载（重复！）
❌ 监听器在join之后注册 ← Race Condition！
```

**新架构（V2）**：
```
WorkspaceConnection (唯一连接管理器)
      ↓
✅ 先注册监听器
✅ 再执行space:join
✅ 加载idConverter（共享）
✅ 事件总线分发
      ↓
      ├→ CloudDocStorageV2 (订阅者)
      └→ CloudAwarenessStorageV2 (订阅者)
```

---

## 快速开始

### 1. 创建Workspace连接

```typescript
import { createWorkspaceConnection } from '@yunke/nbstore/impls/cloud/index-v2';

// 创建连接（使用单例工厂，相同workspace自动复用）
const { connection, release } = createWorkspaceConnection({
  serverBaseUrl: 'https://api.yunke.com',
  isSelfHosted: false,
  spaceType: 'workspace',
  spaceId: 'your-workspace-id',
});

// 连接到服务器
await connection.connect();

// 使用完毕后释放连接
// 当引用计数降为0时，连接会自动关闭
release();
```

### 2. 创建Storage

#### 方式1：依赖注入模式（推荐 - 共享连接）

```typescript
import { CloudDocStorage, CloudAwarenessStorage } from '@yunke/nbstore/impls/cloud';

// 创建DocStorage，注入WorkspaceConnection
const docStorage = new CloudDocStorage(
  {
    id: 'your-workspace-id',
    serverBaseUrl: 'https://api.yunke.com',
    isSelfHosted: false,
    type: 'workspace',
  },
  connection // ← 依赖注入，共享连接
);

// 创建AwarenessStorage，使用同一个connection
const awarenessStorage = new CloudAwarenessStorage(
  {
    id: 'your-workspace-id',
    serverBaseUrl: 'https://api.yunke.com',
    isSelfHosted: false,
    type: 'workspace',
  },
  connection // ← 共享同一个WorkspaceConnection
);
```

**优点**：
- ✅ CloudDocStorage和CloudAwarenessStorage共享同一个Socket连接
- ✅ 最优性能，只有一个`space:join`
- ✅ 适用于主线程手动创建Storage的场景

#### 方式2：独立模式（Worker兼容）

```typescript
import { CloudAwarenessStorage } from '@yunke/nbstore/impls/cloud';

// CloudAwarenessStorage支持不传connection参数
// 此时会自动创建WorkspaceConnection
const awarenessStorage = new CloudAwarenessStorage({
  id: 'your-workspace-id',
  serverBaseUrl: 'https://api.yunke.com',
  isSelfHosted: false,
  type: 'workspace',
}); // ← 注意：只传opts，不传connection
```

**说明**：
- ✅ 自动创建并管理WorkspaceConnection
- ✅ Worker端兼容（Worker通过反射只能传单个参数）
- ⚠️ 如果多个Storage都使用独立模式，可能创建多个连接（会被ConnectionManager去重）

**最佳实践**：
- 主线程：使用**方式1**（依赖注入），手动创建共享connection
- Worker端：自动使用**方式2**（独立模式），framework限制无法传入connection

// 创建AwarenessStorage，注入WorkspaceConnection
const awarenessStorage = new CloudAwarenessStorageV2(
  {
    id: 'your-workspace-id',
    serverBaseUrl: 'https://api.yunke.com',
    isSelfHosted: false,
    type: 'workspace',
  },
  connection // ← 依赖注入，复用同一个连接
);
```

### 3. 使用Storage（API不变）

```typescript
// DocStorage的API完全兼容V1
docStorage.subscribeDocUpdate((update) => {
  console.log('收到文档更新:', update.docId);
});

await docStorage.pushDocUpdate({
  docId: 'doc-123',
  bin: updateData,
});

// AwarenessStorage的API完全兼容V1
awarenessStorage.subscribeUpdate(
  'doc-123',
  (update) => console.log('Awareness更新'),
  async () => ({ docId: 'doc-123', bin: awarenessData })
);
```

---

## 与现有代码集成

### 在Share Page中使用

修改 `share-page.tsx` 的workspace创建逻辑：

```typescript
import { createWorkspaceConnection, CloudDocStorageV2, CloudAwarenessStorageV2 } from '@yunke/nbstore/impls/cloud/index-v2';

// 在workspace创建时
const { connection, release } = createWorkspaceConnection({
  serverBaseUrl: getBaseUrl(),
  isSelfHosted: false,
  spaceType: 'workspace',
  spaceId: workspaceId,
});

// 等待连接建立
await connection.connect();

// 创建workspace配置，使用V2 Storage
const { workspace } = workspacesService.open(
  {
    metadata: { id: workspaceId, flavour: 'yunke-cloud' },
    isSharedMode: true,
  },
  {
    local: {
      awareness: {
        name: 'BroadcastChannelAwarenessStorage',
        opts: { id: `yunke-cloud:${workspaceId}` },
      },
    },
    remotes: {
      'cloud:yunke-cloud': {
        // 使用V2的factory函数
        doc: {
          name: 'CloudDocStorageV2',
          opts: {
            type: 'workspace',
            id: workspaceId,
            serverBaseUrl: getBaseUrl(),
            isSelfHosted: false,
          },
          // 传入connection实例
          factory: (opts) => new CloudDocStorageV2(opts, connection),
        },
        awareness: {
          name: 'CloudAwarenessStorageV2',
          opts: {
            type: 'workspace',
            id: workspaceId,
            serverBaseUrl: getBaseUrl(),
            isSelfHosted: false,
          },
          factory: (opts) => new CloudAwarenessStorageV2(opts, connection),
        },
      },
    },
  }
);

// 清理时释放连接
onCleanup(() => {
  release();
});
```

---

## 事件总线API

### 订阅WorkspaceConnection事件

```typescript
import type { DocUpdateMessage, AwarenessUpdateMessage } from '@yunke/nbstore/impls/cloud/index-v2';

// 订阅文档更新
connection.on('doc:update', (message: DocUpdateMessage) => {
  console.log('收到文档更新:', message.docId, message.timestamp);
});

// 订阅批量文档更新
connection.on('doc:updates', (messages: DocUpdateMessage[]) => {
  console.log(`收到${messages.length}个文档更新`);
});

// 订阅awareness更新
connection.on('awareness:update', (message: AwarenessUpdateMessage) => {
  console.log('Awareness更新:', message.docId);
});

// 订阅连接状态
connection.on('connection:connected', () => {
  console.log('已连接到服务器');
});

connection.on('connection:synced', () => {
  console.log('连接已同步（idConverter加载完成）');
});

connection.on('connection:disconnected', (reason) => {
  console.log('连接断开:', reason);
});

connection.on('connection:error', (error) => {
  console.error('连接错误:', error);
});
```

---

## 调试工具

### 查看连接状态

```typescript
import { getWorkspaceConnectionManager } from '@yunke/nbstore/impls/cloud/index-v2';

const manager = getWorkspaceConnectionManager();

// 获取活跃连接数
console.log('活跃连接数:', manager.getActiveConnectionCount());

// 获取所有连接的详细状态
console.log('连接状态:', manager.getConnectionStats());
// 输出：
// [
//   {
//     key: 'workspace:abc-123',
//     refCount: 2,
//     connected: true,
//     isReady: true
//   }
// ]
```

---

## 测试

### 验证Race Condition修复

测试场景：浏览器A编辑，浏览器B刚打开文档

**旧架构（V1）** - 会丢失更新：
```
T=0ms    B: space:join
T=50ms   A: 编辑，pushUpdate
T=60ms   服务器广播 → B收到 ❌ 无监听器，丢失！
T=200ms  B: idConverter加载完成
T=210ms  B: 注册监听器 ← 太晚了
```

**新架构（V2）** - 不会丢失：
```
T=0ms    B: 注册监听器 ✅
T=10ms   B: space:join
T=50ms   A: 编辑，pushUpdate
T=60ms   服务器广播 → B收到 ✅ 缓存到earlyUpdates
T=200ms  B: idConverter加载完成
T=210ms  B: flushEarlyUpdates() ✅ 处理缓存的更新
```

### 性能验证

```typescript
// 打开控制台，查看日志
// ✅ 应该只看到一次：
// - "space:join"
// - "idConverter加载"
// ❌ 旧架构会看到多次（每个Storage各一次）
```

---

## 向后兼容性

- ✅ **对外API完全兼容** - Storage的接口保持不变
- ✅ **可以渐进式迁移** - V1和V2可以共存
- ✅ **Feature Flag支持** - 可以通过环境变量切换

---

## 注意事项

1. **必须注入WorkspaceConnection** - Storage不再自己管理连接
2. **记得调用release()** - 防止内存泄漏
3. **连接是共享的** - 相同workspace的多个Storage会复用同一个连接
4. **等待isReady** - 在`connection.isReady`为true后再使用idConverter

---

## 故障排除

### 问题：TypeError: Cannot read property 'oldIdToNewId' of null

**原因**：在idConverter加载完成前调用了`connection.idConverter`

**解决**：
```typescript
// ❌ 错误
const docId = connection.idConverter.oldIdToNewId(id);

// ✅ 正确
if (connection.isReady) {
  const docId = connection.idConverter.oldIdToNewId(id);
}
```

### 问题：更新仍然丢失

**检查清单**：
1. 确认使用的是V2版本的Storage
2. 确认WorkspaceConnection已正确注入
3. 检查控制台是否有"早期缓存更新"的日志
4. 确认`connection.connect()`已被调用

---

## 文件清单

新架构的核心文件：

```
packages/common/nbstore/src/impls/cloud/
├── workspace-connection-events.ts       # 事件类型定义
├── workspace-connection.ts              # WorkspaceConnection核心类
├── workspace-connection-manager.ts      # 连接管理器（单例工厂）
├── doc-v2.ts                           # CloudDocStorageV2
├── awareness-v2.ts                      # CloudAwarenessStorageV2
├── index-v2.ts                          # 统一导出
└── README-V2.md                         # 本文档
```

---

## 下一步

1. **测试新架构** - 在开发环境中测试多客户端同步
2. **性能对比** - 对比V1和V2的性能差异
3. **灰度发布** - 通过Feature Flag逐步切换到V2
4. **移除旧代码** - 确认V2稳定后移除V1

---

**反馈和问题**请提交Issue或联系开发团队。
