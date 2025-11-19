# BlockSuite 与文档编辑架构（概览）

> 关联目录与模块：
> - BlockSuite 集成入口：`packages/frontend/core/src/blocksuite/*`
> - Store 扩展与配置：`blocksuite/manager/store.ts`、`store-extensions/*`
> - 编辑器封装：`block-suite-editor/*`、`view-extensions/editor-view/*`
> - AI 能力集成：`blocksuite/ai/*`、`store-extensions/ai/*`、`view-extensions/ai/*`

本篇从架构角度概述 Yunke 前端如何集成 BlockSuite 做文档/白板编辑。具体块类型与 AI 功能的细节，可结合功能文档和 AI 架构文档阅读。

---

## 1. BlockSuite 在项目中的角色

### 1.1 BlockSuite 提供的基础能力

BlockSuite 是一个块级文档/白板编辑内核，提供：

- 文档模型：
  - Block Tree（块树结构）；
  - Block 类型（如 `yunke:page`、`yunke:note`、`yunke:paragraph` 等）；
  - Edgeless/Surface 画布块（白板）。
- 编辑能力：
  - 光标与选区管理；
  - 命令系统（command）用于插入/删除/移动块；
  - 历史记录与撤销/重做管理。
- 扩展机制：
  - `StoreExtension`：对存储层进行配置/扩展；
  - `ViewExtension`：对视图层进行扩展（如引用渲染、通知、打开文档等）。

Yunke 在此基础上，用 `core/src/blocksuite` 目录组织了对 BlockSuite 的“项目级集成”。

### 1.2 Yunke 对 BlockSuite 的封装边界

在 Yunke 前端中，BlockSuite 不直接暴露给页面层，而是通过三个主要层次封装：

- Store 配置与扩展层：
  - 统一构建 `StoreExtensionManager`，注册 AI、特性开关等扩展；
  - 初始化文档初始结构（page/note/surface/paragraph 等）。
- 编辑器容器层：
  - 封装 React 组件 `BlockSuiteEditorImpl`，内部用 BlockSuite 提供的 lit-based 编辑器；
  - 提供 `YunkeEditorContainer` 接口给上层调用（如模式切换、属性面板等）。
- View Extension 层：
  - 定制引用渲染、通知、打开文档、侧边栏、文件大小限制、显示 meta 等；
  - 将 Yunke 自己的服务（DocService/WorkspaceService/EditorService 等）注入到 BlockSuite 视图扩展中。

---

## 2. Store 扩展与配置

### 2.1 StoreExtensionManager 与 StoreProvider

BlockSuite 的 store 扩展管理集中在 `blocksuite/manager/store.ts`：

```ts
import { AIStoreExtension } from '@yunke/core/blocksuite/store-extensions/ai';
import type { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { StoreExtensionManager } from '@blocksuite/yunke/ext-loader';
import { getInternalStoreExtensions } from '@blocksuite/yunke/extensions/store';

import { FeatureFlagStoreExtension } from '../store-extensions/feature-flag';

class StoreProvider {
  // ...
  constructor() {
    this._manager = new StoreExtensionManager([
      ...getInternalStoreExtensions(),
      AIStoreExtension,
      FeatureFlagStoreExtension,
    ]);
  }
  // ...
}

export function getStoreManager() {
  return StoreProvider.getInstance();
}
```

- `StoreExtensionManager`：
  - 来自 BlockSuite 的扩展加载器，用于管理一组 Store 扩展；
  - Yunke 在其上额外挂载了：
    - `AIStoreExtension`：AI 相关的 store 扩展；
    - `FeatureFlagStoreExtension`：特性开关扩展。

- StoreProvider：
  - 单例，集中持有一个 `StoreExtensionManager` 实例；
  - 对上层暴露 `getStoreManager().config.init().featureFlag(...)` 等配置链式调用。

### 2.2 Feature Flag 与 AI Store 扩展

- `FeatureFlagStoreExtension`：
  - 与 `FeatureFlagService` 协作，根据特性开关启用/禁用某些 BlockSuite 功能；
  - 例如控制是否启用某些实验性块、快捷功能等。

- `AIStoreExtension`：
  - 为 BlockSuite 的文档 store 注入 AI 相关能力（详见 AI 架构文档）；
  - 提供 AI 面板、AI 命令与选区操作所需的上下文。

