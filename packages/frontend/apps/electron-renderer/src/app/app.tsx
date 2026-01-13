import { YunkeContext } from '@yunke/core/components/context';
import { WindowsAppControls } from '@yunke/core/components/pure/header/windows-app-controls';
import { AppContainer } from '@yunke/core/desktop/components/app-container';
import { router } from '@yunke/core/desktop/router';
import { I18nProvider } from '@yunke/core/modules/i18n';
import { CloudStorageProvider } from '@yunke/core/modules/cloud-storage';
import createEmotionCache from '@yunke/core/utils/create-emotion-cache';
import { CacheProvider } from '@emotion/react';
import { FrameworkRoot, getCurrentStore } from '@toeverything/infra';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

import { setupEffects } from './effects';
import { DesktopThemeSync } from './theme-sync';

const { frameworkProvider } = setupEffects();

// 调试信息
console.log('BUILD_CONFIG:', {
  isElectron: BUILD_CONFIG.isElectron,
  debug: BUILD_CONFIG.debug,
  distribution: BUILD_CONFIG.distribution,
});
console.log('location.pathname:', location.pathname);

const desktopWhiteList = [
  '/open-app/signin-redirect',
  '/open-app/url',
  '/upgrade-success',
  '/ai-upgrade-success',
  '/share',
  '/oauth',
  '/magic-link',
];
// 临时注释掉这个检查，让桌面应用能够正常启动
/*
if (
  !BUILD_CONFIG.isElectron &&
  BUILD_CONFIG.debug &&
  desktopWhiteList.every(path => !location.pathname.startsWith(path))
) {
  document.body.innerHTML = `<h1 style="color:red;font-size:5rem;text-align:center;">Don't run electron entry in browser.</h1>`;
  throw new Error('错误的分发版本');
}
*/

const cache = createEmotionCache();

const future = {
  v7_startTransition: true,
} as const;

export function App() {
  return (
    <Suspense>
      <FrameworkRoot framework={frameworkProvider}>
        <CacheProvider value={cache}>
          <I18nProvider>
            <YunkeContext store={getCurrentStore()}>
              <CloudStorageProvider>
                <DesktopThemeSync />
                <RouterProvider
                  fallbackElement={<AppContainer fallback />}
                  router={router}
                  future={future}
                />
                {environment.isWindows && (
                  <div style={{ position: 'fixed', right: 0, top: 0, zIndex: 5 }}>
                    <WindowsAppControls />
                  </div>
                )}
              </CloudStorageProvider>
            </YunkeContext>
          </I18nProvider>
        </CacheProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
