# Test info

- Name: 按钮点击测试 >> 侧边栏按钮点击测试
- Location: D:\Documents\yunkebaiban\baibanfront\e2e\button-click.spec.ts:106:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 1
    at D:\Documents\yunkebaiban\baibanfront\e2e\button-click.spec.ts:133:35
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
   33 |         timestamp: new Date(),
   34 |       });
   35 |     }
   36 |   });
   37 |
   38 |   // 监听页面错误
   39 |   page.on('pageerror', error => {
   40 |     errors.push({
   41 |       type: 'pageerror',
   42 |       message: error.message,
   43 |       url: page.url(),
   44 |       timestamp: new Date(),
   45 |     });
   46 |   });
   47 |
   48 |   return errors;
   49 | }
   50 |
   51 | /**
   52 |  * 过滤掉已知的非关键错误
   53 |  */
   54 | function filterKnownErrors(errors: PageError[]): PageError[] {
   55 |   const ignoredPatterns = [
   56 |     // 常见的可忽略错误
   57 |     /Failed to load resource.*favicon/i,
   58 |     /net::ERR_BLOCKED_BY_CLIENT/i,
   59 |     /ResizeObserver loop/i,
   60 |     /Script error\./i,
   61 |     /\[webpack-dev-server\]/i,
   62 |     /\[HMR\]/i,
   63 |     // Socket.IO 重连相关（正常行为）
   64 |     /socket\.io.*reconnect/i,
   65 |     // 开发模式警告
   66 |     /Warning: ReactDOM\.render/i,
   67 |   ];
   68 |
   69 |   return errors.filter(error => {
   70 |     return !ignoredPatterns.some(pattern => pattern.test(error.message));
   71 |   });
   72 | }
   73 |
   74 | test.describe('按钮点击测试', () => {
   75 |   test.beforeEach(async ({ page }) => {
   76 |     // 设置较长的超时，等待应用加载
   77 |     test.setTimeout(120000);
   78 |   });
   79 |
   80 |   test('首页加载无报错', async ({ page }) => {
   81 |     const errors = setupErrorCollector(page);
   82 |
   83 |     await page.goto('/');
   84 |     
   85 |     // 等待页面 DOM 加载完成（不等待 networkidle，因为有持续的 WebSocket 连接）
   86 |     await page.waitForLoadState('domcontentloaded');
   87 |     
   88 |     // 等待应用主要 UI 元素出现
   89 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 });
   90 |     
   91 |     // 等待额外时间确保所有异步操作完成
   92 |     await page.waitForTimeout(5000);
   93 |
   94 |     const criticalErrors = filterKnownErrors(errors);
   95 |     
   96 |     if (criticalErrors.length > 0) {
   97 |       console.log('发现错误:');
   98 |       criticalErrors.forEach(err => {
   99 |         console.log(`  [${err.type}] ${err.message}`);
  100 |       });
  101 |     }
  102 |
  103 |     expect(criticalErrors.length).toBe(0);
  104 |   });
  105 |
  106 |   test('侧边栏按钮点击测试', async ({ page }) => {
  107 |     const errors = setupErrorCollector(page);
  108 |
  109 |     await page.goto('/');
  110 |     await page.waitForLoadState('domcontentloaded');
  111 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  112 |
  113 |     // 查找侧边栏按钮
  114 |     const sidebarButtons = await page.locator('[data-testid*="sidebar"] button, .sidebar button, [class*="sidebar"] button').all();
  115 |
  116 |     console.log(`找到 ${sidebarButtons.length} 个侧边栏按钮`);
  117 |
  118 |     for (let i = 0; i < Math.min(sidebarButtons.length, 10); i++) {
  119 |       const button = sidebarButtons[i];
  120 |       
  121 |       try {
  122 |         if (await button.isVisible() && await button.isEnabled()) {
  123 |           await button.click({ timeout: 5000 });
  124 |           await page.waitForTimeout(500);
  125 |         }
  126 |       } catch (e) {
  127 |         // 点击失败不是测试失败，继续测试其他按钮
  128 |         console.log(`按钮 ${i + 1} 点击跳过:`, (e as Error).message);
  129 |       }
  130 |     }
  131 |
  132 |     const criticalErrors = filterKnownErrors(errors);
> 133 |     expect(criticalErrors.length).toBe(0);
      |                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  134 |   });
  135 |
  136 |   test('工具栏按钮点击测试', async ({ page }) => {
  137 |     const errors = setupErrorCollector(page);
  138 |
  139 |     await page.goto('/');
  140 |     await page.waitForLoadState('domcontentloaded');
  141 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  142 |
  143 |     // 查找工具栏按钮
  144 |     const toolbarButtons = await page.locator('[data-testid*="toolbar"] button, .toolbar button, [class*="toolbar"] button, [role="toolbar"] button').all();
  145 |
  146 |     console.log(`找到 ${toolbarButtons.length} 个工具栏按钮`);
  147 |
  148 |     for (let i = 0; i < Math.min(toolbarButtons.length, 15); i++) {
  149 |       const button = toolbarButtons[i];
  150 |       
  151 |       try {
  152 |         if (await button.isVisible() && await button.isEnabled()) {
  153 |           await button.click({ timeout: 5000 });
  154 |           await page.waitForTimeout(300);
  155 |           
  156 |           // 按 Escape 关闭可能打开的弹窗
  157 |           await page.keyboard.press('Escape');
  158 |         }
  159 |       } catch (e) {
  160 |         console.log(`工具栏按钮 ${i + 1} 点击跳过:`, (e as Error).message);
  161 |       }
  162 |     }
  163 |
  164 |     const criticalErrors = filterKnownErrors(errors);
  165 |     expect(criticalErrors.length).toBe(0);
  166 |   });
  167 |
  168 |   test('菜单按钮点击测试', async ({ page }) => {
  169 |     const errors = setupErrorCollector(page);
  170 |
  171 |     await page.goto('/');
  172 |     await page.waitForLoadState('domcontentloaded');
  173 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  174 |
  175 |     // 查找菜单触发按钮
  176 |     const menuTriggers = await page.locator('[data-testid*="menu"], [aria-haspopup="menu"], [aria-haspopup="true"]').all();
  177 |
  178 |     console.log(`找到 ${menuTriggers.length} 个菜单触发器`);
  179 |
  180 |     for (let i = 0; i < Math.min(menuTriggers.length, 10); i++) {
  181 |       const trigger = menuTriggers[i];
  182 |       
  183 |       try {
  184 |         if (await trigger.isVisible() && await trigger.isEnabled()) {
  185 |           await trigger.click({ timeout: 5000 });
  186 |           await page.waitForTimeout(500);
  187 |           
  188 |           // 点击菜单项（如果有）
  189 |           const menuItems = await page.locator('[role="menuitem"], [role="option"]').all();
  190 |           if (menuItems.length > 0 && await menuItems[0].isVisible()) {
  191 |             await menuItems[0].click({ timeout: 3000 });
  192 |             await page.waitForTimeout(300);
  193 |           }
  194 |           
  195 |           // 按 Escape 关闭菜单
  196 |           await page.keyboard.press('Escape');
  197 |         }
  198 |       } catch (e) {
  199 |         console.log(`菜单 ${i + 1} 测试跳过:`, (e as Error).message);
  200 |       }
  201 |     }
  202 |
  203 |     const criticalErrors = filterKnownErrors(errors);
  204 |     expect(criticalErrors.length).toBe(0);
  205 |   });
  206 |
  207 |   test('所有可点击元素扫描', async ({ page }) => {
  208 |     const errors = setupErrorCollector(page);
  209 |
  210 |     await page.goto('/');
  211 |     await page.waitForLoadState('domcontentloaded');
  212 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  213 |
  214 |     // 获取所有可能可点击的元素
  215 |     const clickableElements = await page.locator('button, [role="button"], a[href], [onclick], [tabindex="0"]').all();
  216 |
  217 |     console.log(`找到 ${clickableElements.length} 个可点击元素`);
  218 |
  219 |     // 测试前 20 个可见的可点击元素
  220 |     let tested = 0;
  221 |     for (const element of clickableElements) {
  222 |       if (tested >= 20) break;
  223 |       
  224 |       try {
  225 |         if (await element.isVisible() && await element.isEnabled()) {
  226 |           // 获取元素信息用于日志
  227 |           const tagName = await element.evaluate(el => el.tagName);
  228 |           const text = await element.textContent() || '';
  229 |           
  230 |           console.log(`测试点击: <${tagName}> "${text.slice(0, 30)}..."`);
  231 |           
  232 |           await element.click({ timeout: 5000 });
  233 |           await page.waitForTimeout(300);
```