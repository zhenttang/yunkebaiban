# AI 实现细节（前端）

> 关联架构文档：`文档/架构文档/ai-architecture.md`  
> 关联功能文档：`文档/功能文档/AI功能/*`  
> 本文聚焦“从入口到结果落地”的关键实现细节：AIProvider、chat panel、选区上下文和插入逻辑。

---

## 1. AIProvider：统一的 AI 动作与事件总线

### 1.1 核心类与静态访问

- 文件：`packages/frontend/core/src/blocksuite/ai/provider/ai-provider.ts`

`AIProvider` 是整个 BlockSuite AI 系统的核心入口，采用单例 + 静态访问模式：

```ts
export class AIProvider {
  private static readonly instance = new AIProvider();

  static get slots() {
    return AIProvider.instance.slots;
  }
  static get actions() {
    return AIProvider.instance.actions;
  }
  static get userInfo() {
    return AIProvider.instance.userInfoFn();
  }
  // ... photoEngine / histories / session / context / actionHistory 等
}
```

- 设计要点：
  - 通过静态 getter，将内部实例的属性暴露为全局单例；
  - 外部模块（entries、widgets、actions 等）不需要关心实例化方式；
  - 后续如需拆分多个 Provider（不同 workspace 或不同文档），可以在内部实现中调整，而不影响调用方接口。

### 1.2 slots：AI 事件流（RxJS Subject）

`AIProvider` 内部定义了一个 `slots` 对象，用于承载各类事件流：

```ts
private readonly slots = {
  /* eslint-disable rxjs/finnish */
  requestSendWithChat: new Subject<AISendParams>(),
  requestUpgradePlan: new Subject<AIChatParams>(),
  requestLogin: new Subject<AIChatParams>(),
  actions: new Subject<{
    action: keyof BlockSuitePresets.AIActions;
    options: BlockSuitePresets.AITextActionOptions;
    event: ActionEventType;
  }>(),
  userInfo: new Subject<AIUserInfo | null>(),
  /* eslint-enable rxjs/finnish */
};
```

- 关键流：
  - `requestSendWithChat`：
    - 从聊天面板或入口触发，承载一次 AI 请求（`host + input + context`）；
  - `actions`：
    - 在 AI action 执行前后或发生错误时广播事件（`started/finished/error/...`）；
  - `requestUpgradePlan` / `requestLogin`：
    - 标记需要升级套餐或登录，通常由 UI 层订阅并弹出提示；
  - `userInfo`：
    - 当用户信息更新时可触发，以便 AI 模块记录/使用。

### 1.3 provideAction：统一的 Action 包装

`AIProvider` 通过 `provideAction` 将具体 AI 能力实现包装成统一的 action，并自动发出事件流：

```ts
private provideAction<T extends keyof BlockSuitePresets.AIActions>(
  id: T,
  action: (...options: Parameters<BlockSuitePresets.AIActions[T]>) =>
    Promise<ReturnType<BlockSuitePresets.AIActions[T]>>
): void {
  this.actions[id] = async (...args) => {
    const options = args[0];
    const slots = this.slots;
    slots.actions.next({ action: id, options, event: 'started' });
    this.actionHistory.push({ action: id, options });
    // ...
    const result: BlockSuitePresets.TextStream | Promise<string> =
      await action(...args);
    const isTextStream = (m: ...) => Reflect.has(m, Symbol.asyncIterator);

    if (isTextStream(result)) {
      return {
        [Symbol.asyncIterator]: async function* () {
          let user = null;
          try {
            user = await AIProvider.userInfo;
            yield* result;
            slots.actions.next({ action: id, options, event: 'finished' });
          } catch (err) {
            slots.actions.next({ action: id, options, event: 'error' });
            // 根据错误类型发出 aborted:* 事件，并 captureException
            // ...
            throw err;
          }
        },
      };
    } else {
      // 非流式结果，完成后发出 finished / error 事件
    }
  };
}
```

- 实现细节：
  - 所有 AI textual actions（如总结/润色/翻译等）在真实实现外层统一包了一层：
    - 在开始/结束/错误时向 `slots.actions` 推送事件；
    - 将最近若干次 action 记录到 `actionHistory` 中；
    - 自动区分流式结果（TextStream）和一次性字符串。
  - 错误处理：
    - 根据错误类型发出不同 `ActionEventType`：
      - `RequestTimeoutError` → `'aborted:timeout'`；
      - `PaymentRequiredError` → `'aborted:paywall'`；
      - `UnauthorizedError` → `'aborted:login-required'`；
      - 其他错误 → `'aborted:server-error'`；
    - 使用 `captureException` 将错误上报，并附加 action id 和 sessionId 等上下文信息。

