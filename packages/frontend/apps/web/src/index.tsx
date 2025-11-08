import './setup';

import { Telemetry } from '@yunke/core/components/telemetry';
import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

function mountApp() {
  // 确保 React 全局可用（某些第三方库可能需要）
  if (typeof window !== 'undefined' && typeof window.React === 'undefined') {
    (window as any).React = React;
  }

  // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
  const root = document.getElementById('app')!;

  try {
    const reactRoot = createRoot(root);
    reactRoot.render(
      <StrictMode>
        <Telemetry />
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('❌ [index] React 渲染失败:', error);
    throw error;
  }
}

try {
  mountApp();
} catch (err) {
  console.error('💥 [index] 应用启动失败:', err);

  // 显示用户友好的错误信息
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f5f5;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    ">
      <h2 style="color: #e74c3c; margin-bottom: 16px;">⚠️ 应用启动失败</h2>
      <p style="color: #666; margin-bottom: 20px; text-align: center; max-width: 500px;">
        应用在启动过程中遇到错误，请刷新页面重试。
        如果问题持续存在，请联系技术支持。
      </p>
      <div style="
        background: #fff;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #e74c3c;
        margin-bottom: 20px;
        max-width: 600px;
        width: 100%;
      ">
        <h4 style="margin: 0 0 8px 0; color: #333;">错误详情:</h4>
        <pre style="
          margin: 0;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 12px;
          overflow: auto;
          color: #e74c3c;
        ">${err?.message || String(err)}</pre>
      </div>
      <button onclick="location.reload()" style="
        padding: 12px 24px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      ">🔄 刷新页面</button>
    </div>
  `;
}
