# Android 应用问题分析报告

## 问题概述

根据日志分析，Android 应用存在两个主要问题：

### 1. 字体文件获取失败

**错误现象：**
```
Unable to open asset URL: http://localhost/fonts/Inter-Regular.woff2
Unable to open asset URL: http://localhost/fonts/Inter-LightItalic-BETA.woff2
Unable to open asset URL: http://localhost/fonts/Kalam-Regular.woff2
Unable to open asset URL: http://localhost/fonts/Lora-BoldItalic.woff2
```

**根本原因：**
- 字体配置使用 CDN URL：`https://cdn.yunke.pro/fonts/...`
- Capacitor Android 配置中 `server.hostname: 'localhost'` 导致所有外部 HTTPS 请求被转换为 `http://localhost`
- Capacitor 无法从本地 assets 中找到这些字体文件

**影响范围：**
- Inter 字体族（Regular, LightItalic-BETA）
- Kalam 字体族（Regular）
- Lora 字体族（BoldItalic）

### 2. 网络请求 CORS 和超时问题

**错误现象：**

#### CORS 错误：
```
Access to fetch at 'http://ykbaiban.yckeji0316.cn/api/auth/session' 
from origin 'http://localhost' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

#### 请求超时：
```
🔴 网络异常 (60001ms): timeout URL: http://ykbaiban.yckeji0316.cn/api/auth/session
🔴 网络异常 (60002ms): timeout URL: http://ykbaiban.yckeji0316.cn/api/notifications/count
🔴 网络异常 (60003ms): timeout URL: http://ykbaiban.yckeji0316.cn/api/workspaces/...
```

**根本原因：**

1. **CORS 问题：**
   - 应用运行在 `http://localhost`（Capacitor 配置）
   - API 请求目标是 `http://ykbaiban.yckeji0316.cn`
   - 浏览器 WebView 的 CORS 策略阻止了跨域请求
   - `CapacitorHttp` 插件被禁用（`enabled: false`），使用的是原生 `fetch` API

2. **超时问题：**
   - 默认超时时间：60秒（`DEFAULT_TIMEOUT.request: 60000`）
   - 网络不稳定或服务器响应慢
   - 可能是 CORS 预检请求失败导致的延迟

## 解决方案

### 方案 1：修复字体文件加载（推荐）

#### 1.1 为 Android 环境使用绝对 URL

修改字体加载逻辑，在 Android 环境下保持使用 CDN URL：

```typescript
// blocksuite/yunke/shared/src/services/font-loader/font-loader-service.ts
```

#### 1.2 或者：将字体文件打包到本地 assets

将常用字体文件复制到 Android assets 目录。

### 方案 2：修复网络请求问题（推荐）

#### 2.1 启用 CapacitorHttp 插件（最佳方案）

CapacitorHttp 插件可以绕过 CORS 限制：

```typescript
// packages/frontend/apps/android/capacitor.config.ts
plugins: {
  CapacitorHttp: {
    enabled: true, // 改为 true
  },
}
```

然后修改网络请求代码，在 Android 环境下使用 `@capacitor/http`。

#### 2.2 或者：配置 CORS 代理

在 `capacitor.config.ts` 中添加代理配置。

#### 2.3 或者：调整超时时间

针对 Android 环境增加超时时间，或实现更智能的重试机制。

## 详细分析

### 字体文件问题详细分析

**当前配置：**
```typescript
// blocksuite/yunke/shared/src/services/font-loader/config.ts
{
  font: FontFamily.Inter,
  url: 'https://cdn.yunke.pro/fonts/Inter-Regular.woff2',
  ...
}
```

**Capacitor 配置：**
```typescript
// packages/frontend/apps/android/capacitor.config.ts
server: {
  hostname: 'localhost',
  androidScheme: 'http',
}
```

**问题链路：**
1. 字体加载器创建 `FontFace` 对象，使用 CDN URL
2. Capacitor Android WebView 拦截请求
3. 外部 HTTPS URL 被转换为 `http://localhost/fonts/...`
4. Capacitor 尝试从本地 assets 加载，但文件不存在
5. 加载失败

### 网络请求问题详细分析

**当前配置：**
```typescript
// packages/frontend/apps/android/capacitor.config.ts
plugins: {
  CapacitorHttp: {
    enabled: false, // 禁用原生 HTTP
  },
}
```

**网络请求流程：**
```typescript
// packages/frontend/core/src/modules/cloud/services/fetch.ts
fetch = async (input: string, init?: FetchInit): Promise<Response> => {
  const url = this.buildRequestUrl(input); // 构建完整 URL
  const response = await globalThis.fetch(url, {...}); // 使用原生 fetch
}
```

**问题链路：**
1. 应用运行在 `http://localhost`（Capacitor server 配置）
2. API 请求目标是 `http://ykbaiban.yckeji0316.cn/api/...`
3. 浏览器 WebView 执行 CORS 预检请求（OPTIONS）
4. 服务器没有返回正确的 CORS 头
5. 预检请求失败，实际请求被阻止
6. 错误显示为 "Failed to fetch" 或超时

## 修复优先级

### 高优先级（必须修复）

1. ✅ **启用 CapacitorHttp 插件**
   - 解决 CORS 问题
   - 提供更好的网络请求控制
   - 支持 Android 原生网络能力

2. ✅ **修复字体加载**
   - 方案 A：Android 环境下保持使用 CDN URL（不转换）
   - 方案 B：将字体文件打包到本地 assets

### 中优先级（建议修复）

3. ⚠️ **优化超时配置**
   - Android 环境下增加超时时间
   - 实现更智能的重试机制
   - 添加网络状态检测

4. ⚠️ **改进错误处理**
   - 区分 CORS 错误和网络超时
   - 提供更友好的错误提示
   - 实现离线模式检测

## 测试建议

### 字体文件测试

1. 检查所有字体文件是否正常加载
2. 验证字体显示效果
3. 测试字体切换功能

### 网络请求测试

1. 正常网络环境下的 API 请求
2. 弱网络环境下的请求超时处理
3. 离线环境下的错误处理
4. CORS 相关请求的验证

## 相关文件

- `packages/frontend/apps/android/capacitor.config.ts` - Capacitor 配置
- `blocksuite/yunke/shared/src/services/font-loader/config.ts` - 字体配置
- `blocksuite/yunke/shared/src/services/font-loader/font-loader-service.ts` - 字体加载器
- `packages/frontend/core/src/modules/cloud/services/fetch.ts` - 网络请求服务
- `packages/common/config/src/network-config.ts` - 网络配置管理

