import { AffineErrorComponent } from '@yunke/core/components/affine/affine-error-boundary/affine-error-fallback';
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
    errorElement: <AffineErrorComponent />,
    children: [
      {
        path: '/',
        lazy: () => import('@yunke/core/desktop/pages/index'),
      },
      {
        path: '/workspace/:workspaceId/*',
        lazy: () => import('@yunke/core/desktop/pages/workspace/index'),
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
