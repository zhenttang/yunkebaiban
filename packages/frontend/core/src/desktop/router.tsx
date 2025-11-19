import { wrapCreateBrowserRouterV6 } from '@sentry/react';
import type { RouteObject } from 'react-router-dom';
import {
  createBrowserRouter as reactRouterCreateBrowserRouter,
  redirect,
} from 'react-router-dom';

import { YunkeErrorComponent } from '../components/yunke/yunke-error-boundary/yunke-error-fallback';
import { RootRouter } from './router-root';
// 🔧 修复：直接导入 workspace 路由组件，避免 lazy loading 导致的竞态条件
// 这确保了父路由（RootRouter）总是被渲染，避免功能偶尔不正常的问题
import { Component as WorkspaceComponent } from './pages/workspace/index';

// 🔧 修复：RootRouter 不使用 lazy loading，直接导入
// 这样可以避免与子路由的 lazy loading 产生竞态条件
// RootRouter 是必需的父路由，应该立即可用

export const topLevelRoutes = [
  {
    // 🔧 修复：直接使用 JSX，让 React Router 在渲染时创建元素
    // 这样可以确保 React Router 能够正确追踪和渲染 element
    // 不使用预先创建的元素，因为 React Router 可能需要每次渲染时创建新的元素引用
    element: <RootRouter />,
    errorElement: <YunkeErrorComponent />,
    // 🔧 修复：添加 loader 确保父路由总是被处理
    // 这解决了 React Router v6 在处理 lazy loading 子路由时的竞态条件问题
    // 当子路由使用 lazy() 加载时，如果加载很快，React Router 可能跳过父路由直接渲染子路由
    // 添加 loader 可以确保父路由的逻辑总是被执行，避免功能偶尔不正常的问题
    loader: () => {
      // loader 会在路由匹配时立即执行，即使子路由是 lazy loading
      // 这确保了父路由（RootRouter）总是被处理，从而确保：
      // - NavigateContext.Provider 总是被提供
      // - RootWrapper 总是被渲染（包含 GlobalDialogs、NotificationCenter 等）
      // - Server 配置重新验证总是执行
      // - FrameworkScope 总是被提供
      // 返回一个标记，确保 loader 数据存在
      return { rootRouterLoaded: true };
    },
    children: [
      // ✅ Clipper 路由优先，避免被 workspace 通配符拦截
      {
        path: '/clipper/import',
        lazy: () => import('./pages/import-clipper'),
      },
      {
        path: '/',
        lazy: () => import('./pages/index'),
      },
      {
        path: '/download',
        lazy: () => import('./pages/download'),
      },
      {
        path: '/download-mobile',
        lazy: () => import('./pages/download/mobile'),
      },
      // ✅ 分享路由必须在 workspace 路由之前，避免被通配符拦截
      // 虽然 /share 路径不会被 /workspace 匹配（因为不以 /workspace 开头），
      // 但为了代码清晰性和避免未来问题，明确放在前面
      {
        path: '/share/:workspaceId/:pageId',
        lazy: () => import('./pages/workspace/share/share-route'),
      },
      {
        path: '/workspace/:workspaceId/*',
        // 🔧 修复：移除 lazy loading，使用直接导入
        // 这解决了 React Router v6 在处理 lazy loading 子路由时的竞态条件问题
        // 当子路由使用 lazy() 加载时，如果加载很快，React Router 可能跳过父路由直接渲染子路由
        // 移除 lazy 可以确保父路由（RootRouter）总是被渲染，避免功能偶尔不正常的问题
        Component: WorkspaceComponent,
      },
      {
        path: '/404',
        lazy: () => import('./pages/404'),
      },
      {
        path: '/expired',
        lazy: () => import('./pages/expired'),
      },
      {
        path: '/invite/:inviteId',
        lazy: () => import('./pages/invite'),
      },
      {
        path: '/upgrade-success',
        lazy: () => import('./pages/upgrade-success'),
      },
      {
        path: '/upgrade-success/team',
        lazy: () => import('./pages/upgrade-success/team'),
      },
      {
        path: '/upgrade-success/self-hosted-team',
        lazy: () => import('./pages/upgrade-success/self-host-team'),
      },
      {
        path: '/ai-upgrade-success',
        lazy: () => import('./pages/ai-upgrade-success'),
      },
      {
        path: '/onboarding',
        lazy: () => import('./pages/onboarding'),
      },
      {
        path: '/redirect-proxy',
        lazy: () => import('./pages/redirect'),
      },
      {
        path: '/subscribe',
        lazy: () => import('./pages/subscribe'),
      },
      {
        path: '/upgrade-to-team',
        lazy: () => import('./pages/upgrade-to-team'),
      },
      {
        path: '/try-cloud',
        loader: () => {
          return redirect(
            `/sign-in?redirect_uri=${encodeURIComponent('/?initCloud=true')}`
          );
        },
      },
      {
        path: '/theme-editor',
        lazy: () => import('./pages/theme-editor'),
      },
      {
        path: '/undraw-gallery',
        lazy: () => import('./pages/undraw-gallery'),
      },
      {
        path: '/template/import',
        lazy: () => import('./pages/import-template'),
      },
      {
        path: '/template/preview',
        loader: ({ request }) => {
          const url = new URL(request.url);
          const workspaceId = url.searchParams.get('workspaceId');
          const docId = url.searchParams.get('docId');
          const templateName = url.searchParams.get('name');
          const templateMode = url.searchParams.get('mode');
          const snapshotUrl = url.searchParams.get('snapshotUrl');

          return redirect(
            `/workspace/${workspaceId}/${docId}?${new URLSearchParams({
              isTemplate: 'true',
              templateName: templateName ?? '',
              snapshotUrl: snapshotUrl ?? '',
              mode: templateMode ?? 'page',
            }).toString()}`
          );
        },
      },
      {
        path: '/auth/:authType',
        lazy: () => import(/* webpackChunkName: "auth" */ './pages/auth/auth'),
      },
      {
        path: '/sign-in',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/sign-in'),
      },
      {
        path: '/magic-link',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/magic-link'),
      },
      {
        path: '/oauth/login',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/oauth-login'),
      },
      {
        path: '/oauth/callback',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/oauth-callback'),
      },
      // deprecated, keep for old client compatibility
      // TODO(@forehalo): remove
      {
        path: '/desktop-signin',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/oauth-login'),
      },
      // deprecated, keep for old client compatibility
      // use '/sign-in'
      // TODO(@forehalo): remove
      {
        path: '/signIn',
        lazy: () =>
          import(/* webpackChunkName: "auth" */ './pages/auth/sign-in'),
      },
      {
        path: '/open-app/:action',
        lazy: () => import('./pages/open-app'),
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

const basename = (typeof environment !== 'undefined' && environment?.subPath) || '';

export const router = (
  window.SENTRY_RELEASE ? createBrowserRouter : reactRouterCreateBrowserRouter
)(topLevelRoutes, {
  basename: basename,
  future: {
    v7_normalizeFormMethod: true,
  },
});
