# Android 端中文输入法输入中文但页面不能显示中文 - 深入分析报告

## 📋 问题描述

在 Android 应用中，用户可以：
- ✅ 通过输入法输入中文（输入法正常弹出）
- ✅ 输入法显示中文候选词
- ❌ **但是输入的中文字符无法显示在页面上**

这是一个**输入事件处理**层面的问题，与之前的 `inputMode` 设置问题（只能输入数字）不同。

---

## 🔍 深入根因分析

### 1. 输入事件处理流程

#### 1.1 正常的中文输入流程

中文输入法（IME）输入中文时会触发以下事件序列：

```
1. compositionstart  → IME开始输入
2. compositionupdate → IME更新候选词（可能多次）
3. beforeinput       → 浏览器准备插入文本
4. compositionend    → IME确认输入，提交最终文本
5. input             → 文本插入完成
```

#### 1.2 当前代码中的事件处理

查看 `blocksuite/framework/std/src/inline/services/event.ts`：

```typescript:44:122:blocksuite/framework/std/src/inline/services/event.ts
private readonly _onBeforeInput = (event: InputEvent) => {
  const range = this.editor.rangeService.getNativeRange();
  if (
    this.editor.isReadonly ||
    this._isComposing ||  // ⚠️ 关键：如果正在composing，直接返回
    !range ||
    !this._isRangeCompletelyInRoot(range)
  )
    return;

  // ... 处理逻辑
  event.preventDefault();  // ⚠️ 阻止默认行为
  // ...
};
```

```typescript:144:185:blocksuite/framework/std/src/inline/services/event.ts
private readonly _onCompositionEnd = async (event: CompositionEvent) => {
  this._isComposing = false;
  // ...
  event.preventDefault();  // ⚠️ 阻止默认行为
  
  const ctx: CompositionEndHookCtx<TextAttributes> = {
    inlineEditor: this.editor,
    raw: event,
    inlineRange,
    data: event.data,
    attributes: {} as TextAttributes,
  };
  this.editor.hooks.compositionEnd?.(ctx);

  const { inlineRange: newInlineRange, data: newData } = ctx;
  if (newData && newData.length > 0) {
    this.editor.insertText(newInlineRange, newData, ctx.attributes);  // ✅ 手动插入文本
    this.editor.setInlineRange({
      index: newInlineRange.index + newData.length,
      length: 0,
    });
  }
  // ...
};
```

### 2. 潜在问题点

#### 2.1 问题 1: `beforeinput` 事件在 `composition` 期间被忽略

**代码位置**: `event.ts:44-52`

```typescript
if (this._isComposing || ...) return;
```

**问题**: 
- 在 `compositionstart` 时，`_isComposing` 被设置为 `true`
- 在 `compositionend` 之前，所有 `beforeinput` 事件都被忽略
- **但是**，Android WebView 可能在 `composition` 期间仍然发送 `beforeinput` 事件

#### 2.2 问题 2: `compositionend` 事件中的异步处理

**代码位置**: `event.ts:144-185`

```typescript
private readonly _onCompositionEnd = async (event: CompositionEvent) => {
  // ...
  this.editor.rerenderWholeEditor();  // ⚠️ 重新渲染整个编辑器
  await this.editor.waitForUpdate();   // ⚠️ 异步等待
  
  // 然后才插入文本
  this.editor.insertText(newInlineRange, newData, ctx.attributes);
};
```

**潜在问题**:
1. **时序问题**: `rerenderWholeEditor()` 和 `waitForUpdate()` 可能导致插入文本时编辑器状态不一致
2. **Range 丢失**: 在异步等待期间，原生的 `range` 可能已经改变或丢失
3. **Android WebView 特殊行为**: Android WebView 可能在 `compositionend` 之后立即触发其他事件，导致 range 不同步

#### 2.3 问题 3: `_isRangeCompletelyInRoot` 检查过严

**代码位置**: `event.ts:19-42`

