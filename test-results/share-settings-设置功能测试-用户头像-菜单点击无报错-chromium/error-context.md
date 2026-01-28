# Test info

- Name: 设置功能测试 >> 用户头像/菜单点击无报错
- Location: D:\Documents\yunkebaiban\baibanfront\e2e\share-settings.spec.ts:135:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
    at D:\Documents\yunkebaiban\baibanfront\e2e\share-settings.spec.ts:177:35
```

# Page snapshot

```yaml
- region "Notifications alt+T"
- dialog:
  - button "关闭":
    - img
  - heading [level=2]
  - paragraph:
    - img
    - text: 登录
  - paragraph: 文档、白板与任务一体化的协同空间
  - button "使用手机号登录":
    - img
  - button "使用微信登录":
    - img
  - button "使用微信公众号登录":
    - img
  - text: 电子邮件
  - textbox "电子邮件"
  - button "以电子邮件继续":
    - text: 以电子邮件继续
    - img
```

# Test source

```ts
   77 |         if (await button.isVisible() && await button.isEnabled()) {
   78 |           await button.click({ timeout: 3000 });
   79 |           await page.waitForTimeout(500);
   80 |         }
   81 |       } catch (e) {
   82 |         // 继续
   83 |       }
   84 |     }
   85 |
   86 |     const criticalErrors = errorCollector.getCriticalErrors();
   87 |     expect(criticalErrors.length).toBe(0);
   88 |   });
   89 | });
   90 |
   91 | test.describe('设置功能测试', () => {
   92 |   test('设置按钮点击无报错', async ({ page, errorCollector }) => {
   93 |     await page.goto('/');
   94 |     await page.waitForLoadState('domcontentloaded');
   95 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
   96 |
   97 |     // 查找设置按钮
   98 |     const settingsButtons = await page.locator(
   99 |       'button:has-text("设置"), button:has-text("Settings"), [data-testid*="setting"], [aria-label*="setting"]'
  100 |     ).all();
  101 |
  102 |     console.log(`找到 ${settingsButtons.length} 个设置按钮`);
  103 |
  104 |     for (const button of settingsButtons.slice(0, 3)) {
  105 |       try {
  106 |         if (await button.isVisible() && await button.isEnabled()) {
  107 |           await button.click({ timeout: 5000 });
  108 |           await page.waitForTimeout(1000);
  109 |           
  110 |           // 在设置面板中点击各个选项卡
  111 |           const tabs = await page.locator('[role="tab"], [data-testid*="tab"]').all();
  112 |           for (const tab of tabs.slice(0, 5)) {
  113 |             try {
  114 |               if (await tab.isVisible()) {
  115 |                 await tab.click({ timeout: 2000 });
  116 |                 await page.waitForTimeout(300);
  117 |               }
  118 |             } catch (e) {
  119 |               // 继续
  120 |             }
  121 |           }
  122 |           
  123 |           await page.keyboard.press('Escape');
  124 |           await page.waitForTimeout(300);
  125 |         }
  126 |       } catch (e) {
  127 |         console.log('设置按钮测试跳过:', (e as Error).message);
  128 |       }
  129 |     }
  130 |
  131 |     const criticalErrors = errorCollector.getCriticalErrors();
  132 |     expect(criticalErrors.length).toBe(0);
  133 |   });
  134 |
  135 |   test('用户头像/菜单点击无报错', async ({ page, errorCollector }) => {
  136 |     await page.goto('/');
  137 |     await page.waitForLoadState('domcontentloaded');
  138 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  139 |
  140 |     // 查找用户头像或菜单
  141 |     const userMenus = await page.locator(
  142 |       '[data-testid*="avatar"], [data-testid*="user"], [class*="avatar"], [class*="user-menu"]'
  143 |     ).all();
  144 |
  145 |     console.log(`找到 ${userMenus.length} 个用户菜单元素`);
  146 |
  147 |     for (const menu of userMenus.slice(0, 3)) {
  148 |       try {
  149 |         if (await menu.isVisible()) {
  150 |           await menu.click({ timeout: 3000 });
  151 |           await page.waitForTimeout(500);
  152 |           
  153 |           // 点击菜单项
  154 |           const menuItems = await page.locator('[role="menuitem"]').all();
  155 |           for (const item of menuItems.slice(0, 3)) {
  156 |             try {
  157 |               const text = await item.textContent() || '';
  158 |               // 跳过登出等敏感操作
  159 |               if (!text.includes('退出') && !text.includes('Logout') && !text.includes('删除')) {
  160 |                 await item.click({ timeout: 2000 });
  161 |                 await page.waitForTimeout(300);
  162 |                 await page.keyboard.press('Escape');
  163 |               }
  164 |             } catch (e) {
  165 |               // 继续
  166 |             }
  167 |           }
  168 |           
  169 |           await page.keyboard.press('Escape');
  170 |         }
  171 |       } catch (e) {
  172 |         console.log('用户菜单测试跳过:', (e as Error).message);
  173 |       }
  174 |     }
  175 |
  176 |     const criticalErrors = errorCollector.getCriticalErrors();
> 177 |     expect(criticalErrors.length).toBe(0);
      |                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  178 |   });
  179 | });
  180 |
```