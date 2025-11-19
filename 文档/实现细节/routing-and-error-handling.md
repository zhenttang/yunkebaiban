# 路由与错误处理实现细节（前端）

> 关联架构文档：`文档/架构文档/frontend-overview.md`  
> 关联功能文档：`文档/功能文档/Web端概览.md`

---

## 1. 顶层路由与导航上下文

### 1.1 apps/web 顶层路由

- 文件：`packages/frontend/apps/web/src/router.tsx`

关键结构：

```tsx
import { YunkeErrorComponent } from '@yunke/core/components/yunke/yunke-error-boundary/yunke-error-fallback';
import { NavigateContext } from '@yunke/core/components/hooks/use-navigate-helper';
import { RootWrapper } from '@yunke/core/desktop/pages/root';

import { wrapCreateBrowserRouterV6 } from '@sentry/react';
import type { RouteObject } from 'react-router-dom';
import {
  createBrowserRouter as reactRouterCreateBrowserRouter,
  redirect,
  useNavigate,
} from 'react-router-dom';
```

- 顶层 element：

```tsx
function WebNavigateProvider() {
  const navigate = useNavigate();
  return (
    <NavigateContext.Provider value={navigate}>
      <RootWrapper />
    </NavigateContext.Provider>
  );
}

export const topLevelRoutes = [
  {
    element: <WebNavigateProvider />,
    errorElement: <YunkeErrorComponent />,
    children: [
      // 各种子路由
    ],
  },
] satisfies [RouteObject, ...RouteObject[]];
```

实现要点：

- 使用 `NavigateContext` 将 React Router 的 `navigate` 函数注入到 Yunke 自定义导航助手中（`use-navigate-helper`），使核心模块可以不直接依赖 `useNavigate`；
- `RootWrapper` 是所有页面的根，负责提供 `FrameworkScope`、全局对话框与通知中心；
- `errorElement` 使用 `YunkeErrorComponent`，作为 route 层级的错误边界。

### 1.2 Sentry 包装的 Router

- 路由器创建：

```ts
const createBrowserRouter = wrapCreateBrowserRouterV6(
  reactRouterCreateBrowserRouter
);

export const router = (
  window.SENTRY_RELEASE ? createBrowserRouter : reactRouterCreateBrowserRouter
)(topLevelRoutes, {
  basename: globalThis.environment?.subPath || '',
  future: {
    v7_normalizeFormMethod: true,
  },
});
```

- `wrapCreateBrowserRouterV6`：
  - 来自 `@sentry/react`，用于将 React Router 的导航/错误与 Sentry 事件关联；
  - 当 `window.SENTRY_RELEASE` 存在时，使用包装后的 router，以便在生产环境收集路由级错误；
  - 在本地或无 Sentry 环境下，回退为原生 `createBrowserRouter`。

---

## 2. RootWrapper：作用域与服务初始化

- 文件：`packages/frontend/core/src/desktop/pages/root/index.tsx`

核心结构：

```tsx
export const RootWrapper = () => {
  const defaultServerService = useService(DefaultServerService);
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    if (isServerReady) return;
    const abortController = new AbortController();
    defaultServerService.server
      .waitForConfigRevalidation(abortController.signal)
      .then(() => setIsServerReady(true))
      .catch(error => {
        console.error('❌ [RootWrapper] Server 配置重新验证失败:', error);
      });
    return () => abortController.abort();
  }, [defaultServerService, isServerReady]);

  return (
    <FrameworkScope scope={defaultServerService.server.scope}>
      <GlobalDialogs />
      <NotificationCenter />
      <Outlet />
      <CustomThemeModifier />
      {BUILD_CONFIG.isElectron && <FindInPagePopup />}
    </FrameworkScope>
  );
};
```

实现细节：

- `DefaultServerService`：
  - 提供 `server.scope`（用于依赖注入的 FrameworkScope）；
  - `waitForConfigRevalidation` 用于在应用启动时确保 server 配置（环境变量、开关等）已正确加载；
- `FrameworkScope`：
  - 把 `server.scope` 注入 React 树；
  - 让内部组件可以通过 `useService` 获取各类服务（DocService、WorkspaceService、AIProvider 的配置等）。
- 全局组件：
  - `GlobalDialogs`：全局对话框容器；
  - `NotificationCenter`：全局通知/提示；
  - `CustomThemeModifier`：根据用户设置修改主题；
  - `FindInPagePopup`：仅在 Electron 中启用的页面内搜索弹窗。

> RootWrapper 的作用是将“服务作用域”和“全局 UI 组件”挂到顶层，让所有路由页面共享同一套服务实例和对话框/通知环境。

---

## 3. 子路由组织：desktop/router 与 apps/web router

### 3.1 core/desktop/router.tsx

- 文件：`packages/frontend/core/src/desktop/router.tsx`

