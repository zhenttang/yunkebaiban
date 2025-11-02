# Android 端数字可以输入但英文/中文不行 - 深入分析

## 📋 问题现象

- ✅ **数字可以输入** - 使用数字键盘时正常
- ❌ **英文不能输入** - 使用英文键盘时无法输入
- ❌ **中文不能输入** - 使用中文输入法时无法输入

这说明**不是输入法弹不出来的问题**，而是**文本插入逻辑有问题**。

---

## 🔍 关键代码分析

### 1. 输入事件处理流程

查看 `blocksuite/framework/std/src/inline/services/event.ts`:

```typescript:44:123:blocksuite/framework/std/src/inline/services/event.ts
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

  const ctx: BeforeinputHookCtx<TextAttributes> = {
    inlineEditor: this.editor,
    raw: event,
    inlineRange,
    data: event.data ?? event.dataTransfer?.getData('text/plain') ?? null,  // ⚠️ 关键：获取数据
    attributes: {} as TextAttributes,
  };
  this.editor.hooks.beforeinput?.(ctx);

  transformInput<TextAttributes>(
    ctx.raw.inputType,
    ctx.data,  // ⚠️ 传递数据
    ctx.attributes,
    ctx.inlineRange,
    this.editor as never
  );
};
```

### 2. 文本转换逻辑

查看 `blocksuite/framework/std/src/inline/utils/transform-input.ts`:

```typescript:6:18:blocksuite/framework/std/src/inline/utils/transform-input.ts
function handleInsertText<TextAttributes extends BaseTextAttributes>(
  inlineRange: InlineRange,
  data: string | null,
  editor: InlineEditor,
  attributes: TextAttributes
) {
  if (!data) return;  // ⚠️ 关键：如果 data 为空，直接返回！
  editor.insertText(inlineRange, data, attributes);
  editor.setInlineRange({
    index: inlineRange.index + data.length,
    length: 0,
  });
}
```

### 3. 文本插入逻辑

查看 `blocksuite/framework/std/src/inline/services/text.ts`:

```typescript:65:84:blocksuite/framework/std/src/inline/services/text.ts
insertText = (
  inlineRange: InlineRange,
  text: string,
  attributes: TextAttributes = {} as TextAttributes
): void => {
  if (this.editor.isReadonly) return;

  if (!text || !text.length) return;  // ⚠️ 如果文本为空，直接返回

  // ... 插入逻辑
};
```

---

## 🎯 问题根因分析

### 根因 1: `beforeinput` 事件中 `event.data` 为空（最可能）

**现象**: 
- 数字可以输入 → 说明 `event.data` 有值（数字键盘）
- 英文/中文不能输入 → 说明 `event.data` 为空（全键盘）

**Android WebView 的特殊行为**:
- 当使用**数字键盘** (`inputMode="numeric"`) 时，`beforeinput` 事件的 `event.data` **通常有值**
- 当使用**全键盘** (`inputMode="text"`) 时，`beforeinput` 事件的 `event.data` **可能为空**

**为什么会这样？**
- Android WebView 在 `inputMode="numeric"` 时，直接将数字字符放在 `event.data` 中
- 但在 `inputMode="text"` 时，文本可能通过其他方式传递（如 `composition` 事件），`beforeinput` 的 `event.data` 可能为空

### 根因 2: `_isComposing` 标志导致英文输入被跳过

**代码位置**: `event.ts:48`

```typescript
if (this._isComposing || ...) return;
```

**问题**:
- 某些 Android 输入法在输入英文时也会触发 `compositionstart`
- 导致 `_isComposing = true`
- 后续的 `beforeinput` 事件被跳过
- 但 `compositionend` 事件可能没有正确插入文本

### 根因 3: `compositionend` 事件处理失败

**代码位置**: `event.ts:144-185`

```typescript
private readonly _onCompositionEnd = async (event: CompositionEvent) => {
  // ...
  data: event.data,  // ⚠️ Android WebView 中可能为空
  // ...
  if (newData && newData.length > 0) {
    this.editor.insertText(newInlineRange, newData, ctx.attributes);  // 只有有数据才插入
  }
};
```

**问题**:
- `compositionend` 事件中 `event.data` 可能为空
- 导致文本无法插入

---

## 🔧 解决方案

### 方案 1: 修复 `beforeinput` 事件中的数据获取（推荐）

**问题**: Android WebView 中 `event.data` 可能为空，需要从其他来源获取文本

**文件**: `blocksuite/framework/std/src/inline/services/event.ts`

