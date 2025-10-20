import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import { useServiceOptional } from '@toeverything/infra';
import { useCallback } from 'react';
import { redirect } from 'react-router-dom';

import { Onboarding } from '../../../components/yunke/onboarding/onboarding';
import { appConfigStorage } from '../../../components/hooks/use-app-config-storage';

/**
 * /onboarding page
 *
 * only for electron
 */
export const loader = () => {
  if (!BUILD_CONFIG.isElectron && !appConfigStorage.get('onBoarding')) {
    // onboarding is off, redirect to index
    return redirect('/');
  }

  return null;
};

export const Component = () => {
  const desktopApi = useServiceOptional(DesktopApiService);

  const openApp = useCallback(() => {
    desktopApi?.handler.ui.handleOpenMainApp().catch(err => {
      console.log('打开主应用失败', err);
    });
  }, [desktopApi]);

  return <Onboarding onOpenApp={openApp} />;
};
