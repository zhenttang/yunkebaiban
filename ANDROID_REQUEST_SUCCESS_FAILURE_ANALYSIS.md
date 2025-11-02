# Android 网络请求成功/失败差异分析

## 关键发现

根据日志分析，**不是所有请求都失败**，成功和失败的请求有明显的模式差异。

## 成功的请求

### 1. Socket.IO 请求（文档保存）

```
✅ [WorkerDocStorage] 云端保存成功
✅ [DocFrontend.save] 保存成功！
```

**成功的请求类型：**
- **Socket.IO WebSocket/polling 连接**
- 文档同步 (`space:push-doc-update`)
- 实时协作功能

**为什么成功：**
- Socket.IO 使用 WebSocket 或 polling 传输协议
- WebSocket 协议**不受 CORS 限制**
- 即使从 `http://localhost` 连接到 `http://ykbaiban.yckeji0316.cn`，WebSocket 连接也是允许的

**代码位置：**
```typescript
// packages/common/nbstore/src/impls/cloud/doc.ts
// 使用 Socket.IO
const result = await this.connection.inner.socket.emitWithAck('space:push-doc-update', requestData);
```

### 2. 部分字体文件

```
Handling local request: http://localhost/fonts/Inter-Light-BETA.woff2 ✅
Handling local request: http://localhost/fonts/Satoshi-Light.woff2 ✅
```

**成功的字体：**
- 这些字体文件**存在于本地 assets 中**
- Capacitor 能够从本地 assets 加载

## 失败的请求

### 1. HTTP REST API 请求（CORS 错误）

```
❌ CORS错误: Access to fetch at 'http://ykbaiban.yckeji0316.cn/api/auth/session' 
from origin 'http://localhost' has been blocked by CORS policy
```

**失败的请求类型：**
- **原生 fetch API** 发起的 HTTP 请求
- REST API 端点（`/api/auth/session`, `/api/notifications/count`, `/api/workspaces`）
- 需要 CORS 预检请求（OPTIONS）

**为什么失败：**
1. **CORS 预检请求失败**
   - 浏览器 WebView 发送 OPTIONS 预检请求
   - 服务器没有返回正确的 CORS 头
   - 预检请求失败，实际请求被阻止

2. **请求方式触发预检**
   - 使用自定义 headers（如 `Authorization`, `Content-Type: application/json`）
   - 跨域请求
   - 触发 CORS 预检

**代码位置：**
```typescript
// packages/frontend/core/src/modules/cloud/services/fetch.ts
const response = await globalThis.fetch(url, {
  ...init,
  signal: abortController.signal,
  headers,
  // 没有设置 mode: 'no-cors'，所以会触发 CORS 检查
});
```

### 2. HTTP REST API 请求（超时）

```
❌ 网络异常 (60001ms): timeout URL: http://ykbaiban.yckeji0316.cn/api/auth/session
```

**为什么超时：**
1. CORS 预检请求失败后，浏览器可能**等待超时**
2. 网络不稳定
3. 服务器响应慢

### 3. 部分字体文件

```
❌ Unable to open asset URL: http://localhost/fonts/Inter-Regular.woff2
❌ Unable to open asset URL: http://localhost/fonts/Kalam-Regular.woff2
```

**失败的字体：**
- 这些字体文件**不存在于本地 assets 中**
- Capacitor 将 CDN URL 转换为 `http://localhost/fonts/...`
- 尝试从本地 assets 加载，但文件不存在

## 详细对比分析

### Socket.IO vs HTTP Fetch

| 特性 | Socket.IO | HTTP Fetch |
|------|-----------|------------|
| 协议 | WebSocket / Polling | HTTP/HTTPS |
| CORS 限制 | ❌ 不受限制 | ✅ 受限制 |
| 预检请求 | ❌ 不需要 | ✅ 需要（复杂请求） |
| 成功案例 | ✅ 文档保存成功 | ❌ API 请求失败 |
| 失败原因 | - | CORS 预检失败 |

### 字体文件成功/失败对比

| 字体文件 | 状态 | 原因 |
|---------|------|------|
| `Inter-Light-BETA.woff2` | ✅ 成功 | 存在于本地 assets |
| `Inter-Regular.woff2` | ❌ 失败 | 不存在于本地 assets |
| `Kalam-Regular.woff2` | ❌ 失败 | 不存在于本地 assets |
| `Satoshi-Light.woff2` | ✅ 成功 | 存在于本地 assets |

## 根本原因

### 1. Socket.IO 请求成功

**原因：**
- Socket.IO 使用 WebSocket 协议，不受 CORS 限制
- 即使从 `http://localhost` 连接到外部服务器，WebSocket 连接也是允许的

