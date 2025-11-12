# Android 应用问题修复方案

## 问题分析总结

### 问题 1：字体文件获取失败

**症状：**
```
Unable to open asset URL: http://localhost/fonts/Inter-Regular.woff2
```

**原因：**
- 字体配置使用 CDN URL：`https://cdn.yunke.pro/fonts/...`
- Capacitor Android 配置 `server.hostname: 'localhost'` 导致外部 HTTPS URL 被转换为 `http://localhost`
- Capacitor 尝试从本地 assets 加载，但文件不存在

**解决方案：**
修改字体加载逻辑，在 Android 环境下保持使用绝对 URL（CDN），不被 Capacitor 转换。

### 问题 2：网络请求 CORS 和超时

**症状：**
```
CORS错误: Access to fetch at 'http://ykbaiban.yckeji0316.cn/api/auth/session' 
from origin 'http://localhost' has been blocked by CORS policy

超时错误: 网络异常 (60001ms): timeout
```

**原因：**
1. CORS：应用运行在 `http://localhost`，API 在 `http://ykbaiban.yckeji0316.cn`，WebView 阻止跨域请求
2. CapacitorHttp 插件被禁用，使用原生 fetch，受 CORS 限制
3. 超时：60秒超时，网络不稳定或 CORS 失败导致延迟

**解决方案：**
启用 CapacitorHttp 插件，绕过 CORS 限制，或调整 Capacitor 配置允许外部请求。

## 修复步骤

### 步骤 1：修复字体文件加载

#### 方案 A：修改字体加载器（推荐）

在 Android 环境下，字体 URL 应该保持为绝对 URL，不被 Capacitor 转换。

修改 `blocksuite/yunke/shared/src/services/font-loader/font-loader-service.ts`：

```typescript
import { createIdentifier } from '@blocksuite/global/di';
import { IS_FIREFOX } from '@blocksuite/global/env';
import { LifeCycleWatcher } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import type { FontConfig } from './config.js';

// 检测是否为 Android 环境
const isAndroid = typeof window !== 'undefined' && 
  ((window as any).BUILD_CONFIG?.isAndroid || 
   (window as any).Capacitor?.getPlatform?.() === 'android');

// 处理字体 URL，Android 环境下保持绝对 URL
function processFontUrl(url: string): string {
  // 如果已经是绝对 URL（http/https），在 Android 环境下直接返回
  if (isAndroid && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return url;
}

const initFontFace = IS_FIREFOX
  ? ({ font, weight, url, style }: FontConfig) =>
      new FontFace(`"${font}"`, `url(${processFontUrl(url)})`, {
        weight,
        style,
      })
  : ({ font, weight, url, style }: FontConfig) =>
      new FontFace(font, `url(${processFontUrl(url)})`, {
        weight,
        style,
      });

export class FontLoaderService extends LifeCycleWatcher {
  static override readonly key = 'font-loader';

  readonly fontFaces: FontFace[] = [];

  get ready() {
    return Promise.all(this.fontFaces.map(fontFace => fontFace.loaded));
  }

  load(fonts: FontConfig[]) {
    this.fontFaces.push(
      ...fonts.map(font => {
        const fontFace = initFontFace(font);
        document.fonts.add(fontFace);
        fontFace.load().catch(console.error);
        return fontFace;
      })
    );
  }

  override mounted() {
    const config = this.std.getOptional(FontConfigIdentifier);
    if (config) {
      this.load(config);
    }
  }

  override unmounted() {
    this.fontFaces.forEach(fontFace => document.fonts.delete(fontFace));
    this.fontFaces.splice(0, this.fontFaces.length);
  }
}

export const FontConfigIdentifier =
  createIdentifier<FontConfig[]>('YunkeFontConfig');

export const FontConfigExtension = (
  fontConfig: FontConfig[]
): ExtensionType => ({
  setup: di => {
    di.addImpl(FontConfigIdentifier, () => fontConfig);
  },
});
```

#### 方案 B：修改 Capacitor 配置

如果方案 A 不起作用，可以尝试修改 Capacitor 配置，允许外部资源：

在 `packages/frontend/apps/android/capacitor.config.ts` 中添加：

```typescript
android: {
  path: 'App',
  buildOptions: {
    // ... 现有配置
  },
  adjustMarginsForEdgeToEdge: 'force',
  webContentsDebuggingEnabled: true,
  allowMixedContent: true,
  captureInput: true,
  // 添加：允许外部资源加载
  allowsLinkPreview: true,
},
```

### 步骤 2：修复网络请求问题

#### 方案 A：启用 CapacitorHttp 插件（强烈推荐）

修改 `packages/frontend/apps/android/capacitor.config.ts`：

```typescript
plugins: {
  CapacitorHttp: {
    enabled: true, // 改为 true，启用原生 HTTP 插件
  },
  CapacitorCookies: {
    enabled: false,
  },
},
```

然后修改网络请求代码，在 Android 环境下使用 `@capacitor/http`：

1. 安装依赖：
```bash
npm install @capacitor/http
```

2. 修改 `packages/frontend/core/src/modules/cloud/services/fetch.ts`：

