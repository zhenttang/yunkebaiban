# 聊天面板 UI 与状态管理（功能 + 实现说明）

> 关联上级：`AI功能/聊天与侧边面板.md`  
> 主要代码位置：
> - 聊天面板 Web Component：`packages/frontend/core/src/blocksuite/ai/chat-panel/index.ts`（`ChatPanel`）
> - 消息渲染组件：`chat-panel-messages.ts`、`components/ai-chat-messages/*`
> - 上下文定义：`chat-context.ts`

---

## 1. 界面结构

`ChatPanel` 是一个基于 Lit 的组件，封装了 AI 聊天面板的主要 UI 和状态管理。核心结构包括：

- 面板标题区；
- 消息列表区；
- 建议提示/预置入口；
- 输入区（由其他组件负责，当前文件主要控制消息区与状态）。

### 1.1 标题区域

在 `ChatPanel` 的样式定义中，`.chat-panel-title` 控制标题行：

```ts
static override styles = css`
  chat-panel {
    width: 100%;
    user-select: text;
  }

  .chat-panel-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .chat-panel-title {
    background: var(--yunke-background-primary-color);
    position: relative;
    padding: 8px 0px;
    width: 100%;
    height: 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1;

    .chat-panel-title-text {
      font-size: 14px;
      font-weight: 500;
      color: var(--yunke-text-secondary-color);
    }
  }
  // ...
`;
```

- 标题文字区域可用来显示“YUNKE AI”、“聊天”等说明；
- 右侧可放置快捷入口，如 AI playground 按钮（`.chat-panel-playground`）。

### 1.2 消息列表区域

消息列表由 `chat-panel-messages` 子组件负责渲染，容器类名为 `.chat-panel-messages-container`：

```ts
protected override render() {
  const { messages, status, error } = this.chatContextValue;
  const { isLoading } = this;
  const filteredItems = messages.filter(item => {
    return (
      isChatMessage(item) ||
      (isChatAction(item) && item.messages?.length === 3) ||
      (isChatAction(item) && HISTORY_IMAGE_ACTIONS.includes(item.action) &&
        item.messages?.length === 2)
    );
  });

  const showDownIndicator =
    this.canScrollDown &&
    filteredItems.length > 0 &&
    this.chatContextValue.status !== 'transmitting';

  return html`
    <div
      class="chat-panel-messages-container"
      data-testid="chat-panel-messages-container"
      @scroll=${() => this._debouncedOnScroll()}
    >
      ${filteredItems.length === 0
        ? /* 空列表时的占位 */
          html`<div class="messages-placeholder">
            <!-- 图标 + 文案 “YUNKE AI 正在加载历史记录...” 或 “我能为您做些什么？” -->
          </div>`
        : /* 有消息时由 chat-panel-messages 渲染 */}
      <!-- 这里省略下半部分 -->
    </div>
  `;
}
```

- `filteredItems` 过滤掉不需要展示的内部消息/动作，仅保留：
  - 用户消息；
  - 一定数量的 AI 动作消息（如生成图片/Slides 时的状态）。
- 对于空消息列表：
  - 显示占位 UI 和提示文案（加载或“我能为您做些什么？”）。

### 1.3 下方输入与操作区（概念）

- 输入框与发送按钮由 AI 输入组件（如 `ai-chat-input`）负责，`ChatPanel` 通过属性与事件将输入内容及上下文传递给 AIProvider；
- 在 UI 上通常包括：
  - 文本输入框；
  - 发送按钮；
  - 上下文开关/片段选择器（如“使用当前页面内容”、“仅使用选中文本”等）。

> 输入区具体实现位于其他文件中，这里主要说明消息区与上下文状态的渲染。

---

## 2. 状态管理

聊天面板的核心状态由 `ChatContextValue` 和 Signal/Lit 状态共同管理。

### 2.1 ChatContextValue 结构

`chat-context.ts` 中定义了聊天上下文值：

```ts
export type ChatContextValue = {
  messages: HistoryMessage[];
  status: ChatStatus;
  error: AIError | null;
  // plain-text of the selected content
  quote: string;
  // markdown of the selected content
  markdown: string;
  // images of the selected content or user uploaded
  images: File[];
  abortController: AbortController | null;
};
```

- `messages`：对话历史消息（用户 + AI），用于渲染列表；
- `status`：当前聊天状态（idle / transmitting / error 等），影响加载动画和按钮状态；
- `error`：最近一次请求的错误信息；
- `quote`/`markdown`：选中内容的纯文本和 markdown 版本，用于构造上下文；
- `images`：选中或上传的图片，用于图像相关任务（如 AI 识图、思维导图等）；
- `abortController`：用于中断进行中的 AI 请求。

默认值在 `ChatPanel` 中定义：

```ts
const DEFAULT_CHAT_CONTEXT_VALUE: ChatContextValue = {
  quote: '',
  images: [],
  abortController: null,
  messages: [],
  status: 'idle',
  error: null,
  markdown: '',
};
```

### 2.2 ChatPanel 状态持有与更新

`ChatPanel` 通过属性 `chatContextValue` 接受当前上下文，并通过 `updateContext` 回调更新：

```ts
@property({ attribute: false })
accessor chatContextValue: ChatContextValue = DEFAULT_CHAT_CONTEXT_VALUE;

@property({ attribute: false })
accessor updateContext!: (context: Partial<ChatContextValue>) => void;
```

- 当用户发送消息、收到回复、改变上下文时：
  - 上层容器调用 `updateContext` 更新部分字段；
  - `ChatPanel` 通过 `SignalWatcher`/Lit 响应性机制自动重渲染。

### 2.3 加载状态与错误提示

- 加载状态：
  - 当 `status === 'transmitting'` 或 `isLoading` 为 true 时，
    - 占位文本变为 “YUNKE AI 正在加载历史记录...”；
    - 输入区可禁用发送按钮或显示不同样式。
- 错误状态：
  - `error` 字段非空时，可以在消息列表底部或通过单独区域显示错误提示；
  - 示例：网络错误、超时、模型不可用等。

### 2.4 滚动状态与“返回底部”指示

- `ChatPanel` 内部维护 `canScrollDown` 状态，用于决定是否展示“下滑指示”：

```ts
private readonly _onScroll = () => {
  if (!this.messagesContainer) return;
  const { clientHeight, scrollTop, scrollHeight } = this.messagesContainer;
  this.canScrollDown = scrollHeight - scrollTop - clientHeight > 200;
};

private readonly _debouncedOnScroll = debounce(
  this._onScroll.bind(this),
  100
);
```

- 当用户滚动到历史消息上方时，`canScrollDown` 为 true：
  - 显示一个“回到底部”的按钮；
  - 点击时调用 `scrollToEnd()`，自动滚动到最新消息。

---

## 3. 与 AIProvider 和 feature flag 的关系（概念）

- `ChatPanel` 并不直接调用网络接口，而是依赖 `AIProvider` 和相关 actions：
  - `AIProvider` 接管请求的构建、发送、流式响应处理；
  - `chat-panel/messages` 与 `ai-loading` 等组件负责按情况展示生成过程（如打字效果、加载动画）。
- Feature flag：
  - `ChatPanel` 中有逻辑使用 `FeatureFlagService` 控制是否展示 AI Onboarding（引导卡片）；
  - 示例：`enable_ai_onboarding` 开关用于决定是否在空消息状态下展示“AI 能做什么”的预设提示。

> 综上，聊天面板 UI 由 `ChatPanel` 和 `chat-panel-messages` 负责，状态通过 `ChatContextValue` 与上层容器协同，实际调用则交给 `AIProvider` 和 action 模块。 
