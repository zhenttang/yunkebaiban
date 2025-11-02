# Android 输入法调试 - 快速排查指南

## 🚨 问题：看不到 JavaScript 日志

您看到的日志是 Android **系统日志（Logcat）**，不是 JavaScript 日志！

### 正确的查看方式

**JavaScript 日志必须在 Chrome DevTools Console 中查看！**

---

## 📱 快速设置步骤

### 1. 确认代码已重新构建

```bash
cd /mnt/d/Documents/yunkebaiban/baibanfront
yarn build:android
yarn sync:android
```

然后在 Android Studio 中重新构建 APK。

### 2. 启用 USB 调试

在 Android 设备上：
- 设置 → 关于手机 → 连续点击"版本号"7次
- 设置 → 开发者选项 → 启用"USB 调试"

### 3. 连接设备并打开 DevTools

1. 用 USB 连接设备到电脑
2. 电脑上打开 Chrome 浏览器
3. 访问：`chrome://inspect`
4. 找到 `app.yunke.pro`
5. 点击 **"inspect"** 按钮
6. 在打开的窗口中点击 **"Console"** 标签

### 4. 测试日志系统

在 Chrome DevTools Console 中，你应该能看到：

```
✅ [Android调试测试] 应用启动，日志系统正常工作！
✅ [Android调试测试] 如果你能看到这条日志，说明 Chrome DevTools 连接成功！
```

如果能看到这些日志，说明日志系统正常工作！

### 5. 测试输入日志

1. 在应用中点击编辑区域
2. 切换到中文输入法
3. 输入一个中文字符（如"你"）

在 Console 中应该能看到：

```
🔍 [Android调试] compositionstart 开始
🔍 [Android调试] compositionend 开始
🔍 [Android调试] insertText 调用
...
```

---

## 🔍 如果仍然看不到日志

### 检查清单

- [ ] 是否在 Chrome DevTools Console 中查看（不是 Logcat）
- [ ] 是否重新构建了项目
- [ ] 是否安装了新版本的 APK
- [ ] Chrome DevTools 是否成功连接（能看到应用）
- [ ] Console 标签是否打开
- [ ] Console 是否有过滤设置（确保没有过滤掉日志）

### 测试方法

在 Chrome DevTools Console 中手动运行：

```javascript
// 测试1: 检查日志系统
console.log('🧪 手动测试日志');

// 测试2: 检查应用是否加载
window.BUILD_CONFIG

// 测试3: 检查编辑器是否初始化
document.querySelector('[contenteditable="true"]')

// 测试4: 手动触发测试函数
__testAndroidInput()
```

---

## 📊 日志类型说明

### Android Logcat（系统日志）
```
RTMode                  system_server    E  pkgName: app.yunke.pro has no permission
```
- 这是 Android 系统级别的日志
- 不会显示 JavaScript 的 console.log

### Chrome DevTools Console（JavaScript 日志）
```
🔍 [Android调试] compositionend 开始
✅ [Android调试] insertText 调用
```
- 这是我们添加的 JavaScript 调试日志
- **必须**在 Chrome DevTools Console 中查看

---

## 🎯 下一步

1. **先确认能看到启动日志**：
   - 打开应用
   - 在 Chrome DevTools Console 中查看是否有启动日志
   - 如果能看到，说明日志系统正常

2. **然后测试输入日志**：
   - 输入中文
   - 查看 Console 中的日志
   - 告诉我看到了什么日志

3. **如果看不到任何日志**：
   - 检查 Chrome DevTools 是否成功连接
   - 检查代码是否重新构建
   - 尝试手动运行 `__testAndroidInput()` 函数

---

## 💡 快速测试命令

在 Chrome DevTools Console 中运行：

```javascript
// 测试日志系统
console.log('测试日志');

// 测试应用状态
console.log('BUILD_CONFIG:', window.BUILD_CONFIG);
console.log('编辑区域:', document.querySelector('[contenteditable="true"]'));

// 测试输入事件监听
document.addEventListener('compositionstart', () => console.log('✅ compositionstart 触发'));
document.addEventListener('compositionend', (e) => console.log('✅ compositionend 触发', e.data));
document.addEventListener('beforeinput', (e) => console.log('✅ beforeinput 触发', e.data));
```

如果这些事件监听器能触发，说明事件系统正常。

---

## 📝 需要的信息

请提供：

1. **Chrome DevTools Console 中能看到什么日志？**
   - 应用启动时的日志
   - 输入时的日志

2. **手动测试函数的结果**：
   ```javascript
   __testAndroidInput()
   ```

3. **事件监听器是否触发**：
   - 在 Console 中运行上面的测试代码
   - 然后输入中文
   - 看是否有事件触发

有了这些信息，我们就能准确定位问题！

