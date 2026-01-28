import { YunkeContext } from '@yunke/core/components/context';
import { WindowsAppControls } from '@yunke/core/components/pure/header/windows-app-controls';
import { AppContainer } from '@yunke/core/desktop/components/app-container';
import { router } from '@yunke/core/desktop/router';
import { I18nProvider } from '@yunke/core/modules/i18n';
import { CloudStorageProvider } from '@yunke/core/modules/cloud-storage';
import createEmotionCache from '@yunke/core/utils/create-emotion-cache';
import { CacheProvider } from '@emotion/react';
import { Framework, FrameworkRoot, getCurrentStore } from '@toeverything/infra';
import { Suspense, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';

import { setupEffects } from './effects';
import { DesktopThemeSync } from './theme-sync';

type FrameworkProviderRef = ReturnType<Framework['provider']>;

type BootstrapState =
  | { status: 'loading' }
  | { status: 'ready'; frameworkProvider: FrameworkProviderRef }
  | { status: 'error'; error: unknown };

let bootstrapPromise: Promise<BootstrapState> | null = null;

function getBootstrapPromise() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const { frameworkProvider } = await setupEffects();
    return { status: 'ready', frameworkProvider } as const;
  })().catch(error => {
    console.error('❌ [electron] 初始化失败:', error);
    return { status: 'error', error } as const;
  });

  return bootstrapPromise;
}

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

  if (bootstrapState.status === 'loading') {
    return <AppContainer fallback />;
  }

  if (bootstrapState.status === 'error') {
    return <BootstrapError error={bootstrapState.error} />;
  }

  return (
    <Suspense>
      <FrameworkRoot framework={bootstrapState.frameworkProvider}>
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
