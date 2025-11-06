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
import { RouterProvider } from 'react-router-dom';

import { CloudStorageProvider } from '@yunke/core/modules/cloud-storage';
import { CloudStorageIndicator } from './components/cloud-storage-indicator';
import { deckerIntegrationManager } from '@yunke/core/modules/decker-integration/decker-integration-manager';
import { AppLoading } from './components/app-loading';

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
        console.log('✅ SharedWorker创建成功:', url);
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

console.log(
  `🚀 [Worker] 开始初始化nbstore Worker...\n` +
  `  类型: ${useSharedWorker ? 'SharedWorker' : 'Worker'}\n` +
  `  URL: ${workerUrl}\n` +
  `  支持 SharedWorker: ${!!window.SharedWorker}\n` +
  `  禁用 SharedWorker: ${localStorage.getItem('disableSharedWorker') === 'true'}`
);

createWorkerWithTimeout(workerUrl, useSharedWorker)
  .then(worker => {
    console.log(`✅ [Worker] Worker创建成功，类型: ${useSharedWorker ? 'SharedWorker' : 'Worker'}`, worker);

    try {
      if (useSharedWorker) {
        console.log('🔌 [Worker] 创建 SharedWorker 端口连接');
        storeManagerClient = new StoreManagerClient(
          new OpClient((worker as SharedWorker).port)
        );
      } else {
        console.log('🔌 [Worker] 创建 Worker 直接连接');
        storeManagerClient = new StoreManagerClient(new OpClient(worker as Worker));
      }
      console.log('✅ [Worker] StoreManagerClient初始化成功');

      // 测试连接是否正常
      console.log('🧪 [Worker] 测试 StoreManagerClient 连接...');

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
  console.log('🏗️ [Framework] 开始创建 Framework 实例');
  const framework = new Framework();
  console.log('✅ [Framework] Framework 实例创建成功');

  console.log('⚙️ [Framework] 开始配置通用模块');
  configureCommonModules(framework);
  console.log('✅ [Framework] 通用模块配置完成');

  console.log('🖥️ [Framework] 开始配置浏览器工作台模块');
  configureBrowserWorkbenchModule(framework);
  console.log('✅ [Framework] 浏览器工作台模块配置完成');

  console.log('💾 [Framework] 开始配置本地存储状态实现');
  configureLocalStorageStateStorageImpls(framework);
  console.log('✅ [Framework] 本地存储状态实现配置完成');

  console.log('🏢 [Framework] 开始配置浏览器工作空间风格');
  configureBrowserWorkspaceFlavours(framework);
  console.log('✅ [Framework] 浏览器工作空间风格配置完成');

  console.log('🔌 [Framework] 开始实现 NbstoreProvider');
  framework.impl(NbstoreProvider, {
    openStore(key, options) {
      console.log(`📂 [NbstoreProvider] 尝试打开存储: ${key}`, { options });
      if (!storeManagerClient) {
        console.error('❌ [NbstoreProvider] StoreManagerClient 未初始化');
        throw new Error('StoreManagerClient not initialized');
      }
      try {
        const store = storeManagerClient.open(key, options);
        console.log(`✅ [NbstoreProvider] 存储打开成功: ${key}`);
        return store;
      } catch (error) {
        console.error(`❌ [NbstoreProvider] 存储打开失败: ${key}`, error);
        throw error;
      }
    },
  });
  console.log('✅ [Framework] NbstoreProvider 实现完成');

  console.log('🪟 [Framework] 开始实现 PopupWindowProvider');
  framework.impl(PopupWindowProvider, {
    open: (target: string) => {
      console.log(`🔗 [PopupWindowProvider] 打开弹窗: ${target}`);
      const targetUrl = new URL(target);

      let url: string;
      // safe to open directly if in the same origin
      if (targetUrl.origin === location.origin) {
        url = target;
        console.log(`🔓 [PopupWindowProvider] 同源URL，直接打开: ${url}`);
      } else {
        const redirectProxy = location.origin + '/redirect-proxy';
        const search = new URLSearchParams({
          redirect_uri: target,
        });

        url = `${redirectProxy}?${search.toString()}`;
        console.log(`🔐 [PopupWindowProvider] 跨源URL，使用代理: ${url}`);
      }
      const popup = window.open(url, '_blank', 'popup noreferrer noopener');
      console.log(`✅ [PopupWindowProvider] 弹窗打开结果: ${popup ? '成功' : '失败'}`);
      return popup;
    },
  });
  console.log('✅ [Framework] PopupWindowProvider 实现完成');

  console.log('📦 [Framework] 创建 FrameworkProvider');
  frameworkProvider = framework.provider();
  console.log('✅ [Framework] FrameworkProvider 创建成功');

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
  console.log('🚀 [App] 开始渲染应用组件');

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

  return (
    <Suspense fallback={<AppLoading />}>
      {(() => {
        console.log('📦 [App] 开始渲染 FrameworkRoot');
        try {
          return (
            <FrameworkRoot framework={frameworkProvider}>
              {(() => {
                console.log('🎨 [App] 开始渲染 CacheProvider');
                return (
                  <CacheProvider value={cache}>
                    {(() => {
                      console.log('🌍 [App] 开始渲染 I18nProvider');
                      return (
                        <I18nProvider>
                          {(() => {
                            console.log('🏪 [App] 开始渲染 YunkeContext');
                            try {
                              const currentStore = getCurrentStore();
                              console.log('✅ [App] YunkeContext store 获取成功:', currentStore ? '有效' : '无效');
                              return (
                                <YunkeContext store={currentStore}>
                                  {(() => {
                                    console.log('☁️ [App] 开始渲染 CloudStorageProvider');
                                    return (
                                      <CloudStorageProvider>
                                        {(() => {
                                          console.log('🛣️ [App] 开始渲染 RouterProvider');
                                          console.log('🛣️ [App] 当前路径:', window.location.pathname);
                                          console.log('🛣️ [App] 路由器实例:', router);

                                          const hideCloudIndicator = /\/download(\-mobile)?(\b|\/)/.test(window.location.pathname);
                                          return (
                                            <>
                                              <RouterProvider
                                                fallbackElement={<AppContainer fallback />}
                                                router={router}
                                                future={future}
                                              />
                                              {!hideCloudIndicator && <CloudStorageIndicator />}
                                            </>
                                          );
                                        })()}
                                      </CloudStorageProvider>
                                    );
                                  })()}
                                </YunkeContext>
                              );
                            } catch (error) {
                              console.error('❌ [App] YunkeContext 渲染失败:', error);
                              throw error;
                            }
                          })()}
                        </I18nProvider>
                      );
                    })()}
                  </CacheProvider>
                );
              })()}
            </FrameworkRoot>
          );
        } catch (error) {
          console.error('❌ [App] FrameworkRoot 渲染失败:', error);
          throw error;
        }
      })()}
    </Suspense>
  );
}
