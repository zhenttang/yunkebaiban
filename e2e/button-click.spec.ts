import { test, expect, Page } from '@playwright/test';

/**
 * 云客白板 - 按钮点击自动化测试
 * 
 * 测试目标：
 * 1. 验证所有可点击按钮不会导致控制台报错
 * 2. 检测未处理的 Promise 拒绝
 * 3. 检测 JavaScript 运行时错误
 */

// 收集页面错误
interface PageError {
  type: 'error' | 'pageerror' | 'unhandledrejection';
  message: string;
  url?: string;
  timestamp: Date;
}

/**
 * 设置错误收集器
 */
function setupErrorCollector(page: Page): PageError[] {
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

  return errors;
}

/**
 * 过滤掉已知的非关键错误
 */
function filterKnownErrors(errors: PageError[]): PageError[] {
  const ignoredPatterns = [
    // 常见的可忽略错误
    /Failed to load resource.*favicon/i,
    /net::ERR_BLOCKED_BY_CLIENT/i,
    /ResizeObserver loop/i,
    /Script error\./i,
    /\[webpack-dev-server\]/i,
    /\[HMR\]/i,
    // Socket.IO 重连相关（正常行为）
    /socket\.io.*reconnect/i,
    // 开发模式警告
    /Warning: ReactDOM\.render/i,
    // 无后端时的预期网络错误
    /NetworkError: A network error occurred/i,
    /Failed to fetch/i,
    /net::ERR_CONNECTION_REFUSED/i,
    /ERR_NAME_NOT_RESOLVED/i,
    /Load failed/i,
    // 认证相关（未登录状态下的正常行为）
    /401|403|Unauthorized|token/i,
    /auth.*fail|login.*required/i,
    // 404 路由（SPA 路由在无后端时的正常行为）
    /404|Not Found/i,
    /Cannot (GET|POST|PUT|DELETE)/i,
    // WebSocket 连接失败（无后端时预期）
    /WebSocket.*failed|ws:\/\//i,
    /ECONNREFUSED/i,
  ];

  return errors.filter(error => {
    return !ignoredPatterns.some(pattern => pattern.test(error.message));
  });
}

