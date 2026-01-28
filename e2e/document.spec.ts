import { test, expect } from './fixtures';

/**
 * 文档编辑相关功能测试
 */
test.describe('文档编辑功能测试', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('文档创建按钮点击无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 查找新建文档按钮
    const newDocButtons = await page.locator(
      'button:has-text("新建文档"), button:has-text("New Doc"), button:has-text("新建页面"), [data-testid*="new-doc"], [data-testid*="new-page"]'
    ).all();

    console.log(`找到 ${newDocButtons.length} 个新建文档按钮`);

    for (const button of newDocButtons.slice(0, 3)) {
      try {
        if (await button.isVisible() && await button.isEnabled()) {
          await button.click({ timeout: 5000 });
          await page.waitForTimeout(1000);
          await page.keyboard.press('Escape');
        }
      } catch (e) {
        console.log('新建文档按钮跳过:', (e as Error).message);
      }
    }

    const criticalErrors = errorCollector.getCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  });

  test('编辑器工具栏按钮点击无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 等待编辑器加载
    await page.waitForTimeout(2000);

    // 查找编辑器工具栏按钮
    const editorToolbarButtons = await page.locator(
      '[class*="editor"] button, [class*="blocksuite"] button, [data-testid*="editor"] button'
    ).all();

    console.log(`找到 ${editorToolbarButtons.length} 个编辑器工具栏按钮`);

    for (let i = 0; i < Math.min(editorToolbarButtons.length, 15); i++) {
      const button = editorToolbarButtons[i];
      try {
        if (await button.isVisible() && await button.isEnabled()) {
          const text = await button.textContent() || 'unnamed';
          console.log(`点击编辑器按钮 ${i + 1}: ${text.slice(0, 20)}`);
          
          await button.click({ timeout: 3000 });
          await page.waitForTimeout(300);
          await page.keyboard.press('Escape');
        }
      } catch (e) {
        // 继续测试
      }
    }

    const criticalErrors = errorCollector.getCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  });

  test('文档保存状态显示正常', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 等待保存状态指示器
    await page.waitForTimeout(2000);

    // 检查是否有保存状态指示器
    const saveIndicator = await page.locator(
      '[class*="save-status"], [data-testid*="save"], [class*="sync-status"]'
    ).count();

    console.log(`找到 ${saveIndicator} 个保存状态指示器`);

    const criticalErrors = errorCollector.getCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('文档列表测试', () => {
  test('文档列表项点击无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});

    // 查找文档列表项
    const docItems = await page.locator(
      '[data-testid*="doc-item"], [class*="doc-item"], [class*="page-item"]'
    ).all();

    console.log(`找到 ${docItems.length} 个文档列表项`);

    for (const item of docItems.slice(0, 5)) {
      try {
        if (await item.isVisible()) {
          await item.click({ timeout: 3000 });
          await page.waitForTimeout(500);
        }
      } catch (e) {
        console.log('文档项点击跳过:', (e as Error).message);
      }
    }

    const criticalErrors = errorCollector.getCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  });
});
