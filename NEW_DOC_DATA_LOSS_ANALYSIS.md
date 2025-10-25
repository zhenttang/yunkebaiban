# 新建文档刷新后数据丢失问题分析

## 🔴 问题现象

用户新建文档后，不刷新页面时可以正常使用，但一旦刷新页面，新建的文档就消失了。

## 🔍 根本原因定位

### 核心问题：rootYDoc 的保存失败

新建文档时，文档的元数据（标题、创建时间等）保存在 **rootYDoc** 中，而不是单独的文档 YDoc 中。

**关键数据结构：**
```typescript
// rootYDoc 的结构（guid = workspace.id）
rootYDoc
  └── meta (YMap)
      └── pages (YArray)
          └── [
              YMap({ id, title, createDate, tags }),  // 文档1
              YMap({ id, title, createDate, tags }),  // 文档2
              ...
            ]
```

### 问题分析流程

#### 1. **新建文档的调用链**

```
用户点击新建
  ↓
DocsService.createDoc()
  ↓
DocsStore.createDoc() 
  ↓
transact(rootYDoc, () => {
  rootYDoc.getMap('meta').get('pages').push([新文档元数据])
})
  ↓
rootYDoc 触发 'update' 事件
  ↓
DocFrontend.handleDocUpdate()
  ↓
❓ 检查：rootYDoc 是否在 status.docs 中？
  ↓
❌ 如果不在 → 跳过保存（打印警告）
✅ 如果在 → schedule({ type: 'save' })
```

#### 2. **rootYDoc 的连接时机**

```typescript
// packages/frontend/core/src/modules/workspace/entities/engine.ts:93
const rootDoc = this.workspaceService.workspace.docCollection.doc;
// 这里访问 docCollection getter，会触发：

// packages/frontend/core/src/modules/workspace/entities/workspace.ts:34
get docCollection() {
  if (!this._docCollection) {
    this._docCollection = new WorkspaceImpl({
      rootDoc: this.rootYDoc,  // guid = workspace.id
      onLoadDoc: doc => this.engine.doc.connectDoc(doc),  // ✅ 连接 rootYDoc
      // ...
    });
  }
  return this._docCollection;
}

// packages/frontend/core/src/modules/workspace/impls/workspace.ts:77
this.onLoadDoc?.(this.doc);  // 立即调用，连接 rootYDoc
```

**时序：**
1. engine.start() 第89行：`this.client = store;`（创建 StoreClient）
2. engine.start() 第93行：访问 `docCollection.doc`
   - 创建 WorkspaceImpl
   - 调用 `onLoadDoc(rootYDoc)` → `engine.doc.connectDoc(rootYDoc)`
   - **rootYDoc 被添加到 `status.docs` 中** ✅
3. engine.start() 第96行：`this.doc.start();`（启动 mainLoop）

**结论：rootYDoc 应该已经被正确连接了！**

#### 3. **那么问题出在哪里？**

让我检查几个可能的问题点：

##### 问题点1：ID 归一化导致的 mismatch

```typescript
// DocFrontend.handleDocUpdate:685
const normalizedId = this.normalizeDocId(doc.guid);

if (!this.status.docs.has(normalizedId)) {
  console.warn('⚠️ [DocFrontend.handleDocUpdate] 文档不在 docs 中，跳过:');
  return;  // ❌ 跳过保存！
}
```

**可能的问题：**
- rootYDoc.guid = workspace.id（例如：`abc-def-123`）
- normalizeDocId 可能将其转换为其他格式
- 导致在 status.docs 中找不到

##### 问题点2：connectDoc 在某些情况下失败

```typescript
// DocFrontend._connectDoc:558
if (this.status.docs.has(normalizedId)) {
  console.error('❌ [DocFrontend._connectDoc] 文档已连接，抛出错误');
  throw new Error('文档已连接');
}
```

**可能的问题：**
- 如果 rootYDoc 被连接两次，第二次会抛出错误
- 但 WorkspaceImpl 构造函数只调用一次 onLoadDoc

##### 问题点3：save 作业执行失败

