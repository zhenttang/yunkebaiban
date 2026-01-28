import { test, expect } from './fixtures';

/**
 * 分享和设置功能测试
 */
test.describe('分享功能测试', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
  });

  test('分享按钮点击无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找分享按钮
    const shareButtons = await page.locator(
      'button:has-text("分享"), button:has-text("Share"), [data-testid*="share"], [aria-label*="share"]'
    ).all();

    console.log(`找到 ${shareButtons.length} 个分享按钮`);

    for (const button of shareButtons.slice(0, 3)) {
      try {
        if (await button.isVisible() && await button.isEnabled()) {
          await button.click({ timeout: 5000 });
          await page.waitForTimeout(1000);
          
          // 检查分享对话框是否打开
          const shareDialog = page.locator('[role="dialog"], [class*="share-menu"], [class*="modal"]');
          if (await shareDialog.isVisible()) {
            console.log('分享对话框已打开');
            
            // 点击对话框内的按钮
            const dialogButtons = await shareDialog.locator('button').all();
            for (const btn of dialogButtons.slice(0, 5)) {
              try {
                if (await btn.isVisible() && await btn.isEnabled()) {
                  const text = await btn.textContent() || '';
                  // 跳过可能有副作用的按钮
                  if (!text.includes('删除') && !text.includes('Delete') && !text.includes('确认')) {
                    await btn.click({ timeout: 2000 });
                    await page.waitForTimeout(300);
                  }
                }
              } catch (e) {
                // 继续
              }
            }
          }
          
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.log('分享按钮测试跳过:', (e as Error).message);
      }
    }

    const criticalErrors = errorCollector.getCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  });

  test('复制链接按钮点击无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const copyLinkButtons = await page.locator(
      'button:has-text("复制链接"), button:has-text("Copy Link"), button:has-text("复制"), [data-testid*="copy"]'
    ).all();

    console.log(`找到 ${copyLinkButtons.length} 个复制链接按钮`);

    for (const button of copyLinkButtons.slice(0, 3)) {
      try {
        if (await button.isVisible() && await button.isEnabled()) {
          await button.click({ timeout: 3000 });
          await page.waitForTimeout(500);
        }
      } catch (e) {
        // 继续
      }
    }

    const criticalErrors = errorCollector.getCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('设置功能测试', () => {
  test('设置按钮点击无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找设置按钮
    const settingsButtons = await page.locator(
      'button:has-text("设置"), button:has-text("Settings"), [data-testid*="setting"], [aria-label*="setting"]'
    ).all();

    console.log(`找到 ${settingsButtons.length} 个设置按钮`);

    for (const button of settingsButtons.slice(0, 3)) {
      try {
        if (await button.isVisible() && await button.isEnabled()) {
          await button.click({ timeout: 5000 });
          await page.waitForTimeout(1000);
          
          // 在设置面板中点击各个选项卡
          const tabs = await page.locator('[role="tab"], [data-testid*="tab"]').all();
          for (const tab of tabs.slice(0, 5)) {
            try {
              if (await tab.isVisible()) {
                await tab.click({ timeout: 2000 });
                await page.waitForTimeout(300);
              }
            } catch (e) {
              // 继续
            }
          }
          
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      } catch (e) {
        console.log('设置按钮测试跳过:', (e as Error).message);
      }
    }

    const criticalErrors = errorCollector.getCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  });

  test('用户头像/菜单点击无报错', async ({ page, errorCollector }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 查找用户头像或菜单
    const userMenus = await page.locator(
      '[data-testid*="avatar"], [data-testid*="user"], [class*="avatar"], [class*="user-menu"]'
    ).all();

    console.log(`找到 ${userMenus.length} 个用户菜单元素`);

    for (const menu of userMenus.slice(0, 3)) {
      try {
        if (await menu.isVisible()) {
          await menu.click({ timeout: 3000 });
          await page.waitForTimeout(500);
          
          // 点击菜单项
          const menuItems = await page.locator('[role="menuitem"]').all();
          for (const item of menuItems.slice(0, 3)) {
            try {
              const text = await item.textContent() || '';
              // 跳过登出等敏感操作
              if (!text.includes('退出') && !text.includes('Logout') && !text.includes('删除')) {
                await item.click({ timeout: 2000 });
                await page.waitForTimeout(300);
                await page.keyboard.press('Escape');
              }
            } catch (e) {
              // 继续
            }
          }
          
          await page.keyboard.press('Escape');
        }
      } catch (e) {
        console.log('用户菜单测试跳过:', (e as Error).message);
      }
    }

    const criticalErrors = errorCollector.getCriticalErrors();
    expect(criticalErrors.length).toBe(0);
  });
});
