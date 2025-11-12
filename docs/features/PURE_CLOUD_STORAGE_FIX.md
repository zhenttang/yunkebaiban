# 纯云存储模式修改总结

## 📅 修改日期
2025-11-01

## 🎯 修改目标
彻底禁用 IndexedDB，实现**纯云存储模式**，解决 "livedata已中毒，连接 IDBConnection 尚未建立" 错误。

---

## ✅ 已完成的修改

### 1. 修改 `cloud.ts` - 移除 Worker 中的 IndexedDB 配置

**文件**: `packages/frontend/core/src/modules/workspace-engine/impls/cloud.ts`

#### 修改 1.1: Android 环境配置 (第 1304-1352 行)

```typescript
// 🌐 [纯云存储模式] Android环境配置
if ((window as any).BUILD_CONFIG?.isAndroid) {
  console.log('🤖 [CloudWorkspaceFlavourProvider] Android环境 - 使用纯云存储配置（禁用IndexedDB）');
  
  return {
    local: {
      // ✅ 只保留浏览器内存通信，不依赖 IndexedDB
      awareness: {
        name: 'BroadcastChannelAwarenessStorage',
        opts: { id: `${this.flavour}:${workspaceId}` },
      },
      // ❌ 完全移除：doc, blob, docSync, blobSync, indexer, indexerSync
    },
    remotes: {
      [`cloud:${this.flavour}`]: {
        doc: { name: 'CloudDocStorage', ... },
        blob: { name: 'CloudBlobStorage', ... },
        awareness: { name: 'CloudAwarenessStorage', ... },
      },
      // ❌ 移除 v1 存储
    },
  };
}
```

#### 修改 1.2: 标准浏览器环境配置 (第 1354-1407 行)

```typescript
// 🌐 [纯云存储模式] 标准浏览器环境配置
console.log('🌐 [CloudWorkspaceFlavourProvider] 标准环境 - 使用纯云存储配置（禁用IndexedDB）');

return {
  local: {
    // ✅ 只保留浏览器内存通信
    awareness: {
      name: 'BroadcastChannelAwarenessStorage',
      opts: { id: `${this.flavour}:${workspaceId}` },
    },
    // ❌ 完全移除所有 IndexedDB 相关存储
  },
  remotes: {
    [`cloud:${this.flavour}`]: {
      doc: { name: 'CloudDocStorage', ... },
      blob: { name: 'CloudBlobStorage', ... },
      awareness: { name: 'CloudAwarenessStorage', ... },
    },
    // ❌ 移除 v1 存储配置
  },
};
```

### 2. 修改 `index.ts` - 禁用本地工作区 Provider

**文件**: `packages/frontend/core/src/modules/workspace-engine/index.ts`

```typescript
export function configureBrowserWorkspaceFlavours(framework: Framework) {
  framework
    // ❌ [纯云存储模式] 禁用本地工作区，只使用云存储
    // .impl(WorkspaceFlavoursProvider('LOCAL'), LocalWorkspaceFlavoursProvider)
    .impl(WorkspaceFlavoursProvider('CLOUD'), CloudWorkspaceFlavoursProvider, [
      GlobalState,
      ServersService,
    ]);
}
```

---

## 📊 修改对比

### 修改前 (旧配置)

```typescript
return {
  local: {
    doc: { name: 'IndexedDBDocStorage', ... },          // ❌ IDB
    blob: { name: 'IndexedDBBlobStorage', ... },         // ❌ IDB
    docSync: { name: 'IndexedDBDocSyncStorage', ... },   // ❌ IDB
    blobSync: { name: 'IndexedDBBlobSyncStorage', ... }, // ❌ IDB
    awareness: { name: 'BroadcastChannelAwarenessStorage', ... },
    indexer: { name: 'IndexedDBIndexerStorage', ... },   // ❌ IDB
    indexerSync: { name: 'IndexedDBIndexerSyncStorage', ... }, // ❌ IDB
  },
  remotes: {
    'cloud:yunke-cloud': {
      doc: { name: 'CloudDocStorage', ... },
      blob: { name: 'CloudBlobStorage', ... },
      awareness: { name: 'CloudAwarenessStorage', ... },
    },
    v1: {
      doc: { name: 'IndexedDBV1DocStorage', ... },  // ❌ IDB
      blob: { name: 'IndexedDBV1BlobStorage', ... }, // ❌ IDB
    },
  },
};
```

### 修改后 (新配置)