> 功能文档中提到的“记录 action 结果、展示不同错误提示”等，都是基于这套统一的事件流实现的。

---

## 2. Chat Context：AI 上下文结构

### 2.1 ChatContextValue 类型

- 文件：`blocksuite/ai/chat-panel/chat-context.ts`

```ts
export type ChatContextValue = {
  messages: HistoryMessage[];
  status: ChatStatus;
  error: AIError | null;
  quote: string;          // 选中内容的 plain-text
  markdown: string;       // 选中内容的 markdown
  images: File[];         // 选中内容/用户上传的图片
  abortController: AbortController | null;
};
```

- 字段说明：
  - `messages`：
    - 聊天历史，包括用户消息与 AI 回复；
    - 用于在面板中渲染和后续补充上下文；
  - `status`：
    - 聊天状态（空闲/加载/错误等）；
  - `quote` / `markdown`：
    - 当前选中内容的纯文本与 Markdown 版本（由 selection-utils 提取）；
  - `images`：
    - 当前选区中包含或用户附加的图片列表；
  - `abortController`：
    - 用于取消当前的 AI 请求（例如用户点击“停止生成”）。

### 2.2 与 UI 和 AIProvider 的关系

- 聊天面板 UI 负责维护 `ChatContextValue` 实例并通过 React context 或 props 向各子组件传递；
- 当用户点击“发送”时：
  - 会基于 `ChatContextValue` 中的 quote/markdown/images 构造一个 `AISendParams`；
  - 调用 `AIProvider.slots.requestSendWithChat.next({...})`；
  - 监听结果流更新 `messages/status/error` 等。

---

## 3. 选区上下文提取：selection-utils

> 文件：`blocksuite/ai/utils/selection-utils.ts`

### 3.1 针对白板（Edgeless）的上下文

文件中有多种针对白板选区的处理逻辑，例如：

- `selectedToCanvas(host)` / `allToCanvas(host)`：
  - 使用 `GfxControllerIdentifier` 获取当前白板选区或所有元素；
  - 调用 `EdgelessClipboardController.toCanvas` 将选择元素渲染为一个 Canvas；
  - 结果可用于生成图片或作为 AI 输入。

```ts
export async function selectedToCanvas(host: EditorHost) {
  const gfx = host.std.get(GfxControllerIdentifier);
  return elementsToCanvas(host, gfx.selection.selectedElements);
}
```

- `elementsToCanvas(host, elements)`：
  - 通过 `splitElements` 将选区拆分为 notes/frames/shapes/images 等；
  - 过滤出可以渲染到画布上的元素；
  - 调用 `EdgelessClipboardController.toCanvas` 生成 Canvas；
  - 失败时在控制台打印错误信息。

### 3.2 文本 / 块层面的选区提取

`getTextContentFromBlockModels` 是文本上下文提取的关键函数：

```ts
export async function getTextContentFromBlockModels(
  editorHost: EditorHost,
  models: BlockModel[],
  type: 'markdown' | 'plain-text' = 'markdown'
) {
  // 过滤出文本块（排除图片/数据库等）
  const selectedTextModels = models.filter(/* ... */);
  // 构造 Slice，并调用 getContentFromSlice 生成 markdown 或 plain-text
}
```

- 实现要点：
  - 对选中块模型进行过滤，只保留可转文本的块（例如 paragraph、heading 等）；
  - 使用 BlockSuite 的 Slice 类型组合选中内容；
  - 调用 `getContentFromSlice` 将其转换为 Markdown 或纯文本；
  - 最终结果可填入 `ChatContextValue.quote/markdown`，用于 AI 请求上下文。

> 功能文档中提到“选中一段文本后，AI 菜单可以看到这段上下文并进行重写/翻译”等，就是通过 selection-utils 的这些方法实现上下文提取的。

---

## 4. 结果落地：page-response 与 AI Panel

> 文件：`blocksuite/ai/actions/page-response.ts`、`blocksuite/ai/widgets/ai-panel/ai-panel.ts`

### 4.1 Page Response：落地到文档

`page-response.ts` 中定义了多种“如何将 AI 结果落地到文档”的策略，例如：

- `replaceWithMarkdown(host)`：
  - 从 AI Panel 中获取 `answer`；
  - 调用 `getSelections(host)` 获取当前文本选区和选中的块；
  - 调用内部的 `replace` 函数，将选区内容替换为 AI 生成的 Markdown；
- `insertMarkdownBelow(host)` / `insertMarkdownAbove(host)`：
  - 将 AI 结果插入到当前块下方/上方；
- 其他响应类型（创建白板元素、创建 Slides 等）：
  - 解析结构化结果，循环生成 BlockSuite 块或白板节点；
  - 更新选区/视图以让用户看到新创建的内容。

