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
import { Suspense, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';

type FrameworkProviderRef = ReturnType<Framework['provider']>;

type BootstrapState =
  | { status: 'loading' }
  | { status: 'ready'; frameworkProvider: FrameworkProviderRef }
  | { status: 'error'; error: unknown };

const workerUrl = getWorkerUrl('nbstore');
const useSharedWorker = Boolean(window.SharedWorker);

function createWorkerWithTimeout(
  url: string,
  isSharedWorker: boolean,
  timeoutMs = 30000
): Promise<Worker | SharedWorker> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`Worker loading timeout: ${url}`));
    }, timeoutMs);

    try {
      if (isSharedWorker) {
        const worker = new SharedWorker(url, { name: 'yunke-shared-worker' });
        window.clearTimeout(timeoutId);
        resolve(worker);
      } else {
        const worker = new Worker(url);
        window.clearTimeout(timeoutId);
        resolve(worker);
      }
    } catch (error) {
      window.clearTimeout(timeoutId);
      reject(error);
    }
  });
}

const future = {
  v7_startTransition: true,
} as const;

let bootstrapPromise: Promise<BootstrapState> | null = null;

function getBootstrapPromise() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const worker = await createWorkerWithTimeout(workerUrl, useSharedWorker);
    const storeManagerClient = useSharedWorker
      ? new StoreManagerClient(
          new OpClient((worker as SharedWorker).port)
        )
      : new StoreManagerClient(new OpClient(worker as Worker));

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
            height:
              windowHeight -
              visualViewport.height -
              visualViewport.offsetTop,
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

    window.addEventListener('beforeunload', () => {
      storeManagerClient.dispose();
    });

    // 设置应用程序生命周期事件，并触发应用程序启动事件
    window.addEventListener('focus', () => {
      frameworkProvider.get(LifecycleService).applicationFocus();
    });
    frameworkProvider.get(LifecycleService).applicationStart();

    return { status: 'ready', frameworkProvider } as const;
  })().catch(error => {
    console.error('❌ [mobile] 初始化失败:', error);
    return { status: 'error', error } as const;
  });

  return bootstrapPromise;
}

const SuspenseFallbackLogger = () => {
  console.info('[mobile app] Suspense fallback invoked');
  return null;
};

function BootstrapError({ error }: { error: unknown }) {
  const message = (error as Error | undefined)?.message ?? String(error);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#fff3cd',
        margin: 0,
        padding: '20px',
      }}
    >
      <h2 style={{ color: '#856404', marginBottom: '16px' }}>
        ⚠️ 应用初始化失败
      </h2>
      <p
        style={{
          color: '#856404',
          marginBottom: '20px',
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
        应用在启动过程中遇到错误，请刷新页面重试。
        如果问题持续存在，请联系技术支持。
      </p>
      <div
        style={{
          background: '#fff',
          padding: '16px',
          borderRadius: '8px',
          borderLeft: '4px solid #ffc107',
          marginBottom: '20px',
          maxWidth: '600px',
          width: '100%',
        }}
      >
        <h4 style={{ margin: '0 0 8px 0', color: '#856404' }}>错误详情:</h4>
        <pre
          style={{
            margin: 0,
            padding: '8px',
            background: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            color: '#d63384',
          }}
        >
          {message}
        </pre>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 24px',
          background: '#ffc107',
          color: '#000',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        🔄 刷新页面
      </button>
    </div>
  );
}

export function App() {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;

    getBootstrapPromise().then(state => {
      if (cancelled) {
        return;
      }
      setBootstrapState(state);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (bootstrapState.status !== 'ready') {
      return;
    }
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
  }, [bootstrapState.status]);

  if (bootstrapState.status === 'loading') {
    return <AppFallback />;
  }

  if (bootstrapState.status === 'error') {
    return <BootstrapError error={bootstrapState.error} />;
  }

  console.info('[mobile app] render App');
  return (
    <Suspense fallback={<SuspenseFallbackLogger />}>
      <FrameworkRoot framework={bootstrapState.frameworkProvider}>
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
