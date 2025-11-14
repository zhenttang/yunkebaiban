# 前端潜在问题分析（第二部分，静态检查）

> 仓库：`baibanfront`  
> 本文记录的是在同步类问题之外，通过静态代码阅读推导出的前端潜在 bug / 风险场景。并未通过自动化或人工测试逐一验证，只提供排查线索。

---

## 1. 数据透明度检测器统计不到真实的离线操作

### 简要结论

数据透明度模块的 `DataTransparencyDetector` 直接从 `localStorage` 读取离线操作记录，并按 `workspaceId` 字段过滤；  
而真正写入离线操作的是 `CloudStorageProvider`，它使用的是 `spaceId` 和 `spaceType` 字段。  

字段名不一致，导致检测器对“离线操作数量”的统计很可能永远为 0。

### 相关代码

- 离线操作写入：  
  文件：`packages/frontend/core/src/modules/cloud-storage/provider.tsx`

  ```ts
  interface OfflineOperation {
    id: string;
    docId: string;
    update: string; // Base64
    timestamp: number;
    spaceId: string;            // 这里是 spaceId
    spaceType: 'workspace' | 'userspace';
    sessionId: string;
    clientId: string | null;
  }

  const saveOfflineOperation = async (docId: string, update: Uint8Array) => {
    if (!currentWorkspaceId) return;

    const normalizedDocId = normalizeDocId(docId);
    const updateBase64 = await uint8ArrayToBase64(update);

    const operation: OfflineOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      docId: normalizedDocId,
      update: updateBase64,
      timestamp: Date.now(),
      spaceId: currentWorkspaceId,
      spaceType: 'workspace',
      sessionId: sanitizeSessionIdentifier(sessionId) ?? sessionId,
      clientId: sanitizeSessionIdentifier(clientIdRef.current),
    };

    const existing = safeStorage.getItem(OFFLINE_OPERATIONS_KEY);
    const operations: OfflineOperation[] = existing ? JSON.parse(existing) : [];
    operations.push(operation);
    safeStorage.setItem(OFFLINE_OPERATIONS_KEY, JSON.stringify(operations));
  };
  ```

- 数据透明度检测器中的读取：  
  文件：`packages/frontend/core/src/data-transparency/detector.ts`

  ```ts
  private async getOfflineOperationsSummary(workspaceId: string): Promise<{
    count: number;
    lastUpdated?: Date;
  }> {
    const operations = await this.getOfflineOperations(workspaceId);
    if (!operations.length) {
      return { count: 0 };
    }

    const lastUpdated = new Date(
      Math.max(...operations.map(op => op.timestamp || 0))
    );

    return {
      count: operations.length,
      lastUpdated,
    };
  }

  private async getOfflineOperations(workspaceId: string): Promise<{
    id: string;
    docId: string;
    timestamp: number;
    workspaceId: string;
  }[]> {
    const OFFLINE_OPERATIONS_KEY = 'cloud_storage_offline_operations';
    try {
      const existing = localStorage.getItem(OFFLINE_OPERATIONS_KEY);
      const operations = existing ? JSON.parse(existing) : [];
      // 使用 workspaceId 字段过滤
      return operations.filter((op: any) => op.workspaceId === workspaceId);
    } catch (error) {
      console.error('❌ [数据透明化] 读取离线操作失败:', error);
      return [];
    }
  }
  ```

### 可能触发场景

- 用户在某个工作区离线编辑，CloudStorageProvider 正常记录离线操作（`spaceId = 当前 workspaceId`）；
- 在“数据透明化”面板或相关页面查看该工作区的离线操作统计。

### 可能表现

- 数据透明度面板中的“离线操作”计数始终为 0；
- `lastUpdated` 一直为空；
- 同时，云存储管理器自身的离线操作计数/提示又显示确实存在离线记录，两者不一致。

> 另外，CloudStorageProvider 在 Electron 等环境可能通过 `__sharedStorage.globalState` 持久化离线操作，而 `DataTransparencyDetector` 只从 `localStorage` 读取，这在某些平台上会进一步导致读不到数据。

---

## 2. 调试日志导出可能包含未预期敏感信息

### 简要结论

console-homepage 模块提供了 `window.__APP_DEBUG__.exportLogs()` 调试命令，会导出包含 `localStorage` 和 `sessionStorage` 快照的 JSON 文件。  

虽然有简单过滤（排除 key 名中包含 `token` / `password` / `secret` 的项），但其它键名（如 `auth`、`session`、`profile` 等）下存储的数据会完整被导出，存在泄露隐私/敏感配置的风险。

### 相关代码

文件：`packages/frontend/core/src/modules/console-homepage/entities/console-homepage-manager.ts`