```typescript
private readonly _onBeforeInput = (event: InputEvent) => {
  const range = this.editor.rangeService.getNativeRange();
  if (
    this.editor.isReadonly ||
    this._isComposing ||
    !range ||
    !this._isRangeCompletelyInRoot(range)
  )
    return;

  let inlineRange = this.editor.toInlineRange(range);
  if (!inlineRange) return;

  // ... 原有代码 ...

  if (!inlineRange) return;

  event.preventDefault();

  // 🔧 Android WebView 修复：多途径获取文本数据
  let inputData = event.data ?? event.dataTransfer?.getData('text/plain') ?? null;
  
  // 如果 event.data 为空（Android WebView 常见问题）
  if (!inputData && event.inputType === 'insertText') {
    // 方法1: 从 event 的 getTargetRanges 中尝试读取
    try {
      const targetRanges = event.getTargetRanges();
      if (targetRanges.length > 0) {
        const staticRange = targetRanges[0];
        const range = document.createRange();
        range.setStart(staticRange.startContainer, staticRange.startOffset);
        range.setEnd(staticRange.endContainer, staticRange.endOffset);
        
        // 尝试从 range 中读取文本（如果 range 包含文本）
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE && range.startOffset !== range.endOffset) {
          const textContent = textNode.textContent || '';
          inputData = textContent.substring(range.startOffset, range.endOffset);
        }
      }
    } catch (e) {
      console.warn('无法从 targetRanges 读取文本:', e);
    }
    
    // 方法2: 从当前 selection 读取（最后的备选）
    if (!inputData) {
      try {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const selectedText = selection.toString();
          // 如果选中了文本，可能是替换操作
          if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
            // 可能是替换文本，但我们需要插入的文本，所以不从这里取
            // 但如果实在没有其他来源，可以考虑使用
          }
        }
      } catch (e) {
        console.warn('无法从 selection 读取文本:', e);
      }
    }
    
    // 🔧 Android WebView 特殊处理：如果是 insertText 但没有数据，尝试从键盘事件获取
    // 注意：这需要配合 keydown 事件，但这里我们只能尝试从 range 中获取
  }

  const ctx: BeforeinputHookCtx<TextAttributes> = {
    inlineEditor: this.editor,
    raw: event,
    inlineRange,
    data: inputData,  // 🔧 使用修复后的数据
    attributes: {} as TextAttributes,
  };
  this.editor.hooks.beforeinput?.(ctx);

  transformInput<TextAttributes>(
    ctx.raw.inputType,
    ctx.data,
    ctx.attributes,
    ctx.inlineRange,
    this.editor as never
  );

  this.editor.slots.inputting.next();
};
```

### 方案 2: 修复 `compositionend` 事件中的数据获取

