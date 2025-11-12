# 文档内容加载逻辑完整分析

## 概述

本文档详细分析了 YunKe（云客白板）前端项目中文档内容的完整加载流程，从用户打开文档到数据渲染到编辑器的全过程。

## 架构层次

文档加载涉及以下几个核心架构层：

```
┌─────────────────────────────────────────────────────────────┐
│                      UI/编辑器层                               │
│              (BlockSuite Editor/DocImpl)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ onLoadDoc()
┌────────────────────▼────────────────────────────────────────┐
│                   Workspace层                                 │
│    (WorkspaceImpl, WorkspaceEngine, WorkspaceService)        │
└────────────────────┬────────────────────────────────────────┘
                     │ engine.doc.connectDoc()
┌────────────────────▼────────────────────────────────────────┐
│                  Frontend层（主线程）                         │
│           DocFrontend (doc.ts in frontend/)                  │
│   - 管理文档加载状态                                           │
│   - 协调存储和同步                                             │
│   - 作业调度和队列管理                                          │
└──────┬──────────────────────────────┬─────────────────────┘
       │                              │
       │ getDoc()                     │ waitForSynced()
       │                              │
┌──────▼──────────────┐      ┌────────▼───────────────────────┐
│    Storage层        │      │         Sync层                  │
│  (DocStorage)       │      │      (DocSync)                  │
│  - IndexedDB        │      │  - DocSyncPeer                  │
│  - CloudStorage     │      │  - 远程同步协调                  │
└─────────────────────┘      └────────────────────────────────┘
       │                              │
       │                              │
┌──────▼──────────────────────────────▼─────────────────────┐
│              Worker层（Web Worker）                         │
│         StoreClient + WorkerDocStorage                     │
│   - 在后台线程处理存储操作                                    │
│   - 避免阻塞主线程                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 1. 初始化流程

### 1.1 Workspace 创建

**文件**: `packages/frontend/core/src/modules/workspace/entities/workspace.ts`

```typescript
// 1. 创建 Workspace 实例
constructor(scope, featureFlagService) {
  this.rootYDoc = new YDoc({ guid: workspace.id });
  
  // 2. 创建 WorkspaceImpl（BlockSuite的Workspace实现）
  this._docCollection = new WorkspaceImpl({
    id: workspace.id,
    rootDoc: this.rootYDoc,
    blobSource: { ... },
    
    // ⭐ 关键：设置文档加载回调
    onLoadDoc: doc => this.engine.doc.connectDoc(doc),
    onLoadAwareness: awareness => this.engine.awareness.connectAwareness(awareness),
    onCreateDoc: docId => this.docs.createDoc({ id: docId, skipInit: true }).id,
  });
}
```

### 1.2 WorkspaceEngine 启动

**文件**: `packages/frontend/core/src/modules/workspace/entities/engine.ts`

```typescript
start() {
  // 1. 通过 NbstoreService 打开存储
  const { store, dispose } = this.nbstoreService.openStore(
    `workspace:${flavour}:${id}`,
    engineWorkerInitOptions
  );
  
  this.client = store; // StoreClient 实例
  
  // 2. 优先加载根文档
  const rootDoc = this.workspaceService.workspace.docCollection.doc;
  this.doc.addPriority(rootDoc.guid, 100);
  
  // ⭐ 启动文档前端（DocFrontend）
  this.doc.start();
}
```

### 1.3 StoreClient 初始化

**文件**: `packages/common/nbstore/src/worker/client.ts:158`

```typescript
constructor(client, cloudDocStoragePromise) {
  // 1. 创建 WorkerDocStorage（主线程代理）
  this.docStorage = new WorkerDocStorage(this.client, cloudDocStoragePromise);
  
  // 2. 创建 DocSync
  if (cloudDocStoragePromise) {
    // 主线程同步（用于云端）
    this.docSync = new DocSyncImpl({
      local: this.docStorage,
      remotes: {}  // 稍后动态添加云端peer
    }, workerDocSyncStorage);
    
    // 异步初始化云端同步
    this.initializeCloudSync(cloudDocStoragePromise, ...);
  } else {
    // Worker同步
    this.docSync = new WorkerDocSync(this.client);
  }
  
  // ⭐ 3. 创建 DocFrontend（核心加载协调器）
  this.docFrontend = new DocFrontend(this.docStorage, this.docSync);
}
```

---

## 2. 文档加载流程

### 2.1 触发点：用户打开文档

**文件**: `packages/frontend/core/src/modules/workspace/impls/doc.ts:158`

```typescript
load(initFn?: () => void): this {
  if (this.ready) return this;
  
  this.spaceDoc.load();
  
  // ⭐ 触发加载回调，开始连接文档
  this.workspace.onLoadDoc?.(this.spaceDoc);
  this.workspace.onLoadAwareness?.(this.awarenessStore.awareness);
  
  initFn?.();
  
  this._loaded = true;
  this._ready = true;
  
  return this;
}
```

### 2.2 DocFrontend.connectDoc()

**文件**: `packages/common/nbstore/src/frontend/doc.ts:517`

```typescript
private _connectDoc(doc: YDoc) {
  if (this.status.docs.has(doc.guid)) {
    throw new Error('文档已连接');
  }
  
  // ⭐ 1. 调度 load 作业
  this.schedule({
    type: 'load',
    docId: doc.guid,
  });
  
  // 2. 注册文档
  this.status.docs.set(doc.guid, doc);
  
  // 3. 监听文档更新（用户编辑）
  doc.on('update', this.handleDocUpdate);
  
  // 4. 监听文档销毁
  doc.on('destroy', () => {
    this.disconnectDoc(doc);
  });
}
```

### 2.3 主循环处理

**文件**: `packages/common/nbstore/src/frontend/doc.ts:236`

```typescript
private async mainLoop(signal?: AbortSignal) {
  // 1. 等待存储连接
  await this.storage.connection.waitForConnected(signal);
  
  // 2. 订阅存储更新（来自其他客户端/标签页）
  const dispose = this.storage.subscribeDocUpdate((record, origin) => {
    this.event.onStorageUpdate(record, origin);
  });
  
  try {
    while (true) {
      throwIfAborted(signal);
      
      // ⭐ 3. 等待并获取下一个文档作业
      const docId = await this.status.jobDocQueue.asyncPop(signal);
      const jobs = this.status.jobMap.get(docId);
      this.status.jobMap.delete(docId);
      
      if (!jobs) continue;
      
      this.status.currentJob = { docId, jobs };
      
      // 4. 分组处理作业
      const { apply, load, save } = groupBy(jobs, job => job.type);
      
      // ⭐ 按顺序执行：load -> apply -> save
      if (load?.length) {
        await this.jobs.load(load[0], signal);
      }
      
      if (apply?.length) {
        for (const applyJob of apply) {
          await this.jobs.apply(applyJob, signal);
        }
      }
      
      if (save?.length) {
        await this.jobs.save(docId, save, signal);
      }
      
      this.status.currentJob = null;
      this.statusUpdatedSubject$.next(docId);
    }
  } finally {
    dispose();
  }
}
```

---

## 3. Load 作业详解

**文件**: `packages/common/nbstore/src/frontend/doc.ts:337`

```typescript
load: async (job: Job & { type: 'load' }, signal?: AbortSignal) => {
  const doc = this.status.docs.get(job.docId);
  if (!doc) return;
  
  // 1. 获取文档当前状态
  const existingData = encodeStateAsUpdate(doc);
  
  // 2. 如果文档有现有数据，调度保存作业
  if (!isEmptyUpdate(existingData)) {
    this.schedule({
      type: 'save',
      docId: doc.guid,
      update: existingData,
    });
  }
  
  // ⭐ 3. 触发文档 sync 事件（标记为已连接）
  doc.emit('sync', [true, doc]);
  
  // ⭐ 4. 从存储读取文档数据
  const docRecord = await this.storage.getDoc(job.docId);
  
  throwIfAborted(signal);
  
  // 5. 应用文档更新
  if (docRecord && !isEmptyUpdate(docRecord.bin)) {
    this.applyUpdate(job.docId, docRecord.bin);
    this.status.readyDocs.add(job.docId);
  } else {
    // 即使文档为空，也标记为 ready，允许应用层初始化默认内容
    this.status.readyDocs.add(job.docId);
  }
  
  // 6. 标记为已加载
  this.status.connectedDocs.add(job.docId);
  this.statusUpdatedSubject$.next(job.docId);
}
```

---

## 4. Storage层：获取文档数据

### 4.1 WorkerDocStorage（主线程代理）

**文件**: `packages/common/nbstore/src/worker/client.ts:250`

```typescript
async getDoc(docId: string) {
  // ⭐ 1. 通过 Worker 获取文档
  const result = await this.client.call('docStorage.getDoc', docId);
  
  // 2. 如果 Worker 返回 null 且配置了云端存储，尝试从云端拉取
  if (!result && this.cloudStoragePromise) {
    try {
      const cloudStorage = await this.cloudStoragePromise;
      if (cloudStorage) {
        const cloudDoc = await cloudStorage.getDoc(docId);
        
        if (cloudDoc && cloudDoc.bin && cloudDoc.bin.length > 0) {
          // ⭐ 从云端获取成功，推送到本地存储
          await this.pushDocUpdate({
            docId,
            bin: cloudDoc.bin,
          });
          return cloudDoc;
        }
      }
    } catch (error) {
      console.error('❌ 从云端获取文档失败:', error);
    }
  }
  
  return result;
}
```

### 4.2 DocStorageBase.getDoc()

**文件**: `packages/common/nbstore/src/storage/doc.ts:110`

```typescript
async getDoc(docId: string) {
  // 1. 锁定文档（防止并发冲突）
  await using _lock = this.isReadonly 
    ? undefined 
    : await this.lockDocForUpdate(docId);
  
  // ⭐ 2. 获取快照（最新的合并状态）
  const snapshot = await this.getDocSnapshot(docId);
  
  // ⭐ 3. 获取未合并的更新
  const updates = await this.getDocUpdates(docId);
  
  if (updates.length) {
    // 4. 合并更新到快照
    const { timestamp, bin, editor } = await this.squash(
      snapshot ? [snapshot, ...updates] : updates
    );
    
    const newSnapshot = {
      spaceId: this.spaceId,
      docId,
      bin,
      timestamp,
      editor,
    };
    
    // 5. 保存新快照（如果不是只读）
    if (!this.isReadonly) {
      await this.setDocSnapshot(newSnapshot, snapshot);
      await this.markUpdatesMerged(docId, updates);
    }
    
    return newSnapshot;
  }
  
  return snapshot;
}
```

### 4.3 IndexedDBDocStorage

**文件**: `packages/common/nbstore/src/impls/idb/doc.ts:124`

```typescript
protected override async getDocSnapshot(docId: string) {
  const trx = this.db.transaction('snapshots', 'readonly');
  const record = await trx.store.get(docId);
  
  if (!record) {
    return null;
  }
  
  return {
    docId,
    bin: record.bin,  // ⭐ Uint8Array - Y.js 二进制数据
    timestamp: record.updatedAt,
  };
}
```

### 4.4 CloudDocStorage

**文件**: `packages/common/nbstore/src/impls/cloud/doc.ts:74`

```typescript
override async getDocSnapshot(docId: string) {
  // ⭐ 通过 Socket.IO 请求文档数据
  const res = await this.socket.emitWithAck('space:load-doc', {
    spaceType: this.spaceType,
    spaceId: this.spaceId,
    docId: this.idConverter.newIdToOldId(docId),
  });
  
  if ('error' in res) {
    if (res.error.name === 'DOC_NOT_FOUND') {
      return null;
    }
    throw new Error(res.error.message);
  }
  
  // ⭐ Base64 解码为 Uint8Array
  const missingBin = base64ToUint8Array(res.data.missing);
  
  return {
    docId,
    bin: missingBin,  // Y.js 二进制数据
    timestamp: new Date(res.data.timestamp),
  };
}
```

---

## 5. 应用更新到 YDoc

**文件**: `packages/common/nbstore/src/frontend/doc.ts:552`

```typescript
applyUpdate(docId: string, update: Uint8Array) {
  const doc = this.status.docs.get(docId);
  if (doc && !isEmptyUpdate(update)) {
    try {
      this.isApplyingUpdate = true;
      
      // ⭐ 使用 Y.js 的 applyUpdate 将二进制数据应用到 YDoc
      applyUpdate(doc, update, NBSTORE_ORIGIN);
      
      // 此时 Y.js 会自动：
      // 1. 解析二进制数据
      // 2. 更新内部 CRDT 结构
      // 3. 触发 'update' 事件
      // 4. 通知所有监听器（包括编辑器）
      
    } catch (err) {
      console.error('failed to apply update yjs doc', err);
      
      // 常见错误：
      // - "Integer out of Range" - 数据格式错误
      // - 可能原因：后端返回的不是有效的 Y.js 二进制格式
      
    } finally {
      this.isApplyingUpdate = false;
    }
  }
}
```

---

## 6. 同步流程（DocSync）

### 6.1 DocSyncImpl

**文件**: `packages/common/nbstore/src/sync/doc/index.ts:45`

```typescript
export class DocSyncImpl implements DocSync {
  private readonly peers: DocSyncPeer[] = Object.entries(
    this.storages.remotes
  ).map(
    ([peerId, remote]) =>
      new DocSyncPeer(peerId, this.storages.local, this.sync, remote)
  );
  