即使 save 作业被正确调度，也可能在执行时失败：

```typescript
// DocFrontend.jobs.save:422
if (!this.status.docs.has(normalizedId)) {
  console.warn('⚠️ [DocFrontend.save] 保存跳过 - 文档不在 docs 集合中:');
  return;
}

if (this.status.connectedDocs.has(normalizedId)) {
  // ✅ 真正执行保存
  await this.storage.pushDocUpdate({ docId, bin: merged });
} else {
  console.warn('⚠️ [DocFrontend.save] 保存跳过 - 文档不在 connectedDocs 中:');
  return;  // ❌ 跳过保存
}
```

**关键：**
- 文档必须同时在 `status.docs` 和 `status.connectedDocs` 中
- connectedDocs 是在 load 作业完成后添加的

##### 问题点4：rootYDoc 的 load 作业未完成

```typescript
// DocFrontend._connectDoc:565
this.schedule({
  type: 'load',
  docId: normalizedId,
});
```

load 作业会：
1. 从 storage 读取文档数据
2. 应用到 YDoc
3. 将 docId 添加到 `status.connectedDocs`

**如果 load 作业未完成，或者失败了：**
- rootYDoc 不会被添加到 connectedDocs
- 后续的 save 作业会被跳过

##### 问题点5：云端同步失败

即使本地 save 成功，也可能云端同步失败：

```typescript
// WorkerDocStorage.pushDocUpdate:359
async pushDocUpdate(update: DocUpdate, origin?: string) {
  return this.client.call('docStorage.pushDocUpdate', { update, origin });
}
```

这会：
1. 将数据保存到 IndexedDB（本地）✅
2. 通过 DocSync 同步到云端 ❓

**如果云端同步失败：**
- 刷新页面时，如果 IndexedDB 被清空
- 或者从云端加载
- 就会找不到数据

## 🎯 最可能的原因

综合分析，最可能的原因是：

### **原因1：rootYDoc 的 load 作业在 save 之前未完成**

**时序问题：**
```
1. connectDoc(rootYDoc) → schedule({ type: 'load', docId: workspace.id })
2. mainLoop 启动
3. 用户快速创建文档
4. rootYDoc update → schedule({ type: 'save', docId: workspace.id })
5. save 作业执行时，load 作业可能还没完成
6. status.connectedDocs 中还没有 workspace.id
7. save 被跳过！
```

### **原因2：云端同步失败但没有明显错误提示**

- IndexedDB 保存成功
- 但云端推送失败（网络、权限、格式问题）
- 刷新后从云端加载，数据不存在

### **原因3：workspace.id 的 ID 格式问题**

- workspace.id 可能包含特殊字符或格式
- 归一化后与原始 ID 不匹配
- 导致 handleDocUpdate 中找不到文档

## 🔬 诊断方法

### 在浏览器控制台执行：

```javascript
// 1. 检查 rootYDoc 是否被连接
const engine = window.__WORKSPACE__?.engine;
const workspaceId = window.__WORKSPACE__?.id;
console.log('Workspace ID:', workspaceId);

const docFrontend = engine?.doc;
console.log('status.docs:', Array.from(docFrontend?.status?.docs?.keys() || []));
console.log('status.connectedDocs:', Array.from(docFrontend?.status?.connectedDocs || []));
console.log('status.readyDocs:', Array.from(docFrontend?.status?.readyDocs || []));

// 2. 检查 rootYDoc 的 YDoc 内容
const rootYDoc = window.__WORKSPACE__?.workspace?.rootYDoc;
const pages = rootYDoc?.getMap('meta')?.get('pages');
console.log('Pages count:', pages?.length);
console.log('Pages:', pages?.toJSON());

// 3. 新建文档后立即检查
// （新建文档后在控制台运行）
setTimeout(() => {
  const pages = rootYDoc?.getMap('meta')?.get('pages');
  console.log('After create - Pages:', pages?.toJSON());
}, 1000);

// 4. 检查 IndexedDB
const dbName = `workspace:cloud:${workspaceId}`;
const request = indexedDB.open(dbName);
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('snapshots', 'readonly');
  const store = tx.objectStore('snapshots');
  const getReq = store.get(workspaceId);
  getReq.onsuccess = () => {
    console.log('IndexedDB snapshot for workspace:', getReq.result);
  };
};

// 5. 监控 save 作业
const originalSchedule = docFrontend.schedule;
docFrontend.schedule = function(job) {
  console.log('📋 Schedule job:', job);
  return originalSchedule.call(this, job);
};
```