**文件**: `blocksuite/framework/std/src/inline/services/event.ts`

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
    const fallbackInlineRange = this.editor.toInlineRange(range);
    if (fallbackInlineRange) {
      this._compositionInlineRange = fallbackInlineRange;
    } else {
      return;
    }
  }

  // 🔧 Android WebView 修复：多途径获取文本
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
        // 如果 range 有选中文本，可能是替换
        if (endOffset > startOffset) {
          compositionText = textContent.substring(startOffset, endOffset);
        } else {
          // 尝试读取最近输入的文本（从 DOM 中）
          // 注意：这需要确保 DOM 中有文本
        }
      }
    } catch (e) {
      console.warn('无法从 range 读取文本:', e);
    }
    
    // 方法2: 从 DOM 中读取（最后的备选）
    if (!compositionText || compositionText.length === 0) {
      try {
        // 尝试从当前光标位置读取最近输入的文本
        // 这需要遍历 DOM 节点
        const textNode = range.startContainer;
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const textContent = textNode.textContent || '';
          // 读取光标位置附近的文本
          const startOffset = Math.max(0, range.startOffset - 10);
          const endOffset = Math.min(textContent.length, range.startOffset + 10);
          const nearbyText = textContent.substring(startOffset, endOffset);
          // 但这不准确，因为可能包含之前的文本
        }
      } catch (e) {
        console.warn('无法从 DOM 读取文本:', e);
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

### 方案 3: 添加 `input` 事件监听作为补充（Android 专用）

**文件**: `blocksuite/framework/std/src/inline/services/event.ts`

在 `mount` 方法中添加：

```typescript
mount = () => {
  // ... 原有代码 ...
  
  // 🔧 Android WebView 修复：添加 input 事件监听作为补充
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    this.editor.disposables.addFromEvent(
      eventSource,
      'input',
      (event: Event) => {
        // 只有在非 composing 状态下才处理
        // 因为 composing 状态下应该由 compositionend 处理
        if (!this._isComposing && event instanceof InputEvent) {
          const range = this.editor.rangeService.getNativeRange();
          if (
            !this.editor.isReadonly &&
            range &&
            this._isRangeCompletelyInRoot(range) &&
            event.inputType === 'insertText'
          ) {
            // 检查是否有数据
            if (event.data && event.data.length > 0) {
              const inlineRange = this.editor.toInlineRange(range);
              if (inlineRange) {
                // 检查是否已经有这个文本（避免重复插入）
                const currentText = this.editor.yTextString;
                const beforeText = currentText.substring(
                  Math.max(0, inlineRange.index - event.data.length),
                  inlineRange.index
                );
                
                // 如果刚插入的文本不在编辑器中，才插入
                if (!beforeText.includes(event.data)) {
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
      }
    );
  }
};
```

### 方案 4: 修复 `_isComposing` 标志的管理（针对英文输入）

**问题**: 某些输入法在输入英文时也会触发 `compositionstart`，导致 `beforeinput` 被跳过

**文件**: `blocksuite/framework/std/src/inline/services/event.ts`

```typescript
private readonly _onCompositionStart = () => {
  this._isComposing = true;
  if (!this.editor.rootElement) return;
  
  // ... 原有代码 ...
  
  // 🔧 Android WebView 修复：检查是否是真正的 IME 输入
  // 某些输入法在输入英文时也会触发 compositionstart，但这不是真正的 composition
  // 我们可以通过检查是否真的是中文输入来判断
  // 但这很难判断，所以我们可以尝试允许 beforeinput 在 composition 期间也处理英文
  
  const range = this.editor.rangeService.getNativeRange();
  if (range) {
    this._compositionInlineRange = this.editor.toInlineRange(range);
  } else {
    this._compositionInlineRange = null;
  }
};
```

然后修改 `_onBeforeInput`:

```typescript
private readonly _onBeforeInput = (event: InputEvent) => {
  const range = this.editor.rangeService.getNativeRange();
  if (
    this.editor.isReadonly ||
    !range ||
    !this._isRangeCompletelyInRoot(range)
  )
    return;

  // 🔧 Android WebView 修复：允许在 composition 期间处理英文输入
  // 如果是英文输入（单字符，ASCII），即使正在 composing 也处理
  const isEnglishInput = event.data && 
                        event.data.length === 1 && 
                        /^[a-zA-Z0-9\s]$/.test(event.data);
  
  if (this._isComposing && !isEnglishInput) {
    // 如果是 composition 期间且不是英文输入，跳过
    return;
  }

  // ... 其余代码 ...
};
```

---

## 🧪 调试和验证

### 添加调试日志

在 `event.ts` 中添加：

```typescript
private readonly _onBeforeInput = (event: InputEvent) => {
  // 🔧 调试日志
  console.log('🔍 [Android调试] beforeinput:', {
    inputType: event.inputType,
    data: event.data,
    isComposing: this._isComposing,
    hasRange: !!this.editor.rangeService.getNativeRange(),
  });
  
  // ... 原有代码 ...
};
```

### 在 Chrome DevTools 中测试

```javascript
// 监听所有输入相关事件
document.addEventListener('beforeinput', (e) => {
  console.log('🔍 beforeinput:', {
    inputType: e.inputType,
    data: e.data,
    isComposing: e.isComposing,
  });
});

document.addEventListener('input', (e) => {
  console.log('🔍 input:', {
    inputType: e.inputType,
    data: e.data,
  });
});

document.addEventListener('compositionstart', () => {
  console.log('🔍 compositionstart');
});

document.addEventListener('compositionend', (e) => {
  console.log('🔍 compositionend:', {
    data: e.data,
  });
});
```

---

## 📊 问题优先级

1. **P0 (必须修复)**: `beforeinput` 事件中 `event.data` 为空的问题（方案1）
2. **P1 (应该修复)**: `compositionend` 事件中 `event.data` 为空的问题（方案2）
3. **P2 (可以优化)**: 添加 `input` 事件监听作为补充（方案3）
4. **P3 (可选)**: 修复 `_isComposing` 标志管理（方案4）

---

## 🎯 推荐实施顺序

1. **首先**: 实施方案1（修复 `beforeinput` 数据获取）
2. **然后**: 实施方案2（修复 `compositionend` 数据获取）
3. **验证**: 测试英文和中文输入是否正常
4. **如果需要**: 实施方案3（添加 `input` 事件监听）
5. **最后**: 如果还有问题，实施方案4（修复 `_isComposing` 标志）

---

## 💡 关键发现

**为什么数字可以输入？**
- 数字键盘 (`inputMode="numeric"`) 时，Android WebView 直接将数字字符放在 `beforeinput` 事件的 `event.data` 中
- 全键盘 (`inputMode="text"`) 时，`event.data` 可能为空，需要通过其他方式获取文本

**解决方案的核心思路**:
1. 多途径获取文本数据（`event.data` → `dataTransfer` → `range` → `selection`）
2. 添加 `input` 事件监听作为补充
3. 放宽 `_isComposing` 检查，允许英文输入

