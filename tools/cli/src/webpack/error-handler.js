(function () {
  var errorEl = null;
  function showGlobalErrorPage() {
    if (errorEl) {
      return;
    }

    // 检测深色模式
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    errorEl = document.createElement('div');
    errorEl.innerHTML = [
      '<style>',
      ':root {',
      '  --systemPrimary: ' + (prefersDark ? '#ffffff' : '#000000') + ';',
      '  --systemSecondary: ' + (prefersDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)') + ';',
      '  --systemTertiary: ' + (prefersDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)') + ';',
      '  --pageBG: ' + (prefersDark ? '#000000' : '#ffffff') + ';',
      '  --panelBG: ' + (prefersDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)') + ';',
      '  --keyColor: #007AFF;',
      '  --borderColor: ' + (prefersDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)') + ';',
      '  --shadow: ' + (prefersDark ? '0 10px 40px rgba(0, 0, 0, 0.6)' : '0 10px 40px rgba(0, 0, 0, 0.12)') + ';',
      '}',
      '@media (prefers-color-scheme: dark) {',
      '  :root {',
      '    --systemPrimary: #ffffff;',
      '    --systemSecondary: rgba(255, 255, 255, 0.6);',
      '    --systemTertiary: rgba(255, 255, 255, 0.4);',
      '    --pageBG: #000000;',
      '    --panelBG: rgba(255, 255, 255, 0.08);',
      '    --borderColor: rgba(255, 255, 255, 0.18);',
      '    --shadow: 0 10px 40px rgba(0, 0, 0, 0.6);',
      '  }',
      '}',
      '* { box-sizing: border-box; margin: 0; padding: 0; }',
      '.error-container {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  width: 100vw;',
      '  height: 100vh;',
      '  height: 100dvh;',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: center;',
      '  background: var(--pageBG);',
      '  background-image: ' + (prefersDark 
        ? 'radial-gradient(1200px 1200px at 80% -10%, rgba(24, 32, 58, 0.5) 0%, transparent 45%), linear-gradient(180deg, #000000 0%, #000000 100%)'
        : 'radial-gradient(1200px 1200px at 80% -10%, rgba(232, 240, 255, 0.5) 0%, transparent 45%), linear-gradient(180deg, #ffffff 0%, #ffffff 100%)') + ';',
      '  z-index: 999999;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;',
      '  padding: 16px;',
      '}',
      '.error-content {',
      '  display: flex;',
      '  flex-direction: column;',
      '  align-items: center;',
      '  justify-content: center;',
      '  max-width: 500px;',
      '  width: 100%;',
      '  text-align: center;',
      '  gap: 24px;',
      '}',
      '.error-icon {',
      '  width: 120px;',
      '  height: 120px;',
      '  margin-bottom: 8px;',
      '  opacity: 0.8;',
      '  animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;',
      '}',
      '@keyframes fadeInScale {',
      '  from {',
      '    opacity: 0;',
      '    transform: scale(0.8);',
      '  }',
      '  to {',
      '    opacity: 0.8;',
      '    transform: scale(1);',
      '  }',
      '}',
      '.error-icon-inner {',
      '  width: 100%;',
      '  height: 100%;',
      '  border-radius: 28px;',
      '  background: var(--panelBG);',
      '  backdrop-filter: blur(20px) saturate(180%);',
      '  border: 1px solid var(--borderColor);',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  box-shadow: var(--shadow);',
      '}',
      '.error-icon-symbol {',
      '  width: 64px;',
      '  height: 64px;',
      '  color: var(--systemSecondary);',
      '  opacity: 0.6;',
      '}',
      '.error-title {',
      '  font-size: 28px;',
      '  font-weight: 600;',
      '  line-height: 34px;',
      '  letter-spacing: -0.2px;',
      '  color: var(--systemPrimary);',
      '  margin: 0;',
      '  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;',
      '}',
      '@keyframes fadeInUp {',
      '  from {',
      '    opacity: 0;',
      '    transform: translateY(20px);',
      '  }',
      '  to {',
      '    opacity: 1;',
      '    transform: translateY(0);',
      '  }',
      '}',
      '.error-description {',
      '  font-size: 17px;',
      '  font-weight: 400;',
      '  line-height: 26px;',
      '  color: var(--systemSecondary);',
      '  margin: 0;',
      '  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;',
      '}',
      '.error-description a {',
      '  color: var(--keyColor);',
      '  text-decoration: none;',
      '  transition: opacity 0.2s ease;',
      '}',
      '.error-description a:hover {',
      '  opacity: 0.8;',
      '  text-decoration: underline;',
      '}',
      '.error-action {',
      '  margin-top: 8px;',
      '  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;',
      '}',
      '.error-button {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  padding: 12px 24px;',
      '  font-size: 15px;',
      '  font-weight: 600;',
      '  line-height: 20px;',
      '  color: var(--keyColor);',
      '  background: transparent;',
      '  border: 1px solid var(--borderColor);',
      '  border-radius: 10px;',
      '  cursor: pointer;',
      '  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);',
      '  text-decoration: none;',
      '  margin-top: 16px;',
      '}',
      '.error-button:hover {',
      '  background: var(--panelBG);',
      '  border-color: var(--keyColor);',
      '  transform: translateY(-1px);',
      '}',
      '.error-button:active {',
      '  transform: translateY(0);',
      '}',
      '@media (max-width: 600px) {',
      '  .error-content {',
      '    max-width: 100%;',
      '    gap: 20px;',
      '  }',
      '  .error-icon {',
      '    width: 100px;',
      '    height: 100px;',
      '  }',
      '  .error-icon-symbol {',
      '    width: 56px;',
      '    height: 56px;',
      '  }',
      '  .error-title {',
      '    font-size: 24px;',
      '    line-height: 30px;',
      '  }',
      '  .error-description {',
      '    font-size: 16px;',
      '    line-height: 24px;',
      '  }',
      '}',
      '</style>',
      '<div class="error-container">',
      '  <div class="error-content">',
      '    <div class="error-icon">',
      '      <div class="error-icon-inner">',
      '        <svg class="error-icon-symbol" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '          <path d="M32 20V36M32 44H32.04M56 32C56 45.2548 45.2548 56 32 56C18.7452 56 8 45.2548 8 32C8 18.7452 18.7452 8 32 8C45.2548 8 56 18.7452 56 32Z" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
      '        </svg>',
      '      </div>',
      '    </div>',
      '    <h1 class="error-title">不支持的环境</h1>',
      '    <p class="error-description">',
      '      看起来 YUNKE 无法在此环境中运行。请确保您使用的是受支持的浏览器，或将您的设备操作系统更新到最新版本。如果问题仍然存在，请访问我们的 <a href="https://gitcode.com/xiaoleixiaolei/issues" target="_blank" rel="noopener">支持页面</a> 获取进一步帮助。',
      '    </p>',
      '    <div class="error-action">',
      '      <a href="https://gitcode.com/xiaoleixiaolei/issues" class="error-button" target="_blank" rel="noopener">',
      '        获取帮助',
      '      </a>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('');
    document.body.append(errorEl);
    
    // 监听深色模式变化
    if (window.matchMedia) {
      var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', function() {
        if (errorEl && errorEl.parentNode) {
          errorEl.remove();
          errorEl = null;
          showGlobalErrorPage();
        }
      });
    }
  }

  /**
   * @param event {PromiseRejectionEvent|ErrorEvent}
   */
  function handler(event) {
    var error;

    if ('error' in event) {
      error =
        event.error ||
        (event.message === 'Script error.'
          ? new SyntaxError(event.message)
          : new Error(event.message));
    } else {
      error = event.reason;
    }

    console.error('未处理的不可恢复错误', error);

    var shouldCache =
      // 语法错误
      error && error instanceof SyntaxError;

    if (!shouldCache) {
      return;
    }

    event.stopImmediatePropagation();
    showGlobalErrorPage();
  }

  function registerGlobalErrorHandler() {
    if (typeof document !== 'undefined') {
      globalThis.addEventListener('unhandledrejection', handler);
      globalThis.addEventListener('error', handler);

      return function () {
        globalThis.removeEventListener('unhandledrejection', handler);
        globalThis.removeEventListener('error', handler);
      };
    }

    return null;
  }

  function unregisterRegisterGlobalErrorHandler(fn) {
    if (typeof fn === 'function') {
      var app = document.getElementById('app');
      if (app) {
        var ob = new MutationObserver(function () {
          fn();
          ob.disconnect();
          ob = null;
        });

        ob.observe(app, { childList: true });
      }
    }
  }

  function ensureBasicEnvironment() {
    var globals = [
      'Promise',
      'Map',
      'fetch',
      'customElements',
      'MutationObserver',
    ];

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (var i = 0; i < globals.length; i++) {
      if (!(globals[i] in globalThis)) {
        showGlobalErrorPage();
        return;
      }
    }
  }

  ensureBasicEnvironment();
  var goodtogo = registerGlobalErrorHandler();
  unregisterRegisterGlobalErrorHandler(goodtogo);
})();
