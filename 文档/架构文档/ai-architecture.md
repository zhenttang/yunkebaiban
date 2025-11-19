# AI 能力架构（前端视角）

> 关联目录与模块：
> - BlockSuite AI 集成：`packages/frontend/core/src/blocksuite/ai/*`
> - AI 面板与消息流：`blocksuite/ai/provider/*`、`blocksuite/ai/chat-panel/*`
> - Edgeless Copilot & 白板：`blocksuite/ai/widgets/edgeless-copilot-*`
> - 文档内 AI 块：`blocksuite/ai/blocks/*`
> - 选中文本/工具栏入口：`blocksuite/ai/entries/*`
>
> 本篇侧重前端架构与模块之间的关系，不详细展开每个功能按钮的细节（这些在功能文档中已经说明）。

---

## 1. 总体设计思路

### 1.1 AI 作为“服务 + UI 扩展”

Yunke 的 AI 能力在前端主要通过两条线接入：

- BlockSuite 侧：
  - 将 AI 视为文档/白板编辑器的“视图扩展 + Store 扩展”；
  - 通过 `AIProvider`、AI 面板组件、AI 块和 Edgeless Copilot 等与 BlockSuite 集成；
  - 提供统一的上下文收集、消息流与结果落地策略。
- 业务模块/服务侧（在其他模块中）：
  - 提供 AI Provider 的“后端代理”（模型选择、鉴权、调用云端 AI 服务）；
  - 暴露给 BlockSuite 的 AI 模块一个统一的调用接口；
  - 在功能文档中体现为“选择模型 / 开关 AI / 调用 AI Provider 提供的 slots”等。

### 1.2 关键模块与职责

`core/src/blocksuite/ai` 目录按功能拆分：

- `provider/*`：
  - `ai-provider`：AIProvider 核心，实现 slots、请求/响应流和状态管理；
  - `copilot-client`：面向后端或云端 Copilot 服务的客户端封装；
  - `setup-provider`：初始化 AIProvider 所需的配置和依赖注入。
- `chat-panel/*`：
  - 聊天面板 UI、消息列表、composer 输入框等；
  - 管理上下文（选中文本/图片）、滚动、快捷操作。
- `blocks/*`：
  - AI 聊天块（`AIChatBlockComponent`）；
  - 转写块（transcription block）等文档内 AI 块。
- `entries/*`：
  - 文本选中菜单、代码工具栏、图片工具栏、Edgeless 入口等；
  - 不同入口根据上下文出现在编辑器不同位置。
- `widgets/*`：
  - `ai-panel`：右侧或底部的 AI 面板；
  - `edgeless-copilot*`：白板 Copilot 工具栏与面板。
- `actions/*` / `tool/*` / `messages/*` / `utils/*`：
  - 把具体 AI 能力（总结、润色、生成图表、Slides 等）包装为 action；
  - 定义消息结构与转换逻辑；
  - 提供工具函数（选区提取、编辑器插入等）。

---

## 2. AIProvider 与消息流

> 相关代码：`blocksuite/ai/provider/*`、`blocksuite/ai/chat-panel/*`

### 2.1 AIProvider 概览

AIProvider 负责在 BlockSuite 编辑器内部提供统一的 AI 请求/响应通道：

- 对外暴露 slots 和事件，例如：
  - `slots.requestSendWithChat`：从聊天面板发起 AI 请求；
  - `slots.requestUpgradePlan`：提示需要升级计划；
  - `slots.requestLogin`：提示需要登录等。
- 对内管理：
  - 当前对话消息列表；
  - 正在生成/错误/空状态；
  - 关联的选区上下文（文本、图片、白板块等）。

在功能文档中提到的“选中文本 AI 菜单 / Edgeless Copilot 按钮 / AI 块”最终都调用 AIProvider 提供的请求通道。

### 2.2 Chat Panel 与上下文管理

`blocksuite/ai/chat-panel/*` 实现一个通用聊天面板：

- UI 结构：
  - 顶部标题栏（模型选择、设置入口等）；
  - 中部消息列表（用户消息 + AI 回复）；
  - 底部输入框（支持多行、快捷插入选中内容等）；
  - 滚动管理（“回到底部”按钮、自动滚动等）。
- 状态管理：
  - 消息数组（包含 role、content、来自哪种入口等信息）；
  - 当前请求状态（idle / loading / error）；
  - 引用内容（quote）和附带的图片。

聊天面板通过上下文对象（例如功能文档中提到的 `ChatContextValue`）暴露当前 AI 会话状态，便于其他组件（AI 块、Peek view、Edgeless Copilot）做同步展示或插入行为。

