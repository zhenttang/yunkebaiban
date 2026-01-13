import { YunkeErrorComponent } from '@yunke/core/components/yunke/yunke-error-boundary/yunke-error-fallback';
import { NavigateContext } from '@yunke/core/components/hooks/use-navigate-helper';
import { RootWrapper } from '@yunke/core/desktop/pages/root';

import { wrapCreateBrowserRouterV6 } from '@sentry/react';
import type { RouteObject } from 'react-router-dom';
import {
  createBrowserRouter as reactRouterCreateBrowserRouter,
  redirect,
  useNavigate,
  Outlet,
} from 'react-router-dom';

// Web应用的导航上下文提供器
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
      {
        path: '/',
        lazy: () => {
          console.log('🔄 [Router] 开始加载首页组件...');
          return import('@yunke/core/desktop/pages/index').then(module => {
            console.log('✅ [Router] 首页组件加载成功');
            return module;
          }).catch(error => {
            console.error('❌ [Router] 首页组件加载失败:', error);
            throw error;
          });
        },
      },
      {
        path: '/download',
        lazy: () => import('@yunke/core/desktop/pages/download'),
      },
      {
        path: '/download-mobile',
        lazy: () => import('@yunke/core/desktop/pages/download/mobile'),
      },
      {
        path: '/workspace/:workspaceId/*',
        lazy: () => {
          console.log('🔄 [Router] 开始加载工作空间页面组件...');
          return import('@yunke/core/desktop/pages/workspace/index').then(module => {
            console.log('✅ [Router] 工作空间页面组件加载成功');
            return module;
          }).catch(error => {
            console.error('❌ [Router] 工作空间页面组件加载失败:', error);
            throw error;
          });
        },
      },
      {
        path: '/share/:workspaceId/:pageId',
        loader: ({ params }) => {
          return redirect(`/workspace/${params.workspaceId}/${params.pageId}`);
        },
      },
      {
        path: '/404',
        lazy: () => import('@yunke/core/desktop/pages/404'),
      },
      {
        path: '/expired',
        lazy: () => import('@yunke/core/desktop/pages/expired'),
      },
      {
        path: '/invite/:inviteId',
        lazy: () => import('@yunke/core/desktop/pages/invite'),
      },
      {
        path: '/upgrade-success',
        lazy: () => import('@yunke/core/desktop/pages/upgrade-success'),
      },
      {
        path: '/upgrade-success/team',
        lazy: () => import('@yunke/core/desktop/pages/upgrade-success/team'),
      },
      {
        path: '/upgrade-success/self-hosted-team',
        lazy: () => import('@yunke/core/desktop/pages/upgrade-success/self-host-team'),
      },
      {
        path: '/ai-upgrade-success',
        lazy: () => import('@yunke/core/desktop/pages/ai-upgrade-success'),
      },
      {
        path: '/onboarding',
        lazy: () => import('@yunke/core/desktop/pages/onboarding'),
      },
      {
        path: '/redirect-proxy',
        lazy: () => import('@yunke/core/desktop/pages/redirect'),
      },
      {
        path: '/subscribe',
        lazy: () => import('@yunke/core/desktop/pages/subscribe'),
      },
      {
        path: '/upgrade-to-team',
        lazy: () => import('@yunke/core/desktop/pages/upgrade-to-team'),
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
        path: '/workspace-dashboard-demo',
        lazy: () => import('@yunke/core/desktop/pages/workspace/dashboard'),
      },
      {
        path: '/theme-editor',
        lazy: () => import('@yunke/core/desktop/pages/theme-editor'),
      },
      {
        path: '/forum',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/forum-home'),
      },
      {
        path: '/forum/notifications',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/notifications'),
      },
      {
        path: '/forum/search',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/search-result'),
      },
      {
        path: '/forum/drafts',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/draft-list'),
      },
      {
        path: '/forum/moderator',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/moderator-panel'),
      },
      {
        path: '/forum/user/:userId',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/user-profile'),
      },
      {
        path: '/forum/my-collections',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/my-collections'),
      },
      {
        path: '/forum/drafts',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/draft-list'),
      },
      {
        path: '/forum/posts/:postId/history',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/edit-history'),
      },
      {
        path: '/forum/notifications',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/notifications'),
      },
      {
        path: '/forum/tags/:tagId',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/tag-posts'),
      },
      {
        path: '/forum/:forumId/create-post',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/create-post'),
      },
      {
        path: '/forum/:forumId/post/:postId',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/post-detail'),
      },
      {
        path: '/forum/posts/:postId/history',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/edit-history'),
      },
      {
        path: '/forum/tags/:tagId',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/tag-posts'),
      },
      {
        path: '/forum/:forumId',
        lazy: () => import('@yunke/core/desktop/pages/workspace/forum/forum-detail'),
      },
      {
        path: '/clipper/import',
        lazy: () => import('@yunke/core/desktop/pages/import-clipper'),
      },
      {
        path: '/template/import',
        lazy: () => import('@yunke/core/desktop/pages/import-template'),
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
        lazy: () => import('@yunke/core/desktop/pages/auth/auth'),
      },
      {
        path: '/sign-In',
        lazy: () => import('@yunke/core/desktop/pages/auth/sign-in'),
      },
      {
        path: '/magic-link',
        lazy: () => import('@yunke/core/desktop/pages/auth/magic-link'),
      },
      {
        path: '/oauth/login',
        lazy: () => import('@yunke/core/desktop/pages/auth/oauth-login'),
      },
      {
        path: '/oauth/callback',
        lazy: () => import('@yunke/core/desktop/pages/auth/oauth-callback'),
      },
      {
        path: '/desktop-signin',
        lazy: () => import('@yunke/core/desktop/pages/auth/oauth-login'),
      },
      {
        path: '/signIn',
        lazy: () => import('@yunke/core/desktop/pages/auth/sign-in'),
      },
      {
        path: '/open-app/:action',
        lazy: () => import('@yunke/core/desktop/pages/open-app'),
      },
      {
        path: '/test-loading',
        lazy: () => import('@yunke/core/desktop/pages/test-loading'),
      },
      {
        path: '*',
        lazy: () => import('@yunke/core/desktop/pages/404'),
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
  basename: globalThis.environment?.subPath || '',
  future: {
    v7_normalizeFormMethod: true,
  },
});

