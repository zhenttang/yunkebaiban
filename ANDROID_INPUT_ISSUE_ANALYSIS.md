# Android 新建文件后无法输入中文问题分析

## 问题描述
在 Android 应用中，新建文件后，只能输入数字，无法输入中文。

## 根本原因分析

### 1. 问题定位

通过代码分析，发现问题出在 **keyboard-toolbar** 组件的 `inputMode` 设置上：

**文件位置**: `blocksuite/yunke/widgets/keyboard-toolbar/src/widget.ts`

```typescript
export class YunkeKeyboardToolbarWidget extends WidgetComponent<RootBlockModel> {
  get keyboard(): VirtualKeyboardProviderWithAction & { fallback?: boolean } {
    const provider = this.std.get(VirtualKeyboardProvider);
    if (isVirtualKeyboardProviderWithAction(provider)) return provider;

    return {
      // fallback keyboard actions
      show: () => {
        const rootComponent = this.block?.rootComponent;
        if (rootComponent && rootComponent === document.activeElement) {
          rootComponent.inputMode = this._initialInputMode;  // ✅ 恢复原始inputMode
        }
      },
      hide: () => {
        const rootComponent = this.block?.rootComponent;
        if (rootComponent && rootComponent === document.activeElement) {
          rootComponent.inputMode = 'none';  // ❌ 问题所在！设置为'none'
        }
      },
      ...provider,
    };
  }
}
```

### 2. 问题机制

#### 2.1 InputMode 在 Android 上的行为

在 Android 的 WebView 中，`inputMode` 属性决定了虚拟键盘的类型：
- `inputMode="text"` (默认) - 显示完整键盘，支持中文输入法
- `inputMode="none"` - **禁用虚拟键盘显示**
- `inputMode="numeric"` - 只显示数字键盘
- `inputMode="decimal"` - 数字键盘（带小数点）
- `inputMode="tel"` - 电话键盘
- `inputMode="search"` - 搜索键盘
- `inputMode="email"` - 邮箱键盘
- `inputMode="url"` - URL键盘

#### 2.2 问题发生时序

1. 用户新建文档
2. 编辑器的 `rootComponent` 被创建（`PageRootBlockComponent`）
3. `keyboard-toolbar` widget 初始化
4. 在某些情况下（可能是键盘工具栏隐藏时），调用 `keyboard.hide()`
5. `rootComponent.inputMode` 被设置为 `'none'`
6. **用户无法唤起输入法，或只能看到数字键盘**

#### 2.3 为什么只能输入数字？

可能的原因：
1. Android WebView 在 `inputMode='none'` 时的 fallback 行为是显示数字键盘
2. 或者 `captureInput: true` 配置（在 `capacitor.config.ts` 中）与 `inputMode='none'` 的组合导致了这个问题

### 3. 相关配置

**文件**: `packages/frontend/apps/android/capacitor.config.ts`
```typescript
android: {
  path: 'App',
  buildOptions: { ... },
  adjustMarginsForEdgeToEdge: 'force',
  webContentsDebuggingEnabled: true,
  allowMixedContent: true,
  captureInput: true,  // 🔧 这个配置可能加剧了问题
},
```

## 解决方案

### 方案 1：修复 keyboard-toolbar 的 inputMode 管理（推荐）

修改 `blocksuite/yunke/widgets/keyboard-toolbar/src/widget.ts`：

```typescript
export class YunkeKeyboardToolbarWidget extends WidgetComponent<RootBlockModel> {
  private readonly _close = (blur: boolean) => {
    if (blur) {
      if (document.activeElement === this._docTitle?.inlineEditorContainer) {
        this._docTitle?.inlineEditor?.setInlineRange(null);
        this._docTitle?.inlineEditor?.eventSource?.blur();
      } else if (document.activeElement === this.block?.rootComponent) {
        this.std.selection.clear();
      }
    }
    this._show$.value = false;
    
    // 🔧 修复：关闭工具栏时恢复inputMode
    const rootComponent = this.block?.rootComponent;
    if (rootComponent) {
      rootComponent.inputMode = this._initialInputMode || 'text';
    }
  };

  get keyboard(): VirtualKeyboardProviderWithAction & { fallback?: boolean } {
    const provider = this.std.get(VirtualKeyboardProvider);
    if (isVirtualKeyboardProviderWithAction(provider)) return provider;

    return {
      show: () => {
        const rootComponent = this.block?.rootComponent;
        if (rootComponent && rootComponent === document.activeElement) {
          // 🔧 修复：确保恢复为text而不是空字符串
          rootComponent.inputMode = this._initialInputMode || 'text';
        }
      },
      hide: () => {
        const rootComponent = this.block?.rootComponent;
        if (rootComponent && rootComponent === document.activeElement) {
          // 🔧 修复：不要设置为'none'，保持原始值或设置为'text'
          // Android上设置为'none'会导致输入法问题
          // rootComponent.inputMode = 'none';  // ❌ 删除这行
          rootComponent.inputMode = this._initialInputMode || 'text';  // ✅ 改为这样
        }
      },
      ...provider,
    };
  }

  override connectedCallback(): void {
    super.connectedCallback();

    const rootComponent = this.block?.rootComponent;
    if (rootComponent) {
      this.disposables.addFromEvent(rootComponent, 'focus', () => {
        this._show$.value = true;
      });
      this.disposables.addFromEvent(rootComponent, 'blur', () => {
        this._show$.value = false;
      });

      if (this.keyboard.fallback) {
        // 🔧 修复：如果initialInputMode为空，设置默认值为'text'
        this._initialInputMode = rootComponent.inputMode || 'text';
        this.disposables.add(() => {
          rootComponent.inputMode = this._initialInputMode;
        });
        this.disposables.add(
          effect(() => {
            if (!this._show$.value) {
              rootComponent.inputMode = this._initialInputMode || 'text';
            }
          })
        );
      }
    }

    // ... 其余代码
  }
}
```