### 2.3 请求-响应流程（抽象）

从前端角度，典型 AI 调用过程类似：

1. 某个入口（选中文本菜单、Copilot 按钮、AI 块中的“继续生成”）构造请求上下文（选中段落、白板元素、文档片段等）；
2. 调用 AIProvider 的 `slots.requestSendWithChat` 或类似接口，将上下文与用户输入拼成一个 prompt；  
3. AIProvider 将请求发给后端的 Copilot 服务；
4. 收到流式或一次性响应后：
   - 更新聊天面板消息列表；
   - 触发 `page-response` 或 `edgeless-response` 等插入/替换行为；
   - 在需要时触发错误/升级/登录等分支。

> 前端侧的复杂度主要在于“如何收集上下文”和“如何把结果合理地落地到文档/白板中”，而非具体模型调用本身。

---

## 3. 文档内 AI 块与转写块

> 相关代码：`blocksuite/ai/blocks/ai-chat-block/*`、`blocksuite/ai/blocks/transcription-block/*`

### 3.1 AIChatBlockComponent（AI 聊天块）

`ai-chat-block/ai-chat-block.ts` 定义了文档中的 AI 聊天块：

- 继承自 BlockSuite 的 `BlockComponent<AIChatBlockModel>`；
- 使用 `Peekable` 装饰器支持“预览/peek”：
  - 在 PC 非只读模式下可触发 peek 行为；
  - 在移动或 readonly 模式下禁用。
- 内部逻辑：
  - 从 `model.props.messages$` 中读取 JSON 字符串形式的消息列表；
  - 使用 zod 的 `ChatMessagesSchema` 做安全解码；
  - 渲染最近若干条消息作为块内容摘要；
  - 底部展示一个“AI 聊天块”按钮，可作为入口打开 chat panel 或执行后续操作。

AI 聊天块的存在，使得“AI 对话”可以作为文档结构的一部分被保存、分享和历史回溯，而不仅仅存在于临时面板中。

### 3.2 转写块（Transcription Block）

转写块用于展示语音/音频转写的文本：

- 模型层：`ai-transcription-block.ts` / `model` 子目录；
- 特点：
  - 内容以普通文本形式展示，但保留与音频附件的关联；
  - 可在文档中进行编辑、复制或作为 AI 输入上下文。

> 这类“AI 生成 + 可编辑的块”是 AI 与 BlockSuite 结合的典型模式：AI 负责生成初始内容，BlockSuite 提供后续编辑与结构化管理。

---

## 4. Edgeless Copilot 与白板 AI

> 相关代码：`blocksuite/ai/widgets/edgeless-copilot-panel/*`、`blocksuite/ai/tool/copilot-tool` 等

### 4.1 Edgeless Copilot Panel

`widgets/edgeless-copilot-panel/index.ts` 定义了 `EdgelessCopilotPanel`：

- 一个基于 `LitElement` 的面板组件，用于在白板（Edgeless）中展示 AI 项列表；
- 输入属性：
  - `host: EditorHost`：当前编辑器主机；
  - `groups: AIItemGroupConfig[]`：AI 项分组配置；
  - `entry: 'toolbar' | 'selection'`：入口类型（工具栏入口还是选区入口）；
  - `onClick`：点击某个 AI 项后的回调。

内部行为：

- 通过 `ThemeProvider` 获取当前主题（light/dark），并调整面板样式；
- 为了避免对编辑器滚动造成干扰，捕获并阻止 wheel/pointerdown；
- 根据 `AIItemGroupConfig` 中每个 item 的 `showWhen(chain, 'edgeless', host)` 过滤可用 AI 项；
- 将过滤后的分组传给 `<ai-item-list>`，渲染为可点击的 AI 菜单。

### 4.2 Copilot 工具栏入口

`widgets/edgeless-copilot-panel/toolbar-entry.ts` 定义了工具栏入口 `EdgelessCopilotToolbarEntry`：

- 行为：
  - 在 Edgeless 工具栏中渲染一个“询问 AI”按钮（带星星图标）；
  - 点击按钮时：
    - 调用 `this.onClick?.()` 执行外部回调；
    - 调用 `_showCopilotPanel()` 打开 Copilot 面板，并根据当前选区收集元素。

关键逻辑：