  start() {
    const abort = new AbortController();
    this.abort = abort;
    
    // ⭐ 启动所有 peer 的同步循环
    Promise.allSettled(
      this.peers.map(peer => peer.mainLoop(abort.signal))
    ).catch(error => {
      console.error(error);
    });
  }
}
```

### 6.2 DocSyncPeer 同步循环

**文件**: `packages/common/nbstore/src/sync/doc/peer.ts`

DocSyncPeer 负责本地存储和远程存储之间的双向同步：

```typescript
async mainLoop(signal?: AbortSignal) {
  // 1. 等待本地和远程存储连接
  await Promise.all([
    this.local.connection.waitForConnected(signal),
    this.remote.connection.waitForConnected(signal),
  ]);
  
  // 2. 订阅本地和远程更新
  const disposeLocalUpdate = this.local.subscribeDocUpdate(this.event.onLocalUpdate);
  const disposeRemoteUpdate = this.remote.subscribeDocUpdate(this.event.onRemoteUpdate);
  
  try {
    while (true) {
      // ⭐ 3. 处理同步作业队列
      const docId = await this.status.jobDocQueue.asyncPop(signal);
      const jobs = this.status.jobMap.get(docId);
      
      // 4. 执行 connect/pull/push/save 等作业
      for (const job of jobs) {
        switch (job.type) {
          case 'connect':
            await this.jobs.connect(docId, signal);
            break;
          case 'pull':
            await this.jobs.pull(docId, signal);
            break;
          case 'push':
            await this.jobs.push(docId, job.update, job.clock, signal);
            break;
          // ...
        }
      }
    }
  } finally {
    disposeLocalUpdate();
    disposeRemoteUpdate();
  }
}
```

**同步作业类型：**

- **connect**: 首次连接，比较本地和远程时钟，决定是 pull 还是 push
- **pull**: 从远程拉取更新到本地
- **push**: 将本地更新推送到远程
- **pullAndPush**: 双向同步
- **save**: 将远程更新保存到本地存储

---

## 7. 数据库服务（DB）

**文件**: `packages/frontend/core/src/modules/db/services/db.ts:46`

```typescript
constructor(workspaceService, workspaceServerService) {
  this.db = this.framework.createEntity(WorkspaceDB, {
    db: new WorkspaceDBClient(
      new YjsDBAdapter(YUNKE_WORKSPACE_DB_SCHEMA, {
        getDoc: guid => {
          // ⭐ 数据库表也是通过 YDoc 实现的
          const ydoc = new YDoc({
            guid: `db$${guid}`,  // 特殊前缀标识数据库文档
          });
          
          // 连接到文档加载系统
          this.workspaceService.workspace.engine.doc.connectDoc(ydoc);
          
          // 提高优先级（数据库通常需要快速加载）
          this.workspaceService.workspace.engine.doc.addPriority(
            ydoc.guid,
            50
          );
          
          return ydoc;
        },
      })
    ),
    schema: YUNKE_WORKSPACE_DB_SCHEMA,
    storageDocId: tableName => `db$${tableName}`,
  });
}
```

---

## 8. 状态管理

### 8.1 文档状态

**文件**: `packages/common/nbstore/src/frontend/doc.ts:53`

```typescript
export type DocFrontendDocState = {
  ready: boolean;      // 文档有数据可用
  loaded: boolean;     // 文档已从存储加载
  updating: boolean;   // 正在更新（加载或保存）
  syncing: boolean;    // 正在与远程同步
  synced: boolean;     // 已与远程同步
  syncRetrying: boolean;   // 同步重试中
  syncErrorMessage: string | null;  // 同步错误消息
};
```

### 8.2 状态流

```typescript
docState$(docId: string): Observable<DocFrontendDocState> {
  return this._docState$(docId).pipe(
    throttleTime(1000, undefined, {
      trailing: true,
      leading: true,
    })
  );
}
```

---

## 9. 关键数据流

### 9.1 加载时序图

```
用户打开文档
    │
    ▼
