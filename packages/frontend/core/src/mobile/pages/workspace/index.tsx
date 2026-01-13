import type React from 'react';
import { YunkeErrorBoundary } from '@yunke/core/components/yunke/yunke-error-boundary';
import { YunkeErrorComponent } from '@yunke/core/components/yunke/yunke-error-boundary/yunke-error-fallback';
import { PageNotFound } from '@yunke/core/desktop/pages/404';
import { SharePage } from '@yunke/core/desktop/pages/workspace/share/share-page';
import { workbenchRoutes } from '@yunke/core/mobile/workbench-router';
import { ServersService, AuthService } from '@yunke/core/modules/cloud';
import { RouteLogic, useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { WorkspacesService } from '@yunke/core/modules/workspace';
import { FrameworkScope, useLiveData, useServices } from '@toeverything/infra';
import {
  lazy as reactLazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  matchPath,
  type RouteObject,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import { WorkspaceLayout } from './layout';
import { MobileWorkbenchRoot } from './workbench-root';

type Route = { Component: React.ComponentType };
/**
 * Source: core/src/modules/workbench/view/route-container.tsx
 **/
const MobileRouteContainer = ({ route }: { route: Route }) => {
  return (
    <YunkeErrorBoundary>
      <Suspense>
        <route.Component />
      </Suspense>
    </YunkeErrorBoundary>
  );
};

const warpedRoutes = workbenchRoutes.map((originalRoute: RouteObject) => {
  if (originalRoute.Component || !originalRoute.lazy) {
    return originalRoute;
  }

  const { path, lazy } = originalRoute;

  const Component = reactLazy(() =>
    lazy().then(m => ({
      default: m.Component as React.ComponentType,
    }))
  );
  const route = {
    Component,
  };

  return {
    path,
    Component: () => {
      return <MobileRouteContainer route={route} />;
    },
    errorElement: <YunkeErrorComponent />,
  };
});

export const Component = () => {
  const { workspacesService, serversService, authService } = useServices({
    WorkspacesService,
    ServersService,
    AuthService,
  });
  const { jumpToSignIn } = useNavigateHelper();

  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const authStatus = useLiveData(authService.session.status$);

  // todo(pengx17): dedupe the code with core
  // check if we are in detail doc route, if so, maybe render share page
  const detailDocRoute = useMemo(() => {
    const match = matchPath(
      '/workspace/:workspaceId/:docId',
      location.pathname
    );
    if (
      match &&
      match.params.docId &&
      match.params.workspaceId &&
      // TODO(eyhn): need a better way to check if it's a docId
      workbenchRoutes.find(route =>
        matchPath(route.path, '/' + match.params.docId)
      )?.path === '/:pageId'
    ) {
      return {
        docId: match.params.docId,
        workspaceId: match.params.workspaceId,
      };
    } else {
      return null;
    }
  }, [location.pathname]);

  const [workspaceNotFound, setWorkspaceNotFound] = useState(false);
  const listLoading = useLiveData(workspacesService.list.isRevalidating$);
  const workspaces = useLiveData(workspacesService.list.workspaces$);
  const meta = useMemo(() => {
    return workspaces.find(({ id }) => id === params.workspaceId);
  }, [workspaces, params.workspaceId]);

  // if listLoading is false, we can show 404 page, otherwise we should show loading page.
  useEffect(() => {
    if (listLoading === false && meta === undefined) {
      setWorkspaceNotFound(true);
    }
    if (meta) {
      setWorkspaceNotFound(false);
    }
  }, [listLoading, meta, workspacesService]);

  // if workspace is not found, we should retry
  const retryTimesRef = useRef(3);
  useEffect(() => {
    retryTimesRef.current = 3; // reset retry times
    workspacesService.list.revalidate();
  }, [params.workspaceId, workspacesService.list]);
  useEffect(() => {
    if (listLoading === false && meta === undefined) {
      const timer = setInterval(() => {
        if (retryTimesRef.current > 0) {
          workspacesService.list.revalidate();
          retryTimesRef.current--;
        }
      }, 5000);
      return () => clearInterval(timer);
    }
    return;
  }, [listLoading, meta, workspaceNotFound, workspacesService]);

  // server search params
  const serverFromSearchParams = useLiveData(
    searchParams.has('server')
      ? serversService.serverByBaseUrl$(searchParams.get('server') as string)
      : undefined
  );
  // server from workspace
  const serverFromWorkspace = useLiveData(
    meta?.flavour && meta.flavour !== 'local'
      ? serversService.server$(meta?.flavour)
      : undefined
  );
  const server = serverFromWorkspace ?? serverFromSearchParams;

  // 未登录且访问云端工作区时直接跳转登录（携带 redirect），分享页除外
  useEffect(() => {
    console.info('[mobile workspace route] auth check: start', {
      authStatus,
      path: location.pathname,
      search: location.search,
      workspaceId: params.workspaceId,
      flavour: meta?.flavour,
      serverBaseUrl: server?.baseUrl,
      isSharePage: !!detailDocRoute,
      hasMeta: !!meta,
    });
    if (!meta || location.pathname.startsWith('/sign-in')) return;
    if (meta.flavour === 'local') return;
    if (authStatus !== 'authenticated') {
      const params: Record<string, string> = {
        redirect_uri: `${location.pathname}${location.search}`,
      };
      if (server?.baseUrl) {
        params.server = server.baseUrl;
      }
      jumpToSignIn(undefined, RouteLogic.REPLACE, undefined, params);
    }
  }, [
    authStatus,
    jumpToSignIn,
    location.pathname,
    location.search,
    meta,
    server,
  ]);

  if (workspaceNotFound) {
    if (
      BUILD_CONFIG.isMobileWeb /* only browser has share page */ &&
      detailDocRoute
    ) {
      return (
        <FrameworkScope scope={server?.scope}>
          <SharePage
            docId={detailDocRoute.docId}
            workspaceId={detailDocRoute.workspaceId}
          />
        </FrameworkScope>
      );
    }
    return <PageNotFound noPermission />;
  }
  if (!meta) {
    return;
  }
  return (
    <WorkspaceLayout meta={meta}>
      <MobileWorkbenchRoot routes={warpedRoutes} />
    </WorkspaceLayout>
  );
};
