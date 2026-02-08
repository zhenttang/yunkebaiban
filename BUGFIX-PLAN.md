# 云客白板前端 Bug 修复与优化规划

> 生成时间：2026-02-06
> 涵盖范围：7 个应用平台、60+ 功能模块、50+ 页面路由、30+ 对话框

---

## 一、已完成修复（离线存储，17 项）

以下问题已在本次会话中修复完毕，0 个 lint 错误。

### 修改文件清单

| 文件 | 修复数 |
|------|--------|
| `packages/frontend/core/src/modules/storage/file-native-db.ts` | 8 |
| `packages/frontend/core/src/modules/cloud-storage/utils/offline-storage.ts` | 3 |
| `packages/frontend/core/src/modules/cloud-storage/workers/merge-worker-client.ts` | 3 |
| `packages/frontend/core/src/modules/cloud-storage/workers/merge-update.worker.ts` | 2 |
| `packages/frontend/core/src/modules/workspace-engine/impls/local.ts` | 2 |
| `packages/frontend/core/src/modules/storage/offline-file-handle.ts` | 1 |
| `packages/frontend/core/src/modules/storage/impls/storage.ts` | 1 |

### 详细列表

| # | 优先级 | 问题 | 状态 |
|---|--------|------|------|
| 1 | P0 | 页面关闭时数据丢失（无 visibilitychange 监听） | ✅ 已修复 |
| 2 | P0 | IndexedDB 连接断开后永远无法重连 | ✅ 已修复 |
| 3 | P0 | 离线操作压缩 delete + save 非原子操作 | ✅ 已修复 |
| 4 | P0 | doc_updates 无限增长导致 DB 膨胀、flush 超时 | ✅ 已修复 |
| 5 | P0 | WASM 加载失败永不重试，SQLite 永久失效 | ✅ 已修复 |
| 6 | P0 | runExclusive 队列链断裂，后续操作全部阻塞 | ✅ 已修复 |
| 7 | P0 | getStats() 用 db.export() 获取大小，内存爆炸 | ✅ 已修复 |
| 8 | P1 | YDoc 合并后未 destroy，内存泄漏 | ✅ 已修复 |
| 9 | P1 | Worker 不 terminate，线程泄漏 | ✅ 已修复 |
| 10 | P1 | getOfflineStorageStatus 加载全部数据到内存 | ✅ 已修复 |
| 11 | P1 | V1 API 每次新建 SQLite 连接 | ✅ 已修复 |
| 12 | P1 | getWorkspaceBlob 等 3 方法连接泄漏 | ✅ 已修复 |
| 13 | P1 | offline-file-handle 每次新建 IndexedDB 连接 | ✅ 已修复 |
| 14 | P1 | flushAllEntriesSync 绕过队列导致写入冲突 | ✅ 已修复 |
| 15 | P1 | flush() 写入前无数据有效性检查 | ✅ 已修复 |
| 16 | P2 | AsyncStorageMemento 连接缓存不处理断连 | ✅ 已修复 |
| 17 | P2 | createWorkspace 中 YDoc 未 destroy | ✅ 已修复 |

---

## 二、待修复问题（全系统扫描，49 项）

### 2.1 严重问题（CRITICAL，4 项）

> 安全漏洞和系统崩溃风险，必须立即修复。

#### C-1：插件沙箱逃逸 — `new Function()` 执行插件代码

- **文件**：`packages/frontend/core/src/modules/plugins/runtime/plugin-runtime.ts`
- **行号**：186
- **问题**：使用 `new Function()` 执行插件代码，等同于 `eval()`。虽在 Worker 中运行，但恶意代码可以：
  - 访问 Worker 全局作用域（`self`、`globalThis`）
  - 执行高消耗计算（DoS 攻击）
  - 通过 `postMessage` 操纵与主线程的通信
  - 利用定时器进行侧信道攻击
- **修复建议**：
  1. 冻结 Worker 全局对象（`Object.freeze(globalThis)` 前置）
  2. 限制可用 API（覆盖 `fetch`、`XMLHttpRequest`、`WebSocket` 等）
  3. 添加执行超时机制
  4. 考虑使用 ShadowRealm 或 QuickJS WASM 替代

#### C-2：插件 ZIP 解析无安全校验

- **文件**：`packages/frontend/core/src/modules/plugins/services/plugin-service.ts`
- **行号**：59-83
- **问题**：
  - 无 ZIP 文件大小限制（可通过超大 ZIP 实施 DoS）
  - 无 manifest JSON 结构验证
  - `resolveEntryPath`（行 91-97）存在路径遍历风险
