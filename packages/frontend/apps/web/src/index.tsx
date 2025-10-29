import './setup';

import { Telemetry } from '@yunke/core/components/telemetry';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

function mountApp() {
  console.log('🚀 [index] 开始挂载应用');

  // oxlint-disable-next-line @typescript-eslint/no-non-null-assertion
  const root = document.getElementById('app')!;
  console.log('✅ [index] 找到根元素:', root);

  try {
    console.log('📦 [index] 开始创建 React Root');
    const reactRoot = createRoot(root);
    console.log('✅ [index] React Root 创建成功');

    console.log('🎨 [index] 开始渲染 Telemetry 和 App 组件');
    reactRoot.render(
      <StrictMode>
        <Telemetry />
        <App />
      </StrictMode>
    );
    console.log('✅ [index] 应用渲染完成');
  } catch (error) {
    console.error('❌ [index] React 渲染失败:', error);
    throw error;
  }
}

try {
  console.log('🎯 [index] 开始启动应用');
  mountApp();
  console.log('🎉 [index] 应用启动成功');
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
