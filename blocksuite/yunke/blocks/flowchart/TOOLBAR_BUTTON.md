# 🎨 流程图工具栏按钮 - 使用说明

## ✅ 已添加功能

在白板底部工具栏添加了**流程图生成按钮**，方便快速创建流程图！

## 🔍 按钮位置

白板底部工具栏，图标是一个流程图样式：
```
┌─┬─┐
│ │ │  ← 4个方块和连接线组成的图标
└─┴─┘
```

## 🚀 使用方法

### 方法 1: 点击工具栏按钮（推荐）

1. **切换到白板模式**
2. **在底部工具栏找到流程图按钮**（最右侧区域）
3. **点击按钮**
4. ✨ 自动在视口中心生成示例流程图！

### 方法 2: 使用斜杠命令

1. 在白板任意位置点击
2. 输入 `/flowchart`
3. 选择 "Yunke Flow 图表"
4. ✨ 生成流程图

## 📁 新增文件

1. `src/toolbar/flowchart-tool-button.ts` - 按钮组件
2. `src/toolbar/quick-tool.ts` - 工具栏扩展

## 🎯 按钮功能

点击按钮会：
1. 读取简单示例的 DSL 代码
2. 在当前视口中心生成流程图
3. 创建 3 个可编辑节点
4. 创建 2 条可编辑连线

## 🎨 按钮样式

- **默认状态**: 透明背景，图标颜色
- **悬停状态**: 浅色背景
- **点击状态**: 深色背景
- **图标**: 自定义 SVG，显示 2x2 网格和连接线

## 🔧 技术实现

```typescript
// 1. 创建按钮组件
@customElement('flowchart-tool-button')
export class FlowchartToolButton extends LitElement {
  // 点击时生成流程图
  private _handleClick = () => {
    generateFlowchartOnEdgeless(this.edgeless.std, dslCode);
  };
}

// 2. 创建工具栏扩展
export const FlowchartQuickTool = QuickToolExtension('flowchart', ({ block }) => {
  return {
    priority: 85,
    content: html`<flowchart-tool-button .edgeless=${block}></flowchart-tool-button>`,
  };
});

// 3. 注册到 ViewExtension
context.register(FlowchartQuickTool);
```

## 🎨 自定义图标

如果想修改按钮图标，编辑 `flowchart-tool-button.ts` 中的 SVG：

```typescript
<svg viewBox="0 0 24 24" fill="currentColor">
  <!-- 你的自定义图标 -->
</svg>
```

## 🔄 与斜杠命令的区别

| 特性 | 工具栏按钮 | 斜杠命令 |
|------|-----------|---------|
| 位置 | 固定在底部 | 任意位置输入 |
| 速度 | 1 次点击 | 需要输入文字 |
| 发现性 | 更容易发现 | 需要知道命令 |
| 场景 | 频繁使用 | 偶尔使用 |

**推荐**：日常使用工具栏按钮，更快更方便！

## 🎉 效果预览

点击按钮后：
```
          ┌────────┐
          │  开始  │
          └───┬────┘
              │ 执行
              ↓
          ┌────────┐
          │处理数据│
          └───┬────┘
              │ 完成
              ↓
          ┌────────┐
          │  结束  │
          └────────┘
```

所有元素都可以：
- ✅ 单独选中和移动
- ✅ 调整大小
- ✅ 编辑文本
- ✅ 修改样式
- ✅ 复制删除

---

**享受便捷的流程图创建体验！** 🎊

