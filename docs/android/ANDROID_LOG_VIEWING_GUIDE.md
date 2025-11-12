# Android 调试日志查看指南

## ⚠️ 重要说明

您看到的这些日志：
```
RTMode                  system_server    E  pkgName: app.yunke.pro has no permission
SystemUtils             com.xiaomi.mirror E  appIsTopAndXSpace: package app.yunke.pro
```

这些是 **Android 系统日志（Logcat）**，不是我们 JavaScript 代码的日志！

我们添加的 JavaScript 调试日志（如 `🔍 [Android调试] compositionend 开始`）需要在 **Chrome DevTools 的 Console** 中查看。

---

## 📱 如何查看 JavaScript 日志

### 方法 1: Chrome DevTools 远程调试（推荐）

#### 步骤 1: 启用 USB 调试
1. 在 Android 设备上：设置 → 关于手机 → 连续点击"版本号"7次（启用开发者选项）
2. 设置 → 开发者选项 → 启用"USB 调试"

#### 步骤 2: 连接设备
1. 用 USB 线连接 Android 设备到电脑
2. 在设备上允许 USB 调试

#### 步骤 3: 打开 Chrome DevTools
1. 在电脑上打开 Chrome 浏览器
2. 访问：`chrome://inspect`
3. 找到你的设备和应用（`app.yunke.pro`）
4. 点击 "inspect" 按钮

#### 步骤 4: 查看 Console
1. 在打开的 DevTools 窗口中，点击 "Console" 标签
2. 现在你应该能看到我们添加的 JavaScript 日志了

---

### 方法 2: 使用 adb logcat 过滤 JavaScript 日志

虽然 console.log 默认不会出现在 logcat 中，但可以通过以下方式尝试：

```bash
# 查看 WebView 控制台日志
adb logcat | grep -E "chromium|Console|WebView|console"
```

**注意**: 大多数情况下，JavaScript 的 console.log 不会出现在 logcat 中，需要通过 Chrome DevTools 查看。

---

## 🔍 如果看不到日志

### 可能的原因

1. **代码没有重新构建**
   - 需要重新构建项目：`yarn build:android`
   - 然后同步：`yarn sync:android`
   - 最后在 Android Studio 中重新构建 APK

2. **WebView 调试未启用**
   - 检查 `capacitor.config.ts` 中 `webContentsDebuggingEnabled: true`
   - 确保重新构建后生效

3. **事件没有触发**
   - 如果连 `compositionstart` 日志都没有，说明事件没有触发
   - 可能是输入法的问题

4. **日志被过滤**
   - 在 Chrome DevTools Console 中，确保没有过滤日志
   - 检查 Console 的过滤设置

---

## 🧪 测试日志系统是否工作

让我们添加一个简单的测试日志，在应用启动时输出，这样可以确认日志系统是否正常工作：

### 在 `app.tsx` 中添加启动日志

查看 `packages/frontend/apps/android/src/app.tsx`，应该已经有类似这样的日志：

```typescript
console.log('🔧 Android BUILD_CONFIG配置:', androidConfig);
```

如果应用启动时在 Chrome DevTools Console 中能看到这个日志，说明日志系统正常工作。

---

## 📋 检查清单

- [ ] 已重新构建项目（`yarn build:android`）
- [ ] 已同步到 Android 项目（`yarn sync:android`）
- [ ] 已在 Android Studio 中重新构建 APK
- [ ] 已在设备上安装新版本
- [ ] 已连接设备到电脑
- [ ] 已在 Chrome 中打开 `chrome://inspect`
- [ ] 已找到并点击应用的 "inspect"
- [ ] 已在 Console 标签中查看日志
- [ ] 已在应用中切换到中文输入法
- [ ] 已在应用中输入中文

---

## 🎯 快速测试步骤

1. **确认日志系统工作**:
   - 打开应用
   - 在 Chrome DevTools Console 中应该能看到应用启动的日志
   - 如果看不到，说明日志系统有问题

2. **测试输入事件**:
   - 点击编辑区域
   - 切换到中文输入法
   - 输入一个中文字符（如"你"）
   - 查看 Console 中是否有 `compositionstart` 和 `compositionend` 日志

3. **如果看不到任何日志**:
   - 检查 `chrome://inspect` 中是否能看到你的应用
   - 检查 WebView 调试是否启用
   - 尝试重新构建和安装应用

---

## 💡 替代方案：添加 Android Logcat 日志

如果 Chrome DevTools 不可用，我们可以添加一个桥接函数，将 JavaScript 日志也输出到 Android Logcat。但这需要修改原生代码。

让我知道是否需要添加这个功能。

