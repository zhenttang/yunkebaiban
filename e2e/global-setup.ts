import { chromium, FullConfig } from '@playwright/test';

/**
 * 全局设置 - 在所有测试开始前运行
 */
async function globalSetup(config: FullConfig) {
  console.log('\n=== 云客白板 E2E 测试开始 ===\n');
  
  // 可以在这里添加：
  // 1. 数据库初始化
  // 2. 测试用户创建
  // 3. 环境变量检查
  
  const { baseURL } = config.projects[0].use;
  console.log(`测试目标 URL: ${baseURL}`);
  
  // 检查应用是否可访问
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    const response = await page.goto(baseURL as string, { timeout: 30000 });
    if (response?.ok()) {
      console.log('✅ 应用服务正常运行\n');
    } else {
      console.log(`⚠️ 应用返回状态码: ${response?.status()}\n`);
    }
  } catch (error) {
    console.log('❌ 无法连接到应用服务');
    console.log('   请确保应用已启动: yarn dev\n');
    throw new Error(`无法连接到 ${baseURL}`);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
