import { AffineContext } from '@affine/core/components/context';
import { AppContainer } from '@affine/core/desktop/components/app-container';
import { router } from '@affine/core/desktop/router';
import { configureCommonModules } from '@affine/core/modules';
import { I18nProvider } from '@affine/core/modules/i18n';
import { LifecycleService } from '@affine/core/modules/lifecycle';
import {
  configureLocalStorageStateStorageImpls,
  NbstoreProvider,
} from '@affine/core/modules/storage';
import { PopupWindowProvider } from '@affine/core/modules/url';
import { configureBrowserWorkbenchModule } from '@affine/core/modules/workbench';
import { configureBrowserWorkspaceFlavours } from '@affine/core/modules/workspace-engine';
import createEmotionCache from '@affine/core/utils/create-emotion-cache';
import { getWorkerUrl } from '@affine/env/worker';
import { StoreManagerClient } from '@affine/nbstore/worker/client';
import { CacheProvider } from '@emotion/react';
import { Framework, FrameworkRoot, getCurrentStore } from '@toeverything/infra';
import { OpClient } from '@toeverything/infra/op';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

import { CloudStorageProvider, useCloudStorage } from './cloud-storage-manager';
import { DocumentEditTest } from './document-edit-test';
import { WorkspaceCloudStatus } from './components/workspace-cloud-status';

// 云存储状态指示器组件 - 简化版本，与左上角状态保持一致
const CloudStorageIndicator = () => {
  const { isConnected, storageMode, lastSync, reconnect, pendingOperationsCount } = useCloudStorage();

  const getStatusColor = () => {
    switch (storageMode) {
      case 'cloud': return '#10b981';
      case 'local': return '#6b7280';
      case 'detecting': return '#ffa500';
      case 'error': return '#ef4444';
      default: return '#999';
    }
  };

  const getStatusText = () => {
    if (pendingOperationsCount > 0) return '同步中...';
    switch (storageMode) {
      case 'cloud': return '云存储已连接';
      case 'local': return '本地模式';
      case 'detecting': return '连接中...';
      case 'error': return '连接失败';
      default: return '未知状态';
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSync.getTime()) / 1000);
    if (diff < 60) return '刚刚同步';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    return `${Math.floor(diff / 3600)}小时前`;
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: '8px',
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      fontSize: '13px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '180px',
      color: getStatusColor(),
      fontWeight: '500'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(),
        flexShrink: 0,
        animation: pendingOperationsCount > 0 ? 'pulse 2s infinite' : 'none'
      }} />
      
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: lastSync ? '2px' : '0' }}>
          {getStatusText()}
        </div>
        
        {lastSync && pendingOperationsCount === 0 && (
          <div style={{
            fontSize: '11px',
            color: '#6b7280'
          }}>
            {formatLastSync()}
          </div>
        )}
      </div>

      {pendingOperationsCount > 0 && (
        <span style={{
          backgroundColor: '#f59e0b',
          color: 'white',
          borderRadius: '10px',
          padding: '2px 6px',
          fontSize: '10px',
          minWidth: '16px',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          {pendingOperationsCount}
        </span>
      )}

      {!isConnected && storageMode !== 'detecting' && (
        <button
          onClick={reconnect}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          重连
        </button>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

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
                {/* 云端连接状态已集成到应用标签栏，不再需要固定位置显示 */}
                {/* <WorkspaceCloudStatus /> */}
                {/* 右下角云存储状态指示器 - 暂时注释掉 */}
                {/* <CloudStorageIndicator /> */}
                {/* 文档编辑测试组件 - 暂时注释掉 */}
                {/* <DocumentEditTest /> */}
              </CloudStorageProvider>
            </AffineContext>
          </I18nProvider>
        </CacheProvider>
      </FrameworkRoot>
    </Suspense>
  );
}
