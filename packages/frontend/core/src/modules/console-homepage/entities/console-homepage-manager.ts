import { Entity } from '@toeverything/infra';

export interface ConsoleWelcomeConfig {
  appName: string;
  version: string;
  buildDate: string;
  environment: 'development' | 'production' | 'staging';
  features: string[];
  debugCommands: Array<{
    name: string;
    description: string;
    command: string;
  }>;
}

export interface ConsoleTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export class ConsoleHomepageManager extends Entity {
  private hasShownWelcome = false;
  private readonly STORAGE_KEY = 'console_homepage_shown';

  constructor() {
    super();
    this.initializeConsoleHomepage();
  }

  private initializeConsoleHomepage() {
    // 延迟初始化，确保所有其他模块加载完成
    setTimeout(() => {
      // 检查是否已经显示过欢迎页面
      const hasShown = localStorage.getItem(this.STORAGE_KEY);
      
      if (!hasShown && this.isDevToolsOpen()) {
        this.showWelcomePage();
        localStorage.setItem(this.STORAGE_KEY, 'true');
        this.hasShownWelcome = true;
      }

      // 监听开发者工具打开事件
      this.detectDevToolsOpen();
      
      // 无论如何都要注册全局调试命令
      this.registerGlobalDebugObject();
    }, 2000); // 延迟2秒确保页面完全加载
  }

  private isDevToolsOpen(): boolean {
    // 检测开发者工具是否已经打开
    const threshold = 160;
    return (
      window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold
    );
  }

