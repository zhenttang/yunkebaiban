import './setup';

import { appConfigProxy } from '@affine/core/components/hooks/use-app-config-storage';
import { Telemetry } from '@affine/core/components/telemetry';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

function main() {
  // 为electron加载持久化配置
  // TODO(@Peng): 应该是同步的，但目前不是必需的
  appConfigProxy
    .getSync()
    .catch(() => console.error('加载应用配置失败'));

  mountApp();
}

function mountApp() {
  // oxlint-disable-next-line typescript-eslint/no-non-null-assertion
  const root = document.getElementById('app')!;
  createRoot(root).render(
    <StrictMode>
      <Telemetry />
      <App />
    </StrictMode>
  );
}

try {
  main();
} catch (err) {
      console.error('应用启动失败', err);
}