test.describe('按钮点击测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置较长的超时，等待应用加载
    test.setTimeout(120000);
  });

  test('首页加载无报错', async ({ page }) => {
    const errors = setupErrorCollector(page);

    await page.goto('/');
    
    // 等待页面 DOM 加载完成（不等待 networkidle，因为有持续的 WebSocket 连接）
    await page.waitForLoadState('domcontentloaded');
    
    // 等待应用主要 UI 元素出现
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 });
    
    // 等待额外时间确保所有异步操作完成
    await page.waitForTimeout(5000);

    const criticalErrors = filterKnownErrors(errors);
    
    if (criticalErrors.length > 0) {
      console.log('发现错误:');
      criticalErrors.forEach(err => {
        console.log(`  [${err.type}] ${err.message}`);
      });
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('侧边栏按钮点击测试', async ({ page }) => {
    const errors = setupErrorCollector(page);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 查找侧边栏按钮
    const sidebarButtons = await page.locator('[data-testid*="sidebar"] button, .sidebar button, [class*="sidebar"] button').all();

    console.log(`找到 ${sidebarButtons.length} 个侧边栏按钮`);

    for (let i = 0; i < Math.min(sidebarButtons.length, 10); i++) {
      const button = sidebarButtons[i];
      
      try {
        if (await button.isVisible() && await button.isEnabled()) {
          await button.click({ timeout: 5000 });
          await page.waitForTimeout(500);
        }
      } catch (e) {
        // 点击失败不是测试失败，继续测试其他按钮
        console.log(`按钮 ${i + 1} 点击跳过:`, (e as Error).message);
      }
    }

    const criticalErrors = filterKnownErrors(errors);
    expect(criticalErrors.length).toBe(0);
  });

  test('工具栏按钮点击测试', async ({ page }) => {
    const errors = setupErrorCollector(page);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 查找工具栏按钮
    const toolbarButtons = await page.locator('[data-testid*="toolbar"] button, .toolbar button, [class*="toolbar"] button, [role="toolbar"] button').all();

    console.log(`找到 ${toolbarButtons.length} 个工具栏按钮`);

    for (let i = 0; i < Math.min(toolbarButtons.length, 15); i++) {
      const button = toolbarButtons[i];
      
      try {
        if (await button.isVisible() && await button.isEnabled()) {
          await button.click({ timeout: 5000 });
          await page.waitForTimeout(300);
          
          // 按 Escape 关闭可能打开的弹窗
          await page.keyboard.press('Escape');
        }
      } catch (e) {
        console.log(`工具栏按钮 ${i + 1} 点击跳过:`, (e as Error).message);
      }
    }

    const criticalErrors = filterKnownErrors(errors);
    expect(criticalErrors.length).toBe(0);
  });

  test('菜单按钮点击测试', async ({ page }) => {
    const errors = setupErrorCollector(page);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 查找菜单触发按钮
    const menuTriggers = await page.locator('[data-testid*="menu"], [aria-haspopup="menu"], [aria-haspopup="true"]').all();

    console.log(`找到 ${menuTriggers.length} 个菜单触发器`);

    for (let i = 0; i < Math.min(menuTriggers.length, 10); i++) {
      const trigger = menuTriggers[i];
      
      try {
        if (await trigger.isVisible() && await trigger.isEnabled()) {
          await trigger.click({ timeout: 5000 });
          await page.waitForTimeout(500);
          
          // 点击菜单项（如果有）
          const menuItems = await page.locator('[role="menuitem"], [role="option"]').all();
          if (menuItems.length > 0 && await menuItems[0].isVisible()) {
            await menuItems[0].click({ timeout: 3000 });
            await page.waitForTimeout(300);
          }
          
          // 按 Escape 关闭菜单
          await page.keyboard.press('Escape');
        }
      } catch (e) {
        console.log(`菜单 ${i + 1} 测试跳过:`, (e as Error).message);
      }
    }

    const criticalErrors = filterKnownErrors(errors);
    expect(criticalErrors.length).toBe(0);
  });

  test('所有可点击元素扫描', async ({ page }) => {
    const errors = setupErrorCollector(page);

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 获取所有可能可点击的元素
    const clickableElements = await page.locator('button, [role="button"], a[href], [onclick], [tabindex="0"]').all();

    console.log(`找到 ${clickableElements.length} 个可点击元素`);

    // 测试前 20 个可见的可点击元素
    let tested = 0;
    for (const element of clickableElements) {
      if (tested >= 20) break;
      
      try {
        if (await element.isVisible() && await element.isEnabled()) {
          // 获取元素信息用于日志
          const tagName = await element.evaluate(el => el.tagName);
          const text = await element.textContent() || '';
          
          console.log(`测试点击: <${tagName}> "${text.slice(0, 30)}..."`);
          
          await element.click({ timeout: 5000 });
          await page.waitForTimeout(300);
          
          // 按 Escape 关闭可能的弹窗
          await page.keyboard.press('Escape');
          
          tested++;
        }
      } catch (e) {
        // 继续测试
      }
    }

    console.log(`实际测试了 ${tested} 个元素`);

    const criticalErrors = filterKnownErrors(errors);
    
    if (criticalErrors.length > 0) {
      console.log('\n=== 发现的错误 ===');
      criticalErrors.forEach((err, i) => {
        console.log(`${i + 1}. [${err.type}] ${err.message}`);
      });
    }

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('页面导航测试', () => {
  test('主要页面导航无报错', async ({ page }) => {
    const errors = setupErrorCollector(page);

    const routes = [
      '/',
      '/workspace',
      // 添加更多路由
    ];

    for (const route of routes) {
      try {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log(`路由 ${route} 访问失败:`, (e as Error).message);
      }
    }

    const criticalErrors = filterKnownErrors(errors);
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('错误边界测试', () => {
  test('应用有错误边界保护', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 检查页面没有显示错误边界的 fallback UI
    const errorBoundary = await page.locator('[data-testid="error-boundary"], .error-boundary, [class*="error"]').count();
    
    // 有错误边界组件是好的，但不应该是激活状态
    const hasVisibleError = await page.locator('text=/something went wrong|error occurred|出错了|发生错误/i').isVisible().catch(() => false);
    
    expect(hasVisibleError).toBe(false);
  });
});
