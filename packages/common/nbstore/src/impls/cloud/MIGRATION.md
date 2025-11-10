# 迁移到新架构 - 完整指南

## ✅ 已完成

**旧架构代码已完全替换**，不需要修改导入路径。

---

## 核心变化

### 架构对比

**旧架构（已移除）**：
```typescript
// ❌ 旧代码（已不存在）
const docStorage = new CloudDocStorage(options);
// 每个Storage自己管理连接
// 监听器在join之后注册 ← Race Condition
```

**新架构（当前）**：
```typescript
// ✅ 新代码
import { createWorkspaceConnection, CloudDocStorage } from '@yunke/nbstore/impls/cloud';

// 1. 创建共享连接
const { connection, release } = createWorkspaceConnection({
  serverBaseUrl: 'https://api.yunke.com',
  isSelfHosted: false,
  spaceType: 'workspace',
  spaceId: 'workspace-id',
});

// 2. 创建Storage，注入连接
const docStorage = new CloudDocStorage(options, connection);
const awarenessStorage = new CloudAwarenessStorage(options, connection);

// 3. 使用完后释放
release();
```

---

## 必须修改的代码

### 1. Workspace初始化代码

**需要修改的文件**：
- `packages/frontend/core/src/desktop/pages/workspace/share/share-page.tsx`
- `packages/frontend/core/src/modules/workspace-engine/impls/cloud.ts`
- 其他创建workspace的地方

**修改前**：
```typescript
const { workspace } = workspacesService.open(
  { metadata, isSharedMode: true },
  {
    remotes: {
      'cloud:yunke-cloud': {
        doc: {
          name: 'CloudDocStorage',
          opts: { /* ... */ },
        },
        awareness: {
          name: 'CloudAwarenessStorage',
          opts: { /* ... */ },
        },
      },
    },
  }
);
```

**修改后**：
```typescript
// ⚠️ 注意：由于Worker架构限制，前端无需手动创建WorkspaceConnection
// Worker会根据name+opts自动创建并注入WorkspaceConnection

const { workspace } = workspacesService.open(
  { metadata, isSharedMode: true },
  {
    remotes: {
      'cloud:yunke-cloud': {
        doc: {
          name: 'CloudDocStorage',
          opts: {
            type: 'workspace',
            id: workspaceId,
            serverBaseUrl: getBaseUrl(),
            isSelfHosted: false,
          },
        },
        awareness: {
          name: 'CloudAwarenessStorage',
          opts: {
            type: 'workspace',
            id: workspaceId,
            serverBaseUrl: getBaseUrl(),
            isSelfHosted: false,
          },
        },
      },
    },
  }
);

// ✅ Worker内部会自动：
// 1. 创建WorkspaceConnection
// 2. 注入到CloudDocStorage/CloudAwarenessStorage
// 3. 管理连接生命周期
```

---

## 关键API变化

### CloudDocStorage

**构造函数签名变化**：

```typescript
// ❌ 旧签名（已不可用）
new CloudDocStorage(options)

// ✅ 新签名（必须使用）
new CloudDocStorage(options, workspaceConnection)
```

**必须注入WorkspaceConnection**，否则会报错。

### CloudAwarenessStorage

**构造函数签名变化**：

```typescript
// ❌ 旧签名（已不可用）
new CloudAwarenessStorage(options)

// ✅ 新签名（必须使用）
new CloudAwarenessStorage(options, workspaceConnection)
```

---

## 测试检查清单

迁移完成后，请测试以下场景：

### 功能测试
- [ ] **单客户端编辑** - 编辑文档，保存，刷新页面，数据保持
- [ ] **多客户端同步** - 打开2个浏览器窗口，互相编辑能实时看到
- [ ] **并发编辑** - A正在编辑，B新打开文档，B能看到A的编辑
- [ ] **快速编辑** - A快速连续编辑10次，B都能收到
- [ ] **网络抖动** - 短暂断网重连，所有更新不丢失
- [ ] **Awareness** - 多客户端可以看到彼此的光标和选区

### 性能测试

打开浏览器控制台，观察日志：

- [ ] **只看到1次** `space:join`
- [ ] **只看到1次** idConverter加载
- [ ] **看到** "处理X个早期缓存更新"（如果有并发编辑）
- [ ] **没有** "更新丢失"相关错误

### 调试

```typescript
import { getWorkspaceConnectionManager } from '@yunke/nbstore/impls/cloud';

const manager = getWorkspaceConnectionManager();
console.log('活跃连接数:', manager.getActiveConnectionCount()); // 应该是1
console.log('连接详情:', manager.getConnectionStats());
```

---

## 常见问题

### Q: TypeError: Cannot read property 'socket' of undefined

**原因**：忘记传入WorkspaceConnection

**解决**：
```typescript
// ❌ 错误
const docStorage = new CloudDocStorage(options);

// ✅ 正确
const docStorage = new CloudDocStorage(options, connection);
```

### Q: TypeError: Cannot read property 'oldIdToNewId' of null

**原因**：在idConverter加载完成前调用

**解决**：
```typescript
// 等待连接就绪
if (!connection.isReady) {
  await connection.connect();
}

// 现在可以安全使用
const docId = connection.idConverter.oldIdToNewId(id);
```

### Q: 更新仍然丢失

**检查清单**：
1. 确认已完全迁移到新架构（没有旧代码残留）
2. 确认WorkspaceConnection已正确注入到Storage
3. 检查控制台是否有错误日志
4. 确认`connection.connect()`已被调用

---

## 回滚方案（如果需要）

如果新架构有问题，可以临时回滚到备份文件：

```bash
cd /mnt/d/Documents/yunkebaiban/baibanfront/packages/common/nbstore/src/impls/cloud

# 恢复旧版本
cp doc.ts.v1.backup doc.ts
cp awareness.ts.v1.backup awareness.ts

# 删除新架构文件
rm workspace-connection.ts
rm workspace-connection-manager.ts
rm workspace-connection-events.ts

# 更新index.ts（移除新架构导出）
# 手动编辑index.ts，删除WorkspaceConnection相关导出
```

**注意**：回滚后，race condition bug会重新出现。

---

## 下一步

1. **测试新架构** - 在开发环境中充分测试
2. **观察日志** - 确认只有1次join、1次idConverter加载
3. **性能对比** - 对比迁移前后的性能差异
4. **删除备份** - 确认稳定后删除`.v1.backup`文件

```bash
# 删除备份文件
rm doc.ts.v1.backup awareness.ts.v1.backup
```

---

## 获取帮助

- 查看详细文档：`README-V2.md`
- 查看代码示例：`workspace-connection.ts`顶部注释
- 提交Issue：如果遇到问题，请提供详细的错误日志