```ts
(window as any).__APP_DEBUG__ = {
  exportLogs: () => {
    const logs = this.collectConsoleLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  // ...其它调试命令
};

private collectConsoleLogs(): any[] {
  return [{
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    memory: 'memory' in performance ? (performance as any).memory : null,
    localStorage: this.getLocalStorageSnapshot(),
    sessionStorage: this.getSessionStorageSnapshot()
  }];
}

private getLocalStorageSnapshot(): Record<string, string> {
  const snapshot: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // 只保存非敏感信息
      if (!key.includes('token') && !key.includes('password') && !key.includes('secret')) {
        snapshot[key] = localStorage.getItem(key) || '';
      }
    }
  }
  return snapshot;
}
```

### 可能触发场景

- 为排查问题，开发或运维在用户浏览器执行 `window.__APP_DEBUG__.exportLogs()`，并将导出的 JSON 文件发给他人或上传到工单系统；
- 业务代码在 localStorage/sessionStorage 中保存了一些非公开信息，但 key 名没有包含 `token`/`password`/`secret` 字样。

### 可能表现

- 导出的调试日志文件中包含大量本地存储内容，其中可能混有不希望外泄的配置/状态/用户相关数据；
- 这类问题在用户视角不可见，但在安全审查/合规检查时会被认为是潜在风险。

---

## 3. 备用 Web Router 的超时提示可能反复弹出

### 简要结论

`packages/frontend/apps/web/src/router.tsx` 中实现了一套路由加载监控逻辑：  

- 通过 `router.subscribe` 记录路由进入 `loading` 状态的时间；
- 通过 `setInterval` 每秒检查是否超过 15 秒超时；
- 一旦超时，就创建一个带橙色背景的“路由加载超时”提示框，并 10 秒后移除。

但是超时后没有重置 `routeLoadStartTime`，如果路由一直处于 loading 状态，每秒都会新建一个提示框，看起来像“超时提示刷屏”。

### 相关代码

文件：`packages/frontend/apps/web/src/router.tsx`

```ts
let routeLoadStartTime: number | null = null;

router.subscribe(state => {
  if (state.state === 'loading' && !routeLoadStartTime) {
    routeLoadStartTime = Date.now();
  } else if (state.state !== 'loading' && routeLoadStartTime) {
    const loadTime = Date.now() - routeLoadStartTime;
    console.log(`✅ [Router] 路由加载完成: ${state.location.pathname} (耗时: ${loadTime}ms)`);
    routeLoadStartTime = null;
  }
});

const ROUTE_LOAD_TIMEOUT = 15000; // 15秒超时

const checkRouteTimeout = () => {
  if (routeLoadStartTime && Date.now() - routeLoadStartTime > ROUTE_LOAD_TIMEOUT) {
    console.error('⏰ [Router] 路由加载超时!', {
      timeout: ROUTE_LOAD_TIMEOUT,
      elapsed: Date.now() - routeLoadStartTime,
      pathname: window.location.pathname
    });

    const timeoutDiv = document.createElement('div');
    timeoutDiv.style.cssText = `...`;
    timeoutDiv.innerHTML = `... 路由加载超时 ...`;
    document.body.appendChild(timeoutDiv);

    setTimeout(() => {
      if (timeoutDiv.parentElement) {
        timeoutDiv.remove();
      }
    }, 10000);
  }
};

setInterval(checkRouteTimeout, 1000); 
```

### 可能触发场景

- 某个路由的 `loader` 或 lazy 模块加载一直未结束，`state.state` 长时间停留在 `'loading'`；
- 或 subscribe 状态机因异常未恢复到非 loading 状态。

### 可能表现

- 控制台每秒打印一次“路由加载超时”错误；
- 页面右上角不断弹出新的“路由加载超时”提示框（前一批 10 秒后消失，后一批又出现），类似“提示刷屏”；
- 只会在实际使用 `apps/web/src/router.tsx` 的场景下出现。目前主 Web 入口使用的是 `core/src/desktop/router.tsx`，因此这更像是备用实现里的潜在坑点。

---

## 4. 备用 Web Router 中登录路径大小写混乱

### 简要结论

同一个登录页面在不同 router 文件中使用了不同的路径大小写：

- 桌面主 router 使用 `/sign-in`；
- 备用 Web router 使用 `/sign-In` 和 `/signIn`。

React Router 路径匹配是大小写敏感的，如果在某个项目中误用了备用 Web router 而链接写成 `/sign-in`，就会出现“路径看起来对，但永远匹配不到”的情况。

### 相关代码

文件：`packages/frontend/apps/web/src/router.tsx`