**证据：**
```typescript
// packages/common/nbstore/src/impls/cloud/socket.ts
transports: ['polling', 'websocket'], // 强制polling优先
```

### 2. HTTP Fetch 请求失败

**原因：**
1. **CORS 预检请求失败**
   - 浏览器发送 OPTIONS 预检请求
   - 服务器没有返回 `Access-Control-Allow-Origin` 头
   - 预检请求失败，实际请求被阻止

2. **触发预检的条件**
   - 跨域请求（`http://localhost` → `http://ykbaiban.yckeji0316.cn`）
   - 使用自定义 headers（`Authorization`, `Content-Type: application/json`）
   - 非简单请求（POST/PUT/DELETE + JSON）

3. **为什么需要预检**
   - 浏览器安全策略
   - 防止恶意网站访问用户数据

### 3. 字体文件部分失败

**原因：**
1. **Capacitor 配置影响**
   - `server.hostname: 'localhost'` 导致外部 URL 被转换
   - 外部 HTTPS URL (`https://cdn.yunke.pro/fonts/...`) 被转换为 `http://localhost/fonts/...`

2. **本地资源不完整**
   - 部分字体文件在构建时被打包到 assets
   - 部分字体文件没有被打包
   - 只有打包到 assets 的字体才能成功加载

## 解决方案

### 方案 1：修复 HTTP Fetch CORS 问题（推荐）

#### 选项 A：启用 CapacitorHttp 插件（最佳）

```typescript
// packages/frontend/apps/android/capacitor.config.ts
plugins: {
  CapacitorHttp: {
    enabled: true, // 改为 true
  },
}
```

**优势：**
- 绕过 CORS 限制
- 使用原生 HTTP 客户端
- 更好的性能和错误处理

#### 选项 B：修改 fetch 请求，添加 mode 选项

```typescript
// packages/frontend/core/src/modules/cloud/services/fetch.ts
const response = await globalThis.fetch(url, {
  ...init,
  signal: abortController.signal,
  headers,
  // Android 环境下使用 no-cors（但会限制响应访问）
  mode: isAndroid ? 'no-cors' : 'cors',
});
```

**注意：** `no-cors` 模式会限制响应访问，可能不适用于需要读取响应体的请求。

### 方案 2：修复字体文件加载

#### 选项 A：Android 环境下保持使用 CDN URL

```typescript
// blocksuite/yunke/shared/src/services/font-loader/font-loader-service.ts
const isAndroid = typeof window !== 'undefined' && 
  ((window as any).BUILD_CONFIG?.isAndroid || 
   (window as any).Capacitor?.getPlatform?.() === 'android');

function processFontUrl(url: string): string {
  // Android 环境下保持绝对 URL
  if (isAndroid && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return url;
}
```

#### 选项 B：将所有字体文件打包到本地 assets

将缺失的字体文件复制到 `packages/frontend/apps/android/App/app/src/main/assets/fonts/` 目录。

## 总结

### 为什么部分请求成功？

1. **Socket.IO 请求成功**：因为 WebSocket 协议不受 CORS 限制
2. **HTTP Fetch 请求失败**：因为受 CORS 限制，预检请求失败
3. **部分字体成功**：因为存在于本地 assets
4. **部分字体失败**：因为不存在于本地 assets

### 核心问题

1. **CORS 策略**：浏览器 WebView 的 CORS 策略阻止了跨域 HTTP 请求
2. **字体资源**：Capacitor 将外部 URL 转换为 localhost，但本地资源不完整

### 建议修复优先级

1. **高优先级**：启用 CapacitorHttp 插件，解决 HTTP API 请求的 CORS 问题
2. **中优先级**：修复字体文件加载，保持使用 CDN URL 或打包所有字体文件
3. **低优先级**：优化错误处理和超时配置

## 测试建议

### 验证 Socket.IO 请求

1. 创建或编辑文档
2. 检查是否成功保存到云端
3. 验证实时协作功能

### 验证 HTTP API 请求

1. 登录/认证请求
2. 获取用户信息
3. 获取工作区列表
4. 通知数量请求

### 验证字体文件

1. 检查所有字体是否正常加载
2. 验证字体显示效果
3. 测试字体切换功能

## 相关文件

- `packages/frontend/apps/android/capacitor.config.ts` - Capacitor 配置
- `packages/frontend/core/src/modules/cloud/services/fetch.ts` - HTTP Fetch 服务
- `packages/common/nbstore/src/impls/cloud/doc.ts` - Socket.IO 文档存储
- `packages/common/nbstore/src/impls/cloud/socket.ts` - Socket.IO 连接
- `blocksuite/yunke/shared/src/services/font-loader/font-loader-service.ts` - 字体加载器

