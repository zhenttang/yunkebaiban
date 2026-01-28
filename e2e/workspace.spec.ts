import { test, expect } from './fixtures';

/**
 * 工作区相关功能测试
 */
test.describe('工作区功能测试', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('创建工作区按钮点击无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 查找创建工作区按钮
    const createButtons = await page.locator('[data-testid*="create"], button:has-text("新建"), button:has-text("创建"), button:has-text("Create")').all();

    console.log(`找到 ${createButtons.length} 个创建按钮`);

    for (const button of createButtons.slice(0, 5)) {
      try {
        if (await button.isVisible() && await button.isEnabled()) {
          await button.click({ timeout: 5000 });
          await page.waitForTimeout(500);
          // 关闭可能打开的模态框
          await page.keyboard.press('Escape');
        }
      } catch (e) {
        console.log('创建按钮点击跳过:', (e as Error).message);
      }
    }

    const criticalErrors = errorCollector.getCriticalErrors();
    if (criticalErrors.length > 0) {
      console.log('发现错误:');
      criticalErrors.forEach((e, i) => console.log(`  [${e.type}] ${e.message}`));
    }
    expect(criticalErrors.length).toBe(0);
  });

  test('工作区列表加载无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 等待工作区列表加载
    await page.waitForTimeout(3000);

    // 检查是否有工作区项目
    const workspaceItems = await page.locator('[data-testid*="workspace"], [class*="workspace"]').count();
    console.log(`找到 ${workspaceItems} 个工作区元素`);

    const criticalErrors = errorCollector.getCriticalErrors();
    if (criticalErrors.length > 0) {
      console.log('发现错误:');
      criticalErrors.forEach((e, i) => console.log(`  [${e.type}] ${e.message}`));
    }
    expect(criticalErrors.length).toBe(0);
  });

  test('工作区切换无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 查找工作区选择器
    const workspaceSelector = page.locator('[data-testid*="workspace-selector"], [class*="workspace-selector"]').first();

    if (await workspaceSelector.isVisible()) {
      await workspaceSelector.click({ timeout: 5000 });
      await page.waitForTimeout(500);

      // 查找并点击第一个工作区选项
      const workspaceOptions = await page.locator('[role="option"], [data-testid*="workspace-item"]').all();
      if (workspaceOptions.length > 0) {
        await workspaceOptions[0].click({ timeout: 3000 });
        await page.waitForTimeout(1000);
      }
    }

    const criticalErrors = errorCollector.getCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  });
});