- **修复建议**：
  1. 添加最大 ZIP 大小限制（如 10MB）
  2. 使用 Zod/Yup schema 验证 manifest 结构
  3. 规范化路径并禁止 `..` 遍历

#### C-3：Manifest 解析 XSS 风险

- **文件**：`packages/frontend/core/src/modules/plugins/services/plugin-service.ts`
- **行号**：71
- **问题**：`JSON.parse()` 后的 manifest 数据如果被渲染到 UI 中（名称、描述等），可能导致 XSS
- **修复建议**：对所有 manifest 字符串字段进行 HTML 转义/sanitize

#### C-4：插件 Worker 异常时未 terminate

- **文件**：`packages/frontend/core/src/modules/plugins/runtime/plugin-runtime.ts`
- **行号**：239-252, 266-279
- **问题**：`handleWorkerCall` 抛异常或 Worker 崩溃时，Worker 线程不会被终止，持续占用资源
- **修复建议**：添加 Worker `onerror` 处理器，异常时自动 terminate 并标记插件为 crashed 状态

---

### 2.2 高危问题（HIGH，8 项）

> 导致白屏、数据丢失或资源持续泄漏，建议尽快修复。

#### H-1：移动端路由缺少 errorElement

- **文件**：`packages/frontend/core/src/mobile/router.tsx`
- **行号**：34
- **问题**：根路由没有 `errorElement`（Desktop 版有），子路由懒加载失败或渲染错误时整个应用白屏
- **修复建议**：添加 `errorElement: <MobileErrorPage />`

#### H-2：移动端路由 Ready State Hack 导致白屏

- **文件**：`packages/frontend/core/src/mobile/router.tsx`
- **行号**：13-29
- **问题**：使用 `useState` + `useEffect` hack 延迟渲染，未就绪时返回 `null`，用户看到空白页面
- **修复建议**：替换为 loading 骨架屏组件

#### H-3：RootWrapper 服务器未就绪时无 loading 状态

- **文件**：`packages/frontend/core/src/desktop/pages/root/index.tsx`
- **行号**：29-45
- **问题**：`cloudEnabled=true` 且 `isServerReady=false` 时返回空，用户看到空白页面
- **修复建议**：添加全局 loading 组件（如 spinner 或骨架屏）

#### H-4：侧边栏 workspace 为 null 时白屏

- **文件**：`packages/frontend/core/src/modules/app-sidebar/views/index.tsx`
- **行号**：519-521
- **问题**：workspace 为 null 时返回 null，无 loading/error 状态
- **修复建议**：添加 workspace loading 状态和错误提示

#### H-5：插件存储配额检查与写入非原子

- **文件**：`packages/frontend/core/src/modules/plugins/runtime/plugin-runtime.ts`
- **行号**：121-134, 373-378
- **问题**：检查配额后到实际写入之间并发调用可能超过配额
- **修复建议**：使用 mutex 或在 setItem 中做原子检查

#### H-6：模板导入失败时资源泄漏

- **文件**：`packages/frontend/core/src/modules/import-template/services/import.ts`
- **行号**：22-42
- **问题**：`ZipTransformer.importDocs` 抛异常时 `disposeWorkspace()` 不会被调用
- **修复建议**：使用 try-finally 确保 dispose

#### H-7：AudioMedia Blob URL 泄漏

- **文件**：`packages/frontend/core/src/modules/media/entities/audio-media.ts`
- **行号**：182
- **问题**：`URL.createObjectURL(blob)` 创建的 URL 在错误路径中未 revoke
- **修复建议**：在 catch/finally 中调用 `URL.revokeObjectURL()`

#### H-8：AudioContext 从未关闭

- **文件**：`packages/frontend/core/src/modules/media/entities/audio-media.ts`
- **行号**：419
- **问题**：`AudioContext` 创建后从未调用 `close()`
- **修复建议**：在 dispose/cleanup 中调用 `audioContext.close()`

---

### 2.3 中等问题（MEDIUM，16 项）

> 影响用户体验和性能，建议排入迭代计划。

#### M-1：懒加载路由缺少独立 Suspense fallback

- **文件**：`packages/frontend/core/src/desktop/router.tsx`
- **行号**：43-206
- **问题**：所有 lazy 路由共享顶层 Suspense，切换页面时看到全局 loading 而非局部 loading
- **修复建议**：为关键路由添加独立 `<Suspense fallback={<PageSkeleton />}>` 包裹

#### M-2：无路由级认证守卫

- **文件**：`packages/frontend/core/src/desktop/router.tsx`
- **行号**：18-209
- **问题**：认证检查在组件级执行，页面先闪现未授权内容再跳转
- **修复建议**：添加 `<AuthGuard>` 高阶路由组件或使用 React Router loader

