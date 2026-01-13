// 🔥 轻量级Worker Bootstrap
// Worker环境不需要完整的浏览器初始化代码

// Worker需要的基础polyfills
import './polyfill/array';
import './polyfill/set';
import './polyfill/dispose';
import './polyfill/iterator-helpers';
import './polyfill/promise-with-resolvers';

// ❌ Worker不需要以下内容:
// - resize-observer (DOM API)
// - request-idle-callback (浏览器特定)
// - telemetry (遥测可以在主线程做)
// - public-path (Worker有自己的作用域)

// 设置Worker环境标识
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__WORKER_ENVIRONMENT__ = true;
}

