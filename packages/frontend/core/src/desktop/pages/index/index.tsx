import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import { WorkspacesService } from '@yunke/core/modules/workspace';
import {
  buildShowcaseWorkspace,
  createFirstAppData,
} from '@yunke/core/utils/first-app-data';
import {
  useLiveData,
  useService,
  useServiceOptional,
} from '@toeverything/infra';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  RouteLogic,
  useNavigateHelper,
} from '../../../components/hooks/use-navigate-helper';
import { AuthService } from '../../../modules/cloud';
import { AppContainer } from '../../components/app-container';

/**
 * index page
 *
 * query string:
 * - initCloud: boolean, if true, when user is logged in, create a cloud workspace
 */
export const Component = ({
  defaultIndexRoute = 'all',
  children,
  fallback,
}: {
  defaultIndexRoute?: string;
  children?: ReactNode;
  fallback?: ReactNode;
}) => {
  // navigating and creating may be slow, to avoid flickering, we show workspace fallback
  const [navigating, setNavigating] = useState(true);
  const [creating, setCreating] = useState(false);
  const authService = useService(AuthService);

  const loggedIn = useLiveData(
    authService.session.status$.map(s => s === 'authenticated')
  );

  const workspacesService = useService(WorkspacesService);
  const list = useLiveData(workspacesService.list.workspaces$);
  const listIsLoading = useLiveData(workspacesService.list.isRevalidating$);

  const { openPage, jumpToPage, jumpToSignIn } = useNavigateHelper();
  const [searchParams] = useSearchParams();

  const createOnceRef = useRef(false);

  useEffect(() => {
    console.info('[desktop index] state', {
      loggedIn,
      listLength: list.length,
      listIsLoading,
      navigating,
      creating,
      search: searchParams.toString(),
      defaultIndexRoute,
    });
  }, [
    creating,
    defaultIndexRoute,
    list.length,
    listIsLoading,
    loggedIn,
    navigating,
    searchParams,
  ]);

  const createCloudWorkspace = useCallback(() => {
    if (createOnceRef.current) return;
    createOnceRef.current = true;
    // TODO: support selfhosted
    buildShowcaseWorkspace(workspacesService, 'yunke-cloud', 'YUNKE Cloud')
      .then(({ meta, defaultDocId }) => {
        if (defaultDocId) {
          jumpToPage(meta.id, defaultDocId);
        } else {
          openPage(meta.id, defaultIndexRoute);
        }
      })
              .catch(err => console.error('创建云端工作空间失败', err));
  }, [defaultIndexRoute, jumpToPage, openPage, workspacesService]);

  useLayoutEffect(() => {
    if (!navigating) {
      return;
    }

    if (listIsLoading) {
      console.info('[desktop index] waiting list loading');
      return;
    }

    // check is user logged in && has cloud workspace
    if (searchParams.get('initCloud') === 'true') {
      if (loggedIn) {
        if (list.every(w => w.flavour !== 'yunke-cloud')) {
          console.info('[desktop index] initCloud createCloudWorkspace');
          createCloudWorkspace();
          return;
        }

        // open first cloud workspace
        const openWorkspace =
          list.find(w => w.flavour === 'yunke-cloud') ?? list[0];
        console.info('[desktop index] initCloud open workspace', {
          id: openWorkspace?.id,
          flavour: openWorkspace?.flavour,
        });
        openPage(openWorkspace.id, defaultIndexRoute);
      } else {
        console.info('[desktop index] initCloud not logged in, wait');
        return;
      }
    } else {
      if (list.length === 0) {
        console.info('[desktop index] list empty, stop navigating');
        setNavigating(false);
        return;
      }
      // open last workspace
      const lastId = localStorage.getItem('last_workspace_id');

      const openWorkspace = list.find(w => w.id === lastId) ?? list[0];
      console.info('[desktop index] open last workspace', {
        lastId,
        openWorkspace: openWorkspace?.id,
        flavour: openWorkspace?.flavour,
      });
      openPage(openWorkspace.id, defaultIndexRoute, RouteLogic.REPLACE);
    }
  }, [
    createCloudWorkspace,
    list,
    openPage,
    searchParams,
    listIsLoading,
    loggedIn,
    navigating,
    defaultIndexRoute,
  ]);

  const desktopApi = useServiceOptional(DesktopApiService);

  useEffect(() => {
    desktopApi?.handler.ui.pingAppLayoutReady().catch(console.error);
  }, [desktopApi]);

  useEffect(() => {
    console.info('[desktop index] createFirstAppData start');
    setCreating(true);
    createFirstAppData(workspacesService)
      .then(createdWorkspace => {
        console.info('[desktop index] createFirstAppData done', {
          createdWorkspace: createdWorkspace?.meta.id,
          defaultPageId: createdWorkspace?.defaultPageId,
        });
        if (createdWorkspace) {
          if (createdWorkspace.defaultPageId) {
            jumpToPage(
              createdWorkspace.meta.id,
              createdWorkspace.defaultPageId
            );
          } else {
            openPage(createdWorkspace.meta.id, 'all');
          }
        }
      })
      .catch(err => {
        console.error('创建首个应用数据失败', err);
      })
      .finally(() => {
        console.info('[desktop index] createFirstAppData finally');
        setCreating(false);
      });
  }, [jumpToPage, openPage, workspacesService]);

  // TODO(@eyhn): We need a no workspace page
  useEffect(() => {
    if (!navigating && !creating && !children) {
      console.info('[desktop index] no workspace -> jumpToSignIn');
      jumpToSignIn();
    }
  }, [children, creating, jumpToSignIn, navigating]);

  if (navigating || creating) {
    return fallback ?? <AppContainer fallback />;
  }

  return (
    children ?? (
      // show fallback when redirecting to sign in
      <AppContainer fallback />
    )
  );
};