DocImpl.load()
    │
    ▼
workspace.onLoadDoc(spaceDoc)
    │
    ▼
engine.doc.connectDoc(spaceDoc)
    │
    ▼
DocFrontend._connectDoc()
    │
    ├─► schedule({ type: 'load', docId })
    └─► doc.on('update', handleDocUpdate)
         │
         ▼
    mainLoop 处理队列
         │
         ▼
    jobs.load()
         │
         ├─► storage.getDoc(docId)
         │       │
         │       ├─► WorkerDocStorage.getDoc()
         │       │       │
         │       │       ├─► Worker: IndexedDB.getDocSnapshot()
         │       │       │       └─► 读取快照 + 合并更新
         │       │       │
         │       │       └─► 失败则回退到 CloudDocStorage
         │       │               └─► Socket.IO: 'space:load-doc'
         │       │                       └─► 后端返回 base64 编码的 Y.js 数据
         │       │
         │       └─► 返回 DocRecord { docId, bin, timestamp }
         │
         ├─► applyUpdate(docId, docRecord.bin)
         │       └─► Y.applyUpdate(doc, update, origin)
         │               └─► Y.js 解析并应用 CRDT 更新
         │                       └─► 触发 doc 'update' 事件
         │                               └─► 编辑器自动重新渲染
         │
         └─► status.connectedDocs.add(docId)
                 └─► 触发状态更新
                         └─► UI 显示"已加载"
