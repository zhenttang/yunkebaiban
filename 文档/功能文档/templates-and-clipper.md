# 模板中心与剪藏集成（功能 + 实现总览）

> 关联前端入口：
> - 桌面路由：`packages/frontend/core/src/desktop/router.tsx`
>   - `/template/import`：模板导入对话框页面
>   - `/template/preview`：模板预览重定向路由
>   - `/clipper/import`：Web Clipper 剪藏导入页面
> - 模块入口：
>   - 模板导入模块：`packages/frontend/core/src/modules/import-template/*`
>   - 剪藏导入模块：`packages/frontend/core/src/modules/import-clipper/*`

---

## 1. 功能定位与整体能力

### 1.1 模板中心（Import Template）

- 主要目标：
  - 提供标准化的页面/白板等模板；
  - 支持从“模板快照 ZIP”导入为真实文档；
  - 支持导入到“现有工作空间”或“新建工作空间”。
- 核心能力：
  - 模板快照下载（`TemplateDownloader` + `TemplateDownloaderStore`）；
  - 模板内容解包并写入指定工作空间（`ImportTemplateService`）；
  - 通过统一对话框引导用户选择目标工作空间并完成跳转。

### 1.2 剪藏集成（Import Clipper）

- 主要目标：
  - 接收来自浏览器扩展或第三方工具发来的剪藏数据；
  - 将剪藏内容（Markdown/HTML、附件等）转换为文档；
  - 支持导入到指定工作空间或自动选择工作空间。
- 核心能力：
  - 从 `window.postMessage` 或 `MessagePort` 接收剪藏 payload；
  - 使用 `MarkdownTransformer` 将 Markdown 内容导入 BlockSuite 文档；
  - 将导入结果通知剪藏来源（扩展）并关闭导入窗口。

---

## 2. 主要路由与调用链

### 2.1 模板导入路由

- `/template/import`：
  - 路由定义：`packages/frontend/core/src/desktop/router.tsx:84`
  - 懒加载页面组件：`./pages/import-template`
  - 常见入口：
    - 分享页右上角“使用此模板”按钮 → `ImportTemplateButton` → `jumpToImportTemplate`；
    - URL 形式：`/template/import?name={模板名}&snapshotUrl={快照地址}`。
- `/template/preview`：
  - 用于将“模板预览链接”跳转回某个 workspace/page：

```ts
{
  path: '/template/preview',
  loader: ({ request }) => {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');
    const docId = url.searchParams.get('docId');
    const templateName = url.searchParams.get('name');
    const templateMode = url.searchParams.get('mode');
    const snapshotUrl = url.searchParams.get('snapshotUrl');

    return redirect(
      `/workspace/${workspaceId}/${docId}?${new URLSearchParams({
        isTemplate: 'true',
        templateName: templateName ?? '',
        snapshotUrl: snapshotUrl ?? '',
        mode: templateMode ?? 'page',
      }).toString()}`
    );
  },
}
```

- 行为说明：
  - 根据 `workspaceId` + `docId` 跳转到目标文档；
  - 通过查询参数告诉页面“当前是模板预览模式”，便于上层 UI 决定是否展示“使用此模板”等操作。

### 2.2 剪藏导入路由

- `/clipper/import`：
  - 路由定义：`packages/frontend/core/src/desktop/router.tsx:36`
  - 懒加载页面组件：`./pages/import-clipper`
  - 被 Chrome/浏览器扩展等当作“回调页面”打开，用于接收剪藏数据并导入。

---

## 3. 模块拆分与文档结构

### 3.1 模板中心模块文档

- 入口：`文档/功能文档/模板与剪藏/模板中心.md`
- 子文档：
  - `模板列表与分类.md`：从“列表体验”的角度描述模板列表页；
  - `模板预览与导入流程.md`：重点说明 `/template/import` 页面与 `ImportTemplateDialog` 的交互。
- 对应代码模块：
  - 模板导入服务：`packages/frontend/core/src/modules/import-template/services/import.ts`
  - 模板下载：
    - `packages/frontend/core/src/modules/import-template/entities/downloader.ts`
    - `packages/frontend/core/src/modules/import-template/store/downloader.ts`
  - 导入对话框：`packages/frontend/core/src/desktop/dialogs/import-template/index.tsx`
  - 导航入口按钮：`packages/frontend/core/src/components/cloud/share-header-right-item/import-template.tsx`

### 3.2 剪藏集成模块文档

- 入口：`文档/功能文档/模板与剪藏/剪藏集成.md`
- 子文档：
  - `剪藏入口与参数.md`：说明 `/clipper/import`、消息通道与剪藏 payload 结构；
  - `剪藏内容解析与落地策略.md`：说明 `ImportClipperService` 如何将剪藏内容落地为文档。
- 对应代码模块：
  - 剪藏导入服务：`packages/frontend/core/src/modules/import-clipper/services/import.ts`
  - 剪藏导入页面：`packages/frontend/core/src/desktop/pages/import-clipper/index.tsx`
  - 工作空间设置中的 Web Clipper 集成说明：  
    `packages/frontend/core/src/desktop/dialogs/setting/workspace-setting/integration/constants.tsx`

---

后续每个子文档会按照“功能说明 + 关键代码路径 + 调用链”逐层展开：  
- 模板中心部分，重点描述模板快照下载、导入到现有/新建工作空间的完整流程；  
- 剪藏部分，重点描述剪藏数据结构、消息通道、Markdown 导入以及与工作空间选择策略的关系。 

