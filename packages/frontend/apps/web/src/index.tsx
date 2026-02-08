import './setup';

import { Telemetry } from '@yunke/core/components/telemetry';
import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

async function cleanupLegacyServiceWorkers() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
  } catch (error) {
    console.warn('[SW] 清理历史 service worker 失败:', error);
  }

  if (typeof caches === 'undefined') {
    return;
  }

  try {
    const keys = await caches.keys();
    const staleKeys = keys.filter(
      key =>
        key.startsWith('yunke-v') ||
        key.startsWith('workbox-precache') ||
        key.startsWith('workbox-runtime')
    );
    await Promise.all(staleKeys.map(key => caches.delete(key)));
  } catch (error) {
    console.warn('[SW] 清理历史缓存失败:', error);
  }
}

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
  // 已移除 SW 功能；启动时做一次清理，防止历史 worker 残留导致刷新抖动
  void cleanupLegacyServiceWorkers();
  mountApp();
} catch (err) {
  console.error('💥 [index] 应用启动失败:', err);

  // 显示用户友好的错误信息（避免 innerHTML 注入）
  const message = (err as Error | undefined)?.message ?? String(err);
  document.body.textContent = '';

  const container = document.createElement('div');
  container.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'height:100vh',
    'font-family:system-ui, -apple-system, sans-serif',
    'background:#f5f5f5',
    'margin:0',
    'padding:20px',
    'box-sizing:border-box',
  ].join(';');

  const title = document.createElement('h2');
  title.textContent = '⚠️ 应用启动失败';
  title.style.cssText = 'color:#e74c3c;margin-bottom:16px';

  const desc = document.createElement('p');
  desc.textContent =
    '应用在启动过程中遇到错误，请刷新页面重试。如果问题持续存在，请联系技术支持。';
  desc.style.cssText =
    'color:#666;margin-bottom:20px;text-align:center;max-width:500px';

  const details = document.createElement('div');
  details.style.cssText = [
    'background:#fff',
    'padding:16px',
    'border-radius:8px',
    'border-left:4px solid #e74c3c',
    'margin-bottom:20px',
    'max-width:600px',
    'width:100%',
  ].join(';');

  const detailsTitle = document.createElement('h4');
  detailsTitle.textContent = '错误详情:';
  detailsTitle.style.cssText = 'margin:0 0 8px 0;color:#333';

  const pre = document.createElement('pre');
  pre.textContent = message;
  pre.style.cssText = [
    'margin:0',
    'padding:8px',
    'background:#f8f9fa',
    'border-radius:4px',
    'font-size:12px',
    'overflow:auto',
    'color:#e74c3c',
  ].join(';');

  const button = document.createElement('button');
  button.textContent = '🔄 刷新页面';
  button.onclick = () => location.reload();
  button.style.cssText = [
    'padding:12px 24px',
    'background:#3498db',
    'color:white',
    'border:none',
    'border-radius:6px',
    'cursor:pointer',
    'font-size:14px',
    'font-weight:500',
  ].join(';');

  details.append(detailsTitle, pre);
  container.append(title, desc, details, button);
  document.body.appendChild(container);
}