#### M-3：AllPage 订阅可能重复

- **文件**：`packages/frontend/core/src/desktop/pages/workspace/all-page/all-page.tsx`
- **行号**：234-272
- **问题**：`watchParams` 快速变化时可能同时存在多个订阅
- **修复建议**：使用 `switchMap` 或在 useEffect 中添加取消逻辑

#### M-4：TrashPage 缺少错误边界

- **文件**：`packages/frontend/core/src/desktop/pages/workspace/trash-page.tsx`
- **行号**：74-345
- **修复建议**：包裹 `<ErrorBoundary fallback={<TrashPageError />}>`

#### M-5：侧边栏 style 对象每次渲染重建

- **文件**：`packages/frontend/core/src/components/root-app-sidebar/index.tsx`
- **行号**：243-277
- **修复建议**：提取为 `useMemo` 或 CSS class

#### M-6：状态指示器缺少无障碍属性

- **文件**：`packages/frontend/core/src/components/root-app-sidebar/index.tsx`
- **行号**：268
- **修复建议**：添加 `role="status"` 和 `aria-live="polite"`

#### M-7：通知按钮未 memo 且无错误处理

- **文件**：`packages/frontend/core/src/components/root-app-sidebar/notification-button.tsx`
- **行号**：24-41
- **修复建议**：`memo()` 包裹 + 添加 service 错误处理

#### M-8：创建页面按钮无 try-catch

- **文件**：`packages/frontend/core/src/modules/app-sidebar/views/add-page-button/index.tsx`
- **行号**：88-114
- **问题**：`createPage`、`createEdgeless`、`createDocFromTemplate` 三个操作都无错误处理
- **修复建议**：添加 try-catch + toast 错误提示

#### M-9：快速菜单 menuItems 每次渲染重建

- **文件**：`packages/frontend/core/src/components/quick-menu-panel/index.tsx`
- **行号**：33-125
- **问题**：数组和 handleKeyDown 每次渲染重建，导致事件监听器反复注册
- **修复建议**：`useMemo` 包裹 menuItems

#### M-10：快速菜单面板缺少 ARIA 属性

- **文件**：`packages/frontend/core/src/components/quick-menu-panel/index.tsx`
- **行号**：137
- **修复建议**：添加 `role="menu"`、`aria-label`、`aria-activedescendant`

#### M-11：离线设置 useEffect 异步操作无取消标志

- **文件**：`packages/frontend/core/src/desktop/dialogs/setting/general-setting/offline/index.tsx`
- **行号**：172-187
- **修复建议**：添加 `let cancelled = false` + cleanup

#### M-12：外部存储配置保存前无字段验证

- **文件**：`packages/frontend/core/src/desktop/dialogs/setting/workspace-setting/storage/index.tsx`
- **行号**：421-467
- **问题**：S3/OSS 的 endpoint、bucket、accessKey 等必填字段未验证
- **修复建议**：添加 required 字段验证

#### M-13：快速操作失败不通知用户

- **文件**：`packages/frontend/core/src/components/explorer/docs-view/quick-actions.tsx`
- **行号**：269-283, 333-356
- **问题**：永久删除/恢复操作只 console.error 不 toast
- **修复建议**：添加 toast 错误提示

#### M-14：集合服务操作静默失败

- **文件**：`packages/frontend/core/src/modules/collection/services/collection.ts`
- **行号**：70-78
- **问题**：`addDocToCollection` / `removeDocFromCollection` 在 collection 不存在时静默失败
- **修复建议**：添加 null check + 抛出错误

#### M-15：大文档快照转 base64 无大小限制

- **文件**：`packages/frontend/core/src/modules/plugins/runtime/plugin-runtime.ts`
- **行号**：330-337
- **修复建议**：添加最大大小限制（如 50MB）

#### M-16：Worker 消息处理不验证消息结构

- **文件**：`packages/frontend/core/src/modules/plugins/runtime/plugin-runtime.ts`
- **行号**：239-252
- **修复建议**：验证 message.type 和 message.data 结构

---

### 2.4 低优先问题（LOW，21 项）

> 代码质量和细节优化，可在日常迭代中逐步改进。