### 方案 2：为 Android 平台特殊处理

在 `packages/frontend/apps/android/src/app.tsx` 中添加全局修复：

```typescript
// 在应用初始化时添加
if (Capacitor.getPlatform() === 'android') {
  // 监听所有 contenteditable 元素的创建
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // 查找所有 contenteditable 元素
          const editables = node.querySelectorAll('[contenteditable="true"]');
          editables.forEach((el) => {
            if (el instanceof HTMLElement && !el.inputMode) {
              el.inputMode = 'text';
              console.log('🔧 [Android修复] 设置inputMode为text:', el);
            }
          });
          
          // 如果节点本身是 contenteditable
          if (node.contentEditable === 'true' && !node.inputMode) {
            node.inputMode = 'text';
            console.log('🔧 [Android修复] 设置inputMode为text:', node);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
```

### 方案 3：修改 Capacitor 配置

在 `capacitor.config.ts` 中调整配置：

```typescript
android: {
  path: 'App',
  buildOptions: { ... },
  adjustMarginsForEdgeToEdge: 'force',
  webContentsDebuggingEnabled: true,
  allowMixedContent: true,
  captureInput: false,  // 🔧 尝试关闭 captureInput
},
```

## 验证步骤

1. 实施修复后，重新构建 Android 应用：
   ```bash
   yarn build:android
   yarn sync:android
   ```

2. 在 Android 设备上测试：
   - 新建文档
   - 点击编辑区域
   - 确认能否正常弹出中文输入法
   - 测试能否正常输入中文字符

3. 使用 Chrome DevTools 远程调试：
   - 在浏览器打开 `chrome://inspect`
   - 选择你的 Android 设备
   - 在控制台检查 `document.activeElement.inputMode` 的值

## 调试技巧

### 1. 添加日志
在 `keyboard-toolbar` widget 中添加调试日志：

```typescript
if (rootComponent) {
  console.log('🔍 [Keyboard Toolbar] inputMode 设置:', {
    before: rootComponent.inputMode,
    after: 'none',
    element: rootComponent.tagName,
  });
}
```

### 2. Chrome Remote Debugging
```bash
# 1. 启用 WebView 调试（已在 capacitor.config.ts 中设置）
# 2. 在 Chrome 访问 chrome://inspect
# 3. 在控制台运行：
document.activeElement.inputMode  // 查看当前inputMode
document.activeElement.contentEditable  // 查看是否可编辑
```

### 3. 运行时检查
在浏览器控制台运行：

```javascript
// 查找所有 contenteditable 元素及其 inputMode
Array.from(document.querySelectorAll('[contenteditable="true"]')).map(el => ({
  tag: el.tagName,
  inputMode: el.inputMode || '(未设置)',
  id: el.id || '(无ID)',
}))
```

## 推荐实施顺序

1. **立即修复**：实施方案 1（修复 keyboard-toolbar）
2. **验证测试**：在 Android 设备上测试
3. **必要时补充**：如果问题仍然存在，添加方案 2 的全局修复
4. **最后手段**：如果上述都不行，尝试方案 3 修改 Capacitor 配置

## 预期效果

修复后，在 Android 设备上：
- ✅ 新建文档后能正常唤起输入法
- ✅ 能够输入中文字符
- ✅ 输入法切换正常工作
- ✅ 不影响其他输入相关功能

## 参考资源

- [MDN: inputmode attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)
- [Android WebView IME Best Practices](https://developer.android.com/guide/webapps/webview)
- [Capacitor Keyboard Plugin](https://capacitorjs.com/docs/apis/keyboard)