```

### 9.2 保存时序图

```
用户编辑文档
    │
    ▼
YDoc.transact() / 直接修改
    │
    ▼
YDoc 触发 'update' 事件
    │
    ▼
handleDocUpdate(update, origin, doc)
    │
    ├─► 检查 origin !== NBSTORE_ORIGIN
    └─► schedule({ type: 'save', docId, update })
         │
         ▼
    mainLoop 处理队列
         │
         ▼
    jobs.save()
         │
         ├─► 合并多个更新（如果有）
         │       └─► mergeUpdates(updates)
         │
         └─► storage.pushDocUpdate({ docId, bin: merged })
                 │
                 ├─► WorkerDocStorage.pushDocUpdate()
                 │       │
                 │       ├─► Worker: IndexedDB.pushDocUpdate()
                 │       │       └─► 写入 updates 表
                 │       │               └─► 触发 BroadcastChannel
                 │       │                       └─► 通知其他标签页
                 │       │
                 │       └─► 如果配置了云端存储
                 │               └─► CloudDocStorage.pushDocUpdate()
                 │                       └─► Socket.IO: 'space:push-doc-update'
                 │                               └─► 推送到服务器
                 │                                       └─► 广播给其他客户端
                 │
                 └─► 返回时间戳
```

### 9.3 同步时序图

```
DocSync.start()
    │
    ▼
