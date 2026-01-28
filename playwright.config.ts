import { defineConfig, devices } from '@playwright/test';

/**
 * 云客白板 E2E 测试配置
 * 用于测试前端按钮点击和用户交互是否正常
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',
  
  // 全局设置
  globalSetup: './e2e/global-setup.ts',
  
  // 测试文件匹配模式
  testMatch: '**/*.spec.ts',
  
  // 完全并行运行测试
  fullyParallel: true,
  
  // 如果在CI中，禁止 test.only
  forbidOnly: !!process.env.CI,
  
  // 失败重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,
  
  // 报告器配置
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['list'],
  ],
  
  // 全局测试配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:8080',
    
    // 收集失败时的追踪信息
    trace: 'on-first-retry',
    
    // 截图设置
    screenshot: 'only-on-failure',
    
    // 视频记录
    video: 'on-first-retry',
    
    // 超时设置
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 全局超时
  timeout: 60000,
  
  // 期望超时
  expect: {
    timeout: 10000,
  },

  // 项目配置 - 不同浏览器
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 可选：其他浏览器
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 开发服务器配置 (可选)
  // webServer: {
  //   command: 'yarn dev',
  //   url: 'http://localhost:8080',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
