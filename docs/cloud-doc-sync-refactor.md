# 云端文档同步修复与改进方案

## 背景概述

在现有的云端同步实现中，前端与后端对文档 ID 的格式解读不一致：

- Blocksuite/nbstore 在前端内部使用短 ID（例如 `db$docProperties`）。
- 通过 `IdConverter` 转换后，会拼接工作区 UUID，变成后端存储使用的长 ID（例如 `db$<workspaceUUID>$docProperties`）。
- 当这些长 ID 再次被前端接收时，由于没有归一化处理，会导致 `DocFrontend` 认为文档“不存在”，从而跳过更新；进一步在后端写入数据库时，ID 也会因为重复拼接而超长，触发 MySQL `Data too long for column 'id'`。

为彻底修复该问题，需要前端、后端共同配合，统一 ID 处理流程，并清理临时调试逻辑。本文档面向对项目不熟悉的同学，完整描述每一步修改的目标、位置与注意事项。

---

## 修改目标总览

1. **前端统一 ID 归一化**：确保所有调度、同步、离线缓存使用相同的 docId。
2. **修正 `IdConverter` 行为**：防止重复向 docId 拼接 workspaceId。
3. **云存储管理器降噪**：删除大段调试输出，并在离线回放时应用归一化。
4. **后端兜底**：接受归一化的 docId，避免错误日志刷屏，同时保留 workspace UUID 校验。
5. **文档化/测试**：为新行为增加测试用例，指导后续开发排查。

---

## 前端改动说明

### 1. 新增 docId 归一化工具
- **位置**：建议在 `packages/common/nbstore/src/utils` 中新建 `doc-id.ts`。
- **函数**：`normalizeDocId(id: string): string`
  - 规则：
    - 非 `$` 分隔的 ID 原样返回。
    - `db$...`：保留前两段（`db$<docId>`），去掉多余的 `spaceId`。
    - `userdata$...`：保留 `userdata$<userId>$<docId>`，去掉中间重复的 spaceId。
- **导出**：单独导出函数供 nbstore、cloud-storage 使用。

### 2. 应用于 `DocFrontend`
- **文件**：`packages/common/nbstore/src/frontend/doc.ts`
- **主要修改点**：
  1. 在 `_connectDoc` 中将 `doc.guid` 同时注册为归一化后的 key（以兼容旧数据）。
  2. `schedule()`：先归一化 job.docId，再入队；必要时克隆 job，避免污染调用方引用。
  3. 主循环 `while(true)`：弹出队列后再归一化一次 docId，重新查询 `jobMap`；如果原始键不存在但归一化后存在，转换后续所有流程。
  4. `jobs.load/apply/save`：统一使用归一化 ID 查询 `status.docs`、`connectedDocs`、`readyDocs` 并与 `storage` 交互。对于从 storage 读取快照，若归一化 ID 未命中，可尝试旧 ID 后再归一化回写。
  5. `applyUpdate()`：在真正调用 `applyUpdate` 前归一化 docId。
  6. 向 `DocFrontend` 内新增 `normalizeDocId` 私有方法，调用刚创建的工具函数。

### 3. 修正 `IdConverter`
- **文件**：`packages/common/nbstore/src/utils/id-converter.ts`
- **逻辑**：
  - 在 `newIdToOldId` 判断开头是否已有 `db$${spaceId}$`/`userdata$${userId}$${spaceId}$`，若有直接返回。
  - 仅在未扩展时调用 `replace`。
  - 对 `userdata$` 使用 `RegExp` 时要 escape `$`。
- **测试**：`packages/common/nbstore/src/utils/__tests__/id-converter.spec.ts` 新增 case：
  - 原始旧 ID 返回自身（无重复拼接）。
  - 普通短 ID 仍能转成预期的长 ID。

### 4. 云存储管理器（Socket 层）
- **文件**：`packages/frontend/apps/web/src/cloud-storage-manager.tsx`
- **需要统一的地方**：
  1. `pushDocUpdate` 调用前对 docId 归一化。发送参数中的 `spaceId` 保持 UUID 不变；日志简化为：发送/响应成功与否、延迟即可。
  2. `saveOfflineOperation`、`syncOfflineOperations`、`processPendingOperations` 等操作时都归一化 ID，避免离线模式积累旧 ID。
  3. 清理大段 emoji 调试输出，保留关键信息和错误提示。
  4. 组件销毁时确保 `socket.disconnect()`，维持现有逻辑即可。

