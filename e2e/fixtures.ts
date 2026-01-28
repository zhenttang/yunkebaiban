import { test as base, expect, Page } from '@playwright/test';

/**
 * 扩展的测试 fixtures
 */

interface PageError {
  type: 'error' | 'pageerror' | 'unhandledrejection';
  message: string;
  url?: string;
  timestamp: Date;
}

interface TestFixtures {
  errorCollector: {
    errors: PageError[];
    getCriticalErrors: () => PageError[];
  };
}

/**
 * 自定义测试 fixture，自动收集页面错误
 */
export const test = base.extend<TestFixtures>({
  errorCollector: async ({ page }, use) => {
    const errors: PageError[] = [];

    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          type: 'error',
          message: msg.text(),
          url: page.url(),
          timestamp: new Date(),
        });
      }
    });

    // 监听页面错误
    page.on('pageerror', error => {
      errors.push({
        type: 'pageerror',
        message: error.message,
        url: page.url(),
        timestamp: new Date(),
      });
    });

    // 已知可忽略的错误模式
    const ignoredPatterns = [
      /Failed to load resource.*favicon/i,
      /net::ERR_BLOCKED_BY_CLIENT/i,
      /ResizeObserver loop/i,
      /Script error\./i,
      /\[webpack-dev-server\]/i,
      /\[HMR\]/i,
      /socket\.io.*reconnect/i,
      /Warning: ReactDOM\.render/i,
      /NetworkError: A network error occurred/i, // 本地测试无后端时的预期错误
      /Failed to fetch/i, // 网络请求失败（无后端）
    ];

    const getCriticalErrors = () => {
      return errors.filter(error => {
        return !ignoredPatterns.some(pattern => pattern.test(error.message));
      });
    };

    await use({ errors, getCriticalErrors });
  },
});

export { expect };

/**
 * 辅助函数：等待应用完全加载
 */
export async function waitForAppReady(page: Page, timeout = 30000) {
  await page.waitForLoadState('networkidle', { timeout });
  
  // 等待 React 渲染完成的标志
  await page.waitForFunction(() => {
    return document.readyState === 'complete' && 
           !document.querySelector('[data-loading="true"]');
  }, { timeout });
}

/**
 * 辅助函数：安全点击元素
 */
export async function safeClick(page: Page, selector: string, options?: {
  timeout?: number;
  force?: boolean;
}) {
  const { timeout = 5000, force = false } = options || {};
  
  try {
    const element = page.locator(selector);
    if (await element.isVisible() && await element.isEnabled()) {
      await element.click({ timeout, force });
      return true;
    }
  } catch (e) {
    console.log(`安全点击失败 [${selector}]:`, (e as Error).message);
  }
  return false;
}

/**
 * 辅助函数：获取所有可点击元素
 */
export async function getAllClickableElements(page: Page) {
  return page.locator('button, [role="button"], a[href], [onclick], [tabindex="0"]').all();
}