关键的 getSelection 辅助函数：

```ts
function getSelection(host: EditorHost) {
  const textSelection = host.selection.find(TextSelection);
  const mode = textSelection ? 'flat' : 'highest';
  const { selectedBlocks } = getSelections(host, mode);
  if (!selectedBlocks) return;
  const length = selectedBlocks.length;
  const firstBlock = selectedBlocks[0];
  const lastBlock = selectedBlocks[length - 1];
  const selectedModels = selectedBlocks.map(block => block.model);
  return {
    textSelection,
    selectedModels,
    firstBlock,
    lastBlock,
  };
}
```

- 说明：
  - 若存在文本选区，则以平铺模式（flat）选取；
  - 否则按 highest 模式获取包含整个选区的块集合；
  - 返回首尾块 + 所有模型，为 replace/insert 等操作提供上下文。

### 4.2 YunkeAIPanelWidget：AI Panel 的状态与交互

- 文件：`blocksuite/ai/widgets/ai-panel/ai-panel.ts`

`YunkeAIPanelWidget` 是 AI 面板的具体 UI 实现，继承自 BlockSuite 的 `WidgetComponent`：

- 内部状态：
  - `state`：`'hidden' | 'input' | 'generating' | 'finished' | 'error'`；
  - `_answer`：当前 AI 回复文本；
  - `_abortController`：用于取消当前请求；
  - `_selection`：打开面板前保存的选区，以便收起/关闭时恢复。

- `generate()` 方法：

```ts
generate = () => {
  this.restoreSelection();

  const text = this._inputText;
  if (!this.config?.generateAnswer) throw new Error('generateAnswer 未找到');

  this._resetAbortController();
  this._answer = null;

  const update = (answer: string) => {
    this._answer = answer;
    this.requestUpdate();
  };
  const finish = (type: 'success' | 'error' | 'aborted', err?: AIError) => {
    if (type === 'aborted') return;
    if (!this.config) throw new Error('完成时配置未找到');
    if (type === 'error') {
      this.state = 'error';
      this.config.errorStateConfig.error = err;
    } else {
      this.state = 'finished';
      this.config.errorStateConfig.error = undefined;
    }
    this._resetAbortController();
  };

  this.scrollTop = 0;
  this.state = 'generating';
  this.config.generateAnswer({
    input: text,
    update,
    finish,
    signal: this._abortController.signal,
  });
};
```

- 实现细节：
  - `generateAnswer` 由调用方通过 `YunkeAIPanelWidgetConfig` 注入，内部一般会调用 AIProvider 的对应 action；
  - `update` 用于流式更新 `_answer` 并触发 re-render；
  - `finish` 判断请求结果状态，切换 `state` 为 `'finished'` 或 `'error'`，并重置 abortController；
  - Esc 按键处理：
    - 在 `state === 'generating'` 时 Esc 表示停止生成；
    - 在 `state === 'input'` 时 Esc 表示关闭面板。

---

## 5. 小结：从入口到落地的完整链路

结合本篇实现细节与 `ai-architecture.md`，可以将一次典型的 AI 调用总结为：

1. **入口**：用户在某个入口触发（选中文本菜单、Edgeless Copilot 按钮、AI 块按钮等）。  
2. **上下文提取**：
   - 使用 `selection-utils` 之类工具从 BlockSuite 编辑器中获取选中文本/块/白板元素；
   - 将结果填入 `ChatContextValue`（`quote/markdown/images`）。  
3. **请求发起**：
   - 聊天面板或 AI Panel 调用 `AIProvider.slots.requestSendWithChat.next({...})` 或某个 action；
   - AIProvider 使用 `provideAction` 包装 action，发出 `slots.actions` 事件，并调用后端 Copilot 服务。  
4. **响应处理**：
   - 流式或一次性结果通过 `update` 回调写入 panel（`_answer` 或 chat messages），驱动 UI 更新；
   - 出错或需要登录/升级时，AIProvider 发出对应的异常事件，UI 订阅后弹出提示。  
5. **结果落地**：
   - 根据 action 类型调用 `page-response` 或 Edgeless response 函数，将结果插入/替换到 BlockSuite 文档或白板；  
   - AI 块可以持久化对话记录；白板 Copilot 可以生成新的 Note/Frame/元素。  

前端实现中，AI 和 BlockSuite 深度整合，但通过 AIProvider、ChatContext、selection-utils 和 response 系列函数形成了清晰的边界：入口只负责收集上下文和调用 action，不需要感知后端细节；落地点只关心如何在编辑器中改动文档。  

需要更深层分析时，可以围绕某一个具体能力（如“生成 Slides”或“白板 Copilot 布局”）继续按同样方式拆出一条更细的调用链。 