### 5. 触发点排查
- 搜索 `__CLOUD_STORAGE_MANAGER__`，确认其它模块获取 manager 时不再假设 docId 未归一化。如有需要新 helper，可在公共工具里封装 `getCloudStorageManager()` 返回正确实例。

### 6. 前端测试
- **命令**：`yarn vitest --run packages/common/nbstore/src/utils/__tests__/id-converter.spec.ts packages/common/nbstore/src/__tests__/frontend.spec.ts`
- 若当前环境缺少 `@rollup/rollup-linux-x64-gnu`，需先按照仓库 README 补装可选依赖。
- 手动验证：运行本地 dev，创建/编辑文档、刷新页面、离线→上线并同步离线记录，确认：
  - 浏览器控制台不再出现 “文档不在 docs 中” 提示。
  - 网络日志中的 `space:push-doc-update` docId 皆为规范格式。

---

## 后端改动说明

### 1. docId 归一化工具
- **位置**：`com.yunke.backend.storage.impl.WorkspaceDocStorageAdapter`
- **实现**：新增私有方法
  ```java
  private String normalizeDocId(String docId) { ... }
  ```
  - 与前端逻辑保持一致：拆分 `$`，针对 `db` / `userdata` 去除重复空间段。
  - 允许传入 `null`/空字符串时直接返回原值。

### 2. 应用归一化
- 在以下方法开头先 `docId = normalizeDocId(docId);`
  - `pushDocUpdates`
  - `getDocSnapshot`
  - `getDocUpdates`
  - `markUpdatesMerged`
  - `getDocTimestamps`
  - `handleDocMergeRequest`
- 更新日志输出、Repository 调用均使用归一化后的 id。

### 3. 工作空间 ID 校验日志调整
- 仍然保留 `workspaceRepository.existsById` 检查，但把连续的 `logger.error` 改成：
  - `logger.warn` 输出一次“收到未知 workspaceId”。
  - 如需列出数据库中的 workspace，可放在 debug 级别供排障使用。

### 4. Update 序列号优化
- 修改 `getNextSequence()`：使用 `updateRepository.findMaxSeqByWorkspaceIdAndId(...)` 或 `SELECT MAX(seq)`。
- 若 Repository 尚无对应方法，需要增补 `@Query`。

### 5. 相关服务
- `AsyncDocMergeService` 与 `DocStorageService` 保持现状；只要 docId 归一化后，事件触发即可正常工作。

### 6. 后端测试
- 单元测试：为 `normalizeDocId` 编写 JUnit 覆盖 `db$`、`userdata$`、重复空间段等场景。
- 集成测试：启动后端，在 WARN 日志观察是否仍出现 `Data too long for column 'id'` 或 workspace 校验异常。

---

## 协同验证步骤

1. **环境准备**：
   - 前端：`yarn install`，确认依赖齐全。
   - 后端：`mvn clean install`，若需要改动数据库字段，请提前执行迁移脚本。

2. **功能自测**：
   - 同时启动前后端 + yjs-service。
   - 打开同一个文档，分别在两个浏览器窗口里编辑，检查实时协作。
   - 观察后端日志无 workspace 错误、无超长 ID 报错。
   - 断网后编辑、恢复网络，确认离线操作回放成功。

3. **回归**：
   - 检查文档属性（DocProperties）是否仍可读写。
   - 云存储状态页面是否仍能导出日志、展示正确状态。

4. **上线顺序**：
   - 先发布前端，确保其只发出规范 docId。
   - 再部署后端改动，避免老前端请求被新的归一化逻辑吞掉。

---

## 文件清单

- `packages/common/nbstore/src/utils/doc-id.ts`（新增）
- `packages/common/nbstore/src/frontend/doc.ts`
- `packages/common/nbstore/src/utils/id-converter.ts`
- `packages/common/nbstore/src/utils/__tests__/id-converter.spec.ts`
- `packages/frontend/apps/web/src/cloud-storage-manager.tsx`
- `packages/common/nbstore/src/__tests__/frontend.spec.ts`
- `src/main/java/com/yunke/backend/storage/impl/WorkspaceDocStorageAdapter.java`
- `src/main/java/com/yunke/backend/service/DocStorageService.java`
- 若需要，数据库迁移脚本（扩容 `updates.id` 字段）

---

## 说明

- 归一化工具要保持前后端一致，实现任何一方时同步更新另一方。
- 文档中的顺序仅为推荐；实际开发可视情况调整，但务必保证前端改动先上线。
- 如果未来支持更多空间类型，可将归一化规则迁移至共享库，减少重复。

