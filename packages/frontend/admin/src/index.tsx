import './global.css';
import './styles/animations.css';
import './setup';

// 添加全局样式修复滚动问题
const style = document.createElement('style');
style.innerHTML = `
  html, body {
    height: 100%;
    overflow: hidden;
    position: fixed;
    width: 100%;
    touch-action: none;
  }
`;
document.head.appendChild(style);

import { createRoot } from 'react-dom/client';

import { App } from './app';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('app')!).render(<App />);
