# 前端整体架构概览（Frontend Overview）

> 关联目录与项目：
> - Web 桌面端应用：`packages/frontend/apps/web`
> - 核心前端模块：`packages/frontend/core`
> - 管理后台：`packages/frontend/admin`
> - 组件库与基础设施：`packages/frontend/component`、`packages/frontend/routes`、`packages/frontend/track` 等
> - BlockSuite 文档内核：`blocksuite/*`、`packages/frontend/core/src/blocksuite/*`

本篇从“代码组织与职责划分”的角度，介绍前端整体结构，为功能文档提供架构上下文。

---

## 1. Monorepo 与顶层结构

### 1.1 Monorepo 布局

仓库采用 Monorepo 结构，前端相关部分主要集中在：

- `packages/frontend/*`：
  - `apps/web`：Web 桌面端入口应用（浏览器端主入口）；
  - `admin`：管理后台前端（系统设置、监控、账号管理等）；
  - `core`：核心业务模块（工作空间、文档编辑、AI、论坛等）；
  - `component`：通用 UI 组件库；
  - `i18n`：多语言资源与 i18n 基础设施；
  - `routes`：通用路由工具与类型；
  - `track`：埋点与统计 SDK；
  - `templates`：内置模板与贴纸等静态资源；
  - 其他如 `native-mock`、`electron-api`、`mobile` 等，用于多端集成。
- `blocksuite/*`：
  - 文档/白板内核与编辑能力（BlockSuite），与 `@yunke/core/blocksuite` 集成；
  - 文档中涉及的块类型、视图扩展、同步存储等均基于此实现。

### 1.2 应用与核心模块的关系

整体架构大致可视为：

- `apps/web`：负责浏览器环境下的顶层路由、错误边界、导航上下文等；
  - 通过路由引导到 `@yunke/core/desktop` 中的各页面组件；
  - 本身尽量薄，仅做“壳”和跨模块协调。
- `core`：
  - 按“桌面端页面（desktop/pages）+ 模块（modules）+ 组件（components）+ hooks”组织；
  - 提供工作空间、文档编辑、AI、论坛等核心业务能力；
  - 暴露页面组件给 `apps/web`、桌面客户端等不同入口复用。
- `admin`：
  - 独立的管理后台应用；
  - 使用统一的配置/权限/组件基础设施，但路由和页面与 core 业务隔离。

> 换句话说，`apps/web` 是浏览器端入口，`core` 是通用功能层，`admin` 是管理后台入口；Monorepo 内其他包提供组件、国际化、埋点等横向能力。

---

## 2. Web 桌面端应用结构（apps/web）

### 2.1 路由与入口

- Web 应用的顶层路由定义在：`packages/frontend/apps/web/src/router.tsx`。
- 关键要点：
  - 使用 `react-router-dom` v6 创建路由，并通过 `@sentry/react` 包装以支持错误采集；
  - 顶层 `element` 为 `WebNavigateProvider`，它：
    - 从 `react-router` 获取 `navigate`；
    - 将其注入 `NavigateContext`；
    - 渲染 `RootWrapper`（来自 `@yunke/core/desktop/pages/root`）。

### 2.2 路由与 core 的关系

在路由中，大部分路径直接 lazy-load `@yunke/core/desktop` 下的页面组件，例如：

- `/workspace/:workspaceId/*` → `@yunke/core/desktop/pages/workspace/index`；
- `/forum/*` → `@yunke/core/desktop/pages/workspace/forum/*`；
- `/template/import` → `@yunke/core/desktop/pages/import-template`；
- `/clipper/import` → `@yunke/core/desktop/pages/import-clipper`；
- `/download` / `/onboarding` / `/subscribe` / `/auth/*` 等均指向 `core` 中对应页面。

这意味着：

- `apps/web` 只负责：
  - 壳：Router 创建、错误边界、监控日志；
  - 配置：设置 `basename`、Sentry、路由加载监控。
- 具体业务界面完全交给 `core` 层的页面组件实现。

### 2.3 路由监控与调试

`router.tsx` 中还增加了路由状态监控：

- 订阅路由状态变化，打印当前路径、是否加载中、是否有错误；
- 通过定时器检查路由加载是否超时（例如超过 15 秒），并在 DOM 中插入提示弹窗，提醒用户可能的网络或模块加载问题。

---

## 3. Core 模块结构（packages/frontend/core）

`core` 是整个前端业务的“心脏”，主要由以下几个层次构成：

### 3.1 desktop/pages：页面层

- 路径：`packages/frontend/core/src/desktop/pages/*`
- 特点：
  - 每个子目录通常对应一个顶级路由或一组相关路由；
  - 例如：
    - `workspace/*`：工作空间页面（文档列表、详情、设置、附件等）；
    - `workspace/forum/*`：论坛（首页、板块、帖子详情、发帖、搜索、通知、版主面板等）；
    - `import-template`、`import-clipper`：模板导入与剪藏导入页面；
    - `auth/*`：登录、OAuth 等认证页面；
    - `download`、`onboarding`、`subscribe` 等。

