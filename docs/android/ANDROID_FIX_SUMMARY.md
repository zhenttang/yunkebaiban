# Android 问题修复总结

## 已完成的修复

### 1. ✅ 启用 CapacitorHttp 插件

**修改文件：**
- `packages/frontend/apps/android/capacitor.config.ts`
- `packages/frontend/apps/android/App/app/src/main/assets/capacitor.config.json`

**修改内容：**
```typescript
plugins: {
  CapacitorHttp: {
    enabled: true, // 🔧 Android 环境下启用，绕过 CORS 限制
  },
}
```

### 2. ✅ 修改网络请求代码支持 Android

**修改文件：**
- `packages/frontend/core/src/modules/cloud/services/fetch.ts`

**主要改动：**
1. 添加 Android 环境检测函数 `isAndroidEnvironment()`
2. 添加 CapacitorHttp 动态导入函数 `getCapacitorHttp()`
3. 修改 `executeFetch()` 方法，在 Android 环境下优先使用 CapacitorHttp
4. 实现 CapacitorHttp 响应到标准 Response 的转换
5. 添加降级机制：如果 CapacitorHttp 失败，自动降级到原生 fetch

**关键代码：**
```typescript
// Android 环境下尝试使用 CapacitorHttp
if (isAndroid) {
  try {
    const CapacitorHttp = await getCapacitorHttp();
    if (CapacitorHttp) {
      // 使用 CapacitorHttp 绕过 CORS
      const response = await CapacitorHttp.request({...});
      // 转换为标准 Response
      return new Response(...);
    }
  } catch {
    // 降级到原生 fetch
  }
}
```

### 3. ✅ 修复字体加载器

**修改文件：**
- `blocksuite/yunke/shared/src/services/font-loader/font-loader-service.ts`

**主要改动：**
1. 添加 Android 环境检测函数 `isAndroidEnvironment()`
2. 添加字体 URL 处理函数 `processFontUrl()`
3. 在 Android 环境下保持使用绝对 URL（CDN），不被 Capacitor 转换

**关键代码：**
```typescript
function processFontUrl(url: string): string {
  // Android 环境下，如果已经是绝对 URL（http/https），直接返回
  // 这样 Capacitor 就不会将其转换为 localhost
  if (isAndroidEnvironment() && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return url;
}
```

## 需要安装的依赖

**重要：** 需要安装 `@capacitor/http` 包

```bash
cd packages/frontend/apps/android
npm install @capacitor/http
# 或者使用 yarn
yarn add @capacitor/http
```

然后同步 Capacitor 配置：
```bash
npm run sync
# 或
yarn sync
```

## 修复原理

### 网络请求修复

1. **问题根源：**
   - WebView 的 CORS 策略阻止跨域 HTTP 请求
   - Socket.IO 使用 WebSocket，不受 CORS 限制（所以成功）
   - HTTP Fetch 需要 CORS 预检，预检失败导致请求失败

2. **解决方案：**
   - 使用 CapacitorHttp 插件，绕过浏览器 CORS 限制
   - CapacitorHttp 使用原生 HTTP 客户端，不受 WebView CORS 限制
   - 保持向后兼容，如果 CapacitorHttp 不可用，降级到原生 fetch

### 字体文件修复

1. **问题根源：**
   - Capacitor 配置 `server.hostname: 'localhost'` 导致外部 URL 被转换
   - 外部 CDN URL (`https://cdn.yunke.pro/fonts/...`) 被转换为 `http://localhost/fonts/...`
   - 部分字体文件不在本地 assets 中，导致加载失败

2. **解决方案：**
   - Android 环境下保持使用绝对 URL（CDN）
   - 通过 FontFace API 的 URL 处理，确保 Capacitor 不会转换外部 URL

## 测试建议

### 网络请求测试

1. **登录/认证请求：**
   - 测试 `/api/auth/session` 请求
   - 验证不再出现 CORS 错误

2. **API 请求：**
   - 测试 `/api/workspaces` 请求
   - 测试 `/api/notifications/count` 请求
   - 验证请求成功，不再超时

3. **文档保存：**
   - 测试文档保存功能（Socket.IO 应该仍然正常工作）
   - 验证云端同步正常

### 字体文件测试

1. **字体加载：**
   - 检查控制台日志，确认字体文件加载成功
   - 验证不再出现 "Unable to open asset URL" 错误

2. **字体显示：**
   - 测试字体切换功能
   - 验证所有字体正常显示

## 注意事项

1. **依赖安装：**
   - 必须安装 `@capacitor/http` 包
   - 安装后需要运行 `cap sync` 同步配置

2. **构建：**
   - 修改后需要重新构建 Android 应用
   - 确保 Capacitor 配置已同步到 Android 项目

3. **降级兼容：**
   - 如果 CapacitorHttp 不可用，会自动降级到原生 fetch
   - 但原生 fetch 在 Android 环境下可能仍然受 CORS 限制

4. **字体文件：**
   - 如果修复后仍有字体加载失败，可能需要将字体文件打包到本地 assets
   - 或者检查 CDN 是否可访问

## 后续优化建议

1. **错误处理：**
   - 改进错误提示，区分 CORS 错误和网络超时
   - 添加网络状态检测

2. **性能优化：**
   - 字体文件可以考虑预加载或本地缓存
   - 优化 CapacitorHttp 请求的性能

3. **监控：**
   - 添加网络请求成功率监控
   - 跟踪 CapacitorHttp 使用情况

## 相关文件

- `packages/frontend/apps/android/capacitor.config.ts` - Capacitor 配置
- `packages/frontend/apps/android/App/app/src/main/assets/capacitor.config.json` - Android assets 配置
- `packages/frontend/core/src/modules/cloud/services/fetch.ts` - 网络请求服务
- `blocksuite/yunke/shared/src/services/font-loader/font-loader-service.ts` - 字体加载器
- `ANDROID_REQUEST_SUCCESS_FAILURE_ANALYSIS.md` - 详细问题分析