```ts
{
  path: '/auth/:authType',
  lazy: () => import('@yunke/core/desktop/pages/auth/auth'),
},
{
  path: '/sign-In',
  lazy: () => import('@yunke/core/desktop/pages/auth/sign-in'),
},
// ...
{
  path: '/signIn',
  lazy: () => import('@yunke/core/desktop/pages/auth/sign-in'),
},
```

桌面 router：`packages/frontend/core/src/desktop/router.tsx`

```ts
{
  path: '/sign-in',
  lazy: () => import('./pages/auth/sign-in'),
},
```

### 可能触发场景

- 在某个新入口/实验项目中，开发者从习惯出发引入了 `apps/web/src/router.tsx` 的 router；
- 页面上的跳转链接/重定向路径写的是 `/sign-in`（参考了桌面 router）。

### 可能表现

- 点击“登录”按钮时，导航到 `/sign-in`，但 router 中没有该路径，于是落入 404 或直接空白；
- 控制台不一定有明显错误，只是路由表里没有匹配项。

---

## 5. AuthStore 的 token 回退策略可能导致跨服务混用

### 简要结论

认证存储 `AuthStore` 在读取 token 时，优先从当前 server 相关的 `GlobalState` 取；如果没有，则回退到 `localStorage` 中的 `yunke-admin-token`。  

在多 server 场景下，这种回退策略有可能让“某个 server 的请求”使用另一 server 的 admin token。

### 相关代码

文件：`packages/frontend/core/src/modules/cloud/stores/auth.ts`

```ts
getStoredToken(): string | null {
  // 优先从GlobalState获取，如果没有则从localStorage获取（兼容管理员模块）
  return this.globalState.get<string>(`${this.serverService.server.id}-auth-token`) ||
         localStorage.getItem('yunke-admin-token');
}

setStoredTokens(token: string, refreshToken: string) {
  this.globalState.set(`${this.serverService.server.id}-auth-token`, token);
  this.globalState.set(`${this.serverService.server.id}-auth-refresh-token`, refreshToken);
  
  // 同时存储到localStorage（兼容管理员模块）
  localStorage.setItem('yunke-admin-token', token);
  localStorage.setItem('yunke-admin-refresh-token', refreshToken);
}
```

### 可能触发场景

- 前端配置了多个不同 server（例如自托管 + 云端），`serverService.server.id` 会随着用户切换：  
  - 对 server A 登录，写入了 `A-auth-token` 和 `yunke-admin-token`；  
  - 切到 server B 时，`B-auth-token` 还没写过，此时 `getStoredToken()` 将从 `localStorage.getItem('yunke-admin-token')` 回退读取 A 的 token。

### 可能表现

- 向 server B 发起请求时，Authorization header 带的是 server A 的 JWT；
  - 如果后端对 token 受众/签发方校验严格，请求会被 401，前端再清 token，表现为“B 上登录状态总是莫名其妙失效”；
  - 如果后端校验较宽松，有理论上的“跨服务 token 混用”风险（取决于后端实现）。

---

## 6. 数据透明度检测器依赖 `__CLOUD_STORAGE_MANAGER__`（与云存储依赖一致）

### 简要结论

`DataTransparencyDetector` 在计算连接状态时，会直接从 `window.__CLOUD_STORAGE_MANAGER__` 读取云存储连接信息。  

这与云存储模块中其它对该全局对象的依赖类似：前提是 React 树最外层挂载了 `<CloudStorageProvider>`，并且 detector 初始化时该 Provider 已经完成挂载。

### 相关代码

文件：`packages/frontend/core/src/data-transparency/detector.ts`

```ts
private async getConnectionInfo(workspaceId: string) {
  // 实现连接信息获取逻辑
  const cloudManager = (window as any).__CLOUD_STORAGE_MANAGER__;
  return {
    isOnline: navigator.onLine,
    isCloudConnected: cloudManager?.isConnected || false,
    lastConnected: cloudManager?.lastSync,
    reconnectAttempts: 0,
  };
}
```

### 可能触发场景

- 在某些独立 demo（例如 `data-transparency/yunke-integration-demo.tsx`）或开发环境中，单独使用数据透明度组件/检测器，而没有用 `<CloudStorageProvider>` 包裹；
- 或者渲染顺序是：先创建 detector，再挂载 CloudStorageProvider。

### 可能表现

- 数据透明度面板中的“云端连接状态”一直显示为“未连接”，`lastConnected` 为 `undefined`；
- 目前代码对 `cloudManager` 使用了可选链访问，不会抛异常，但状态信息会不准确。

---

这些问题都是基于当前代码结构和调用方式从“静态行为”推断出来的潜在风险点，并不意味着一定会在生产环境发生。如果后续遇到相关现象，可以优先对照这里提到的文件和逻辑进行排查。 