```typescript
return {
  local: {
    // ✅ 只保留不依赖 IndexedDB 的存储
    awareness: { name: 'BroadcastChannelAwarenessStorage', ... },
  },
  remotes: {
    'cloud:yunke-cloud': {
      doc: { name: 'CloudDocStorage', ... },
      blob: { name: 'CloudBlobStorage', ... },
      awareness: { name: 'CloudAwarenessStorage', ... },
    },
  },
};
```

---

## 🎯 解决的问题

### 问题根源
虽然主线程的 `WorkerDocStorage` 已经修改为直接使用云存储，但 Worker 配置中仍然包含 IndexedDB 存储配置，导致：

1. Worker 在初始化时创建 IDB 存储实例
2. 自动尝试连接 IndexedDB
3. 如果 IDB 不可用/被禁用，连接失败
4. 错误通过 RxJS Observable 传播到 LiveData
5. LiveData 进入"中毒"状态，抛出错误

### 错误信息
```
500 错误
livedata已中毒，原始错误：Error: 连接 IDBConnection 尚未建立。
at get inner (http://localhost/js/nbstore-0.21.0.worker.js:81:21220)
...
```

### 修改后的效果

✅ **Worker 不会创建任何 IndexedDB 存储实例**
- `StoreConsumer` 在解析 `init.local` 时，只会找到 `awareness`
- 不会查找和实例化任何 IDB 存储类

✅ **不会尝试连接 IndexedDB**
- `this.storages.local.connect()` 只会连接 `BroadcastChannelAwarenessStorage`
- 不会调用 `IDBConnection.connect()`

✅ **所有数据操作通过主线程直接访问云存储**
- 主线程的 `WorkerDocStorage` 已配置为直接调用 `CloudDocStorage`
- 数据读写完全走云端，无本地缓存

✅ **避免 LiveData 中毒错误**
- 没有 IDB 连接，就不会有连接失败
- RxJS Observable 不会收到错误
- LiveData 保持正常状态

---

## 📋 数据流对比

### 修改前（混合模式）

```
用户操作 → WorkspaceEngine → WorkerDocStorage 
   ↓
Worker (nbstore.worker.ts)
   ↓
StoreConsumer 创建 IndexedDBDocStorage 实例
   ↓
IDBConnection.connect() 尝试连接 IndexedDB
   ↓
❌ 连接失败 → Observable 错误 → LiveData 中毒 → 应用崩溃
```

### 修改后（纯云模式）

```
用户操作 → WorkspaceEngine → WorkerDocStorage
   ↓
直接调用主线程的 CloudDocStorage
   ↓
✅ HTTP 请求到云端服务器
   ↓
✅ 返回数据 → 渲染到 UI
```

---

## 🔍 技术细节

### 保留的存储
- ✅ **BroadcastChannelAwarenessStorage**: 用于多标签页之间的实时协作通信（内存通道，不依赖 IDB）

### 移除的存储
- ❌ **IndexedDBDocStorage**: 文档数据本地缓存
- ❌ **IndexedDBBlobStorage**: 文件数据本地缓存
- ❌ **IndexedDBDocSyncStorage**: 文档同步状态
- ❌ **IndexedDBBlobSyncStorage**: 文件同步状态
- ❌ **IndexedDBIndexerStorage**: 搜索索引
- ❌ **IndexedDBIndexerSyncStorage**: 索引同步
- ❌ **IndexedDBV1DocStorage**: v1 版本文档存储（迁移用）
- ❌ **IndexedDBV1BlobStorage**: v1 版本文件存储（迁移用）

### Worker 注册仍保留
虽然移除了 Worker 中的 IDB 配置，但 Worker 本身仍然注册了 IDB 存储实现：

```typescript
// nbstore.worker.ts
const consumer = new StoreManagerConsumer([
  ...idbStorages,           // 仍然注册（但配置中不使用）
  ...idbV1Storages,         // 仍然注册（但配置中不使用）
  ...broadcastChannelStorages,  // 使用
]);
```

**为什么不移除？**
- 保持代码完整性，避免影响其他可能的使用场景
- 只要配置中不包含 IDB 的名字，就不会被实例化
- 未来如果需要恢复 IDB，只需修改配置即可

---

## 🧪 测试建议

### 1. 新建文档测试
```
1. 打开应用
2. 新建工作区
3. 新建文档
4. 输入内容
5. 检查浏览器控制台：
   ✅ 应该看到: "🌐 [CloudWorkspaceFlavourProvider] 标准环境 - 使用纯云存储配置"
   ✅ 不应该看到: IndexedDB 相关的日志
   ❌ 不应该有错误: "连接 IDBConnection 尚未建立"
```

