import './setup';

import { Telemetry } from '@affine/core/components/telemetry';
// 移除SQLite原生API绑定
// import { bindNativeDBApis } from '@affine/nbstore/sqlite';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
// import { NbStoreNativeDBApis } from './plugins/nbstore';

// 移除原生DB API绑定
// bindNativeDBApis(NbStoreNativeDBApis);

function mountApp() {
  // oxlint-disable-next-line no-non-null-assertion
  const root = document.getElementById('app')!;
  createRoot(root).render(
    <StrictMode>
      <Telemetry />
      <App />
    </StrictMode>
  );
}

try {
  mountApp();
} catch (err) {
      console.error('应用启动失败', err);
}
