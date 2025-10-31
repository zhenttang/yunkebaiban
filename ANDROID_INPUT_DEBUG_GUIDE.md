# Android 输入法调试指南

## 当前问题

点击输入区域后，输入法没有弹出，Android 日志显示：
```
E  pkgName: app.yunke.pro has no permission
```

## 已实施的修复

### 1. ✅ AndroidManifest.xml 修复
已添加 `android:windowSoftInputMode="adjustResize"` 到 MainActivity

```xml
<activity
    android:name=".MainActivity"
    android:windowSoftInputMode="adjustResize"
    ...>
</activity>
```

### 2. ✅ InputMode 修复
已修复 keyboard-toolbar 组件，不再设置 `inputMode='none'`

## 关于 "RTMode" 错误

### 这是什么？
- **RTMode** 是某些 Android 设备厂商（小米、vivo、OPPO 等）的系统优化服务
- "has no permission" 通常是**警告而非错误**
- 通常不影响应用核心功能

### 可能的原因
1. 设备制造商的性能监控服务
2. 电池优化服务
3. 应用启动优化服务

### 如何确认是否影响输入
在 Android Studio 的 Logcat 中过滤其他错误：
```
# 过滤掉 RTMode
adb logcat | grep -v RTMode

# 或查看 WebView 相关日志
adb logcat | grep -E "chromium|Console|WebView"
```

## 调试步骤

### 步骤 1: 重新构建和同步
```bash
cd D:\Documents\yunkebaiban\baibanfront

# 完全清理构建
yarn workspace @yunke/android build

# 同步到 Android 项目
yarn sync:android

# 在 Android Studio 中重新构建
# 或使用命令行：
cd packages/frontend/apps/android/App
./gradlew clean
./gradlew assembleDebug
```

### 步骤 2: 检查 WebView 日志
在 Android Studio Logcat 中搜索：
```
Tag: chromium
Tag: Console
Tag: WebView
```

查看是否有 JavaScript 错误或 WebView 配置问题。

### 步骤 3: Chrome 远程调试
```bash
# 1. 连接设备并启动应用
# 2. 在 Chrome 打开
chrome://inspect

# 3. 找到你的 WebView
# 4. 在控制台测试：
document.activeElement.contentEditable
document.activeElement.inputMode
document.activeElement.focus()

# 5. 手动触发输入法：
const el = document.querySelector('[contenteditable="true"]');
el.focus();
el.click();
```

### 步骤 4: 测试原生 HTML
在 Chrome DevTools 控制台创建测试元素：
```javascript
// 创建测试输入框
const testDiv = document.createElement('div');
testDiv.contentEditable = true;
testDiv.inputMode = 'text';
testDiv.style.cssText = 'border:1px solid red;padding:20px;margin:20px;';
testDiv.textContent = '点击这里测试输入';
document.body.appendChild(testDiv);
testDiv.focus();

// 检查是否能弹出输入法
```

### 步骤 5: 检查 Capacitor Keyboard 插件
在 Chrome DevTools 控制台：
```javascript
// 检查 Keyboard 插件是否可用
import { Keyboard } from '@capacitor/keyboard';

// 手动显示键盘
Keyboard.show().then(() => {
  console.log('✅ 键盘显示成功');
}).catch(err => {
  console.error('❌ 键盘显示失败:', err);
});

// 检查键盘状态
Keyboard.getResizeMode().then(mode => {
  console.log('键盘调整模式:', mode);
});
```

## 可能的解决方案

### 方案 1: 修改 WebView 配置

编辑 `packages/frontend/apps/android/App/app/src/main/java/.../MainActivity.kt`（或 .java）

