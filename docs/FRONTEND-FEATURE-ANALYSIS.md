# 云客白板前端功能完整性分析报告

> 分析日期：2026-02-05  
> 项目版本：0.21.0  
> 分析范围：baibanfront 前端项目完整功能  

---

## 目录

1. [项目概述](#一项目概述)
2. [技术架构](#二技术架构)
3. [功能模块完成度](#三功能模块完成度)
4. [文档编辑功能](#四文档编辑功能)
5. [离线功能](#五离线功能)
6. [数据存储与同步](#六数据存储与同步)
7. [多平台支持](#七多平台支持)
8. [未完成功能分析](#八未完成功能分析)
9. [风险与建议](#九风险与建议)

---

## 一、项目概述

### 1.1 项目信息

- **项目名称**: 云科白板 (Yunke Whiteboard)
- **基于项目**: AFFiNE 开源项目二次开发
- **编辑器框架**: BlockSuite
- **包管理器**: Yarn 4.9.1 (workspaces)

### 1.2 代码规模

| 模块 | 文件数 | 主要语言 |
|------|--------|----------|
| blocksuite/yunke | ~2,500 | TypeScript |
| packages/frontend/core | ~3,300 | TypeScript/TSX |
| packages/frontend/apps | ~550 | TypeScript/Swift/Kotlin |
| packages/common | ~300 | TypeScript |
| **总计** | **~8,000+** | - |

### 1.3 目录结构

```
baibanfront/
├── blocksuite/                    # BlockSuite 编辑器框架
│   ├── framework/                 # 核心框架
│   └── yunke/                     # 云科定制组件
│       ├── blocks/                # 内容块 (30+ 种)
│       ├── widgets/               # UI 组件
│       ├── gfx/                   # 图形功能
│       ├── data-view/             # 数据视图
│       └── inlines/               # 内联元素
├── packages/
│   ├── frontend/
│   │   ├── apps/                  # 多平台应用
│   │   │   ├── web/               # Web 应用
│   │   │   ├── electron/          # 桌面端
│   │   │   ├── android/           # Android
│   │   │   └── ios/               # iOS
│   │   ├── core/                  # 核心模块 (70+)
│   │   └── component/             # UI 组件库
│   └── common/                    # 公共库
│       ├── nbstore/               # 存储抽象层
│       └── infra/                 # 基础设施
└── tools/                         # 构建工具
```

---

## 二、技术架构

### 2.1 技术栈

| 分类 | 技术 |
|------|------|
| 前端框架 | React 18.2.0 + TypeScript 5.7 |
| 编辑器核心 | BlockSuite (Lit) |
| 状态管理 | Jotai + Yjs (CRDT) |
| 样式方案 | Vanilla Extract + Emotion |
| 构建工具 | Vite 6 + Webpack |
| 桌面端 | Electron |
| 移动端 | Capacitor |
| 测试 | Vitest + Playwright |

### 2.2 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│                      View 层 (渲染)                          │
│   React Components + Lit Web Components                      │
├─────────────────────────────────────────────────────────────┤
│                     Service 层 (业务)                        │
│   Framework DI + LiveData + Commands                         │
├─────────────────────────────────────────────────────────────┤
│                      Model 层 (数据)                         │
│   Yjs Documents + nbstore + SQLite/IndexedDB                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 存储架构

```
┌────────────────────────────────────────────────────────┐
│                    Frontend API                         │
│          (DocStorage, BlobStorage, AwarenessStorage)    │
├────────────────────────────────────────────────────────┤
│                  Storage Abstraction                    │
│               (packages/common/nbstore/)                │
├─────────────┬─────────────┬────────────────────────────┤
│  IndexedDB  │   SQLite    │      Cloud (Socket.IO)     │
│  (Web 端)   │ (桌面/移动) │       (实时协作)            │
└─────────────┴─────────────┴────────────────────────────┘
```

---

## 三、功能模块完成度

### 3.1 总览

| 功能分类 | 完成度 | 说明 |
|----------|--------|------|
| 文档编辑 | ✅ 95% | 30+ Block 类型，双模式编辑器 |
| 白板功能 | ✅ 90% | 激光笔、投票、计时器、动画 |
| 离线模式 | ✅ 90% | SQLite 存储、自定义位置 |
| 工作区管理 | ✅ 90% | 创建/删除/切换 |
| 文档组织 | ✅ 90% | 收藏、集合、标签、搜索 |
| 分享功能 | ⚠️ 80% | 需后端支持 |
| 数据同步 | ⚠️ 85% | 需后端支持 |
| AI 功能 | ⚠️ 60% | 部分需后端实现 |
| 插件系统 | ⚠️ 50% | 核心 API 未完成 |
| 移动端 | ⚠️ 70% | 功能受限 |

### 3.2 核心模块清单

**packages/frontend/core/src/modules/** 包含 70+ 功能模块：

| 模块 | 说明 | 完成度 |
|------|------|--------|
| doc | 文档管理 | ✅ 95% |
| workspace | 工作区管理 | ✅ 90% |
| editor | 编辑器集成 | ✅ 95% |
| storage | 存储管理 | ✅ 90% |
| quicksearch | 快速搜索 | ✅ 90% |
| favorite | 收藏功能 | ✅ 95% |
| collection | 集合功能 | ✅ 90% |
| tag | 标签系统 | ✅ 95% |
| theme | 主题系统 | ✅ 95% |
| navigation | 导航系统 | ✅ 90% |
| share-doc | 文档分享 | ⚠️ 80% |
| cloud | 云端功能 | ⚠️ 85% |
| ai-button | AI 功能 | ⚠️ 60% |
| plugins | 插件系统 | ⚠️ 50% |
| permissions | 权限管理 | ⚠️ 70% |

---

## 四、文档编辑功能

### 4.1 Block 类型（30+ 种）

#### 基础内容块

| Block | Flavour | 说明 |
|-------|---------|------|
| 段落 | `yunke:paragraph` | 支持 text/quote/h1-h6 |
| 列表 | `yunke:list` | bulleted/numbered/todo/toggle |
| 代码 | `yunke:code` | 语法高亮、语言选择 |
| 分隔线 | `yunke:divider` | - |
| 标注 | `yunke:callout` | 带图标的提示块 |

#### 媒体块

| Block | Flavour | 说明 |
|-------|---------|------|
| 图片 | `yunke:image` | 支持旋转、缩放 |
| 附件 | `yunke:attachment` | 文件上传下载 |
| 书签 | `yunke:bookmark` | URL 预览卡片 |

#### 嵌入块

| Block | Flavour | 说明 |
|-------|---------|------|
| YouTube | `yunke:embed-youtube` | 视频嵌入 |
| Figma | `yunke:embed-figma` | 设计嵌入 |
| GitHub | `yunke:embed-github` | 仓库/文件嵌入 |
| HTML | `yunke:embed-html` | HTML 内容 |
| iframe | `yunke:embed-iframe` | 通用嵌入 |
| 链接文档 | `yunke:embed-linked-doc` | 文档预览卡片 |
| 同步文档 | `yunke:embed-synced-doc` | 实时同步内容 |

#### 数据块

| Block | Flavour | 说明 |
|-------|---------|------|
| 表格 | `yunke:table` | 行列操作 |
| 数据库 | `yunke:database` | 多视图、20+ 列类型 |

#### 图形块

| Block | Flavour | 说明 |
|-------|---------|------|
| 白板 | `yunke:surface` | 无限画布 |
| 框架 | `yunke:frame` | 演示模式 |
| 流程图 | `yunke:flowchart` | Mermaid |
| Excalidraw | `yunke:excalidraw` | 手绘风格 |
| Draw.io | `yunke:drawio` | 图表 |

### 4.2 富文本格式

```typescript
interface YunkeTextAttributes {
  bold?: true;        // 加粗
  italic?: true;      // 斜体
  underline?: true;   // 下划线
  strike?: true;      // 删除线
  code?: true;        // 行内代码
  link?: string;      // 链接
  background?: string; // 背景色
  color?: string;     // 文字颜色
  latex?: string;     // LaTeX 公式
  footnote?: FootNote; // 脚注
  mention?: MentionInfo; // @提及
  reference?: ReferenceInfo; // 文档引用
}
```

### 4.3 数据库功能

**列类型（20+ 种）**:
- 文本: text, rich-text
- 数字: number, rating
- 日期: date, date-range
- 选择: select, multi-select
- 布尔: checkbox
- 文件: attachment, image
- 链接: url, email, phone
- 其他: location, person, progress
- 关系: relation, rollup
- 计算: formula

**视图类型**:
- 表格视图 (Table)
- 看板视图 (Kanban)
- 日历视图 (Calendar)
- 甘特图视图 (Gantt)
- 图表视图 (Chart)

### 4.4 白板专用工具

| 工具 | 位置 | 说明 |
|------|------|------|
| 激光笔 | `gfx/laser/` | 轨迹显示 500ms |
| 投票 | `gfx/vote/` | 单选/多选、匿名 |
| 计时器 | `gfx/timer/` | 倒计时 |
| 动画 | `gfx/animation/` | 帧动画、导出 GIF |
| 表情反应 | `gfx/emoji-reaction/` | 表情标记 |
| 图表 | `gfx/chart/` | 数据可视化 |
| 书法笔 | `gfx/calligraphy/` | 书法效果 |

### 4.5 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` | 重做 |
| `Ctrl+B` | 加粗 |
| `Ctrl+I` | 斜体 |
| `Ctrl+U` | 下划线 |
| `Ctrl+K` | 插入链接/快速搜索 |
| `Ctrl+Alt+1/2/3` | 标题 1/2/3 |
| `Alt+↑/↓` | 上移/下移块 |
| `/` | 斜杠菜单 |

---

## 五、离线功能

### 5.1 完成度

| 功能 | 完成度 | 说明 |
|------|--------|------|
| 文档存储 | ✅ 95% | SQLite/IndexedDB |
| Blob 存储 | ✅ 98% | 图片/附件本地化 |
| 编辑功能 | ✅ 100% | 所有 Block 支持 |
| 导入导出 | ✅ 96% | 5 种格式 |
| 数据备份 | ❌ 30% | 缺少自动备份 |
| 错误恢复 | ⚠️ 60% | 部分场景不完善 |

### 5.2 存储架构

```
Electron 桌面端：
├── 全局配置: {userData}/config.json
├── 全局状态: {userData}/global-state.json
└── 工作区数据: {离线目录}/workspaces/{id}/storage.db
    ├── doc_updates    (文档增量更新)
    ├── doc_snapshots  (文档快照)
    ├── doc_clocks     (文档时钟)
    └── blobs          (二进制数据)
```

### 5.3 导入支持

| 格式 | 实现方式 |
|------|----------|
| Markdown (.md) | `MarkdownTransformer.importMarkdownToDoc()` |
| MD + 媒体 (.zip) | `MarkdownTransformer.importMarkdownZip()` |
| HTML | `HtmlTransformer.importHTMLToDoc()` |
| Notion 导出 | `NotionHtmlTransformer.importNotionZip()` |
| 快照 (.zip) | `ZipTransformer.importDocs()` |

### 5.4 导出支持

| 格式 | 实现方式 |
|------|----------|
| HTML | `HtmlTransformer.exportDoc()` |
| Markdown | `MarkdownTransformer.exportDoc()` |
| PDF | `printToPdf()` |
| PNG | `ExportManager.exportPng()` |
| 快照 | `ZipTransformer.exportDocs()` |

> 详细分析见: [OFFLINE-FEATURE-ANALYSIS.md](./OFFLINE-FEATURE-ANALYSIS.md)

---

## 六、数据存储与同步

### 6.1 nbstore 存储抽象

**核心接口**:

```typescript
interface DocStorage {
  pushDocUpdate(update): Promise<void>;
  getDocSnapshot(docId): Promise<DocSnapshot>;
  getDocUpdates(docId): Promise<DocUpdate[]>;
  deleteDoc(docId): Promise<void>;
  subscribeDocUpdate(callback): () => void;
}

interface BlobStorage {
  get(key): Promise<Blob>;
  set(blob): Promise<void>;
  delete(key): Promise<void>;
  list(): Promise<string[]>;
}
```

### 6.2 同步机制

```
本地存储 ←→ DocSyncPeer ←→ 远程存储
              │
         SyncMetadata (同步元数据)

作业类型:
- connect: 建立连接
- pull: 拉取更新
- push: 推送更新
- pullAndPush: 双向同步
```

### 6.3 CRDT 协作

- 基于 Yjs 实现
- 支持 `diffUpdate()` 计算差异
- 支持 `mergeUpdates()` 合并更新
- 自动冲突解决

---

## 七、多平台支持

### 7.1 平台状态

| 平台 | 状态 | 技术栈 |
|------|------|--------|
| Web | ✅ 完成 | Vite + React |
| Electron | ✅ 完成 | Electron + better-sqlite3 |
| Android | ⚠️ 开发中 | Capacitor |
| iOS | ⚠️ 开发中 | Capacitor + Swift |

### 7.2 桌面端特有功能

- ✅ 离线模式
- ✅ 自定义存储位置
- ✅ SQLite 本地存储
- ✅ 系统托盘
- ✅ 文件系统访问

### 7.3 移动端限制

- ❌ 离线模式（依赖网络）
- ❌ 自定义存储位置
- ⚠️ 白板编辑（需 Feature Flag）
- ⚠️ 完整 AI 功能

---

## 八、未完成功能分析

### 8.1 按原因分类

#### 后端依赖（占比约 40%）

| 功能 | 影响 |
|------|------|
| 云端协作 API | 实时协作受限 |
| Copilot 配额 API | AI 功能不完整 |
| 订阅/支付 API | 商业化受阻 |
| 用户配额 API | 配额显示异常 |

#### 设计决策（占比约 30%）

| 功能 | 原因 |
|------|------|
| 插件写入权限 | 安全考虑，MVP 阶段关闭 |
| 插件市场 | 需要完整生态建设 |
| 移动端离线 | 技术复杂度高 |

#### 开发优先级（占比约 20%）

| 功能 | 状态 |
|------|------|
| 移动端独立首页 | 复用桌面版 |
| 404 错误页面 | 待实现 |
| 版本历史 | 待实现 |

#### 技术限制（占比约 10%）

| 功能 | 限制 |
|------|------|
| iOS Keyboard API | Capacitor 限制 |
| Android WebView | 兼容性问题 |

### 8.2 关键 TODO 清单

| 优先级 | 位置 | 说明 |
|--------|------|------|
| P0 | `user-copilot-quota.ts:43` | Copilot 配额 API 未实现 |
| P0 | `plugin-runtime.ts:208` | doc.getSnapshot 未实现 |
| P1 | `mobile/pages/index.tsx:9` | 移动首页待优化 |
| P1 | `mobile-detail-page.tsx:264` | 404 页面未实现 |
| P2 | `subscription.ts:69` | GraphQL 待迁移 |

### 8.3 插件系统缺失

| 功能 | 状态 | 影响 |
|------|------|------|
| doc.getSnapshot | ❌ 未实现 | 插件无法读取文档 |
| doc:write 权限 | ❌ MVP 不开放 | 插件无法修改文档 |
| 插件市场 | ❌ 非 MVP 目标 | 只能手动安装 |
| 网络访问权限 | ❌ 默认禁止 | 插件功能受限 |

---

## 九、风险与建议

### 9.1 数据安全风险

| 风险 | 等级 | 建议 |
|------|------|------|
| 无自动备份 | 高 | 实现定时备份机制 |
| 数据库损坏无恢复 | 高 | 添加完整性检查 |
| 写入失败静默处理 | 中 | 添加用户通知 |
| 页面关闭数据丢失 | 中 | 优化保存时机 |

### 9.2 改进建议优先级

#### P0 - 立即处理

1. 实现磁盘空间检测和预警
2. SQLite 写入失败时通知用户
3. 添加数据库完整性检查
4. 实现插件 `doc.getSnapshot` API

#### P1 - 近期处理

1. 实现自动备份机制
2. 完善页面关闭时的数据保存
3. 移动端独立首页
4. 404 错误页面

#### P2 - 长期优化

1. 版本历史功能
2. 插件市场建设
3. 移动端离线模式
4. 性能监控系统

### 9.3 代码质量建议

1. 清理调试代码和注释
2. 统一错误处理机制
3. 减少代码重复（移动端/桌面端）
4. 完善单元测试覆盖

---

## 附录

### A. 关键文件索引

| 功能 | 文件路径 |
|------|----------|
| Block 模型 | `blocksuite/yunke/model/src/blocks/` |
| Block 视图 | `blocksuite/yunke/blocks/*/src/view.ts` |
| 富文本 | `blocksuite/yunke/rich-text/src/` |
| 数据视图 | `blocksuite/yunke/data-view/src/` |
| 存储抽象 | `packages/common/nbstore/src/` |
| 编辑器集成 | `packages/frontend/core/src/blocksuite/` |
| 核心模块 | `packages/frontend/core/src/modules/` |
| Electron | `packages/frontend/apps/electron/` |
| 移动端 | `packages/frontend/core/src/mobile/` |

### B. 相关文档

- [离线功能分析](./OFFLINE-FEATURE-ANALYSIS.md)
- [离线存储 Bug](./bugs/OFFLINE-STORAGE-BUGS.md)
- [桌面端保存逻辑](./桌面端保存逻辑分析.md)
- [插件系统](./plugin-system.md)
- [桌面端构建](./desktop-build-windows.md)
- [桌面端离线](./desktop-offline.md)

---

*文档版本: 1.0*  
*最后更新: 2026-02-05*