DocSyncPeer.mainLoop()
    │
    ├─► 订阅本地更新
    │       └─► local.subscribeDocUpdate(onLocalUpdate)
    │               └─► 本地有新数据 → schedule({ type: 'push' })
    │
    ├─► 订阅远程更新
    │       └─► remote.subscribeDocUpdate(onRemoteUpdate)
    │               └─► 远程有新数据 → schedule({ type: 'save' })
    │
    └─► 处理同步作业
            │
            ├─► connect:
            │       └─► 比较本地和远程时钟
            │               ├─► local > remote → push
            │               ├─► local < remote → pull
            │               └─► local = remote → 无操作
            │
            ├─► pull:
            │       └─► remote.getDocDiff(docId, localStateVector)
            │               └─► 获取差异
            │                       └─► local.pushDocUpdate(diff)
            │
            ├─► push:
            │       └─► local.getDocDiff(docId, remoteStateVector)
            │               └─► 获取差异
            │                       └─► remote.pushDocUpdate(diff)
            │
            └─► save:
                    └─► 将远程更新保存到本地存储
```

---

## 10. 关键文件清单

### Frontend层
- **`packages/common/nbstore/src/frontend/doc.ts`** (700行)
  - `DocFrontend` 类：核心加载协调器
  - 作业调度、队列管理、状态管理

### Storage层
- **`packages/common/nbstore/src/storage/doc.ts`** (343行)
  - `DocStorage` 接口定义
  - `DocStorageBase` 基类实现
  
- **`packages/common/nbstore/src/impls/idb/doc.ts`** (270行)
  - `IndexedDBDocStorage` 实现
  - 本地持久化存储
  
- **`packages/common/nbstore/src/impls/cloud/doc.ts`** (331行)
  - `CloudDocStorage` 实现
  - 云端同步存储（Socket.IO）

### Sync层
- **`packages/common/nbstore/src/sync/doc/index.ts`** (186行)
  - `DocSyncImpl` 类：同步协调器
  
- **`packages/common/nbstore/src/sync/doc/peer.ts`** (1121行)
  - `DocSyncPeer` 类：双向同步引擎

### Workspace层
- **`packages/frontend/core/src/modules/workspace/entities/workspace.ts`** (126行)
  - `Workspace` 实体
  
- **`packages/frontend/core/src/modules/workspace/entities/engine.ts`** (109行)
  - `WorkspaceEngine` 实体
  
- **`packages/frontend/core/src/modules/workspace/impls/workspace.ts`** (181行)
  - `WorkspaceImpl` 类（BlockSuite Workspace）
  
- **`packages/frontend/core/src/modules/workspace/impls/doc.ts`** (180行)
  - `DocImpl` 类（BlockSuite Doc）

### Worker层
- **`packages/common/nbstore/src/worker/client.ts`** (约800行)
  - `StoreClient` 类
  - `WorkerDocStorage` 类
  - Web Worker 通信代理

### Database层
- **`packages/frontend/core/src/modules/db/services/db.ts`** (125行)
  - `WorkspaceDBService`
  - 数据库表通过 YDoc 实现

---

## 11. 数据格式

### 11.1 Y.js 二进制格式

文档数据在存储和传输时使用 Y.js 的二进制编码格式：

```typescript
// 编码
const update: Uint8Array = Y.encodeStateAsUpdate(doc);

