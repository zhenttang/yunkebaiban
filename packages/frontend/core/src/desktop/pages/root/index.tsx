import { NotificationCenter } from '@yunke/component';
import { CLOUD_ENABLED_KEY } from '@yunke/core/modules/cloud/constant';
import { DefaultServerService } from '@yunke/core/modules/cloud';
import { GlobalStateService } from '@yunke/core/modules/storage/services/global';
import { FrameworkScope, LiveData, useLiveData, useService } from '@toeverything/infra';
import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { GlobalDialogs } from '../../dialogs';
import { CustomThemeModifier } from './custom-theme';
import { FindInPagePopup } from './find-in-page/find-in-page-popup';

export const RootWrapper = () => {
  const defaultServerService = useService(DefaultServerService);
  const globalStateService = useService(GlobalStateService);
  const [isServerReady, setIsServerReady] = useState(false);
  const cloudEnabled =
    useLiveData(
      useMemo(
        () =>
          LiveData.from(
            globalStateService.globalState.watch<boolean>(CLOUD_ENABLED_KEY),
            globalStateService.globalState.get<boolean>(CLOUD_ENABLED_KEY)
          ),
        [globalStateService]
      )
    ) === true;

  useEffect(() => {
    if (isServerReady || !cloudEnabled) {
      return;
    }
    const abortController = new AbortController();
    defaultServerService.server
      .waitForConfigRevalidation(abortController.signal)
      .then(() => {
        setIsServerReady(true);
      })
      .catch((error) => {
        console.error('❌ [RootWrapper] Server 配置重新验证失败:', error);
      });
    return () => {
      abortController.abort();
    };
  }, [cloudEnabled, defaultServerService, isServerReady]);

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