添加 WebView 配置：
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // 配置 WebView
    val webView = bridge.webView
    val settings = webView.settings
    
    // 确保 JavaScript 可以处理输入
    settings.javaScriptEnabled = true
    settings.domStorageEnabled = true
    
    // 输入法相关设置
    webView.isFocusable = true
    webView.isFocusableInTouchMode = true
    webView.requestFocus()
}
```

### 方案 2: 添加输入法权限（如果需要）

在 `AndroidManifest.xml` 中添加（通常不需要）：
```xml
<!-- 输入法相关权限（可选） -->
<uses-permission android:name="android.permission.WRITE_SETTINGS" 
    tools:ignore="ProtectedPermissions" />
```

### 方案 3: 修改 capacitor.config.ts

调整键盘配置：
```typescript
android: {
  // ...
  adjustMarginsForEdgeToEdge: 'force',
  webContentsDebuggingEnabled: true,
  allowMixedContent: true,
  captureInput: true,  // 或尝试 false
},
plugins: {
  Keyboard: {
    resize: 'body',  // 或 'ionic', 'native'
    style: 'dark',   // 或 'light'
    resizeOnFullScreen: true,
  },
},
```

### 方案 4: 禁用 RTMode 警告的影响

如果是特定厂商设备，可以尝试：

1. **小米设备**：
   - 设置 → 应用管理 → 权限 → 自启动管理 → 允许
   - 设置 → 省电与电池 → 无限制

2. **华为/荣耀设备**：
   - 设置 → 应用 → 应用启动管理 → 手动管理
   - 允许所有权限

3. **OPPO/vivo 设备**：
   - 设置 → 电池 → 应用耗电管理 → 允许后台运行

## 验证输入法是否工作

### 测试检查表
- [ ] 点击编辑区域后，软键盘弹出
- [ ] 能切换到中文输入法
- [ ] 能输入中文字符
- [ ] 字符正确显示在编辑器中
- [ ] 删除、换行等功能正常

### 日志检查
```bash
# 查看 WebView 控制台日志
adb logcat | grep "Console"

# 查看输入法相关日志
adb logcat | grep -i "keyboard\|input\|ime"

# 查看 Capacitor 日志
adb logcat | grep "Capacitor"
```

## 临时测试方案

如果还是不行，创建一个简单的测试页面：

在 `packages/frontend/apps/android/src/` 创建 `test-input.html`：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>输入法测试</title>
</head>
<body>
  <h1>输入法测试</h1>
  
  <h2>普通输入框</h2>
  <input type="text" placeholder="测试普通输入框" style="width:100%;padding:20px;font-size:20px;">
  
  <h2>ContentEditable</h2>
  <div contenteditable="true" 
       style="border:1px solid #ccc;padding:20px;min-height:100px;font-size:20px;">
    点击这里输入文字
  </div>
  
  <h2>Textarea</h2>
  <textarea placeholder="测试 textarea" 
            style="width:100%;height:100px;padding:20px;font-size:20px;"></textarea>
  
  <script>
    // 日志所有焦点事件
    document.querySelectorAll('input, [contenteditable], textarea').forEach(el => {
      el.addEventListener('focus', () => {
        console.log('✅ 元素获得焦点:', el.tagName, {
          contentEditable: el.contentEditable,
          inputMode: el.inputMode,
        });
      });
      
      el.addEventListener('click', () => {
        console.log('🖱️ 元素被点击:', el.tagName);
      });
      
      el.addEventListener('input', (e) => {
        console.log('⌨️ 输入事件:', e.data);
      });
    });
  </script>
</body>
</html>
```

## 下一步

1. 重新构建并同步 Android 项目
2. 使用 Chrome DevTools 远程调试
3. 在控制台测试 `document.activeElement` 和 `Keyboard` API
4. 如果还有问题，提供：
   - 设备型号和 Android 版本
   - 完整的 Logcat 日志（过滤 RTMode）
   - Chrome DevTools 控制台的截图

## 联系调试信息

需要提供的信息：
- 设备品牌和型号（小米/华为/OPPO/vivo/其他）
- Android 版本
- 输入法类型（搜狗/Google Pinyin/百度/讯飞等）
- Chrome DevTools 中 `document.activeElement` 的完整信息
- 是否在其他 Android 设备上测试过

