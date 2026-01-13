import { NotificationCenter } from '@yunke/component';
import { DefaultServerService } from '@yunke/core/modules/cloud';
import { FrameworkScope, useService } from '@toeverything/infra';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { GlobalDialogs } from '../../dialogs';

export const RootWrapper = () => {
  const defaultServerService = useService(DefaultServerService);
  const [isServerReady, setIsServerReady] = useState(false);

  useEffect(() => {
    if (isServerReady) {
      return;
    }
    const abortController = new AbortController();
    console.info('[mobile root wrapper] waitForConfigRevalidation...');
    defaultServerService.server
      .waitForConfigRevalidation(abortController.signal)
      .then(() => {
        console.info('[mobile root wrapper] server ready');
        setIsServerReady(true);
      })
      .catch(err => {
        console.error('[mobile root wrapper] server ready failed', err);
      });
    return () => abortController.abort();
  }, [defaultServerService, isServerReady]);

  console.info('[mobile root wrapper] render', { isServerReady });

  return (
    <FrameworkScope scope={defaultServerService.server.scope}>
      <GlobalDialogs />
      <NotificationCenter />
      <Outlet />
    </FrameworkScope>
  );
};
