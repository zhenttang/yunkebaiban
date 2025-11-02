import { jsx as _jsx } from "react/jsx-runtime";
import './setup';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
function main() {
    mountApp();
}
function mountApp() {
    const root = document.getElementById('app');
    if (!root) {
        throw new Error('根元素未找到');
    }
    createRoot(root).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
}
main();
//# sourceMappingURL=index.js.map