> 总体来说，Store 扩展层负责把“项目级配置（AI、特性开关等）”注入 BlockSuite，使得文档 store 在运行时能够访问到这些扩展能力。

---

## 3. 文档初始化与基础结构

### 3.1 initDocFromProps：构建基础文档

`blocksuite/initialization/index.ts` 中提供了构建初始文档结构的工具函数：

```ts
import type { DocCreateOptions } from '@yunke/core/modules/doc/types';
import {
  NoteDisplayMode,
  type NoteProps,
  type ParagraphProps,
  type RootBlockProps,
} from '@blocksuite/yunke/model';
import type { SurfaceBlockProps } from '@blocksuite/yunke/std/gfx';
import { type Store, Text } from '@blocksuite/yunke/store';

export interface DocProps {
  page?: Partial<RootBlockProps>;
  surface?: Partial<SurfaceBlockProps>;
  note?: Partial<NoteProps>;
  paragraph?: Partial<ParagraphProps>;
  onStoreLoad?: (doc: Store, props: { noteId: string; paragraphId: string; surfaceId: string }) => void;
}

export function initDocFromProps(doc: Store, props?: DocProps, options: DocCreateOptions = {}) {
  doc.load(() => {
    const pageBlockId = doc.addBlock(
      'yunke:page',
      props?.page || { title: new Text(options.title || '') }
    );
    const surfaceId = doc.addBlock(
      'yunke:surface' as never,
      props?.surface || {},
      pageBlockId
    );
    const noteBlockId = doc.addBlock(
      'yunke:note',
      { ...props?.note, displayMode: NoteDisplayMode.DocAndEdgeless },
      pageBlockId
    );
    const paragraphBlockId = doc.addBlock(
      'yunke:paragraph',
      props?.paragraph || {},
      noteBlockId
    );
    props?.onStoreLoad?.(doc, { noteId: noteBlockId, paragraphId: paragraphBlockId, surfaceId });
    doc.history.undoManager.clear();
  });
}
```

- 初始化流程：
  - 在 `Store.load` 回调中顺序创建：
    1. `yunke:page` 根块（带 title）；
    2. `yunke:surface` 白板块（Edgeless 画布）；
    3. `yunke:note` 文档块（带 `DocAndEdgeless` 显示模式，支持文档/白板双模式）；
    4. `yunke:paragraph` 段落块作为初始内容。
  - 通过 `onStoreLoad` 回调向调用方暴露相关 block 的 ID；
  - 清理历史记录，避免初始结构被 Undo。

### 3.2 与 DocService 的关系

- 上层 `DocsService` / `DocService` 在创建新文档时，会：
  - 创建一个 BlockSuite `Store` 实例；
  - 调用 `initDocFromProps` 构建基础文档结构；
  - 将文档元信息（标题、模式等）与 Yunke 的 “文档列表/历史/权限” 管理逻辑连接起来。

---

## 4. 编辑器容器与视图扩展

### 4.1 BlockSuiteEditorImpl：编辑器 React 封装

核心编辑器封装位于 `block-suite-editor/blocksuite-editor.tsx`：

- 主要职责：
  - 将 BlockSuite page/edgeless 编辑器（lit 组件）封装为 React 组件；
  - 向上层暴露“编辑器容器接口” `YunkeEditorContainer`；
  - 把特定交互（如空白处点击生成新段落、鼠标中键粘贴开关）与项目设置结合。

关键点示例：

```ts
export interface YunkeEditorContainer extends HTMLElement {
  page: Store;
  doc: Store;
  docTitle: DocTitle;
  host?: EditorHost;
  model: RootBlockModel | null;
  updateComplete: Promise<boolean>;
  mode: DocMode;
  origin: HTMLDivElement;
  std: BlockStdScope;
}
```

`BlockSuiteEditorImpl` 内通过 `Proxy` 构造一个 `YunkeEditorContainer` 对象：

- 将 `page/doc/docTitle/host/model/updateComplete/std` 等 BlockSuite 内部对象包装起来；
- 将不在 API 上的属性/方法透传给底层根 DOM 元素；
- 为上层调用提供统一的“编辑器容器句柄”（例如属性面板、AI 面板需要访问当前文档模式、std 命令等）。

