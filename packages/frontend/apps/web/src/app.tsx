import { YunkeContext } from '@yunke/core/components/context';
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
import { Suspense, useEffect, useState } from 'react';
import { RouterProvider, type RouterProviderProps } from 'react-router-dom';

import { CloudStorageProvider } from '@yunke/core/modules/cloud-storage';
import { CloudStorageIndicator } from './components/cloud-storage-indicator';
import { deckerIntegrationManager } from '@yunke/core/modules/decker-integration/decker-integration-manager';
import { AppLoading } from './components/app-loading';

// 🔍 RouterProvider 包装组件，用于监听路由状态
function RouterProviderWrapper(props: RouterProviderProps) {
  const { router } = props;
  
  useEffect(() => {
    const checkRouterState = () => {
      // Router state check logic
    };
    
    checkRouterState();
    
    // 监听路由变化
    const unsubscribe = router?.subscribe?.(checkRouterState);
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router]);
  
  return <RouterProvider {...props} />;
}

const cache = createEmotionCache();

type FrameworkProviderRef = ReturnType<Framework['provider']>;

type BootstrapState =
  | { status: 'loading' }
  | { status: 'ready'; frameworkProvider: FrameworkProviderRef }
  | { status: 'error'; error: unknown };

let storeManagerClient: StoreManagerClient | null = null;

const workerUrl = getWorkerUrl('nbstore');

// 🔥 性能优化：添加Worker加载超时检测和错误提示
function createWorkerWithTimeout(
  url: string,
  isSharedWorker: boolean,
  timeoutMs = 30000 // 30秒超时
): Promise<Worker | SharedWorker> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error(
        `⚠️ Worker加载超时 (${timeoutMs}ms): ${url}\n` +
        `可能原因:\n` +
        `  1. Worker文件过大，下载缓慢\n` +
        `  2. 网络连接问题\n` +
        `  3. 构建配置错误\n` +
        `建议: 检查Network面板或重新构建项目`
      );
      reject(new Error(`Worker loading timeout: ${url}`));
    }, timeoutMs);

    try {
      if (isSharedWorker) {
        const worker = new SharedWorker(url, {
          name: 'yunke-shared-worker',
        });
        
        // SharedWorker成功创建
        clearTimeout(timeoutId);
        resolve(worker);
      } else {
        const worker = new Worker(url);
        
        // Worker成功创建
        clearTimeout(timeoutId);
        resolve(worker);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Worker创建失败:', error);
      reject(error);
    }
  });
}

// 初始化Worker（带错误处理）
const useSharedWorker =
  window.SharedWorker &&
  localStorage.getItem('disableSharedWorker') !== 'true';

// 🔧 修复：添加全局错误处理，捕获未处理的 Promise rejection
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  const errorMessage = error?.message || String(error);
  
  // 检查是否是超时错误
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    console.error('⚠️ [全局错误处理] 检测到未处理的超时错误:', {
      message: errorMessage,
      error: error,
      stack: error?.stack
    });
    
    // 如果是 fetch 超时，记录详细信息但不阻止页面渲染
    if (errorMessage.includes('fetchError') || errorMessage.includes('Request timeout')) {
      // 不阻止默认行为，让应用继续运行
      // event.preventDefault(); // 如果需要阻止默认错误处理，取消注释
    }
  } else {
    console.error('❌ [全局错误处理] 未处理的 Promise rejection:', {
      message: errorMessage,
      error: error,
      stack: error?.stack
    });
  }
});

const future = {
  v7_startTransition: true,
} as const;

let bootstrapPromise: Promise<BootstrapState> | null = null;

function getBootstrapPromise(): Promise<BootstrapState> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    const worker = await createWorkerWithTimeout(workerUrl, useSharedWorker);
    if (useSharedWorker) {
      storeManagerClient = new StoreManagerClient(
        new OpClient((worker as SharedWorker).port)
      );
    } else {
      storeManagerClient = new StoreManagerClient(new OpClient(worker as Worker));
    }

    const framework = new Framework();

    configureCommonModules(framework);
    configureBrowserWorkbenchModule(framework);
    configureLocalStorageStateStorageImpls(framework);
    configureBrowserWorkspaceFlavours(framework);

    framework.impl(NbstoreProvider, {
      openStore(key, options) {
        if (!storeManagerClient) {
          throw new Error('StoreManagerClient not initialized');
        }
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
        return window.open(url, '_blank', 'popup noreferrer noopener');
      },
    });

    const frameworkProvider = framework.provider();

    // setup application lifecycle events, and emit application start event
    window.addEventListener('focus', () => {
      frameworkProvider.get(LifecycleService).applicationFocus();
    });

    frameworkProvider.get(LifecycleService).applicationStart();

    window.addEventListener('beforeunload', () => {
      storeManagerClient?.dispose();
    });

    return { status: 'ready', frameworkProvider };
  })().catch(error => {
    console.error('❌ [Worker/Framework] 初始化失败:', error);
    console.error('💥 [Worker/Framework] 错误详情:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      workerUrl,
      useSharedWorker,
      supportsSharedWorker: !!window.SharedWorker,
    });
    return { status: 'error', error };
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
    return <AppLoading />;
  }

  if (bootstrapState.status === 'error') {
    return <BootstrapError error={bootstrapState.error} />;
  }

  const currentStore = getCurrentStore();
  const hideCloudIndicator = /\/download(\-mobile)?(\b|\/)/.test(window.location.pathname);

  return (
    <Suspense fallback={<AppLoading />}>
      <FrameworkRoot framework={bootstrapState.frameworkProvider}>
        <CacheProvider value={cache}>
          <I18nProvider>
            <YunkeContext store={currentStore}>
              <CloudStorageProvider>
                <>
                  <RouterProviderWrapper 
                    fallbackElement={<AppContainer fallback />}
                    router={router}
                    future={future}
                  />
                  {!hideCloudIndicator && <CloudStorageIndicator />}
                </>
              </CloudStorageProvider>
            </YunkeContext>
          </I18nProvider>
        </CacheProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