```typescript
private readonly _isRangeCompletelyInRoot = (range: Range) => {
  // 严格的范围检查
  // ...
};
```

**问题**: 
- Android WebView 在某些情况下，`compositionend` 事件的 `range` 可能不完全在 `rootElement` 内
- 例如：光标在边界、文本节点分片等情况
- 导致 `compositionend` 处理被跳过

#### 2.4 问题 4: Android WebView 的 `event.data` 可能为空

**代码位置**: `event.ts:170`

```typescript
data: event.data,  // ⚠️ Android WebView 中可能为空
```

**Android WebView 特殊行为**:
- 某些版本的 Android WebView 在 `compositionend` 时，`event.data` 可能为 `null` 或空字符串
- 导致 `if (newData && newData.length > 0)` 条件不满足，文本无法插入

#### 2.5 问题 5: 原生 Range 与 InlineRange 转换失败

**代码位置**: `event.ts:161`

```typescript
const inlineRange = this._compositionInlineRange;
if (!inlineRange) return;  // ⚠️ 如果转换失败，直接返回
```

**问题**:
- `compositionstart` 时保存的 `_compositionInlineRange` 可能在 `compositionend` 时已经无效
- Android WebView 中 DOM 结构可能发生变化，导致 range 转换失败

### 3. Android WebView 特有行为

#### 3.1 事件触发顺序差异

**标准浏览器**:
```
compositionstart → compositionupdate → compositionend → beforeinput → input
```

**Android WebView (某些版本)**:
```
compositionstart → beforeinput (data=null) → compositionupdate → compositionend → beforeinput (data=实际文本)
```

#### 3.2 `event.data` 的获取方式

在 Android WebView 中，可能需要从不同的地方获取文本：
- `event.data` (可能为空)
- `event.target.textContent` (可能不准确)
- 手动读取 DOM 中的文本 (最可靠)

#### 3.3 ContentEditable 元素的 focus 状态

Android WebView 在处理 `compositionend` 时，`contentEditable` 元素可能失去焦点：
- 导致 `document.activeElement` 不再是编辑器元素
- 导致 `getNativeRange()` 返回 `null`

---

## 🎯 核心问题总结

### 问题层级

1. **事件层**: `compositionend` 事件处理不当
2. **数据层**: `event.data` 在 Android WebView 中可能为空
3. **范围层**: Range 转换和验证失败
4. **时序层**: 异步渲染导致状态不一致
5. **平台层**: Android WebView 的特殊行为

### 最可能的原因

基于代码分析，**最可能的原因是组合问题**：

1. **主要原因**: `compositionend` 事件中 `event.data` 为空，导致 `newData.length === 0`，文本无法插入
2. **次要原因**: `_isRangeCompletelyInRoot` 检查过严，在某些边界情况下拒绝处理
3. **触发条件**: 
   - Android WebView 版本较旧（< 80）
   - 使用了特定输入法（某些第三方输入法）
   - 编辑器处于特定状态（新建文档、刚加载完成等）

---

## 🔧 解决方案

### 方案 1: 修复 `compositionend` 事件中的数据获取（推荐）

**文件**: `blocksuite/framework/std/src/inline/services/event.ts`

**修改点**: `_onCompositionEnd` 方法