这里定义了 desktop 视图内部的一组 “子路由”（如 workspace 内的 all/collection/tag/forum 等），供工作空间页面使用：

```ts
import { wrapCreateBrowserRouterV6 } from '@sentry/react';
import type { RouteObject } from 'react-router-dom';
import { createBrowserRouter as reactRouterCreateBrowserRouter, redirect } from 'react-router-dom';

import { YunkeErrorComponent } from '../components/yunke/yunke-error-boundary/yunke-error-fallback';
import { RootRouter } from './router-root';
import { Component as WorkspaceComponent } from './pages/workspace/index';

export const topLevelRoutes = [
  {
    element: <RootRouter />,
    errorElement: <YunkeErrorComponent />,
    loader: () => ({ rootRouterLoaded: true }),
    children: [
      { path: '/clipper/import', lazy: () => import('./pages/import-clipper') },
      { path: '/', lazy: () => import('./pages/index') },
      // ... 工作空间、分享、404 等
      {
        path: '/workspace/:workspaceId/*',
        Component: WorkspaceComponent, // 非 lazy，避免竞态
      },
      { path: '*', lazy: () => import('./pages/404') },
    ],
  },
] satisfies [RouteObject, ...RouteObject[]];

const createBrowserRouter = wrapCreateBrowserRouterV6(reactRouterCreateBrowserRouter);
export const router = (
  window.SENTRY_RELEASE ? createBrowserRouter : reactRouterCreateBrowserRouter
)(topLevelRoutes, { basename, future: { v7_normalizeFormMethod: true } });
```

与 apps/web 区别：

- apps/web 的 router 是“浏览器入口”层；  
- core/desktop/router 是 desktop 环境下使用的 router（用于桌面客户端或其他入口），但结构和错误处理逻辑类似：
  - 包装在 Sentry router 中；
  - 使用 `YunkeErrorComponent` 作为顶层错误元素；
  - 为工作空间路由移除 lazy，从而避免父子 lazy 导致的竞态问题。

### 3.2 apps/web 中的论坛/导入等路由

在 `apps/web/src/router.tsx` 中，除了基础页面之外，还直接挂载了一些业务路由到桌面核心页面，例如：

- `/forum/*`：论坛（home/detail/post-detail/create-post 等）；
- `/clipper/import`：剪藏导入页面；
- `/template/import` / `/template/preview`：模板导入与预览；
- `/open-app/:action`：与桌面应用交互入口；
- `/auth/*`：登录、OAuth 登录等。

这些都通过 lazy import 指向 `@yunke/core/desktop/pages/...` 对应文件。

---

## 4. 错误边界与错误回退组件

### 4.1 YunkeErrorComponent：路由层错误显示

- 文件：`packages/frontend/core/src/components/yunke/yunke-error-boundary/yunke-error-fallback.tsx`

`YunkeErrorComponent` 用于 React Router 的 `errorElement`：

```tsx
export const YunkeErrorComponent = () => {
  const error = useRouteError() as Error;
  const t = useI18n();

  const reloadPage = useCallback(() => {
    document.location.reload();
  }, []);

  return (
    <ErrorDetail
      title={t['com.yunke.error.unexpected-error.title']()}
      resetError={reloadPage}
      buttonText={t['com.yunke.error.reload']()}
      description={
        'message' in (error as Error) ? (error as Error).message : `${error}`
      }
      error={error as Error}
    />
  );
};
```

实现细节：

- 使用 `useRouteError` 获取 router 捕获到的错误；
- 使用 i18n 渲染统一标题和按钮文案；
- `ErrorDetail` 内部负责显示错误信息（message/stack）及“重新加载”按钮；
- 点击“重新加载”时调用 `document.location.reload()` 进行全页面刷新。

### 4.2 YunkeErrorFallback：组件级错误回退

同一文件中还提供了更通用的 fallback 组件：

```tsx
const fallbacks = new Set([PageNotFoundDetail, NoPageRootFallback]);

function getErrorFallbackComponent(error: any): FC<FallbackProps> {
  for (const Component of fallbacks) {
    const ErrorConstructor = Reflect.get(Component, ERROR_REFLECT_KEY);
    if (ErrorConstructor && error instanceof ErrorConstructor) {
      return Component as FC<FallbackProps>;
    }
  }
  return AnyErrorFallback;
}

export const YunkeErrorFallback: FC<YunkeErrorFallbackProps> = props => {
  const { error, resetError, height } = props;
  const Component = useMemo(() => getErrorFallbackComponent(error), [error]);

  return (
    <div className={clsx(styles.viewport, props.className)} style={{ height }}>
      <Component error={error} resetError={resetError} />
      <Provider key="JotaiProvider" store={getCurrentStore()}>
        <DumpInfo error={error} />
      </Provider>
    </div>
  );
};
```

