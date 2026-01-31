import {
  useBindWorkbenchToBrowserRouter,
  WorkbenchService,
} from '@yunke/core/modules/workbench';
import { ViewRoot } from '@yunke/core/modules/workbench/view/view-root';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect } from 'react';
import { type RouteObject, useLocation } from 'react-router-dom';

import { useNavigationSync } from '../../components/app-tabs/navigation-sync';
import { NavigationSyncProvider } from '../../components/app-tabs/navigation-context';

export const MobileWorkbenchRoot = ({ routes }: { routes: RouteObject[] }) => {
  const workbench = useService(WorkbenchService).workbench;

  // for debugging
  (window as any).workbench = workbench;

  const views = useLiveData(workbench.views$);

  const location = useLocation();
  const basename = location.pathname.match(/\/workspace\/[^/]+/g)?.[0] ?? '/';

  useBindWorkbenchToBrowserRouter(workbench, basename);

  // 🔄 底部导航状态同步
  const navigationSync = useNavigationSync();

  useEffect(() => {
    workbench.updateBasename(basename);
  }, [basename, workbench]);

  return (
    <NavigationSyncProvider markUserNavigation={navigationSync.markUserNavigation}>
      <ViewRoot routes={routes} view={views[0]} />
    </NavigationSyncProvider>
  );
};
