# Test info

- Name: 页面导航测试 >> 主要页面导航无报错
- Location: D:\Documents\yunkebaiban\baibanfront\e2e\button-click.spec.ts:261:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 4
    at D:\Documents\yunkebaiban\baibanfront\e2e\button-click.spec.ts:282:35
```

# Page snapshot

```yaml
- region "Notifications alt+T"
- link:
  - /url: /
  - img
- link "官方网站":
  - /url: https://yunke.pro
- link "博客":
  - /url: https://yunke.pro/blog
- link "联系我们":
  - /url: https://yunke.pro/about-us
- button "下载应用"
- paragraph: 抱歉，您没有访问权限或该内容不存在...
- button "返回我的内容"
- img "404 Navigation"
- text: 连接中…
- button "关闭提示": ✕
```

# Test source

```ts
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
  234 |           
  235 |           // 按 Escape 关闭可能的弹窗
  236 |           await page.keyboard.press('Escape');
  237 |           
  238 |           tested++;
  239 |         }
  240 |       } catch (e) {
  241 |         // 继续测试
  242 |       }
  243 |     }
  244 |
  245 |     console.log(`实际测试了 ${tested} 个元素`);
  246 |
  247 |     const criticalErrors = filterKnownErrors(errors);
  248 |     
  249 |     if (criticalErrors.length > 0) {
  250 |       console.log('\n=== 发现的错误 ===');
  251 |       criticalErrors.forEach((err, i) => {
  252 |         console.log(`${i + 1}. [${err.type}] ${err.message}`);
  253 |       });
  254 |     }
  255 |
  256 |     expect(criticalErrors.length).toBe(0);
  257 |   });
  258 | });
  259 |
  260 | test.describe('页面导航测试', () => {
  261 |   test('主要页面导航无报错', async ({ page }) => {
  262 |     const errors = setupErrorCollector(page);
  263 |
  264 |     const routes = [
  265 |       '/',
  266 |       '/workspace',
  267 |       // 添加更多路由
  268 |     ];
  269 |
  270 |     for (const route of routes) {
  271 |       try {
  272 |         await page.goto(route);
  273 |         await page.waitForLoadState('domcontentloaded');
  274 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  275 |         await page.waitForTimeout(2000);
  276 |       } catch (e) {
  277 |         console.log(`路由 ${route} 访问失败:`, (e as Error).message);
  278 |       }
  279 |     }
  280 |
  281 |     const criticalErrors = filterKnownErrors(errors);
> 282 |     expect(criticalErrors.length).toBe(0);
      |                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  283 |   });
  284 | });
  285 |
  286 | test.describe('错误边界测试', () => {
  287 |   test('应用有错误边界保护', async ({ page }) => {
  288 |     await page.goto('/');
  289 |     await page.waitForLoadState('domcontentloaded');
  290 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  291 |
  292 |     // 检查页面没有显示错误边界的 fallback UI
  293 |     const errorBoundary = await page.locator('[data-testid="error-boundary"], .error-boundary, [class*="error"]').count();
  294 |     
  295 |     // 有错误边界组件是好的，但不应该是激活状态
  296 |     const hasVisibleError = await page.locator('text=/something went wrong|error occurred|出错了|发生错误/i').isVisible().catch(() => false);
  297 |     
  298 |     expect(hasVisibleError).toBe(false);
  299 |   });
  300 | });
  301 |
```