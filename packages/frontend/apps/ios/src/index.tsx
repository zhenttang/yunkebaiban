import './setup';
import '@yunke/component/theme';
import '@yunke/core/mobile/styles/mobile.css';

import { Telemetry } from '@yunke/core/components/telemetry';
import { bindNativeDBApis } from '@yunke/nbstore/sqlite';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { NbStoreNativeDBApis } from './plugins/nbstore';

bindNativeDBApis(NbStoreNativeDBApis);

function mountApp() {
  // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
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