- 常见模式：
  - 页面组件主要负责：
    - 调用对应 `modules/*` 提供的服务；
    - 组织布局和交互（表单、列表、对话框等）；
    - 处理路由参数和导航（`useParams` / `useNavigate`）。

### 3.2 modules：业务服务层

- 路径：`packages/frontend/core/src/modules/*`
- 每个模块负责一块业务能力，例如：
  - `workspace`：工作空间元数据管理；
  - `doc`：文档数据管理（列表、元信息）；
  - `import-template` / `import-clipper`：模板导入、剪藏导入；
  - `cloud`：云服务/会话管理（如 `AuthService`、`ServerService`）；
  - `ai`：AI 聊天、文档内 AI 块、白板 Copilot 等；
  - 其他如 `collection`、`permissions` 等。

- 模模块内部常见结构：
  - `services/*.ts`：业务服务（通常继承自 `Service`）；
  - `entities/*.ts`：状态实体（继承自 `Entity`），结合 `LiveData` 管理状态与副作用；
  - `store/*.ts`：对外部资源（HTTP、存储等）的封装；
  - `index.ts`：模块装配（将服务/实体注册到框架）。

### 3.3 components 与 hooks：UI 与交互基础

- 通用业务组件：
  - `components/yunke/*`：Yunke 特定 UI（错误边界、布局容器等）；
  - `components/page-list/*`：页面列表、过滤器、排序组件等；
  - `components/workspace-*`：工作空间选择器、设置侧边栏等；
  - `blocksuite/ai/*` / `blocksuite/widgets/*`：AI 面板、白板小部件等。

- 通用 hooks：
  - `components/hooks/use-navigate-helper.ts`：封装常用导航行为（跳转工作空间/页面/分享页/模板导入等）；
  - `components/hooks/yunke-async-hooks.ts`：封装通用异步操作逻辑；
  - 其他针对权限、会话、布局等的自定义 hooks。

> 页面层通过 `hooks + components + modules` 组成完整场景；模块层则通过 `Service/Entity/Store` 架构与后端、BlockSuite 等交互。

---

## 4. BlockSuite 与文档编辑集成（概览）

> BlockSuite 和文档编辑细节在 `blocksuite.md` 中展开，这里仅做概览。

### 4.1 集成位置

- BlockSuite 相关代码主要位于：
  - `packages/frontend/core/src/blocksuite/*`：封装 Yunke 对 BlockSuite 的定制（块类型、视图扩展、AI 集成等）；
  - `blocksuite/*`：BlockSuite 本身的实现（作为外部库引入）。

### 4.2 角色分工

- BlockSuite 提供：
  - 文档结构（Block Tree）、光标与选区、协同编辑协议等基础能力；
  - Edgeless 白板、文本/列表/表格等常用块类型。

- Yunke 在其基础上增加：
  - 自定义块类型（AI 聊天块、转写块等）；
  - 与 AI 服务、模板、剪藏等业务串联的视图扩展；
  - 与工作空间/权限/历史版本等功能的集成。

---

## 5. 管理后台与设置架构（简要）

### 5.1 管理后台入口

- `packages/frontend/admin` 为独立的 React 应用：
  - 提供 `/admin/*` 路由空间；
  - 使用自己的布局、导航与模块；
  - 通过 REST API 与后端交互（目前部分使用 mock 数据）。

### 5.2 配置与模块划分

- 系统设置模块（`admin/src/modules/settings/*`）：
  - 使用 `config.json` + `config.ts` 描述所有可配置字段；
  - 通过 `SettingsPage + AdminPanel + ConfigRow` 动态渲染各模块的配置界面；
  - 使用 `useAppConfig` 统一管理配置加载、修改与保存。

- 其他模块（`accounts`、`monitoring`、`setup`、`ai` 等）：
  - 各自负责账号管理、系统监控、初始化向导、AI 配置等；
  - 与 `core` 共享部分基础设施（如 `use-query`、`notify` 等）。

---

## 6. 前端架构文档的后续扩展

本篇概览主要回答“项目是如何分层和拆包”的问题。后续可按以下方向继续深化架构文档：

- `blocksuite.md`：
  - 详细说明 BlockSuite 的文档模型、扩展机制、Yjs 同步与编辑器集成；
  - 列出 Yunke 自定义块类型及其与 AI、模板、剪藏的结合方式。
- `storage-and-sync.md`：
  - 描述文档存储、同步与历史版本的架构（nbstore、worker、快照与增量更新等）；
  - 解释前端如何与后端协同管理文档历史与冲突。
- `ai-architecture.md`：
  - 从“Provider + Prompt + 插件”的角度说明 AI 能力的模块化设计；
  - 描述聊天、文档内 AI、白板 Copilot 等入口与后端服务之间的调用链。

这些文档与已存在的“功能 + 实现说明”文档配合，可以让新人既能从“能做什么”入手，又能从“怎么做”理解底层架构。 

