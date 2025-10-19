import { AffineContext } from '@yunke/core/components/context';
import { AppContainer } from '@yunke/core/desktop/components/app-container';
import { router } from '@yunke/core/desktop/router';
import { configureCommonModules } from '@yunke/core/modules';
import { I18nProvider } from '@yunke/core/modules/i18n';
import { LifecycleService } from '@yunke/core/modules/lifecycle';
import {
  configureLocalStorageStateStorageImpls,
  NbstoreProvider,
} from '@yunke/core/modules/storage';
import { PopupWindowProvider } from '@yunke/core/modules/url';
import { configureBrowserWorkbenchModule } from '@yunke/core/modules/workbench';
import { configureBrowserWorkspaceFlavours } from '@yunke/core/modules/workspace-engine';
import createEmotionCache from '@yunke/core/utils/create-emotion-cache';
import { getWorkerUrl } from '@yunke/env/worker';
import { StoreManagerClient } from '@yunke/nbstore/worker/client';
import { CacheProvider } from '@emotion/react';
import { Framework, FrameworkRoot, getCurrentStore } from '@toeverything/infra';
import { OpClient } from '@toeverything/infra/op';
import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { CloudStorageProvider } from './cloud-storage-manager';
import { CloudStorageIndicator } from './components/cloud-storage-indicator';
import { deckerIntegrationManager } from '@yunke/core/modules/decker-integration/decker-integration-manager';

const cache = createEmotionCache();

let storeManagerClient: StoreManagerClient;

const workerUrl = getWorkerUrl('nbstore');

if (
  window.SharedWorker &&
  localStorage.getItem('disableSharedWorker') !== 'true'
) {
  const worker = new SharedWorker(workerUrl, {
    name: 'affine-shared-worker',
  });
  storeManagerClient = new StoreManagerClient(new OpClient(worker.port));
} else {
  const worker = new Worker(workerUrl);
  storeManagerClient = new StoreManagerClient(new OpClient(worker));
}
window.addEventListener('beforeunload', () => {
  storeManagerClient.dispose();
});

const future = {
  v7_startTransition: true,
} as const;

const framework = new Framework();
configureCommonModules(framework);
configureBrowserWorkbenchModule(framework);
configureLocalStorageStateStorageImpls(framework);
configureBrowserWorkspaceFlavours(framework);
framework.impl(NbstoreProvider, {
  openStore(key, options) {
    return storeManagerClient.open(key, options);
  },
});
framework.impl(PopupWindowProvider, {
  open: (target: string) => {
    const targetUrl = new URL(target);

    let url: string;
    // safe to open directly if in the same origin
    if (targetUrl.origin === location.origin) {
      url = target;
    } else {
      const redirectProxy = location.origin + '/redirect-proxy';
      const search = new URLSearchParams({
        redirect_uri: target,
      });

      url = `${redirectProxy}?${search.toString()}`;
    }
    window.open(url, '_blank', 'popup noreferrer noopener');
  },
});
const frameworkProvider = framework.provider();

// setup application lifecycle events, and emit application start event
window.addEventListener('focus', () => {
  frameworkProvider.get(LifecycleService).applicationFocus();
});
frameworkProvider.get(LifecycleService).applicationStart();

export function App() {
  return (
    <Suspense>
      <FrameworkRoot framework={frameworkProvider}>
        <CacheProvider value={cache}>
          <I18nProvider>
            <AffineContext store={getCurrentStore()}>
              <CloudStorageProvider>
                <RouterProvider
                  fallbackElement={<AppContainer fallback />}
                  router={router}
                  future={future}
                />
                <CloudStorageIndicator />
              </CloudStorageProvider>
            </AffineContext>
          </I18nProvider>
        </CacheProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