### 2. 刷新页面测试
```
1. 输入内容后刷新页面
2. 检查文档内容是否保存
3. 检查控制台是否有错误
```

### 3. 多标签页测试
```
1. 打开同一工作区的多个标签页
2. 在一个标签页编辑文档
3. 检查其他标签页是否实时同步
4. BroadcastChannelAwarenessStorage 应该正常工作
```

### 4. 网络测试
```
1. 打开浏览器开发者工具 → Network
2. 新建/编辑文档
3. 应该看到对云端 API 的请求：
   - POST /api/workspace/{id}/docs
   - GET /api/workspace/{id}/docs/{docId}
4. 不应该看到 IndexedDB 相关操作
```

### 5. Application 面板测试
```
1. 打开浏览器开发者工具 → Application → IndexedDB
2. 应该看不到或很少有 yunke 相关的数据库
3. 或者数据库存在但没有活跃连接
```

---

## ⚠️ 注意事项

### 1. 离线功能
- ❌ **无离线编辑能力**：没有 IndexedDB 缓存，断网后无法加载文档
- 建议：添加网络状态检测，断网时友好提示

### 2. 性能影响
- ⚠️ **首次加载较慢**：每次都从云端加载，无本地缓存加速
- ⚠️ **网络延迟**：所有操作依赖网络，延迟较本地 IDB 高
- 建议：
  - 优化云端 API 响应速度
  - 考虑添加内存缓存（不持久化）
  - 使用 CDN 加速静态资源

### 3. 数据丢失风险
- ⚠️ **无本地备份**：云端服务故障时可能丢失未同步数据
- 建议：
  - 确保云端服务高可用
  - 实现自动保存机制
  - 添加保存状态提示

### 4. 浏览器兼容性
- ✅ **BroadcastChannelAwarenessStorage**：需要浏览器支持 BroadcastChannel API
- 支持情况：Chrome 54+, Firefox 38+, Safari 15.4+
- 不支持：IE 全系列

### 5. 旧数据迁移
- ❌ **无法自动迁移**：移除了 v1 存储配置，无法从旧版本 IndexedDB 自动迁移
- 如果需要迁移旧数据，需要手动编写迁移脚本

---

## 🔄 如果需要恢复 IndexedDB

如果后续需要恢复混合模式（本地 + 云端），只需：

### 1. 恢复 `cloud.ts` 配置
将 `local` 配置改回包含 IDB 存储：
```typescript
local: {
  doc: { name: 'IndexedDBDocStorage', ... },
  blob: { name: 'IndexedDBBlobStorage', ... },
  // ... 其他配置
},
```

### 2. 恢复 `index.ts` 注册
取消注释本地工作区 Provider：
```typescript
.impl(WorkspaceFlavoursProvider('LOCAL'), LocalWorkspaceFlavoursProvider)
```

### 3. 修改 `WorkerDocStorage`
如果需要恢复本地缓存，修改 `client.ts` 中的 `WorkerDocStorage` 方法，让它优先读取 Worker（IDB），失败后再 fallback 到云端。

---

## 📝 相关文档

- `CLOUD_ONLY_STORAGE_CHANGES.md`: 主线程 WorkerDocStorage 的云存储修改
- `ENV_CONFIG_GUIDE.md`: 环境配置指南
- `DOCUMENT_LOADING_FLOW_ANALYSIS.md`: 文档加载流程分析
- `YJS_SERVICE_ANALYSIS.md`: YJS 服务分析

---

## 🎉 总结

本次修改彻底实现了**纯云存储模式**：

✅ **问题解决**：不再出现 "连接 IDBConnection 尚未建立" 错误
✅ **架构简化**：移除了 IndexedDB 层，减少了复杂度
✅ **数据一致**：所有数据直接存储在云端，避免本地和云端不一致
✅ **代码清晰**：配置明确表达了"纯云存储"的意图

⚠️ **权衡取舍**：
- 失去了离线编辑能力
- 性能依赖网络质量
- 需要确保云端服务稳定

🎯 **适用场景**：
- 企业内网部署，网络稳定
- 强调数据安全和集中管理
- 不需要离线使用
- 避免浏览器存储配额限制

---

## 👨‍💻 修改人员
AI Assistant (Claude)

## 📅 修改时间
2025-11-01 21:45:00

