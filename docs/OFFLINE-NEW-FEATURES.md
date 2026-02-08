# 离线场景新功能实施计划

> 创建日期：2026-02-08
> 状态：实施中

---

## 第一阶段：核心离线体验补齐（1-2 周）

### 1. 嵌入块离线占位符
- **现状**：YouTube/Figma/iframe 嵌入块离线时直接报错或空白
- **目标**：显示标题 + 图标 + 「需要网络连接」提示
- **文件**：`embed-youtube-block.ts`、`embed-figma-block.ts`、`embed-iframe-block.ts`
- **状态**：✅ 已实现（2026-02-08）

### 2. 离线功能降级提示系统
- **现状**：AI/社区/论坛等功能离线时直接报错
- **目标**：统一的「此功能需要网络连接」提示 + 功能可用性标识
- **文件**：`packages/frontend/core/src/components/hooks/use-offline-guard.tsx`
- **状态**：✅ 已实现（2026-02-08）— `useOfflineGuard` Hook + `checkOnlineOrToast` 工具函数

### 3. 文档级同步状态指示
- **现状**：只有工作区级别的连接状态
- **目标**：每个文档显示 ✅已同步 / 🔄同步中 / ⏳待上传 / ❌失败 状态
- **文件**：`packages/frontend/core/src/components/hooks/use-doc-sync-status.ts`
- **状态**：✅ 已实现（2026-02-08）— `useDocSyncStatus` Hook，基于 nbstore DocFrontend.docState$

### 4. 本地存储管理 UI
- **现状**：配额 UI 只针对云端
- **目标**：显示本地 IndexedDB/SQLite 占用量、进度条、缓存清理
- **文件**：`offline/index.tsx` — `LocalStorageManagement` 组件
- **状态**：✅ 已实现（2026-02-08）— storage.estimate + 进度条 + Service Worker 缓存清理

## 第二阶段：离线→在线过渡优化（2-3 周）

### 5. 冲突可视化对比工具
- **现状**：Yjs 自动合并，无法查看差异
- **目标**：检测到冲突时弹出对比界面，支持手动选择
- **状态**：⬜ 待实现

### 6. 离线分享（导出 + QR 码）
- **现状**：分享依赖云端
- **目标**：导出文档后生成 QR 码供扫码获取
- **状态**：⬜ 待实现

### 7. 选择性同步
- **现状**：全量同步
- **目标**：用户可选择哪些工作区离线缓存
- **状态**：⬜ 待实现

## 第三阶段：高级离线能力（长期）

### 8. 局域网 P2P 协作
### 9. 跨设备同步可视化
### 10. 离线 AI（WebLLM）
### 11. 渐进式数据加载

---

## 实施记录

| 日期 | 功能 | 状态 | 修改/新建文件 |
|------|------|------|---------|
| 2026-02-08 | 嵌入块离线占位符 | ✅ | embed-youtube-block.ts, embed-figma-block.ts, embed-iframe-block.ts |
| 2026-02-08 | 离线功能降级提示 | ✅ | 新建 use-offline-guard.tsx |
| 2026-02-08 | 文档级同步状态 | ✅ | 新建 use-doc-sync-status.ts |
| 2026-02-08 | 本地存储管理 UI | ✅ | offline/index.tsx (LocalStorageManagement 组件) |