// 解码
Y.applyUpdate(doc, update);
```

**特点：**
- 高效的二进制格式（非 JSON）
- 包含 CRDT 操作历史
- 可以增量合并
- 支持冲突自动解决

### 11.2 DocRecord 结构

```typescript
interface DocRecord {
  docId: string;           // 文档 ID
  bin: Uint8Array;         // Y.js 二进制数据
  timestamp: Date;         // 最后更新时间
  editor?: string;         // 最后编辑者（可选）
}
```

### 11.3 IndexedDB Schema

**表结构：**
- `snapshots`: 文档快照（最新的合并状态）
- `updates`: 待合并的增量更新
- `clocks`: 文档时间戳（用于同步）

---

## 12. 性能优化

### 12.1 优先级队列

```typescript
// 高优先级文档先加载
engine.doc.addPriority(rootDoc.guid, 100);  // 根文档
engine.doc.addPriority(dbDoc.guid, 50);     // 数据库文档
```

### 12.2 增量更新

- 只传输差异部分（Y.diffUpdate）
- 避免全量同步

### 12.3 快照合并

- 定期将增量更新合并到快照
- 减少启动时的加载时间

### 12.4 Web Worker

- 存储操作在后台线程执行
- 避免阻塞主线程和 UI

### 12.5 状态节流

```typescript
docState$.pipe(
  throttleTime(1000, undefined, {
    leading: true,
    trailing: true,
  })
)
```

---

## 13. 错误处理

### 13.1 常见错误

1. **"Integer out of Range"**
   - 原因：后端返回的数据不是有效的 Y.js 二进制格式
   - 解决：检查后端编码逻辑

2. **"文档已连接"**
   - 原因：重复调用 connectDoc
   - 解决：确保每个文档只连接一次

3. **"引擎未初始化"**
   - 原因：在 WorkspaceEngine.start() 之前访问
   - 解决：确保先启动引擎

### 13.2 降级策略

```typescript
// WorkerDocStorage.getDoc()
// 1. 尝试从 Worker (IndexedDB)
const result = await this.client.call('docStorage.getDoc', docId);

