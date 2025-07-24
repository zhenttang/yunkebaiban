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

// 添加全局错误处理
window.addEventListener('error', (event) => {
  console.error('🔴 全局错误:', event.error);
  console.error('错误堆栈:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 未处理的Promise拒绝:', event.reason);
});

function mountApp() {
  try {
    // oxlint-disable-next-line no-non-null-assertion
    const root = document.getElementById('app')!;
    if (!root) {
      throw new Error('找不到app根元素');
    }
    
    console.log('🚀 开始挂载应用...');
    
    // 先显示加载中状态
    root.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-size: 18px;
        color: #666;
      ">
        <div style="text-align: center;">
          <div>正在初始化应用...</div>
          <div style="margin-top: 10px; font-size: 14px;">请稍候</div>
        </div>
      </div>
    `;
    
    // 延迟挂载React应用，确保所有服务初始化完成
    setTimeout(() => {
      console.log('⏰ 延迟挂载React应用...');
      try {
        createRoot(root).render(
          <StrictMode>
            <Telemetry />
            <App />
          </StrictMode>
        );
        console.log('✅ 应用挂载成功');
      } catch (error) {
        console.error('❌ React应用挂载失败:', error);
        root.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <h2>应用加载失败</h2>
            <p>错误信息: ${error.message}</p>
            <p>请尝试刷新页面</p>
          </div>
        `;
      }
    }, 500); // 延迟500ms确保framework初始化完成
    
  } catch (error) {
    console.error('❌ 应用挂载失败:', error);
    // 显示错误信息给用户
    const root = document.getElementById('app');
    if (root) {
      root.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h2>应用加载失败</h2>
          <p>错误信息: ${error.message}</p>
          <p>请尝试刷新页面</p>
        </div>
      `;
    }
  }
}

try {
  mountApp();
} catch (err) {
      console.error('应用启动失败', err);
}