| # | 文件 | 问题简述 |
|---|------|---------|
| L-1 | `detail-page.tsx:96-109` | DocScope 未初始化返回 null 无 loading UI |
| L-2 | `router-root.tsx:6-14` | RootRouter 无错误处理 |
| L-3 | `root/index.tsx:39-41` | 服务器配置错误不可见 |
| L-4 | `detail-page-wrapper.tsx:183-257` | useLoadDoc 订阅清理时机 |
| L-5 | `all-page.tsx:102-464` | 缺少错误边界 |
| L-6 | `quick-menu-button.tsx:36` | 缺少 `aria-expanded` |
| L-7 | 多处组件 | 未使用 `memo()` 包裹 |
| L-8 | `add-page-button:90,99` | 生产代码中 console.log |
| L-9 | `appearance/index.tsx:52-57` | useCallback 在 JSX 内定义 |
| L-10 | `storage/index.tsx:368-375` | 条件判断永远为 true（冗余） |
| L-11 | `offline/index.tsx:223-257` | 空依赖数组的潜在过时闭包 |
| L-12 | `app-sidebar/views/index.tsx:286` | `window.location.replace` 硬导航 |
| L-13 | `navigation.tsx:41-45` | 导航失败无 catch |
| L-14 | `notification-button.tsx:26` | 无加载状态 |
| L-15 | `plugin-service.ts:45-57` | `window.__PLUGIN_DEBUG__` 暴露调试 API |
| L-16 | `plugin-runtime.ts:284-325` | Doc 快照出错返回 null 而非 throw |
| L-17 | `audio-media-manager.ts:87` | beforeunload 监听未移除 |
| L-18 | `audio-media-manager.ts:38,170-179` | WeakMap GC 前 disposable 可能未运行 |
| L-19 | `plugin-runtime.ts:51-73` | docId 参数无验证 |
| L-20 | `quick-actions.tsx:158-195` | doc 在 check 和 call 之间可能变 null |
| L-21 | `storage/index.tsx:156-184` | setCloudSyncEnabled 同步异常未 catch |

---

## 三、修复优先级排期建议

### 第一批（立即修复）— 安全和崩溃

| 编号 | 预估工时 | 说明 |
|------|---------|------|
| C-1 ~ C-4 | 2-3 天 | 插件系统安全加固 |
| H-1 ~ H-3 | 0.5 天 | 移动端/桌面端白屏问题 |
| H-4 | 0.5 天 | 侧边栏白屏 |

### 第二批（1-2 周内）— 资源泄漏和用户体验

| 编号 | 预估工时 | 说明 |
|------|---------|------|
| H-5 ~ H-8 | 1 天 | 资源泄漏（AudioContext、Blob URL、模板导入） |
| M-1 ~ M-4 | 1 天 | 错误边界和路由守卫 |
| M-8, M-13, M-14 | 0.5 天 | 操作错误处理 |
| M-12 | 0.5 天 | 表单验证 |

### 第三批（迭代中逐步改进）— 性能和代码质量

| 编号 | 预估工时 | 说明 |
|------|---------|------|
| M-5, M-7, M-9 | 0.5 天 | 性能优化（memo、useMemo） |
| M-6, M-10 | 0.5 天 | 无障碍改进 |
| M-11, M-15, M-16 | 0.5 天 | 安全防护补充 |
| L-1 ~ L-21 | 2-3 天 | 低优先细节逐步修复 |

---

## 四、系统架构参考

```
应用层（7 个平台）
├── Web / Mobile Web / iOS / Android / Electron / Website / Admin
│
核心层（@yunke/core）
├── 路由系统 ─── Desktop Router / Mobile Router / Admin Router
├── 页面（50+）── 工作区 / 文档 / 集合 / 标签 / 社区 / 论坛 / 设置 ...
├── 对话框（30+）── 创建工作区 / 导入 / 登录 / 设置 / 选择器 ...
├── 组件 ─────── 侧边栏 / 工具栏 / 菜单 / 列表 / 属性面板 ...
├── 模块（60+）── workspace / doc / editor / collection / tag / cloud / plugins ...
│
存储层
├── SQLite (WASM) ── 文档数据持久化
├── IndexedDB ────── 离线操作队列 / 键值存储
├── LocalStorage ─── 配置项 / 状态
├── File System API ─ 文件句柄管理
│
同步层
├── Socket.IO ────── 实时通信
├── YJS CRDT ─────── 协作编辑
├── Offline Queue ── 离线操作缓冲
├── Merge Worker ─── 后台文档合并
```

---

## 五、备注

- 本文档中的行号基于 2026-02-06 的代码快照，后续修改可能导致行号偏移
- "已完成修复" 部分的改动已在本地代码中，尚未提交
- 插件系统安全问题（C-1 ~ C-4）建议在上线前完成修复
- 云同步相关问题（provider.tsx 中的 pushDocUpdate 双重保存、syncOfflineOperations 数据竞争等）未列入本文档，待后续单独规划
