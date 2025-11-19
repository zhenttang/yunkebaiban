# Copilot 入口与触发方式（功能 + 实现说明）

> 关联上级：`AI功能/白板与 Edgeless Copilot.md`  
> 主要代码位置：
> - Edgeless Copilot 小部件：`packages/frontend/core/src/blocksuite/ai/widgets/edgeless-copilot/index.ts`（`EdgelessCopilotWidget`）
> - Copilot 面板：`widgets/edgeless-copilot-panel/index.ts`（`EdgelessCopilotPanel`）
> - AI 面板入口：`widgets/ai-panel/*`

---

## 1. 入口位置与形态

### 1.1 白板选区上的 Copilot 入口

`EdgelessCopilotWidget` 会在 edgeless（白板）模式下监听当前选区，当用户选择一段内容时，在选区周围展示 Copilot 入口：

- 选区矩形可视化：

```ts
export class EdgelessCopilotWidget extends WidgetComponent<RootBlockModel> {
  static override styles = css`
    .copilot-selection-rect {
      position: absolute;
      box-sizing: border-box;
      border-radius: 4px;
      border: 2px dashed var(--yunke-brand-color, #1e96eb);
    }
  `;
  // ...
}
```

- 说明：
  - 当白板上有选中的节点/区域时，会绘制一个虚线矩形标记选区；
  - Copilot 面板会相对于这个选区矩形进行定位；
  - 用户可通过选区处的入口（例如图标按钮）唤起 Copilot 面板。

### 1.2 工具栏入口（概念）

除了选区入口，还可在白板工具栏中集成 Copilot 按钮：

- “Copilot” 或 “AI 帮我画/布局”按钮；
- 点击后：
  - 若当前有选区，以选区为上下文；
  - 若无选区，则以整张白板或当前视图为上下文。

> 工具栏入口具体代码在其他 whiteboard 工具配置中，这里侧重 EdgelessCopilotWidget 和 Panel 的行为。

---

## 2. 触发流程与 AI 输入

### 2.1 显示 AI 输入面板

在 `EdgelessCopilotWidget` 中，`_showCopilotInput` 方法负责唤起 AI 输入面板，并与 Copilot 面板联动：

```ts
private _showCopilotInput() {
  requestConnectedFrame(() => {
    const referenceElement = this.selectionElem;
    if (!referenceElement || !referenceElement.isConnected) return;

    const rootBlockId = this.host.store.root?.id;
    if (!rootBlockId) return;

    const input = this.host.view.getWidget(
      YUNKE_AI_PANEL_WIDGET,
      rootBlockId
    );

    if (input instanceof YunkeAIPanelWidget) {
      input.setState('input', referenceElement);
      const aiPanel = input;
      if (aiPanel.config && !aiPanel.config.generateAnswer) {
        aiPanel.config.generateAnswer = ({ finish, input }) => {
          finish('success');
          aiPanel.hide();
          extractSelectedContent(this.host)
            .then(context => {
              AIProvider.slots.requestSendWithChat.next({
                input,
                context,
                host: this.host,
              });
            })
            .catch(console.error);
        };
        aiPanel.config.inputCallback = text => {
          const panel = this.shadowRoot?.querySelector(
            'edgeless-copilot-panel'
          );
          if (panel instanceof HTMLElement) {
            panel.style.visibility = text ? 'hidden' : 'visible';
          }
        };
      }
      requestAnimationFrame(() => {
        this._createCopilotPanel();
        this._updateCopilotPanel(input);
      });
    }
  });
}
```

流程说明：

1. 计算白板选区对应的 DOM 元素 `selectionElem`；
2. 获取白板对应的 AI 面板 widget（`YUNKE_AI_PANEL_WIDGET` → `YunkeAIPanelWidget`）；
3. 将选区元素传入 AI 面板作为定位参考；
4. 配置 `generateAnswer`：
   - 用户在 AI 输入框中输入指令后；
   - 关闭 AI 输入面板；
   - 调用 `extractSelectedContent(this.host)` 提取选中区域的上下文；
   - 通过 `AIProvider.slots.requestSendWithChat` 触发带上下文的 AI 请求；
5. 通过 `_createCopilotPanel` 和 `_updateCopilotPanel` 创建并定位 Copilot 操作面板。

### 2.2 自然语言指令与上下文

- 用户输入的自然语言指令（如“帮我把选中的节点组织成流程图”）作为 `input` 传入；
- `extractSelectedContent` 将当前白板选区转换为 AI 可理解的上下文（包含节点文字、结构等）；
- 组合后送入 AIProvider，得到结构化响应，再由响应解析模块生成白板上的新内容或布局调整。

### 2.3 基于当前白板内容的智能调整

- 当没有选区，或用户选择“基于整个白板调整布局”时：
  - Copilot 可以基于当前画布中的所有节点及其关系构建上下文；
  - 指令示例：
    - “帮我自动整理当前思维导图的布局”；
    - “把这些散乱的节点整理成从左到右的流程图”；
  - 插入/调整逻辑由响应解析模块决定（详见“生成内容与布局规则”小节）。 