### 查看控制台日志：

新建文档时，应该看到：

```
✅ 正常情况：
📋 Schedule job: { type: 'save', docId: '<workspace-id>', update: Uint8Array(...) }
💾 [DocFrontend.save] 保存文档: <workspace-id>
✅ [DocFrontend.save] 推送到存储成功

❌ 异常情况：
⚠️ [DocFrontend.handleDocUpdate] 文档不在 docs 中，跳过
或
⚠️ [DocFrontend.save] 保存跳过 - 文档不在 connectedDocs 中
```

## 💡 临时解决方案

在明确问题之前，可以添加诊断日志：

### 修改 `DocsStore.createDoc()`:

```typescript
// packages/frontend/core/src/modules/doc/stores/docs.ts:58
createDoc(docId?: string) {
  const id = docId ?? nanoid();
  
  console.log('📝 [DocsStore.createDoc] 开始创建文档:', {
    id,
    workspaceId: this.workspaceService.workspace.id,
    rootYDocGuid: this.workspaceService.workspace.rootYDoc.guid
  });

  transact(
    this.workspaceService.workspace.rootYDoc,
    () => {
      const docs = this.workspaceService.workspace.rootYDoc
        .getMap('meta')
        .get('pages');

      if (!docs || !(docs instanceof YArray)) {
        console.error('❌ [DocsStore.createDoc] pages YArray 不存在！');
        return;
      }

      console.log('📝 [DocsStore.createDoc] 添加到 pages YArray');
      docs.push([
        new YMap([
          ['id', id],
          ['title', ''],
          ['createDate', Date.now()],
          ['tags', new YArray()],
        ]),
      ]);
      console.log('✅ [DocsStore.createDoc] 添加成功，当前文档数:', docs.length);
    },
    { force: true }
  );
  
  console.log('📝 [DocsStore.createDoc] transact 完成');

  return id;
}
```

### 修改 `handleDocUpdate`:

```typescript
// packages/common/nbstore/src/frontend/doc.ts:661
private readonly handleDocUpdate = (
  update: Uint8Array,
  origin: any,
  doc: YDoc,
  _transaction: YTransaction
) => {
  if (origin === NBSTORE_ORIGIN) {
    return;
  }

  const normalizedId = this.normalizeDocId(doc.guid);
  
  console.log('📤 [DocFrontend.handleDocUpdate] 收到更新:', {
    docGuid: doc.guid,
    normalizedId,
    updateSize: update.length,
    inDocs: this.status.docs.has(normalizedId),
    docsKeys: Array.from(this.status.docs.keys())
  });

  if (!this.status.docs.has(normalizedId)) {
    console.error('❌ [DocFrontend.handleDocUpdate] 文档不在 docs 中，跳过保存:', {
      docId: doc.guid,
      normalizedId,
      docsSize: this.status.docs.size,
      docsKeys: Array.from(this.status.docs.keys())
    });
    return;
  }

  console.log('✅ [DocFrontend.handleDocUpdate] 调度 save 作业');
  this.schedule({
    type: 'save',
    docId: normalizedId,
    update,
  });
};
```

## 📊 下一步

1. **添加诊断日志**（上述修改）
2. **重现问题**：新建文档
3. **查看控制台**：找到具体失败的环节
4. **检查 IndexedDB 和云端**：确认数据是否保存
5. **根据日志定位**：是 handleDocUpdate 跳过，还是 save 跳过，还是云端同步失败

添加日志后，请告诉我控制台输出的内容，我可以帮你进一步诊断。

