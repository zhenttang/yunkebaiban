# AI 块类型细节（功能 + 实现说明）

> 关联上级：`AI功能/文档内AI与块能力.md`  
> 主要代码位置：
> - AI 聊天块：`packages/frontend/core/src/blocksuite/ai/blocks/ai-chat-block/ai-chat-block.ts` + `model/*`
> - 转写块：`ai-transcription-block.ts` + `blocks/transcription-block/model.ts`

---

## 1. AI 聊天块（AIChatBlock）

### 1.1 功能概述

- 在文档中以“块”的形式嵌入 AI 对话：
  - 块内展示最近几轮会话消息（例如最后两条）；
  - 可以在块内继续对话或查看历史；
  - 适合用来记录与 AI 的讨论过程、草稿推演等。

### 1.2 组件实现：`AIChatBlockComponent`

- 代码片段（简化）：

```ts
@Peekable({
  enableOn: ({ store }: AIChatBlockComponent) => {
    // 移动端和只读模式下禁用
    return !BUILD_CONFIG.isMobileEdition && !store.readonly;
  },
})
export class AIChatBlockComponent extends BlockComponent<AIChatBlockModel> {
  static override styles = AIChatBlockStyles;

  private _textRendererOptions: TextRendererOptions = {};

  private readonly _deserializeChatMessages = computed(() => {
    const messages = this.model.props.messages$.value;
    try {
      const result = ChatMessagesSchema.safeParse(JSON.parse(messages));
      return result.success ? result.data : [];
    } catch {
      return [];
    }
  });

  override connectedCallback() {
    super.connectedCallback();
    this._textRendererOptions = {
      customHeading: true,
      extensions: this.previewExtensions,
    };
  }

  override renderBlock() {
    const messages = this._deserializeChatMessages.value.slice(-2);

    return html`<div class="yunke-ai-chat-block-container">
      <div class="ai-chat-messages-container">
        <ai-chat-messages
          .host=${this.host}
          .messages=${messages}
          .textRendererOptions=${this._textRendererOptions}
          .withMask=${true}
        ></ai-chat-messages>
      </div>
      <div class="ai-chat-block-button">
        ${ChatWithAIIcon} <span>AI 聊天块</span>
      </div>
    </div>`;
  }

  get previewExtensions() {
    return this.std.get(ViewExtensionManagerIdentifier).get('preview-page');
  }
}
```

### 1.3 数据与显示逻辑

- `AIChatBlockModel` 的 `props.messages$` 字段保存了聊天记录（序列化为 JSON 字符串）；
- 通过 `ChatMessagesSchema` 进行安全解析，得到 `HistoryMessage[]`；
- 在块中只展示最近几条消息（例如 `slice(-2)`），避免块内部过长：
  - 完整历史仍由上下文/独立面板管理；
  - 块主要作为“这段对话”的摘要和入口。

### 1.4 交互与 Peek 行为

- `@Peekable` 装饰器允许在满足条件时通过 Peek 功能查看更详细内容：
  - 在桌面端、非只读模式下启用；
  - 用户可以在块上触发 Peek（例如鼠标悬停/点击）查看完整 AI 对话；
- 块下方的“AI 聊天块”按钮可作为入口：
  - 点击后跳转到侧边 AI 面板或打开更完整的聊天视图；
  - 具体行为由外层集成决定。

---

## 2. 转写块（TranscriptionBlock）

### 2.1 功能概述

- 转写块用于展示语音转文本的结果：
  - 与某个音频资源绑定；
  - 显示分段文本、时间轴等（视实现）；
  - 支持在文档内选中和编辑转写结果。

### 2.2 组件实现：`LitTranscriptionBlock`

- 核心代码片段：

```ts
export class LitTranscriptionBlock extends BlockComponent<TranscriptionBlockModel> {
  static override styles = [
    css`
      transcription-block {
        outline: none;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
    `,
  ];

  override render() {
    return this.std.host.renderChildren(this.model);
  }

  @property({ type: String, attribute: 'data-block-id' })
  override accessor blockId!: string;

  constructor() {
    super();
    this.widgets = {};
    // 允许跨段落文本选择
    this.contentEditable = 'true';
  }

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    this.disposables.addFromEvent(this, 'click', this.onClick);
  }

  protected onClick(event: MouseEvent) {
    event.stopPropagation();
  }
}

export const AITranscriptionBlockSpec: ExtensionType[] = [
  BlockViewExtension('yunke:transcription', () => {
    return literal`transcription-block`;
  }),
];
```

### 2.3 行为说明

- `BlockViewExtension('yunke:transcription', ...)` 注册了转写块的视图扩展：
  - 让 `'yunke:transcription'` 类型的块渲染为 `<transcription-block>`；
  - 块内部通过 `renderChildren(this.model)` 渲染具体转写内容（如逐句文本、时间戳等）。
- 交互特性：
  - 设置 `contentEditable = 'true'` 允许用户在转写块中选择、复制文本；
  - 点击事件 `onClick` 会阻止事件冒泡，避免影响周围块的选中状态；
  - 可以与 AI 功能结合，例如：
    - 对选中的转写片段进行总结；
    - 纠错/润色转写结果。

### 2.4 音频绑定（概念）

- 虽然当前片段未展示音频绑定逻辑，但通常 TranscriptionBlockModel 会包含：
  - 音频文件标识；
  - 每段文本对应的时间区间；
  - 允许未来在音频播放器与转写文本之间做“跳转到对应时间”的联动。

> 总体上，AI 聊天块和转写块提供了两种典型的“文档内 AI 容器”：一个用于对话，一个用于语音转文字。它们都基于 BlockSuite 的 BlockComponent 和 ViewExtension 机制集成到文档结构中。 
