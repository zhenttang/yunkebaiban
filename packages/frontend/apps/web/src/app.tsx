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
import { Suspense, useEffect } from 'react';
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

let storeManagerClient: StoreManagerClient;

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
        console.log('✅ Worker创建成功:', url);
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

createWorkerWithTimeout(workerUrl, useSharedWorker)
  .then(worker => {
    try {
      if (useSharedWorker) {
        storeManagerClient = new StoreManagerClient(
          new OpClient((worker as SharedWorker).port)
        );
      } else {
        storeManagerClient = new StoreManagerClient(new OpClient(worker as Worker));
      }

    } catch (clientError) {
      console.error('❌ [Worker] StoreManagerClient 创建失败:', clientError);
      throw clientError;
    }
  })
  .catch(error => {
    console.error('❌ [Worker] Worker初始化失败，应用可能无法正常使用:', error);
    console.error('💥 [Worker] 错误详情:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      workerUrl,
      useSharedWorker,
      supportsSharedWorker: !!window.SharedWorker
    });

    // 显示用户友好的错误提示
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4d4f;
      color: white;
      padding: 20px 30px;
      border-radius: 8px;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 500px;
    `;
    errorDiv.innerHTML = `
      <h3 style="margin: 0 0 10px 0;">⚠️ 应用初始化失败</h3>
      <p style="margin: 0 0 10px 0;">无法加载核心存储模块，请尝试：</p>
      <ol style="margin: 0; padding-left: 20px;">
        <li>刷新页面（Ctrl+F5）</li>
        <li>清除浏览器缓存</li>
        <li>检查网络连接</li>
        <li>联系技术支持</li>
      </ol>
      <button onclick="location.reload()" style="
        margin-top: 15px;
        padding: 8px 16px;
        background: white;
        color: #ff4d4f;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      ">立即刷新</button>
    `;
    document.body.appendChild(errorDiv);
  });

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
      console.warn('⚠️ [全局错误处理] fetch 请求超时，但不应该阻塞页面渲染');
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

window.addEventListener('beforeunload', () => {
  if (storeManagerClient) {
    storeManagerClient.dispose();
  }
});

const future = {
  v7_startTransition: true,
} as const;

let frameworkProvider: FrameworkProvider | null = null;

try {
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

  frameworkProvider = framework.provider();

  // setup application lifecycle events, and emit application start event
  window.addEventListener('focus', () => {
    frameworkProvider!.get(LifecycleService).applicationFocus();
  });

  frameworkProvider!.get(LifecycleService).applicationStart();

} catch (frameworkError) {
  console.error('💥 [Framework] 框架初始化失败:', frameworkError);
  console.error('💥 [Framework] 框架错误详情:', {
    message: frameworkError?.message,
    stack: frameworkError?.stack,
    name: frameworkError?.name
  });

  // 显示框架初始化失败错误
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      background: #fff3cd;
      margin: 0;
      padding: 20px;
    ">
      <h2 style="color: #856404; margin-bottom: 16px;">⚠️ 框架初始化失败</h2>
      <p style="color: #856404; margin-bottom: 20px; text-align: center; max-width: 500px;">
        应用框架在初始化过程中遇到错误，这通常是由于依赖模块加载失败导致的。
      </p>
      <div style="
        background: #fff;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #ffc107;
        margin-bottom: 20px;
        max-width: 600px;
        width: 100%;
      ">
        <h4 style="margin: 0 0 8px 0; color: #856404;">错误详情:</h4>
        <pre style="
          margin: 0;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 12px;
          overflow: auto;
          color: #d63384;
        ">${frameworkError?.message || String(frameworkError)}</pre>
      </div>
      <button onclick="location.reload()" style="
        padding: 12px 24px;
        background: #ffc107;
        color: #000;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      ">🔄 刷新页面</button>
    </div>
  `;

  throw frameworkError;
}

export function App() {

  // 检查框架是否初始化成功
  if (!frameworkProvider) {
    console.error('❌ [App] FrameworkProvider 未初始化，无法渲染应用');
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#e74c3c',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h2>⚠️ 框架初始化失败</h2>
        <p>应用框架未能正确初始化，请刷新页面重试</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          刷新页面
        </button>
      </div>
    );
  }

  const currentStore = getCurrentStore();
  const hideCloudIndicator = /\/download(\-mobile)?(\b|\/)/.test(window.location.pathname);

  return (
    <Suspense fallback={<AppLoading />}>
      <FrameworkRoot framework={frameworkProvider}>
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
