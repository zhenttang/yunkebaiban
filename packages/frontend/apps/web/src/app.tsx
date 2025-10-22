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

import { CloudStorageProvider } from './cloud-storage-manager';
import { CloudStorageIndicator } from './components/cloud-storage-indicator';
import { deckerIntegrationManager } from '@yunke/core/modules/decker-integration/decker-integration-manager';

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
  `🚀 开始初始化nbstore Worker...\n` +
  `  类型: ${useSharedWorker ? 'SharedWorker' : 'Worker'}\n` +
  `  URL: ${workerUrl}`
);

createWorkerWithTimeout(workerUrl, useSharedWorker)
  .then(worker => {
    if (useSharedWorker) {
      storeManagerClient = new StoreManagerClient(
        new OpClient((worker as SharedWorker).port)
      );
    } else {
      storeManagerClient = new StoreManagerClient(new OpClient(worker as Worker));
    }
    console.log('✅ StoreManagerClient初始化成功');
  })
  .catch(error => {
    console.error('❌ Worker初始化失败，应用可能无法正常使用:', error);
    
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
            <YunkeContext store={getCurrentStore()}>
              <CloudStorageProvider>
                <RouterProvider
                  fallbackElement={<AppContainer fallback />}
                  router={router}
                  future={future}
                />
                <CloudStorageIndicator />
              </CloudStorageProvider>
            </YunkeContext>
          </I18nProvider>
        </CacheProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
