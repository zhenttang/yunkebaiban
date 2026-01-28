# Test info

- Name: 工作区功能测试 >> 创建工作区按钮点击无报错
- Location: D:\Documents\yunkebaiban\baibanfront\e2e\workspace.spec.ts:11:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 4
    at D:\Documents\yunkebaiban\baibanfront\e2e\workspace.spec.ts:39:35
```

# Page snapshot

```yaml
- region "Notifications alt+T"
- img "应用图标"
- text: 在 YUNKE 客户端中打开
- button:
  - img
- text: 还未安装该应用？
- link "点此下载":
  - /url: /download
- text: 。
- checkbox "记住我的选择":
  - img
  - checkbox "记住我的选择"
- text: 记住我的选择
- button "忽略"
- button "在客户端中打开"
- navigation:
  - button:
    - img
  - switch "工作区"
  - button "演示工作区"
  - button:
    - img
  - switch "导航"
  - img
  - text: 快速搜索
  - button "快捷菜单":
    - img
  - button:
    - img
  - link "全部文档":
    - /url: /workspace/xd_tDbPvdAHcGuJ3L9jyD/all
    - img
    - text: 全部文档
  - link "日记":
    - /url: /workspace/xd_tDbPvdAHcGuJ3L9jyD/journals
    - img
    - text: 日记
  - img
  - text: 设置
  - switch "收藏夹":
    - text: 收藏夹
    - img
    - button:
      - img
  - switch "组织":
    - text: 组织
    - img
    - button:
      - img
  - switch "标签":
    - text: 标签
    - img
    - button:
      - img
  - switch "精选":
    - text: 精选
    - img
    - button:
      - img
  - switch "其他":
    - text: 其他
    - img
  - link "回收站":
    - /url: /workspace/xd_tDbPvdAHcGuJ3L9jyD/trash
    - img
    - text: 回收站
  - img
  - text: 导入
  - img
  - text: 模板 ☁️ 云端已连接
  - button "下载应用":
    - img
    - text: 下载应用
    - img
- button:
  - img
- link "文档":
  - /url: /workspace/xd_tDbPvdAHcGuJ3L9jyD/all
- link "精选":
  - /url: /workspace/xd_tDbPvdAHcGuJ3L9jyD/collection
- link "标签":
  - /url: /workspace/xd_tDbPvdAHcGuJ3L9jyD/tag
- radiogroup:
  - radio:
    - img
  - radio:
    - img
  - radio [checked]:
    - img
- button "显示"
- button "新建文档"
- button:
  - img
- button "全部"
- button "添加筛选规则":
  - img
  - text: 添加筛选规则
- text: 筛选 添加筛选条件
- button "添加筛选条件"
- link "未命名 刚刚":
  - /url: /workspace/xd_tDbPvdAHcGuJ3L9jyD/678oTTNdlM
  - listitem:
    - img
    - checkbox:
      - img
      - checkbox
    - img
    - text: 未命名 刚刚
    - button:
      - img
    - button:
      - img
- button:
  - img
- text: 本地模式
- button "重新连接"
- button "关闭提示": ✕
```

# Test source

```ts
   1 | import { test, expect } from './fixtures';
   2 |
   3 | /**
   4 |  * 工作区相关功能测试
   5 |  */
   6 | test.describe('工作区功能测试', () => {
   7 |   test.beforeEach(async ({ page }) => {
   8 |     test.setTimeout(120000);
   9 |   });
  10 |
  11 |   test('创建工作区按钮点击无报错', async ({ page, errorCollector }) => {
  12 |     await page.goto('/');
  13 |     await page.waitForLoadState('domcontentloaded');
  14 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  15 |
  16 |     // 查找创建工作区按钮
  17 |     const createButtons = await page.locator('[data-testid*="create"], button:has-text("新建"), button:has-text("创建"), button:has-text("Create")').all();
  18 |
  19 |     console.log(`找到 ${createButtons.length} 个创建按钮`);
  20 |
  21 |     for (const button of createButtons.slice(0, 5)) {
  22 |       try {
  23 |         if (await button.isVisible() && await button.isEnabled()) {
  24 |           await button.click({ timeout: 5000 });
  25 |           await page.waitForTimeout(500);
  26 |           // 关闭可能打开的模态框
  27 |           await page.keyboard.press('Escape');
  28 |         }
  29 |       } catch (e) {
  30 |         console.log('创建按钮点击跳过:', (e as Error).message);
  31 |       }
  32 |     }
  33 |
  34 |     const criticalErrors = errorCollector.getCriticalErrors();
  35 |     if (criticalErrors.length > 0) {
  36 |       console.log('发现错误:');
  37 |       criticalErrors.forEach((e, i) => console.log(`  [${e.type}] ${e.message}`));
  38 |     }
> 39 |     expect(criticalErrors.length).toBe(0);
     |                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  40 |   });
  41 |
  42 |   test('工作区列表加载无报错', async ({ page, errorCollector }) => {
  43 |     await page.goto('/');
  44 |     await page.waitForLoadState('domcontentloaded');
  45 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  46 |
  47 |     // 等待工作区列表加载
  48 |     await page.waitForTimeout(3000);
  49 |
  50 |     // 检查是否有工作区项目
  51 |     const workspaceItems = await page.locator('[data-testid*="workspace"], [class*="workspace"]').count();
  52 |     console.log(`找到 ${workspaceItems} 个工作区元素`);
  53 |
  54 |     const criticalErrors = errorCollector.getCriticalErrors();
  55 |     if (criticalErrors.length > 0) {
  56 |       console.log('发现错误:');
  57 |       criticalErrors.forEach((e, i) => console.log(`  [${e.type}] ${e.message}`));
  58 |     }
  59 |     expect(criticalErrors.length).toBe(0);
  60 |   });
  61 |
  62 |   test('工作区切换无报错', async ({ page, errorCollector }) => {
  63 |     await page.goto('/');
  64 |     await page.waitForLoadState('domcontentloaded');
  65 |     await page.waitForSelector('[class*="sidebar"], [class*="workspace"]', { timeout: 30000 }).catch(() => {});
  66 |
  67 |     // 查找工作区选择器
  68 |     const workspaceSelector = page.locator('[data-testid*="workspace-selector"], [class*="workspace-selector"]').first();
  69 |
  70 |     if (await workspaceSelector.isVisible()) {
  71 |       await workspaceSelector.click({ timeout: 5000 });
  72 |       await page.waitForTimeout(500);
  73 |
  74 |       // 查找并点击第一个工作区选项
  75 |       const workspaceOptions = await page.locator('[role="option"], [data-testid*="workspace-item"]').all();
  76 |       if (workspaceOptions.length > 0) {
  77 |         await workspaceOptions[0].click({ timeout: 3000 });
  78 |         await page.waitForTimeout(1000);
  79 |       }
  80 |     }
  81 |
  82 |     const criticalErrors = errorCollector.getCriticalErrors();
  83 |     expect(criticalErrors.length).toBe(0);
  84 |   });
  85 | });
  86 |
```