# Android 输入事件追踪 - 深入分析

## 🎯 已添加的调试功能

### 1. 全局事件监听（document 级别）

在 `document` 上添加了捕获阶段的监听器，可以捕获**所有**输入相关事件，即使它们被其他代码拦截。

**日志格式**：
```
🔍 [Android调试] 全局事件捕获 [事件类型]
```

这个日志会显示：
- 事件发生的目标元素
- 事件是否在 eventSource 内
- 事件是否在 rootElement 内
- 事件是否被阻止（defaultPrevented）

### 2. InlineEditor mount 日志

记录编辑器挂载时的详细信息：
- rootElement 和 eventSource 的元素信息
- contentEditable 和 inputMode 设置

### 3. EventService mount 日志

记录事件服务挂载时的详细信息：
- eventSource 的完整信息
- 事件监听器绑定状态

---

## 🔍 关键问题分析

### 如果看不到任何日志

**可能原因**：
1. **代码没有重新加载**
   - 需要重新构建项目
   - 重新安装 APK

2. **事件根本没有触发**
   - Android WebView 可能没有发送键盘事件
   - 可能需要检查输入法设置

### 如果能看到全局事件但看不到 eventSource 事件

**可能原因**：
1. **eventSource 不是正确的元素**
   - 事件发生在其他元素上
   - 需要检查 `isInEventSource` 是否为 `true`

2. **事件被阻止传播**
   - 查看 `defaultPrevented` 是否为 `true`
   - 可能有其他代码调用了 `preventDefault()`

### 如果事件发生在错误的元素上

**可能原因**：
1. **PageRootBlockComponent 拦截了事件**
   - 事件可能发生在 `yunke-page-root` 元素上
   - 而 eventSource 是 `rich-text` 的容器

2. **事件冒泡被阻止**
   - 事件发生在子元素，但没有冒泡到 eventSource

---

## 📋 测试步骤

### 步骤 1: 重新构建并安装

```bash
cd /mnt/d/Documents/yunkebaiban/baibanfront
yarn build:android
yarn sync:android
```

然后在 Android Studio 中重新构建并安装 APK。

### 步骤 2: 查看启动日志

在 Chrome DevTools Console 中，应该能看到：

```
🔍 [Android调试] InlineEditor mount 开始
🔍 [Android调试] EventService mount 开始
✅ [Android调试] EventService mount 成功
```

### 步骤 3: 尝试输入

输入一个字符（中文或英文），观察日志：

**应该看到**：
```
🔍 [Android调试] 全局事件捕获 [beforeinput]
🔍 [Android调试] 全局事件捕获 [input]
🔍 [Android调试] 原生事件监听: { type: 'beforeinput', ... }
🔍 [Android调试] beforeinput 事件触发
```

### 步骤 4: 分析日志

**关键检查点**：

1. **事件是否触发**？
   - 如果看到 `全局事件捕获`，说明事件有触发
   - 如果看不到，说明事件根本没有触发

2. **事件发生在哪个元素**？
   - 查看 `target` 字段
   - 检查 `isInEventSource` 是否为 `true`

3. **事件是否被阻止**？
   - 查看 `defaultPrevented` 字段
   - 如果为 `true`，说明有代码阻止了默认行为

4. **eventSource 是否正确**？
   - 查看 `eventSource 详细信息` 日志
   - 检查 `contentEditable` 和 `inputMode` 是否正确

---

## 🎯 可能的问题和解决方案

### 问题 1: 事件发生在 PageRootBlockComponent 而不是 rich-text

**现象**：
- 全局事件捕获显示 `target` 是 `YUNKE-PAGE-ROOT`
- `isInEventSource` 为 `false`

**原因**：
- `PageRootBlockComponent` 设置了 `contentEditable="true"`
- 键盘事件可能先发生在它上面

**解决方案**：
- 需要将事件监听器也绑定到 `PageRootBlockComponent`
- 或者检查为什么事件没有冒泡到 `rich-text`

### 问题 2: 事件被提前阻止

**现象**：
- 能看到全局事件捕获
- `defaultPrevented` 为 `true`
- 但看不到我们的处理函数被调用

**原因**：
- 有其他代码在捕获阶段调用了 `preventDefault()`
- 事件被阻止传播

**解决方案**：
- 需要在更早的阶段处理事件
- 或者找到阻止事件的代码并修复

### 问题 3: eventSource 元素不正确

**现象**：
- `eventSource 详细信息` 显示的元素不是输入发生的元素
- `isInEventSource` 为 `false`

**原因**：
- `eventSource` 设置错误
- 可能是 `PageRootBlockComponent` 而不是 `rich-text` 的容器

**解决方案**：
- 需要检查 `rich-text` 的 `inlineEventSource` 设置
- 可能需要将事件监听器绑定到正确的元素

---

## 💡 快速诊断命令

在 Chrome DevTools Console 中运行：

```javascript
// 1. 检查所有 contentEditable 元素
Array.from(document.querySelectorAll('[contenteditable="true"]')).map(el => ({
  tag: el.tagName,
  id: el.id,
  class: el.className,
  inputMode: el.inputMode,
  hasInlineEditor: !!(el as any).inlineEditor,
}))

// 2. 检查当前焦点
console.log('当前焦点:', document.activeElement);

// 3. 检查事件监听器（需要手动添加）
const editor = document.querySelector('[contenteditable="true"]');
if (editor) {
  editor.addEventListener('beforeinput', (e) => {
    console.log('手动监听 beforeinput:', e);
  }, true);
}
```

---

## 🚀 下一步

1. **重新构建项目**
2. **查看启动日志**，确认代码已加载
3. **尝试输入**，查看全局事件捕获日志
4. **分析日志**，找出问题所在

请告诉我：
- 能看到启动日志吗？
- 输入时能看到 `全局事件捕获` 日志吗？
- 如果能看到，`target` 是什么元素？`isInEventSource` 是什么？

有了这些信息，我就能准确定位问题！