实现要点：

- 通过 `ERROR_REFLECT_KEY` 在各 fallback 组件上挂载对应的错误构造函数，然后在运行时用 `instanceof` 匹配适配的 fallback；
- 若找不到特定 fallback，则降级到 `AnyErrorFallback`；
- 使用 `DumpInfo` 组件记录错误详情（便于调试和上报），并通过 `jotai` 的 store 提供必要上下文。

> 这一套错误回退机制允许在不同异常类型下展示不同的 UI（例如 404、根节点丢失等），同时保留通用 fallback，既方便开发调试，又能给用户较友好的错误体验。

---

## 5. 路由状态监控与加载超时提示

### 5.1 订阅路由状态变化

- 文件：`apps/web/src/router.tsx`（尾部）

```ts
console.log('🛣️ [Router] 路由器创建完成，开始监控加载状态');

let routeLoadStartTime: number | null = null;

router.subscribe(state => {
  console.log('🛣️ [Router] 路由状态变化:', {
    pathname: state.location.pathname,
    state: state.state,
    isLoading: state.state === 'loading',
    hasError: !!state.errors,
    locationKey: state.location.key,
  });

  if (state.state === 'loading' && !routeLoadStartTime) {
    routeLoadStartTime = Date.now();
    console.log('🔄 [Router] 开始加载路由:', state.location.pathname);
  } else if (state.state !== 'loading' && routeLoadStartTime) {
    const loadTime = Date.now() - routeLoadStartTime;
    console.log(`✅ [Router] 路由加载完成: ${state.location.pathname} (耗时: ${loadTime}ms)`);
    routeLoadStartTime = null;
  }

  if (state.errors) {
    console.error('❌ [Router] 路由加载错误:', {
      pathname: state.location.pathname,
      error: state.errors,
      timestamp: new Date().toISOString(),
    });
  }
});
```

说明：

- 利用 React Router v6.4+ 提供的 `router.subscribe` 接口；
- 在路由开始 `loading` 时记录开始时间；在结束（非 loading 状态）时记录耗时；
- 遇到 `state.errors` 时打印详细错误信息，包括路径和时间戳；
- 配合 Sentry 的 router 包装，形成“控制台 + Sentry 双重监控”。

### 5.2 加载超时检测

```ts
const ROUTE_LOAD_TIMEOUT = 15000; // 15秒

const checkRouteTimeout = () => {
  if (routeLoadStartTime && Date.now() - routeLoadStartTime > ROUTE_LOAD_TIMEOUT) {
    console.error('⏰ [Router] 路由加载超时!', {
      timeout: ROUTE_LOAD_TIMEOUT,
      elapsed: Date.now() - routeLoadStartTime,
      pathname: window.location.pathname,
    });

    const timeoutDiv = document.createElement('div');
    timeoutDiv.style.cssText = /* ...一段内联CSS... */;
    timeoutDiv.innerHTML = `
      <h4>⚠️ 路由加载超时</h4>
      <p>页面加载时间过长，可能的原因：</p>
      <ul>...</ul>
      <button onclick="this.parentElement.remove(); location.reload()">刷新页面</button>
    `;
    document.body.appendChild(timeoutDiv);

    setTimeout(() => {
      timeoutDiv.parentElement && timeoutDiv.remove();
    }, 10000);
  }
};

setInterval(checkRouteTimeout, 1000);
```

实现要点：

- 每秒检查一次当前路由是否处于 loading 且持续时间超过 15s；
- 超时后：
  - 在控制台打印一条错误日志；
  - 在 DOM 中插入一个固定位置的提示框，说明可能原因（网络、服务器、JS 模块加载失败）；
  - 提供“刷新页面”按钮，点击后 reload；
  - 10 秒后自动移除提示框，避免长期占用页面。

> 这套监控机制在开发和生产环境都能工作，尤其在路由 lazy 加载出现异常时，可以快速定位问题并给用户一个退路（刷新页面）。

---

## 6. 小结

整体来看，路由与错误处理的实现可以概括为：

- `apps/web/src/router.tsx` 负责浏览器入口层的路由表与 Sentry 集成，同时向核心模块注入 `navigate` 与 `RootWrapper`；  
- `core/desktop/router.tsx` 在桌面环境中提供类似结构，并以 `RootRouter + YunkeErrorComponent` 包裹所有子路由；  
- `RootWrapper` 通过 `FrameworkScope` 注入服务作用域，并渲染全局对话框/通知/主题修改器；  
- `YunkeErrorComponent + YunkeErrorFallback` 提供路由层和组件层的错误回退，并结合 i18n 与错误日志输出；  
- 订阅 router 状态与自建超时检测，为调试和用户体验提供额外保障。

这几层叠加，使得前端在路由、错误处理与监控上形成了一套相对完整且可扩展的方案。 