```typescript
import { Http } from '@capacitor/http';

// 检测是否为 Android 环境
const isAndroid = typeof window !== 'undefined' && 
  ((window as any).BUILD_CONFIG?.isAndroid || 
   (window as any).Capacitor?.getPlatform?.() === 'android');

export class FetchService extends Service {
  // ... 现有代码 ...

  /**
   * 执行单次fetch请求（内部方法）
   */
  private async executeFetch(
    url: string, 
    init: FetchInit, 
    abortController: AbortController
  ): Promise<Response> {
    const timeout = init?.timeout ?? DEFAULT_TIMEOUT.request;
    
    // Android 环境下使用 CapacitorHttp
    if (isAndroid && (window as any).Capacitor) {
      try {
        const headers = this.prepareHeaders(url, init.headers);
        
        // 使用 CapacitorHttp 绕过 CORS
        const response = await Http.request({
          method: (init.method as any) || 'GET',
          url,
          headers,
          data: init.body,
          // 注意：CapacitorHttp 不支持 AbortController，需要自己实现超时
        });

        // 将 CapacitorHttp 响应转换为标准 Response
        return new Response(JSON.stringify(response.data), {
          status: response.status,
          statusText: response.statusText || 'OK',
          headers: new Headers(response.headers),
        });
      } catch (error: any) {
        throw new UserFriendlyError({
          status: error.status || 500,
          code: 'NETWORK_ERROR',
          type: 'NETWORK_ERROR',
          name: 'NETWORK_ERROR',
          message: error.message || '网络请求失败',
        });
      }
    }

    // 非 Android 环境使用原生 fetch
    const timeoutId = setTimeout(() => {
      abortController.abort('timeout');
    }, timeout);

    try {
      const headers = this.prepareHeaders(url, init.headers);
      
      const response = await globalThis.fetch(url, {
        ...init,
        signal: abortController.signal,
        headers,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      const errorMessage = err?.message || err?.toString() || String(err) || '网络连接失败';
      const errorStack = err?.stack || '';
      
      const isTimeout = errorMessage === 'timeout' || 
                       errorMessage.includes('timeout') ||
                       err?.name === 'AbortError';
      
      throw new UserFriendlyError({
        status: isTimeout ? 504 : 500,
        code: 'NETWORK_ERROR',
        type: 'NETWORK_ERROR',
        name: 'NETWORK_ERROR',
        message: isTimeout ? `请求超时（${timeout}ms）` : `网络错误: ${errorMessage}`,
        stacktrace: errorStack,
      });
    }
  }

  // ... 其余代码保持不变 ...
}
```

#### 方案 B：修改 Capacitor 配置允许外部请求

如果不想使用 CapacitorHttp，可以尝试修改 Capacitor 配置：

```typescript
server: {
  cleartext: true,
  allowMixedContent: true,
  hostname: 'localhost',
  androidScheme: 'http',
  iosScheme: 'http',
  // 添加：允许所有外部请求
  // 注意：这可能会影响安全性，建议使用方案 A
},
```

### 步骤 3：优化超时配置（可选）

针对 Android 环境增加超时时间或实现更智能的重试机制：

修改 `packages/common/config/src/network-config.ts`：

```typescript
// 在 Android 环境下增加超时时间
export function getAndroidTimeout(): number {
  if (isAndroidEnvironment()) {
    return 120000; // 120秒
  }
  return 60000; // 60秒
}
```

然后在 `fetch.ts` 中使用：

```typescript
const timeout = init?.timeout ?? (isAndroid ? getAndroidTimeout() : DEFAULT_TIMEOUT.request);
```

## 测试验证

### 字体文件测试

1. 启动 Android 应用
2. 检查控制台日志，确认字体文件加载成功
3. 验证字体显示效果
4. 测试字体切换功能

### 网络请求测试

1. **正常网络环境：**
   - 测试 API 请求是否成功
   - 检查响应时间
   - 验证 CORS 错误是否消失

2. **弱网络环境：**
   - 测试请求超时处理
   - 验证重试机制

3. **离线环境：**
   - 测试错误处理
   - 验证离线模式提示

## 优先级

1. **高优先级：**
   - ✅ 启用 CapacitorHttp 插件（解决 CORS 问题）
   - ✅ 修复字体文件加载（保持 CDN URL）

2. **中优先级：**
   - ⚠️ 优化超时配置
   - ⚠️ 改进错误处理

3. **低优先级：**
   - 📝 添加网络状态检测
   - 📝 实现离线模式

## 注意事项

1. **安全性：** 启用 CapacitorHttp 后，确保 API 请求有适当的认证和授权
2. **性能：** 字体文件从 CDN 加载可能受网络影响，考虑添加本地缓存
3. **兼容性：** 确保修复不影响其他平台（Web、Electron、iOS）

## 相关文件

- `packages/frontend/apps/android/capacitor.config.ts` - Capacitor 配置
- `blocksuite/yunke/shared/src/services/font-loader/font-loader-service.ts` - 字体加载器
- `packages/frontend/core/src/modules/cloud/services/fetch.ts` - 网络请求服务
- `packages/common/config/src/network-config.ts` - 网络配置管理

