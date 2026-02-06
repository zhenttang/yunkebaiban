import { NavigateContext } from '@yunke/core/components/hooks/use-navigate-helper';
import { wrapCreateBrowserRouterV6 } from '@sentry/react';
import { useEffect, useState } from 'react';
import type { RouteObject } from 'react-router-dom';
import {
  createBrowserRouter as reactRouterCreateBrowserRouter,
  redirect,
  useNavigate,
  useRouteError,
} from 'react-router-dom';

import { RootWrapper } from './pages/root';

/**
 * H-2 修复：移动端 ready state 使用 loading 组件替代空白
 * 
 * 旧实现返回 `null` 导致白屏，现在显示 loading 指示器
 */
function RootRouter() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    console.info('[mobile router] initialize');
    setReady(true);
  }, []);

  if (!ready) {
    // H-2 修复：显示 loading 而非白屏
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <NavigateContext.Provider value={navigate}>
      <RootWrapper />
    </NavigateContext.Provider>
  );
}

/**
 * H-1 修复：移动端全局错误页面
 * 
 * 旧实现根路由无 errorElement，子路由崩溃时整个应用白屏
 */
function MobileErrorPage() {
  const error = useRouteError();
  console.error('[mobile] 路由错误:', error);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: 24, textAlign: 'center' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>页面加载失败</h2>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        {error instanceof Error ? error.message : '发生了意外错误'}
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '8px 24px', fontSize: 14, backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
      >
        重新加载
      </button>
    </div>
  );
}

export const topLevelRoutes = [
  {
    element: <RootRouter />,
    errorElement: <MobileErrorPage />,  // H-1 修复：添加错误页面防止白屏
    children: [
      {
        path: '/',
        lazy: () => import('./pages/index'),
      },
      {
        path: '/workspace/:workspaceId/*',
        lazy: () => import('./pages/workspace/index'),
      },
      {
        path: '/share/:workspaceId/:pageId',
        loader: ({ params }) => {
          return redirect(`/workspace/${params.workspaceId}/${params.pageId}`);
        },
      },
      {
        path: '/payment-test',
        lazy: () => import('./pages/payment-test'),
      },
      {
        path: '/404',
        lazy: () => import('./pages/404'),
      },
      {
        path: '/auth/:authType',
        lazy: () => import('./pages/auth'),
      },
      {
        path: '/sign-in',
        lazy: () => import('./pages/sign-in'),
      },
      {
        path: '/magic-link',
        lazy: () =>
          import(
            /* webpackChunkName: "auth" */ '@yunke/core/desktop/pages/auth/magic-link'
          ),
      },
      {
        path: '/oauth/login',
        lazy: () =>
          import(
            /* webpackChunkName: "auth" */ '@yunke/core/desktop/pages/auth/oauth-login'
          ),
      },
      {
        path: '/oauth/callback',
        lazy: () =>
          import(
            /* webpackChunkName: "auth" */ '@yunke/core/desktop/pages/auth/oauth-callback'
          ),
      },
      {
        path: '/redirect-proxy',
        lazy: () => import('@yunke/core/desktop/pages/redirect'),
      },
      {
        path: '/open-app/:action',
        lazy: () => import('@yunke/core/desktop/pages/open-app'),
      },
      {
        path: '*',
        lazy: () => import('./pages/404'),
      },
    ],
  },
] satisfies [RouteObject, ...RouteObject[]];

const createBrowserRouter = wrapCreateBrowserRouterV6(
  reactRouterCreateBrowserRouter
);
export const router = (
  window.SENTRY_RELEASE ? createBrowserRouter : reactRouterCreateBrowserRouter
)(topLevelRoutes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});