```typescript
private readonly _onCompositionEnd = async (event: CompositionEvent) => {
  this._isComposing = false;
  if (!this.editor.rootElement || !this.editor.rootElement.isConnected) {
    return;
  }

  const range = this.editor.rangeService.getNativeRange();
  if (
    this.editor.isReadonly ||
    !range ||
    !this._isRangeCompletelyInRoot(range)
  )
    return;

  // 🔧 Android WebView 修复：在 rerender 之前保存更多信息
  const inlineRange = this._compositionInlineRange;
  if (!inlineRange) {
    // 尝试从当前 range 重新获取
    const fallbackInlineRange = this.editor.toInlineRange(range);
    if (fallbackInlineRange) {
      this._compositionInlineRange = fallbackInlineRange;
    } else {
      return;
    }
  }

  // 🔧 Android WebView 修复：获取文本的多种方式
  let compositionText = event.data;
  
  // 如果 event.data 为空（Android WebView 常见问题）
  if (!compositionText || compositionText.length === 0) {
    // 方法1: 从 range 中读取文本
    try {
      const textNode = range.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE) {
        const textContent = textNode.textContent || '';
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        compositionText = textContent.substring(startOffset, endOffset);
      }
    } catch (e) {
      console.warn('无法从 range 读取文本:', e);
    }
    
    // 方法2: 从 DOM 中读取（最后的备选）
    if (!compositionText || compositionText.length === 0) {
      try {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const selectedText = selection.toString();
          if (selectedText) {
            compositionText = selectedText;
          }
        }
      } catch (e) {
        console.warn('无法从 selection 读取文本:', e);
      }
    }
  }

  this.editor.rerenderWholeEditor();
  await this.editor.waitForUpdate();

  // 🔧 重新获取 range（可能在 rerender 后改变）
  const currentRange = this.editor.rangeService.getNativeRange();
  let finalInlineRange = this._compositionInlineRange;
  
  if (currentRange) {
    const currentInlineRange = this.editor.toInlineRange(currentRange);
    if (currentInlineRange) {
      finalInlineRange = currentInlineRange;
    }
  }

  if (!finalInlineRange) return;

  event.preventDefault();

  const ctx: CompositionEndHookCtx<TextAttributes> = {
    inlineEditor: this.editor,
    raw: event,
    inlineRange: finalInlineRange,
    data: compositionText,  // 🔧 使用修复后的文本
    attributes: {} as TextAttributes,
  };
  this.editor.hooks.compositionEnd?.(ctx);

  const { inlineRange: newInlineRange, data: newData } = ctx;
  
  // 🔧 确保有数据才插入
  if (newData && newData.length > 0) {
    this.editor.insertText(newInlineRange, newData, ctx.attributes);
    this.editor.setInlineRange({
      index: newInlineRange.index + newData.length,
      length: 0,
    });
  } else {
    // 🔧 如果还是没有数据，记录警告
    console.warn('⚠️ [Android输入法] compositionend 事件中没有文本数据', {
      eventData: event.data,
      compositionText,
      range: currentRange,
      inlineRange: finalInlineRange,
    });
  }

  this.editor.slots.inputting.next();
};
```

### 方案 2: 放宽 `_isRangeCompletelyInRoot` 检查（针对 Android）

**文件**: `blocksuite/framework/std/src/inline/services/event.ts`

```typescript
private readonly _isRangeCompletelyInRoot = (range: Range) => {
  if (range.commonAncestorContainer.ownerDocument !== document) return false;

  const rootElement = this.editor.rootElement;
  if (!rootElement) return false;

  // 🔧 Android WebView 修复：更宽松的检查
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  // Android WebView 中，允许部分重叠的情况
  if (isAndroid) {
    try {
      return rootElement.contains(range.commonAncestorContainer) ||
             range.intersectsNode(rootElement);
    } catch (e) {
      // 如果检查失败，尝试更宽松的判断
      return true;
    }
  }

  // 标准浏览器的严格检查
  const rootRange = document.createRange();
  rootRange.selectNode(rootElement);
  // ... 原有逻辑
};
```

### 方案 3: 添加 Android WebView 特殊处理

**文件**: `blocksuite/framework/std/src/inline/services/event.ts`

在 `mount` 方法中添加：

