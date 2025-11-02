import { jsx as _jsx } from "react/jsx-runtime";
import './setup';
import { events } from '@yunke/electron-api';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
async function main() {
    const handleActive = (active) => {
        document.documentElement.dataset.active = String(active);
    };
    events?.ui.onTabShellViewActiveChange(handleActive);
    mountApp();
}
function mountApp() {
    const root = document.getElementById('app');
    if (!root) {
        throw new Error('根元素未找到');
    }
    createRoot(root).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
}
main().catch(console.error);
//# sourceMappingURL=index.js.map