// 添加路由加载监控
console.log('🛣️ [Router] 路由器创建完成，开始监控加载状态');
console.log('🛣️ [Router] 当前路由配置:', topLevelRoutes.length, '个顶级路由');

// 监控路由状态变化
let routeLoadStartTime: number | null = null;

router.subscribe(state => {
  console.log('🛣️ [Router] 路由状态变化:', {
    pathname: state.location.pathname,
    state: state.state,
    isLoading: state.state === 'loading',
    hasError: !!state.errors,
    locationKey: state.location.key
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
      timestamp: new Date().toISOString()
    });
  }
});

// 设置路由加载超时检测
const ROUTE_LOAD_TIMEOUT = 15000; // 15秒超时

const checkRouteTimeout = () => {
  if (routeLoadStartTime && Date.now() - routeLoadStartTime > ROUTE_LOAD_TIMEOUT) {
    console.error('⏰ [Router] 路由加载超时!', {
      timeout: ROUTE_LOAD_TIMEOUT,
      elapsed: Date.now() - routeLoadStartTime,
      pathname: window.location.pathname
    });

    // 显示超时提示
    const timeoutDiv = document.createElement('div');
    timeoutDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff9800;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      z-index: 999999;
      font-family: system-ui, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 400px;
    `;
    timeoutDiv.innerHTML = `
      <h4 style="margin: 0 0 8px 0;">⚠️ 路由加载超时</h4>
      <p style="margin: 0 0 8px 0;">页面加载时间过长，可能的原因：</p>
      <ul style="margin: 0 0 8px 0; padding-left: 20px;">
        <li>网络连接问题</li>
        <li>服务器响应缓慢</li>
        <li>JavaScript模块加载失败</li>
      </ul>
      <button onclick="this.parentElement.remove(); location.reload()" style="
        background: white;
        color: #ff9800;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      ">刷新页面</button>
    `;
    document.body.appendChild(timeoutDiv);

    // 10秒后自动移除提示
    setTimeout(() => {
      if (timeoutDiv.parentElement) {
        timeoutDiv.remove();
      }
    }, 10000);
  }
};

setInterval(checkRouteTimeout, 1000); 