### 4.2 编辑器行为集成

`block-suite-editor/index.ts` 中会注册与编辑器相关的扩展效果：

```ts
import { registerAIEffects } from '@yunke/core/blocksuite/ai/effects';
import { editorEffects } from '@yunke/core/blocksuite/editors';

import { registerTemplates } from './register-templates';

editorEffects();
registerAIEffects();
registerTemplates();

export * from './blocksuite-editor';
```

- `editorEffects()`：
  - 注册与编辑器运行相关的一些全局效果（如快捷键、模式切换、跨文档交互等）；
- `registerAIEffects()`：
  - 注册 AI 相关的编辑器扩展（选中文本 AI 操作、文档内 AI 块、白板 Copilot 等）；
- `registerTemplates()`：
  - 注册默认模板和 starter-bar（新建文档时的模板选择入口）。

### 4.3 Editor View Extension：与应用服务整合

`view-extensions/editor-view/editor-view.tsx` 提供 `YunkeEditorViewExtension`，用于把 Yunke 自己的服务与 BlockSuite 视图层结合：

- 通过 `ViewExtensionProvider` 接入：
  - `DocService` / `DocsService`：文档导航与打开逻辑；
  - `EditorService`：编辑器状态；
  - `WorkspaceService`：当前工作空间上下文；
  - React-to-Lit 渲染桥（`reactToLit`）；
  - 通用确认 Modal（`confirmModal`）。

在 `setup` 中注册一系列 patch：

- `patchReferenceRenderer`：自定义引用渲染，将 BlockSuite 的引用渲染为 `YunkePageReference`/`YunkeSharedPageReference`；
- `patchNotificationService`：接入 Yunke 的通知系统；
- `patchOpenDocExtension`：处理“在新页面打开文档”等操作；
- `patchSideBarService`：控制侧边栏行为；
- `patchDocModeService`：在 doc/doc+edgeless 模式间切换；
- `patchFileSizeLimitExtension`：限制上传文件大小；
- `buildDocDisplayMetaExtension`：展示文档标题、封面等 meta 信息；
- `patchForAudioEmbedView`：为音频块提供自定义视图；
- `patchDocUrlExtensions` / `patchQuickSearchService`：处理文档 URL 和快速搜索能力。

> 这一层确保编辑器不仅仅是一个孤立的 BlockSuite 编辑器，还能与 Yunke 的文档路由、通知、侧边栏、AI 等模块协同工作。

---

## 5. AI 与 BlockSuite 的结合（概览）

> 详细 AI 架构见 `ai-architecture.md` 和功能文档中的 AI 部分，这里只做集成角度的注记。

BlockSuite 的 AI 集成主要通过三个方向实现：

- Store 扩展：
  - `AIStoreExtension` 负责在文档 store 中挂载 AI 所需的状态、配置和事件；
  - 例如 AI 请求队列、上下文打包逻辑等。

- View 扩展：
  - `view-extensions/ai/*` 提供 AI 面板、Peek 视图、Edgeless Copilot 按钮等视图组件；
  - 将 AI 交互入口直接嵌入 BlockSuite 的 UI（如选中文本弹出 AI 菜单）。

- Blocksuite AI 模块：
  - `blocksuite/ai/*` 封装 AI actions、provider、聊天面板等具体逻辑；
  - 与 `@yunke/core/modules/ai` 提供的后端接口协同工作。

---

## 6. 小结与后续扩展

Yunke 的 BlockSuite 集成可以概括为：

- 使用 `StoreExtensionManager` 对 BlockSuite store 做项目级扩展（AI、特性开关）；
- 使用 `initDocFromProps` 等工具构建统一的初始文档结构（page + note + surface + paragraph）；
- 用 `BlockSuiteEditorImpl` 封装 lit 编辑器，并提供 `YunkeEditorContainer` 接口给上层调用；
- 用 `YunkeEditorViewExtension` 将文档编辑与 Yunke 自己的 Doc/Workspace/Notification/AI 服务打通。

后续可在此文档基础上增加更细粒度内容，例如：

- 针对单个块类型（数据库块、AI 块、引用块、白板块）的架构与扩展点分析；
- 与同步/存储架构（`storage-and-sync.md`）的交互方式：如何将 BlockSuite 文档与后端存储、历史版本、权限控制等整合。 

