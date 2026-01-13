import { YunkeContext } from '@yunke/core/components/context';
import { AppFallback } from '@yunke/core/mobile/components/app-fallback';
import { configureMobileModules } from '@yunke/core/mobile/modules';
import { HapticProvider } from '@yunke/core/mobile/modules/haptics';
import { VirtualKeyboardProvider } from '@yunke/core/mobile/modules/virtual-keyboard';
import { router } from '@yunke/core/mobile/router';
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
import { getWorkerUrl } from '@yunke/env/worker';
import { StoreManagerClient } from '@yunke/nbstore/worker/client';
import { Framework, FrameworkRoot, getCurrentStore } from '@toeverything/infra';
import { OpClient } from '@toeverything/infra/op';
import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

let storeManagerClient: StoreManagerClient;

const workerUrl = getWorkerUrl('nbstore');
if (window.SharedWorker) {
  const worker = new SharedWorker(workerUrl, { name: 'yunke-shared-worker' });
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
configureMobileModules(framework);
framework.impl(NbstoreProvider, {
  openStore(key, options) {
    const { store, dispose } = storeManagerClient.open(key, options);
    return {
      store: store,
      dispose: () => {
        dispose();
      },
    };
  },
});
framework.impl(PopupWindowProvider, {
  open: (target: string) => {
    const targetUrl = new URL(target);

    let url: string;
    // 如果在相同域下，可以安全地直接打开
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
framework.impl(HapticProvider, {
  impact: options => {
    return new Promise(resolve => {
      const style = options?.style ?? 'LIGHT';
      const pattern = {
        LIGHT: [10],
        MEDIUM: [20],
        HEAVY: [30],
      }[style];
      const result = navigator.vibrate?.(pattern);
      if (!result) {
        console.warn('不支持振动，或用户未交互');
      }
      resolve();
    });
  },
  notification: () => Promise.reject('Not supported'),
  vibrate: () => Promise.reject('Not supported'),
  selectionStart: () => Promise.reject('Not supported'),
  selectionChanged: () => Promise.reject('Not supported'),
  selectionEnd: () => Promise.reject('Not supported'),
});
framework.impl(VirtualKeyboardProvider, {
  onChange: callback => {
    if (!visualViewport) {
      console.warn('不支持visualViewport');
      return () => {};
    }

    const listener = () => {
      if (!visualViewport) return;
      const windowHeight = window.innerHeight;

      /**
       * ┌───────────────┐ - window top
       * │               │
       * │               │
       * │               │
       * │               │
       * │               │
       * └───────────────┘ - keyboard top        --
       * │               │                       │ keyboard height in layout viewport
       * └───────────────┘ - page(html) bottom   --
       * │               │                       │ visualViewport.offsetTop
       * └───────────────┘ - window bottom       --
       */
      callback({
        visible: window.innerHeight - visualViewport.height > 0,
        height: windowHeight - visualViewport.height - visualViewport.offsetTop,
      });
    };

    visualViewport.addEventListener('resize', listener);
    visualViewport.addEventListener('scroll', listener);
    return () => {
      visualViewport?.removeEventListener('resize', listener);
      visualViewport?.removeEventListener('scroll', listener);
    };
  },
});
const frameworkProvider = framework.provider();

// 设置应用程序生命周期事件，并触发应用程序启动事件
window.addEventListener('focus', () => {
  frameworkProvider.get(LifecycleService).applicationFocus();
});
frameworkProvider.get(LifecycleService).applicationStart();

const SuspenseFallbackLogger = () => {
  console.info('[mobile app] Suspense fallback invoked');
  return null;
};

export function App() {
  console.info('[mobile app] render App');
  useEffect(() => {
    console.info('[mobile app] subscribe router');
    const unsubscribe = router.subscribe(state => {
      console.info('[mobile app] router state', {
        historyAction: state.historyAction,
        location: `${state.location?.pathname ?? ''}${state.location?.search ?? ''}`,
        initialized: state.initialized,
        matches: state.matches?.map(m => m.route.path ?? '(index)'),
        navigationState: state.navigation?.state,
        loaderState: state.loaderData ? Object.keys(state.loaderData) : [],
        errors: state.errors,
      });
    });
    const onError = (event: ErrorEvent) => {
      console.error('[mobile app] window error', event.message);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      console.error('[mobile app] unhandledrejection', event.reason);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      unsubscribe();
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  return (
    <Suspense fallback={<SuspenseFallbackLogger />}>
      <FrameworkRoot framework={frameworkProvider}>
        <I18nProvider>
          <YunkeContext store={getCurrentStore()}>
            <RouterProvider
              fallbackElement={<AppFallback />}
              router={router}
              future={future}
            />
          </YunkeContext>
        </I18nProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