// 2. 失败则从云端拉取
if (!result && this.cloudStoragePromise) {
  const cloudDoc = await cloudStorage.getDoc(docId);
  
  // 3. 推送到本地存储
  if (cloudDoc) {
    await this.pushDocUpdate({ docId, bin: cloudDoc.bin });
    return cloudDoc;
  }
}
```

---

## 14. 调试技巧

### 14.1 启用日志

文件中已有大量注释的日志语句，可以取消注释来启用：

```typescript
// console.log('[DocFrontend Debug] 开始加载文档:', { docId });
```

### 14.2 监控状态

```typescript
// 订阅文档状态
engine.doc.docState$(docId).subscribe(state => {
  console.log('文档状态:', state);
  // { ready, loaded, updating, syncing, synced, ... }
});

// 订阅全局状态
engine.doc.state$.subscribe(state => {
  console.log('全局状态:', state);
  // { total, loaded, updating, syncing, synced, ... }
});
```

### 14.3 检查存储

```typescript
// 检查 IndexedDB
const doc = await engine.doc.storage.getDoc(docId);
console.log('存储中的文档:', doc);

// 检查文档内容
const ydoc = workspace.docCollection.getDoc(docId)?.spaceDoc;
const blocks = ydoc?.getMap('blocks');
console.log('文档块数量:', blocks?.size);
```

---

## 15. 总结

文档加载流程的核心要点：

1. **分层架构**: UI → Workspace → Frontend → Storage/Sync → Worker
2. **异步作业队列**: 通过 `AsyncPriorityQueue` 管理加载顺序
3. **Y.js CRDT**: 使用 Y.js 的二进制格式存储和同步
4. **多级存储**: IndexedDB（本地）+ CloudStorage（远程）
5. **双向同步**: DocSyncPeer 管理本地和远程的双向同步
6. **状态驱动**: 通过 RxJS Observable 管理加载状态
7. **优先级控制**: 重要文档（如根文档）优先加载
8. **性能优化**: Web Worker + 增量更新 + 快照合并

**加载路径总结：**
```
用户操作 → DocImpl.load() → onLoadDoc → connectDoc → 
schedule(load) → mainLoop → jobs.load → storage.getDoc →
[IndexedDB/Cloud] → applyUpdate → Y.js → 编辑器渲染
```

这个系统设计巧妙地平衡了：
- 本地优先（快速启动）
- 云端同步（协作能力）
- 性能优化（Web Worker + 增量更新）
- 可靠性（多级降级 + 错误恢复）