  private detectDevToolsOpen() {
    let devtools = {
      open: false,
      orientation: null
    };

    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          // 如果之前没有显示过欢迎页面，现在显示
          const hasShown = localStorage.getItem(this.STORAGE_KEY);
          if (!hasShown && !this.hasShownWelcome) {
            this.showWelcomePage();
            localStorage.setItem(this.STORAGE_KEY, 'true');
            this.hasShownWelcome = true;
          }
        }
      } else {
        if (devtools.open) {
          devtools.open = false;
        }
      }
    }, 500);
  }

  private showWelcomePage() {
    const config = this.getWelcomeConfig();
    const theme = this.getConsoleTheme();
    
    // 清除控制台
    console.clear();
    
    // 显示精美的欢迎页面
    this.renderWelcomeHeader(config, theme);
    this.renderSystemInfo(config, theme);
    this.renderDebugCommands(config, theme);
    this.renderFooter(theme);
  }

  private renderWelcomeHeader(config: ConsoleWelcomeConfig, theme: ConsoleTheme) {
    const headerStyle = `
      background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor});
      color: white;
      padding: 20px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      margin: 10px 0;
      text-align: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;

    console.log(`%c
╔════════════════════════════════════════════════════════════════╗
║                     🎨 ${config.appName} 开发者控制台                     ║
║                                                                ║
║  欢迎来到 ${config.appName} 的开发者世界！                               ║
║  这里是您探索、调试和开发的完美起点。                                ║
║                                                                ║
║  版本: ${config.version}                                        ║
║  构建时间: ${config.buildDate}                                   ║
║  环境: ${config.environment}                                    ║
╚════════════════════════════════════════════════════════════════╝
    `, headerStyle);
  }

  private renderSystemInfo(config: ConsoleWelcomeConfig, theme: ConsoleTheme) {
    const infoStyle = `
      color: ${theme.textColor};
      background: ${theme.backgroundColor};
      padding: 15px;
      border: 2px solid ${theme.borderColor};
      border-radius: 8px;
      font-family: 'Monaco', 'Menlo', monospace;
      margin: 10px 0;
    `;

    console.groupCollapsed(`%c📊 系统信息`, `color: ${theme.primaryColor}; font-weight: bold; font-size: 14px;`);
    
    console.log(`%c
🖥️  用户代理: ${navigator.userAgent}
🌍  语言: ${navigator.language}
📱  平台: ${navigator.platform}
🔧  Cookie 已启用: ${navigator.cookieEnabled ? '是' : '否'}
💾  内存信息: ${this.getMemoryInfo()}
🕒  当前时间: ${new Date().toLocaleString('zh-CN')}
    `, infoStyle);

    console.log(`%c
🎯  已启用功能:
${config.features.map(feature => `   ✅ ${feature}`).join('\n')}
    `, infoStyle);

    console.groupEnd();
  }

  private renderDebugCommands(config: ConsoleWelcomeConfig, theme: ConsoleTheme) {
    const commandStyle = `
      color: ${theme.accentColor};
      background: #1a1a1a;
      padding: 10px;
      border-left: 4px solid ${theme.accentColor};
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
    `;

    console.groupCollapsed(`%c🛠️  调试命令`, `color: ${theme.accentColor}; font-weight: bold; font-size: 14px;`);
    
    config.debugCommands.forEach(cmd => {
      console.log(`%c${cmd.name}: ${cmd.description}`, 
        `color: ${theme.primaryColor}; font-weight: bold;`);
      console.log(`%c  ${cmd.command}`, commandStyle);
    });

    // 添加到全局对象，方便调用
    this.registerGlobalDebugCommands(config.debugCommands);

    console.groupEnd();
  }

  private renderFooter(theme: ConsoleTheme) {
    const footerStyle = `
      color: ${theme.textColor};
      background: linear-gradient(90deg, ${theme.primaryColor}20, ${theme.accentColor}20);
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin: 10px 0;
      border: 1px solid ${theme.borderColor};
    `;

    console.log(`%c
🚀 祝您编码愉快！如需帮助，请查看上方的调试命令。
💡 提示：您可以通过 window.__APP_DEBUG__ 访问调试工具。

═══════════════════════════════════════════════════════════════════
    `, footerStyle);
  }

  private getMemoryInfo(): string {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return `已使用 ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / 限制 ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`;
    }
    return '不可用';
  }

  private getWelcomeConfig(): ConsoleWelcomeConfig {
    return {
      appName: '云开白板',
      version: '1.0.0',
      buildDate: new Date().toLocaleDateString('zh-CN'),
      environment: process.env.NODE_ENV as any || 'development',
      features: [
        'BlockSuite 编辑器',
        '云端同步',
        '实时协作',
        '模块化架构',
        '多平台支持',
        '离线模式',
        '插件系统'
      ],
      debugCommands: [
        {
          name: 'showAppInfo',
          description: '显示应用详细信息',
          command: 'window.__APP_DEBUG__.showAppInfo()'
        },
        {
          name: 'clearStorage',
          description: '清除本地存储',
          command: 'window.__APP_DEBUG__.clearStorage()'
        },
        {
          name: 'toggleCloudSync',
          description: '切换云端同步状态',
          command: 'window.__APP_DEBUG__.toggleCloudSync()'
        },
        {
          name: 'exportLogs',
          description: '导出调试日志',
          command: 'window.__APP_DEBUG__.exportLogs()'
        },
        {
          name: 'showPerformance',
          description: '显示性能指标',
          command: 'window.__APP_DEBUG__.showPerformance()'
        }
      ]
    };
  }

  private getConsoleTheme(): ConsoleTheme {
    return {
      primaryColor: '#3b82f6',
      accentColor: '#06b6d4',
      backgroundColor: '#f8fafc',
      textColor: '#334155',
      borderColor: '#e2e8f0'
    };
  }

  private registerGlobalDebugCommands(commands: Array<{name: string; description: string; command: string}>) {
    // 创建全局调试对象
    (window as any).__APP_DEBUG__ = {
      showAppInfo: () => {
        const config = this.getWelcomeConfig();
        console.group('🔍 应用信息');
        console.log('应用名称:', config.appName);
        console.log('版本:', config.version);
        console.log('构建时间:', config.buildDate);
        console.log('环境:', config.environment);
        console.log('已启用功能:', config.features);
        console.groupEnd();
      },

      clearStorage: () => {
        const confirmed = confirm('确定要清除所有本地存储数据吗？这个操作不可撤销。');
        if (confirmed) {
          localStorage.clear();
          sessionStorage.clear();
          console.log('✅ 本地存储已清除');
          location.reload();
        }
      },

      toggleCloudSync: () => {
        const cloudManager = (window as any).__CLOUD_STORAGE_MANAGER__;
        if (cloudManager) {
          console.log('🔄 尝试重新连接云端...');
          cloudManager.reconnect();
        } else {
          console.warn('⚠️ 云存储管理器未找到');
        }
      },

      exportLogs: () => {
        const logs = this.collectConsoleLogs();
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('📥 调试日志已导出');
      },

      showPerformance: () => {
        console.group('⚡ 性能指标');
        
        // 内存使用情况
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          console.log('内存使用:', {
            已使用: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            总量: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            限制: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
          });
        }

        // 页面加载时间
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          console.log('页面加载时间:', {
            DOM加载: `${(navigation.domContentLoadedEventEnd - navigation.fetchStart).toFixed(2)}ms`,
            页面完成: `${(navigation.loadEventEnd - navigation.fetchStart).toFixed(2)}ms`,
            首次绘制: this.getFirstPaint()
          });
        }

        console.groupEnd();
      },

      help: () => {
        console.log('🔧 可用调试命令:');
        commands.forEach(cmd => {
          console.log(`  ${cmd.name}: ${cmd.description}`);
          console.log(`    ${cmd.command}`);
        });
      }
    };

    // 添加帮助命令
    (window as any).__APP_DEBUG__.help();
  }

  // 独立的全局调试对象注册方法，即使没有显示欢迎页面也会注册
  private registerGlobalDebugObject() {
    const config = this.getWelcomeConfig();
    this.registerGlobalDebugCommands(config.debugCommands);
    
    // 添加一个强制显示欢迎页面的方法
    (window as any).__APP_DEBUG__.showWelcome = () => {
      this.showWelcomePageManually();
    };
    
    // 添加重置状态的方法
    (window as any).__APP_DEBUG__.resetWelcome = () => {
      this.resetWelcomePageStatus();
      console.log('✅ 欢迎页面状态已重置，刷新页面后将重新显示');
    };
    
    console.log('%c🔧 云开白板调试工具已准备就绪！', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    console.log('%c输入 window.__APP_DEBUG__.help() 查看所有可用命令', 'color: #06b6d4; font-size: 12px;');
    console.log('%c输入 window.__APP_DEBUG__.showWelcome() 手动显示欢迎页面', 'color: #06b6d4; font-size: 12px;');
  }

  private getFirstPaint(): string {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? `${firstPaint.startTime.toFixed(2)}ms` : '不可用';
  }

  private collectConsoleLogs(): any[] {
    // 这里可以实现日志收集逻辑
    // 目前返回基本的系统信息
    return [{
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      memory: 'memory' in performance ? (performance as any).memory : null,
      localStorage: this.getLocalStorageSnapshot(),
      sessionStorage: this.getSessionStorageSnapshot()
    }];
  }

  private getLocalStorageSnapshot(): Record<string, string> {
    const snapshot: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // 只保存非敏感信息
        if (!key.includes('token') && !key.includes('password') && !key.includes('secret')) {
          snapshot[key] = localStorage.getItem(key) || '';
        }
      }
    }
    return snapshot;
  }

  private getSessionStorageSnapshot(): Record<string, string> {
    const snapshot: Record<string, string> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        // 只保存非敏感信息
        if (!key.includes('token') && !key.includes('password') && !key.includes('secret')) {
          snapshot[key] = sessionStorage.getItem(key) || '';
        }
      }
    }
    return snapshot;
  }

  // 公共方法，允许手动重新显示欢迎页面
  public showWelcomePageManually() {
    this.showWelcomePage();
  }

  // 重置欢迎页面显示状态
  public resetWelcomePageStatus() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.hasShownWelcome = false;
  }
}