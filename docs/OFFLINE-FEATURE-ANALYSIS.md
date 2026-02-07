# 云客白板离线功能深度分析报告

> 分析日期：2026-02-05  
> 分析范围：baibanfront 前端项目离线功能完整性  
> 分析深度：代码级别 + 架构级别

---

## 目录

1. [离线功能架构概览](#一离线功能架构概览)
2. [离线功能完成度总览](#二离线功能完成度总览)
3. [已完成的离线功能详情](#三已完成的离线功能详情)
4. [未完成功能及原因](#四未完成功能及原因)
5. [已知 Bug 和风险](#五已知-bug-和风险)
6. [边界情况处理分析](#六边界情况处理分析)
7. [改进建议](#七改进建议)
8. [关键文件索引](#八关键文件索引)

---

## 一、离线功能架构概览

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      离线模式架构                                │
├─────────────────────────────────────────────────────────────────┤
│  用户编辑 → Yjs Doc 更新 → 100ms 防抖 → 本地存储                 │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │ BlockSuite  │ ──► │  nbstore    │ ──► │ SQLite/IndexedDB │   │
│  │   编辑器    │     │  存储抽象   │     │   本地数据库     │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│                                                                  │
│  存储位置：                                                       │
│  - Electron: {离线目录}/workspaces/{id}/storage.db              │
│  - Web: IndexedDB local:workspace:{id}                          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 离线模式启用条件

```typescript
// packages/frontend/core/src/modules/workspace-engine/impls/cloud.ts:488-498
const isOfflineMode = BUILD_CONFIG.isElectron && !isCloudEnabled;

// 离线模式特征
- remotes: {}（不触发云同步）
- 使用本地 SQLite 存储
- 无需网络连接
```

### 1.3 存储层次结构

```
Electron 桌面端：
├── 全局配置: {userData}/config.json
├── 全局状态: {userData}/global-state.json
├── 全局缓存: {userData}/global-cache.json
└── 工作区数据: {离线目录}/workspaces/{id}/storage.db
    ├── doc_updates    (文档增量更新)
    ├── doc_snapshots  (文档快照)
    ├── doc_clocks     (文档时钟)
    ├── blobs          (二进制数据)
    └── peer_clocks    (同步时钟)

Web 端：
└── IndexedDB: local:workspace:{id}
    ├── docs store
    ├── blobs store
    └── meta store
```

---

## 二、离线功能完成度总览

| 功能模块 | 完成度 | 状态说明 |
|----------|--------|----------|
| **文档存储** | ✅ 95% | 核心完整，边界情况处理待完善 |
| **Blob 存储** | ✅ 98% | 图片/附件完全本地化 |
| **文本编辑** | ✅ 100% | 所有文本 Block 完全支持 |
| **富媒体编辑** | ✅ 100% | 图片、附件、书签完全支持 |
| **白板编辑** | ✅ 100% | Surface、Frame 等完全支持 |
| **数据视图** | ✅ 100% | Database、Table 完全支持 |
| **撤销/重做** | ✅ 90% | 当前会话完整，跨会话不支持 |
| **导入功能** | ✅ 95% | 5 种格式，外部图片可能受限 |
| **导出功能** | ✅ 98% | 5 种格式，完全本地 |
| **数据备份** | ❌ 30% | 缺少自动备份机制 |
| **错误恢复** | ⚠️ 60% | 部分场景处理不完善 |

### 整体评分

```
核心编辑功能:    ████████████████████ 100%
文档存储:        ███████████████████░  95%
Blob 存储:       ████████████████████  98%
导入导出:        ███████████████████░  96%
数据备份:        ██████░░░░░░░░░░░░░░  30%
错误恢复:        ████████████░░░░░░░░  60%
```

---

## 三、已完成的离线功能详情

### 3.1 文档存储 API

**位置**: `packages/common/nbstore/src/impls/sqlite/`

```typescript
// 核心 API - 全部已实现
✅ pushUpdate(docId, update)           // 推送文档更新
✅ getDocSnapshot(docId)                // 获取文档快照
✅ setDocSnapshot(docId, snapshot)      // 设置文档快照
✅ getDocUpdates(docId)                 // 获取更新列表
✅ markUpdatesMerged(docId, updates)    // 标记更新已合并
✅ deleteDoc(docId)                     // 删除文档
✅ getDocClocks()                       // 获取文档时钟
✅ getDocTimestamps()                   // 获取时间戳
```

**数据保存流程**:

```
用户编辑
    ↓
Yjs Doc.on('update')
    ↓
handleDocUpdate() [100ms 防抖]
    ↓
storage.pushDocUpdate()
    ↓
SQLite/IndexedDB 写入
```

**关键代码**: `packages/common/nbstore/src/frontend/doc.ts:790-816`

### 3.2 Blob 存储（图片/附件）

**SQLite 表结构**:

```sql
CREATE TABLE IF NOT EXISTS blobs (
  key TEXT PRIMARY KEY,
  data BLOB NOT NULL,
  mime TEXT,
  size INTEGER,
  created_at INTEGER
);
```

**核心 API**:

```typescript
// 位置: packages/common/nbstore/src/impls/sqlite/blob.ts
✅ getBlob(key)                    // 读取 Blob
✅ setBlob(blobRecord)             // 保存 Blob
✅ deleteBlob(key, permanently)    // 删除 Blob
✅ listBlobs()                     // 列出所有 Blob
✅ releaseBlobs()                  // 释放资源
✅ getBlobUploadedAt(key)          // 获取上传时间
✅ setBlobUploadedAt(key, time)    // 设置上传时间
```

**特点**:
- 完全本地化：图片和附件保存在本地数据库
- 离线可用：无需网络即可访问已上传的媒体文件
- 自动清理：支持 `releaseBlobs()` 释放未使用资源

### 3.3 编辑功能支持矩阵

| Block 类型 | 离线支持 | 说明 |
|------------|----------|------|
| 段落 (paragraph) | ✅ | 完全支持 |
| 标题 (h1-h6) | ✅ | 完全支持 |
| 列表 (list) | ✅ | 有序/无序/待办/折叠 |
| 引用 (quote) | ✅ | 完全支持 |
| 标注 (callout) | ✅ | 完全支持 |
| 代码块 (code) | ✅ | 语法高亮、语言选择 |
| 分隔线 (divider) | ✅ | 完全支持 |
| 图片 (image) | ✅ | 拖拽上传、本地存储 |
| 附件 (attachment) | ✅ | 上传、下载、预览 |
| 书签 (bookmark) | ✅ | URL 链接（离线时无法抓取预览） |
| 表格 (table) | ✅ | 行列操作、样式设置 |
| 数据库 (database) | ✅ | 多视图、筛选排序 |
| 白板 (surface) | ✅ | 画布、图形、手写 |
| 框架 (frame) | ✅ | 演示模式 |
| 流程图 | ✅ | Mermaid、Draw.io |
| Excalidraw | ✅ | 手绘风格图形 |
| 嵌入块 | ⚠️ | YouTube/Figma 等需要网络 |

### 3.4 文字格式化

```typescript
// 位置: blocksuite/yunke/shared/src/types/index.ts
interface YunkeTextAttributes {
  bold?: true | null;        // 加粗
  italic?: true | null;      // 斜体
  underline?: true | null;   // 下划线
  strike?: true | null;      // 删除线
  code?: true | null;        // 行内代码
  link?: string | null;      // 链接
  background?: string | null; // 背景色
  color?: string | null;     // 文字颜色
  latex?: string | null;     // LaTeX 公式
  footnote?: FootNote | null; // 脚注
  mention?: MentionInfo | null; // @提及
  reference?: ReferenceInfo | null; // 文档引用
}
```

所有文字格式在离线模式下完全支持。

### 3.5 数据视图（Database）

**支持的列类型（20+ 种）**:

| 分类 | 列类型 |
|------|--------|
| 文本 | text, rich-text |
| 数字 | number, rating |
| 日期 | date, date-range |
| 选择 | select, multi-select |
| 布尔 | checkbox |
| 文件 | attachment, image |
| 链接 | url, email, phone |
| 其他 | location, person, progress |
| 关系 | relation, rollup |
| 计算 | formula |

**支持的视图类型**:
- ✅ 表格视图 (Table)
- ✅ 看板视图 (Kanban)
- ✅ 日历视图 (Calendar)
- ✅ 甘特图视图 (Gantt)
- ✅ 图表视图 (Chart)

### 3.6 导入功能

**位置**: `packages/frontend/core/src/desktop/dialogs/import/index.tsx`

| 格式 | 实现方式 | 离线支持 |
|------|----------|----------|
| Markdown (.md) | `MarkdownTransformer.importMarkdownToDoc()` | ✅ 完全本地 |
| MD + 媒体 (.zip) | `MarkdownTransformer.importMarkdownZip()` | ✅ 完全本地 |
| HTML (.html/.htm) | `HtmlTransformer.importHTMLToDoc()` | ✅ 完全本地 |
| Notion 导出 (.zip) | `NotionHtmlTransformer.importNotionZip()` | ✅ 完全本地 |
| 快照文件 (.zip) | `ZipTransformer.importDocs()` | ✅ 完全本地 |

**文件选择机制**:
```typescript
// 位置: blocksuite/yunke/shared/src/utils/file/filesys.ts:116-189
// 优先使用 File System Access API
// 降级到传统 <input type="file">
```

### 3.7 导出功能

**位置**: `packages/frontend/core/src/components/hooks/yunke/use-export-page.ts`

| 格式 | 实现方式 | 离线支持 |
|------|----------|----------|
| HTML (.html/.zip) | `HtmlTransformer.exportDoc()` | ✅ 完全本地 |
| Markdown (.md/.zip) | `MarkdownTransformer.exportDoc()` | ✅ 完全本地 |
| PDF (.pdf) | `printToPdf()` → 浏览器打印 API | ✅ 完全本地 |
| PNG (.png) | `ExportManager.exportPng()` → Canvas | ✅ 完全本地 |
| 快照 (.zip) | `ZipTransformer.exportDocs()` | ✅ 完全本地 |

### 3.8 撤销/重做

**实现**: BlockSuite `UndoManager`

**位置**: `blocksuite/framework/store/src/model/store/store.ts:328-347`

```typescript
undo = () => {
  if (this.readonly) return;
  this._history.undoManager.undo();
};

redo = () => {
  if (this.readonly) return;
  this._history.undoManager.redo();
};
```

**离线行为**:
- ✅ 当前会话：撤销/重做正常工作
- ✅ 历史记录：保存在 Yjs Doc 中
- ❌ 页面刷新：历史记录清空（符合预期）
- ❌ 跨会话恢复：不支持（需要版本历史功能）

---

## 四、未完成功能及原因

### 4.1 数据备份机制 ❌

**完成度**: 30%

| 缺失功能 | 影响 | 原因 |
|----------|------|------|
| 自动备份 | 误删或损坏无法恢复 | 未实现定时备份逻辑 |
| 增量备份 | 大数据量备份慢 | 未实现差异检测 |
| 数据库损坏恢复 | 损坏时数据丢失 | 无完整性检查机制 |

**建议实现**:

```typescript
interface BackupService {
  // 定时备份（如每日）
  scheduleAutoBackup(intervalHours: number): void;
  
  // 创建备份
  createBackup(): Promise<BackupInfo>;
  
  // 列出备份
  listBackups(): Promise<BackupInfo[]>;
  
  // 恢复备份
  restoreFromBackup(backupId: string): Promise<void>;
  
  // 数据库完整性检查
  checkDatabaseIntegrity(): Promise<boolean>;
}
```

### 4.2 版本历史 ❌

**完成度**: 10%

| 功能 | 状态 | 说明 |
|------|------|------|
| 当前会话撤销/重做 | ✅ | Yjs UndoManager |
| 跨会话版本历史 | ❌ | 页面刷新后历史清空 |
| 文档版本回滚 | ❌ | 需要实现快照存储 |
| 版本对比 | ❌ | 未实现 |

**原因**: BlockSuite 的 UndoManager 仅保存当前会话的历史。实现跨会话版本历史需要额外的快照存储机制。

### 4.3 错误处理不完善 ⚠️

**问题 1：磁盘空间不足处理**

```typescript
// 位置: packages/frontend/core/src/modules/storage/file-native-db.ts:341-348
// 当前实现：所有重试都失败时只记录警告
console.error('[离线存储] 数据写入失败，可能导致数据丢失:', lastError);
// ❌ 不抛出错误，不通知用户
```

**问题 2：文件权限丢失处理**

```typescript
// 位置: packages/frontend/core/src/modules/storage/file-native-db.ts:142-166
if (permissionStatus !== 'granted') {
  throw new Error('离线目录未授权');
  // ❌ 抛出错误，但无自动恢复流程
}
```

**问题 3：数据库损坏处理**

```typescript
// 当前状态：无实现
// ❌ 没有数据库完整性检查
// ❌ 没有损坏恢复机制
```

### 4.4 监控与诊断 ❌

| 缺失功能 | 影响 |
|----------|------|
| 存储使用统计 | 无法监控存储增长 |
| 性能指标收集 | 无法定位性能问题 |
| 写入延迟监控 | 无法发现写入瓶颈 |
| 错误率统计 | 无法评估稳定性 |

---

## 五、已知 Bug 和风险

### 5.1 已修复的 Bug

| Bug ID | 描述 | 位置 | 状态 |
|--------|------|------|------|
| #1 | 网络恢复后不自动同步 | `provider.tsx:679` | ✅ 已修复 |
| #2 | Socket 重连后不同步 | `provider.tsx:898,922,944` | ✅ 已修复 |
| #3 | 使用过期 socket 状态 | `provider.tsx:529` | ✅ 已修复 |
| #4 | Socket 断开时数据未持久化 | `provider.tsx:1061-1064` | ✅ 已修复 |
| #5 | 同步失败时数据丢失 | `provider.tsx:702-717` | ✅ 已修复 |

### 5.2 仍存在的风险

#### 风险 1：页面快速关闭时数据丢失

```
触发条件：用户编辑后 100ms 内关闭页面
原因：防抖机制导致更新未保存
影响：最后几次编辑可能丢失
风险等级：中
```

**相关代码**:
```typescript
// packages/common/nbstore/src/frontend/doc.ts:601
// 100ms 防抖
const debouncedSave = debounce(save, 100);
```

#### 风险 2：离线队列溢出

```typescript
// 位置: packages/frontend/core/src/modules/cloud-storage/provider.tsx:426-433
// 限制
const MAX_OFFLINE_OPERATIONS = 500;      // 最多 500 条操作
const MAX_OFFLINE_STORAGE_BYTES = 2 * 1024 * 1024; // 最大 2MB

// 超过限制时旧数据被丢弃（FIFO）
if (trimmed.length > MAX_OFFLINE_OPERATIONS) {
  trimmed = trimmed.slice(trimmed.length - MAX_OFFLINE_OPERATIONS);
}
```

**风险**: 长时间离线可能导致重要数据被清理。

#### 风险 3：SQLite 写入失败静默处理

```typescript
// 位置: packages/frontend/core/src/modules/storage/file-native-db.ts:297-348
// 当前行为
1. 尝试写入 SQLite
2. 失败后重试（最多 3 次）
3. 全部失败 → 只记录警告，不通知用户

// ⚠️ 用户可能不知道数据未保存
```

#### 风险 4：数据库损坏无恢复机制

```
触发条件：异常断电、磁盘故障、文件系统错误
影响：整个工作区数据可能无法读取
风险等级：高
当前状态：无检测和恢复机制
```

### 5.3 代码中的 TODO/FIXME

| 位置 | 内容 | 优先级 |
|------|------|--------|
| `handlers.ts:72` | db 文件可能仍在使用（Windows） | P1 |
| `handlers.ts:393` | 需要分页获取已删除工作区 | P2 |
| `app-tabs-header.tsx:170` | 关闭 tab 时 view 可能已 GC | P2 |
| `workspace/layout.tsx:36` | 需复用全局 context | P3 |

---

## 六、边界情况处理分析

| 边界情况 | 处理状态 | 详细说明 |
|----------|----------|----------|
| 磁盘空间不足 | ❌ 未处理 | 无检测机制，失败只记录日志 |
| 文件系统只读 | ❌ 未处理 | 会抛出错误但无恢复流程 |
| 数据库被锁定 | ⚠️ 部分处理 | 有重试但无等待机制 |
| 数据库损坏 | ❌ 未处理 | 无完整性检查和恢复 |
| 并发写入冲突 | ✅ 已处理 | 使用 AsyncLock 串行化 |
| 页面快速关闭 | ⚠️ 部分处理 | 有 beforeunload 但不可靠 |
| 权限被撤销 | ⚠️ 部分处理 | 抛出错误但无自动恢复 |
| 大文件处理 | ⚠️ 部分处理 | 有 Blob 存储但无分片 |
| 存储配额超限 | ⚠️ 部分处理 | 有限制但用户无感知 |

### 详细分析

#### 磁盘空间不足

```typescript
// 当前实现：无
// 建议实现：
async function checkDiskSpace(): Promise<{available: number, required: number}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      available: estimate.quota - estimate.usage,
      required: pendingDataSize
    };
  }
  return { available: Infinity, required: 0 };
}
```

#### 并发写入冲突

```typescript
// 位置: packages/frontend/apps/electron/src/helper/nbstore/v1/workspace-db-adapter.ts:23-26
// 已实现：使用 AsyncLock 确保串行写入
private lock = new AsyncLock();

async transaction<T>(cb: (db: SqliteConnection) => Promise<T>): Promise<T> {
  return this.lock.runExclusive(async () => {
    return await cb(this.db);
  });
}
```

---

## 七、改进建议

### 7.1 P0 - 立即处理（数据安全）

#### 1. 添加磁盘空间检测

```typescript
// 建议位置: packages/frontend/core/src/modules/storage/disk-space.ts

export class DiskSpaceMonitor {
  private warningThreshold = 100 * 1024 * 1024; // 100MB
  
  async checkAndWarn(): Promise<void> {
    const space = await this.getAvailableSpace();
    if (space < this.warningThreshold) {
      this.notifyUser('磁盘空间不足，请清理后继续使用');
    }
  }
  
  private async getAvailableSpace(): Promise<number> {
    // 实现空间检测
  }
}
```

#### 2. SQLite 写入失败用户通知

```typescript
// 建议修改: packages/frontend/core/src/modules/storage/file-native-db.ts

if (writeFailedAfterRetry) {
  // 通知用户
  notificationService.error({
    title: '数据保存失败',
    message: '请检查磁盘空间或文件权限',
    action: {
      label: '重试',
      onClick: () => this.retryWrite()
    }
  });
  
  // 保存到紧急备份
  await this.saveToEmergencyBackup(data);
}
```

#### 3. 数据库完整性检查

```typescript
// 建议位置: packages/common/nbstore/src/impls/sqlite/integrity.ts

export async function checkDatabaseIntegrity(db: SqliteConnection): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const result = await db.exec('PRAGMA integrity_check');
  const isValid = result === 'ok';
  
  if (!isValid) {
    // 尝试恢复
    await this.attemptRecovery(db);
  }
  
  return { isValid, errors: isValid ? [] : [result] };
}
```

### 7.2 P1 - 近期处理（可靠性）

#### 4. 自动备份机制

```typescript
// 建议位置: packages/frontend/core/src/modules/backup/auto-backup.ts

export class AutoBackupService {
  private backupInterval = 24 * 60 * 60 * 1000; // 24小时
  
  async scheduleBackup(): Promise<void> {
    setInterval(async () => {
      await this.createBackup();
    }, this.backupInterval);
  }
  
  async createBackup(): Promise<BackupInfo> {
    const timestamp = Date.now();
    const backupPath = `${this.backupDir}/backup_${timestamp}.db`;
    
    // 复制数据库文件
    await fs.copyFile(this.dbPath, backupPath);
    
    // 清理旧备份（保留最近 7 个）
    await this.cleanOldBackups(7);
    
    return { path: backupPath, timestamp };
  }
  
  async listBackups(): Promise<BackupInfo[]> {
    // 列出所有备份
  }
  
  async restoreFromBackup(backupId: string): Promise<void> {
    // 恢复备份
  }
}
```

#### 5. 页面关闭时强制保存

```typescript
// 建议修改: packages/common/nbstore/src/frontend/doc.ts

// 添加 beforeunload 处理
window.addEventListener('beforeunload', (e) => {
  if (this.hasPendingUpdates()) {
    // 取消防抖，立即保存
    this.flushPendingUpdates();
    
    // 使用 sendBeacon 作为后备
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/backup', this.getPendingData());
    }
  }
});

// 添加 visibilitychange 处理
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    this.flushPendingUpdates();
  }
});
```

### 7.3 P2 - 长期优化

#### 6. 版本历史功能

```typescript
// 建议位置: packages/frontend/core/src/modules/version-history/

export class VersionHistoryService {
  // 保存版本快照
  async saveSnapshot(docId: string): Promise<VersionInfo> {
    const snapshot = await this.doc.getSnapshot();
    const version = {
      id: nanoid(),
      docId,
      timestamp: Date.now(),
      snapshot,
      description: this.generateDescription(snapshot)
    };
    await this.store.saveVersion(version);
    return version;
  }
  
  // 获取版本列表
  async getVersions(docId: string): Promise<VersionInfo[]> {
    return this.store.getVersions(docId);
  }
  
  // 恢复到指定版本
  async restoreVersion(versionId: string): Promise<void> {
    const version = await this.store.getVersion(versionId);
    await this.doc.applySnapshot(version.snapshot);
  }
  
  // 版本对比
  async compareVersions(v1: string, v2: string): Promise<DiffResult> {
    // 实现版本对比
  }
}
```

#### 7. 存储使用情况监控 UI

```typescript
// 建议位置: packages/frontend/core/src/components/storage-status/

export function StorageStatusPanel() {
  const { used, total, percentage } = useStorageStatus();
  
  return (
    <div className="storage-status">
      <ProgressBar value={percentage} />
      <span>{formatBytes(used)} / {formatBytes(total)}</span>
      {percentage > 80 && (
        <Alert type="warning">存储空间即将用尽</Alert>
      )}
    </div>
  );
}
```

---

## 八、关键文件索引

### 8.1 核心存储实现

| 功能 | 文件路径 |
|------|----------|
| SQLite 文档存储 | `packages/common/nbstore/src/impls/sqlite/doc.ts` |
| SQLite Blob 存储 | `packages/common/nbstore/src/impls/sqlite/blob.ts` |
| SQLite 同步存储 | `packages/common/nbstore/src/impls/sqlite/doc-sync.ts` |
| SQLite 连接管理 | `packages/common/nbstore/src/impls/sqlite/db.ts` |
| IndexedDB 文档存储 | `packages/common/nbstore/src/impls/idb/doc.ts` |
| IndexedDB Blob 存储 | `packages/common/nbstore/src/impls/idb/blob.ts` |

### 8.2 Electron 主进程

| 功能 | 文件路径 |
|------|----------|
| 存储处理器 | `packages/frontend/apps/electron/src/helper/nbstore/handlers.ts` |
| V1 数据库适配器 | `packages/frontend/apps/electron/src/helper/nbstore/v1/workspace-db-adapter.ts` |
| 工作区元数据 | `packages/frontend/apps/electron/src/helper/workspace/meta.ts` |
| 工作区操作 | `packages/frontend/apps/electron/src/helper/workspace/handlers.ts` |

### 8.3 前端存储模块

| 功能 | 文件路径 |
|------|----------|
| 文件原生数据库 | `packages/frontend/core/src/modules/storage/file-native-db.ts` |
| 离线文件句柄 | `packages/frontend/core/src/modules/storage/offline-file-handle.ts` |
| Electron 存储实现 | `packages/frontend/core/src/modules/storage/impls/electron.ts` |
| 外部存储 | `packages/frontend/core/src/modules/external-storage/` |

### 8.4 导入导出

| 功能 | 文件路径 |
|------|----------|
| 导出 Hook | `packages/frontend/core/src/components/hooks/yunke/use-export-page.ts` |
| 导入对话框 | `packages/frontend/core/src/desktop/dialogs/import/index.tsx` |
| HTML 适配器 | `blocksuite/yunke/shared/src/adapters/html/` |
| Markdown 适配器 | `blocksuite/yunke/shared/src/adapters/markdown/` |
| ZIP 转换器 | `blocksuite/yunke/widgets/linked-doc/src/transformers/zip.ts` |

### 8.5 文档

| 文档 | 文件路径 |
|------|----------|
| 离线模式使用 | `docs/desktop-offline.md` |
| 离线存储 Bug | `docs/bugs/OFFLINE-STORAGE-BUGS.md` |
| 保存逻辑分析 | `docs/桌面端保存逻辑分析.md` |

---

## 附录：离线功能测试清单

### A.1 基础功能测试

- [ ] 创建新文档并编辑
- [ ] 关闭应用后重新打开，数据是否保留
- [ ] 插入图片并保存
- [ ] 导入 Markdown 文件
- [ ] 导出为 PDF

### A.2 边界情况测试

- [ ] 快速输入后立即关闭应用
- [ ] 磁盘空间不足时的行为
- [ ] 撤销文件夹访问权限后的行为
- [ ] 大文件（>10MB）导入
- [ ] 长时间（>1小时）不保存后的行为

### A.3 恢复测试

- [ ] 强制关闭应用后数据恢复
- [ ] 数据库文件损坏后的行为
- [ ] 清空缓存后的行为

---

*文档版本: 1.0*  
*最后更新: 2026-02-05*
