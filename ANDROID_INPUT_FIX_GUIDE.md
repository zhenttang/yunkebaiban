# Android 中文输入修复 - 快速指南

## 问题
在 Android 应用中新建文件后，只能输入数字，无法输入中文。

## 修复内容
已修复 `blocksuite/yunke/widgets/keyboard-toolbar/src/widget.ts` 中的 `inputMode` 设置问题。

### 修复详情
1. ❌ **之前**: 键盘工具栏会将 `inputMode` 设置为 `'none'`，导致 Android 上输入法异常
2. ✅ **现在**: 保持 `inputMode` 为 `'text'`，确保中文输入法正常工作

## 构建和测试

### 1. 构建 Android 应用
```bash
# 在项目根目录执行
cd /mnt/d/Documents/yunkebaiban/baibanfront

# 构建 Android 版本
yarn build:android

# 同步到 Android 项目
yarn sync:android

# (可选) 在 Android Studio 中打开
yarn studio:android
```

### 2. 测试步骤
1. 在 Android 设备或模拟器上安装/运行应用
2. 新建一个文档
3. 点击编辑区域
4. 尝试输入中文：
   - ✅ 应该能看到完整的中文输入法键盘
   - ✅ 能够正常输入中文字符
   - ✅ 不再限制只能输入数字

### 3. Chrome 远程调试（可选）
如果需要深入调试：

```bash
# 1. 确保设备连接并启用 USB 调试
# 2. 在 Chrome 浏览器打开
chrome://inspect

# 3. 选择你的应用 WebView
# 4. 在控制台检查：
document.activeElement.inputMode  // 应该是 'text' 而不是 'none'
```

### 4. 验证点
- [ ] 新建文档能正常弹出输入法
- [ ] 能输入中文字符（不限于数字）
- [ ] 输入法切换正常工作
- [ ] 编辑现有文档也正常

## 技术细节

### 修改的文件
- `blocksuite/yunke/widgets/keyboard-toolbar/src/widget.ts`

### 核心改动
```typescript
// ❌ 之前
hide: () => {
  rootComponent.inputMode = 'none';  // 导致Android输入法问题
}

// ✅ 现在
hide: () => {
  rootComponent.inputMode = this._initialInputMode || 'text';  // 保持正常输入
}
```

### 为什么这样修复？
- Android WebView 在 `inputMode='none'` 时会禁用或限制输入法
- 保持 `inputMode='text'` 确保能唤起完整的虚拟键盘，包括中文输入法
- 使用 fallback 到 `'text'` 确保即使 `_initialInputMode` 为空也能正常工作

## 如果问题仍然存在

### 方案A: 添加全局修复
在 `packages/frontend/apps/android/src/app.tsx` 中添加：

```typescript
import { Capacitor } from '@capacitor/core';

// 在应用启动时
if (Capacitor.getPlatform() === 'android') {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.contentEditable === 'true' && !node.inputMode) {
            node.inputMode = 'text';
          }
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
```

### 方案B: 调整 Capacitor 配置
在 `packages/frontend/apps/android/capacitor.config.ts` 中：

```typescript
android: {
  // ...
  captureInput: false,  // 尝试关闭
}
```

## 相关文档
- 详细分析: `ANDROID_INPUT_ISSUE_ANALYSIS.md`
- [MDN: inputmode attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode)

## 联系
如果修复后问题仍然存在，请提供：
1. Android 系统版本
2. 输入法类型（如搜狗、Google Pinyin等）
3. Chrome DevTools 中 `document.activeElement.inputMode` 的值
4. 是否启用了"移动键盘工具栏"功能

