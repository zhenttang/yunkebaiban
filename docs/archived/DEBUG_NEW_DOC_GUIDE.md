# 新建文档数据丢失问题 - 调试指南

## 📝 已添加的诊断日志

我已经在关键位置添加了详细的日志，现在新建文档时会输出完整的执行流程。

### 修改的文件

1. **packages/frontend/core/src/modules/doc/stores/docs.ts**
   - `createDoc()` 方法添加了日志

2. **packages/common/nbstore/src/frontend/doc.ts**
   - `_connectDoc()` 添加连接日志
   - `handleDocUpdate()` 添加更新接收日志
   - `jobs.save()` 添加保存流程日志
   - `jobs.load()` 添加加载完成日志

## 🧪 测试步骤

### 1. 重新编译项目

```bash
cd /mnt/d/Documents/yunkebaiban/baibanfront
yarn build
# 或者如果是开发模式
yarn dev
```

### 2. 打开浏览器并清空控制台

1. 打开应用
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. 点击清空按钮（🚫）

### 3. 新建文档并观察日志

点击"新建文档"按钮，然后在控制台查看输出。

## ✅ 正常情况下应该看到的日志

如果一切正常，日志顺序应该是：

```
1. 📝 [DocsStore.createDoc] 开始创建文档: { newDocId: "xxx", workspaceId: "yyy", rootYDocGuid: "yyy" }

2. 📝 [DocsStore.createDoc] 添加到 pages YArray，当前文档数: N

3. ✅ [DocsStore.createDoc] 添加成功，新文档数: N+1

4. 📝 [DocsStore.createDoc] transact 完成，返回 ID: xxx

5. 📤 [DocFrontend.handleDocUpdate] 收到更新: {
     docGuid: "yyy",
     updateSize: 数字,
     origin: undefined 或其他,
     inDocs: true,              ← 关键：应该是 true
     inConnectedDocs: true,     ← 关键：应该是 true
     docsCount: N,
     connectedDocsCount: N
   }

6. ✅ [DocFrontend.handleDocUpdate] 调度 save 作业

7. 💾 [DocFrontend.save] 开始保存文档: { docId: "yyy", jobsCount: 1 }

8. 💾 [DocFrontend.save] 推送到存储...: { docId: "yyy", mergedSize: 数字 }

9. ✅ [DocFrontend.save] 保存成功！{ docId: "yyy" }
```

## ❌ 问题情况下会看到的日志

### 情况1：rootYDoc 未连接到 DocFrontend

```
📝 [DocsStore.createDoc] 开始创建文档: ...
📝 [DocsStore.createDoc] transact 完成

❌ 没有 "📤 [DocFrontend.handleDocUpdate] 收到更新"
```

**原因：** rootYDoc 的 'update' 事件没有被监听，说明 `_connectDoc` 没有被调用。

**检查点：**
- WorkspaceImpl 的 `onLoadDoc` 是否正确传递
- engine.start() 是否正常执行

### 情况2：文档不在 docs 中

```
📝 [DocsStore.createDoc] ...

📤 [DocFrontend.handleDocUpdate] 收到更新: {
  ...
  inDocs: false,              ← 问题：应该是 true
  ...
}

❌ [DocFrontend.handleDocUpdate] 文档不在 docs 中，跳过保存！{
  docId: "yyy",
  allDocsKeys: [...]          ← 查看这里有没有包含 rootYDoc.guid
}
```

**原因：** rootYDoc 没有被正确添加到 `status.docs`。

**可能的问题：**
- `_connectDoc` 被调用了，但 GUID 不匹配
- 文档被过早地断开连接

### 情况3：文档不在 connectedDocs 中

```
📤 [DocFrontend.handleDocUpdate] 收到更新: {
  inDocs: true,
  inConnectedDocs: false,     ← 问题：应该是 true
  ...
}

✅ [DocFrontend.handleDocUpdate] 调度 save 作业

❌ [DocFrontend.save] 保存跳过 - 文档不在 connectedDocs 中: {
  allConnectedDocs: [...]     ← 查看这里有没有包含 rootYDoc.guid
}
```

**原因：** load 作业未完成，rootYDoc 还没有被添加到 connectedDocs。

**这是最可能的问题！**

**时序问题：**
```
T1: connectDoc(rootYDoc) → 调度 load 作业
T2: 用户新建文档（很快）
T3: rootYDoc update → 调度 save 作业
T4: save 作业执行 → 但 load 还没完成！
T5: rootYDoc 不在 connectedDocs → 保存被跳过
```

### 情况4：保存到存储失败

```
💾 [DocFrontend.save] 开始保存文档: ...
💾 [DocFrontend.save] 推送到存储...

❌ [DocFrontend.save] 推送到存储失败: {
  error: ...,
  errorMessage: "具体错误信息"
}
```

**原因：** IndexedDB 或云端存储出错。

## 🔍 额外诊断

### 查看 rootYDoc 的连接状态

在新建文档**之前**，在控制台运行：

```javascript
// 使用 React DevTools 或者其他方式找到 workspace 对象
// 简单方法：在代码中临时添加 window._workspace = workspace

// 然后在控制台：
console.log('rootYDoc guid:', window._workspace?.rootYDoc?.guid);
console.log('workspace id:', window._workspace?.id);
console.log('是否相同:', window._workspace?.rootYDoc?.guid === window._workspace?.id);
```

### 查看 load 作业的执行时间

在控制台过滤日志：

```
搜索: "DocFrontend.load"
```

查看 rootYDoc 的 load 作业什么时候完成：
```
✅ [DocFrontend.load] 添加到 connectedDocs，文档加载完成: { docId: "workspace-id" }
```

**关键：**这个日志必须在"新建文档"之前出现！

### 检查 IndexedDB

1. 开发者工具 → Application → Storage → IndexedDB
2. 找到 `workspace:cloud:<workspace-id>` 或类似的数据库
3. 查看 `snapshots` 表
4. 找到 key 为 workspace.id 的记录
5. 查看 `bin` 字段是否有数据

## 💡 临时解决方案

如果确认是"情况3"（时序问题），可以临时添加等待逻辑：

### 方案：在 createDoc 之前等待 rootYDoc 加载完成

修改 `DocsStore.createDoc()`:

```typescript
async createDoc(docId?: string) {
  const id = docId ?? nanoid();

  // 等待 rootYDoc 加载完成
  const engine = this.workspaceService.workspace.engine;
  const workspaceId = this.workspaceService.workspace.id;
  
  console.log('⏳ [DocsStore.createDoc] 等待 rootYDoc 加载完成...');
  await engine.doc.waitForDocLoaded(workspaceId);
  console.log('✅ [DocsStore.createDoc] rootYDoc 已加载');

  // 原有逻辑...
}
```

但这会使 createDoc 变成异步方法，可能需要修改调用处。

## 📊 下一步

1. **运行测试**：新建文档并收集日志
2. **粘贴日志**：把控制台的完整输出发给我
3. **确定问题**：根据日志定位是哪个情况
4. **应用修复**：根据具体问题应用对应的修复方案

## 🎯 预期结果

修复后，新建文档应该：
1. ✅ 立即在列表中显示
2. ✅ 可以正常编辑
3. ✅ 刷新页面后仍然存在
4. ✅ 在云端也能看到

请运行测试并把日志发给我！