```typescript
mount = () => {
  // ... 原有代码
  
  // 🔧 Android WebView 修复：添加额外的 input 事件监听
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    this.editor.disposables.addFromEvent(
      eventSource,
      'input',
      (event: Event) => {
        // 如果在 compositionend 之后立即有 input 事件，且之前没有插入文本
        // 则尝试从 input 事件中获取文本
        if (!this._isComposing && event instanceof InputEvent) {
          const range = this.editor.rangeService.getNativeRange();
          if (range && this._isRangeCompletelyInRoot(range)) {
            const inlineRange = this.editor.toInlineRange(range);
            if (inlineRange && event.data && event.data.length > 0) {
              // 检查是否已经有这个文本（避免重复插入）
              const currentText = this.editor.yTextString;
              if (!currentText.includes(event.data)) {
                console.log('🔧 [Android输入法] 从 input 事件补充插入文本:', event.data);
                this.editor.insertText(inlineRange, event.data, {});
                this.editor.setInlineRange({
                  index: inlineRange.index + event.data.length,
                  length: 0,
                });
              }
            }
          }
        }
      }
    );
  }
};
```

### 方案 4: 增强 `compositionstart` 时的信息保存

**文件**: `blocksuite/framework/std/src/inline/services/event.ts`

```typescript
private _compositionInlineRange: InlineRange | null = null;
private _compositionStartText: string = '';  // 🔧 新增：保存初始文本

private readonly _onCompositionStart = () => {
  this._isComposing = true;
  if (!this.editor.rootElement) return;
  
  // ... 原有代码
  
  const range = this.editor.rangeService.getNativeRange();
  if (range) {
    this._compositionInlineRange = this.editor.toInlineRange(range);
    // 🔧 Android WebView 修复：保存初始文本状态
    this._compositionStartText = this.editor.yTextString;
  } else {
    this._compositionInlineRange = null;
    this._compositionStartText = '';
  }
};
```

---

## 🧪 测试和验证

### 测试步骤

1. **基本功能测试**:
   ```
   - 新建文档
   - 点击编辑区域
   - 切换到中文输入法
   - 输入中文（如"你好"）
   - 确认文本显示在页面上
   ```

2. **边界情况测试**:
   ```
   - 在文档开头输入中文
   - 在文档末尾输入中文
   - 在段落中间输入中文
   - 连续输入多段中文
   - 输入中文后立即删除
   ```

3. **不同输入法测试**:
   ```
   - Google Pinyin
   - 搜狗输入法
   - 百度输入法
   - 讯飞输入法
   ```

4. **调试信息收集**:
   ```javascript
   // 在 Chrome DevTools 控制台运行
   document.addEventListener('compositionend', (e) => {
     console.log('🔍 compositionend:', {
       data: e.data,
       target: e.target,
       range: window.getSelection()?.getRangeAt(0),
     });
   });
   
   document.addEventListener('beforeinput', (e) => {
     console.log('🔍 beforeinput:', {
       inputType: e.inputType,
       data: e.data,
       isComposing: e.isComposing,
     });
   });
   ```

### 验证指标

- ✅ 中文文本能正确显示
- ✅ 光标位置正确
- ✅ 连续输入正常
- ✅ 删除功能正常
- ✅ 与其他文本混排正常

---

## 📊 问题优先级

1. **P0 (必须修复)**: `compositionend` 中 `event.data` 为空的问题
2. **P1 (应该修复)**: `_isRangeCompletelyInRoot` 检查过严
3. **P2 (可以优化)**: 异步渲染时序问题
4. **P3 (可选)**: 添加额外的 input 事件监听

---

## 🔗 相关资源

- [MDN: CompositionEvent](https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent)
- [MDN: InputEvent](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent)
- [Android WebView IME 文档](https://developer.android.com/guide/webapps/webview)
- [Blocksuite Inline Editor 源码](https://github.com/toeverything/blocksuite/tree/main/packages/framework/std/src/inline)

---

## 📝 实施建议

1. **立即实施**: 方案 1（修复数据获取）
2. **验证后实施**: 方案 2（放宽检查）
3. **需要时实施**: 方案 3（额外监听）
4. **长期优化**: 方案 4（增强信息保存）

建议先实施方案 1，这是最可能解决问题的方案。如果问题仍然存在，再依次尝试其他方案。