```ts
private _showCopilotPanel() {
  const selectedElements = sortEdgelessElements(this._gfx.selection.selectedElements);
  const toBeSelected = new Set(selectedElements);

  selectedElements.forEach(element => {
    if (toBeSelected.has(element)) return;
    toBeSelected.add(element);
    if (isGfxGroupCompatibleModel(element)) {
      element.descendantElements.forEach(descendant => {
        toBeSelected.add(descendant);
      });
    }
  });

  this._gfx.tool.setTool(CopilotTool);
  (this._gfx.tool.currentTool$.peek() as CopilotTool).updateSelectionWith(
    Array.from(toBeSelected),
    10
  );
}
```

- `_gfx` 为 Gfx 控制器，用于管理白板元素和工具；
- `CopilotTool` 作为一个特殊工具：
  - 接管当前选区；
  - 将选中元素作为 AI 输入上下文；
  - 通常会在白板上某个位置弹出 AI 面板，展示生成结果或建议布局。

> Edgeless Copilot 的架构要点在于：通过工具和面板把白板选区转化为 AI 上下文，然后将 AI 结果再以新元素/Note/连接线等形式落回白板。

---

## 5. 入口与动作：actions / entries / tool

> 相关目录：`actions/*`、`entries/*`、`tool/*`

### 5.1 actions：AI 能力包装

`blocksuite/ai/actions/*` 将一个个业务能力（如“总结”“润色”“生成标题”“生成流程图”）抽象为独立的 action：

- 每个 action 知道：
  - 如何从编辑器/选区中提取上下文；
  - 如何构造 AI 请求参数；
  - 如何处理 AI 响应（插入/替换/追加/仅展示 等）。

这使得：

- 不同入口（选中文本菜单、工具栏按钮、快捷键）可以复用同一套 action 逻辑；
- 在架构层面可方便增加/下线某个 AI 能力，而不影响调用方。

### 5.2 entries：不同入口挂载方式

`entries/*` 中的模块把 actions 映射到具体入口，例如：

- `entries/format-bar`：
  - 将“重写/润色/翻译”等文本相关动作挂到格式工具栏；
- `entries/code-toolbar`：
  - 对代码块增加 “解释代码 / 优化代码 / 生成测试” 等 AI 操作；
- `entries/image-toolbar`：
  - 对图片增加 “生成标题/描述”等 AI 操作；
- `entries/edgeless`：
  - 在白板上增加 Edgeless Copilot 入口。

### 5.3 tool：与编辑器工具体系结合

`tool/*` 中的 `CopilotTool` 等封装了与编辑器工具系统的集成方式：

- Copilot 工具负责：
  - 管理 Copilot 面板的打开/关闭；
  - 收集和维护白板选区；
  - 将上下文交给 AIProvider 或 AI Panel；
  - 在结果返回后更新白板元素。

> 通过 actions + entries + tool 的组合，AI 能力从“单一的聊天框”变成了分布在编辑器各个入口的“上下文感知操作”。

---

## 6. 与功能文档的对应关系与扩展方向

### 6.1 对应的功能文档

在功能文档中，已从“使用者视角”详细描述了以下部分：

- `文档/功能文档/AI功能/聊天与侧边面板*`：聊天面板 UI 与状态管理；
- `文档/功能文档/AI功能/文档内AI与块能力*`：AI 块、选中文本 AI 操作菜单；
- `文档/功能文档/AI功能/白板与 Edgeless Copilot*`：白板 Copilot 的入口与布局；
- `文档/功能文档/AI功能/Slides 与结构化生成*`：结构化输出与 Slides 生成。

本篇架构文档从模块/依赖的角度描述了这些功能背后的结构：

- AIProvider 与 chat-panel 是“AI 消息流的中心”；
- blocksuite/ai/blocks/* 与 widgets/* 是“AI 在文档/白板中的可视化和交互层”；
- actions/entries/tool 则负责“把具体 AI 能力挂到各种入口”。

### 6.2 后续可深入的方向

可以在此基础上继续扩展以下架构文档或实现文档：

- 对单个 AI 能力链路的“端到端”说明：
  - 例如“选中文本 → AI 重写 → 插入结果”的完整调用链（入口 → action → AIProvider → 落地规则）；
- AI Provider 与后端 Copilot 服务之间的协议：
  - 模型选择、参数配置、多轮对话上下文管理；
- 白板 Copilot 的布局算法和撤销策略：
  - 如何为生成的节点计算布局、如何与 BlockSuite 的历史/撤销系统对齐。

这些内容可以结合后端文档和更详细的代码分析，在需要时再单独拆分。当前这篇文档的目标是为“AI 功能文档”提供一个一目了然的结构地图。 

