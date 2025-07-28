import { ResponsiveUtils } from './breakpoint-config.js';
import type { BreakpointConfig } from '../types/responsive-contracts.js';

/**
 * 容器查询管理器 - 支持现代CSS Container Queries
 */
export class ContainerQueryManager {
  private static instance: ContainerQueryManager;
  private supportsContainerQueries: boolean;
  private polyfillLoaded = false;

  constructor() {
    this.supportsContainerQueries = ResponsiveUtils.supportsContainerQueries();
  }

  static getInstance(): ContainerQueryManager {
    if (!ContainerQueryManager.instance) {
      ContainerQueryManager.instance = new ContainerQueryManager();
    }
    return ContainerQueryManager.instance;
  }

  /**
   * 为容器设置响应式类名
   */
  setupContainerQueries(container: HTMLElement, breakpoints: BreakpointConfig): void {
    if (this.supportsContainerQueries) {
      this.setupNativeContainerQueries(container, breakpoints);
    } else {
      this.setupPolyfillContainerQueries(container, breakpoints);
    }
  }

  /**
   * 使用原生CSS Container Queries
   */
  private setupNativeContainerQueries(container: HTMLElement, breakpoints: BreakpointConfig): void {
    // 设置容器查询上下文
    container.style.containerType = 'inline-size';
    container.style.containerName = 'layout-container';

    // 添加CSS规则（通过JavaScript动态插入）
    this.injectContainerQueryCSS(breakpoints);
  }

  /**
   * 使用JavaScript polyfill实现容器查询
   */
  private setupPolyfillContainerQueries(container: HTMLElement, breakpoints: BreakpointConfig): void {
    // 创建ResizeObserver监听容器尺寸变化
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.updateContainerClasses(entry.target as HTMLElement, entry.contentRect.width, breakpoints);
      }
    });

    observer.observe(container);
    
    // 立即更新一次
    this.updateContainerClasses(container, container.getBoundingClientRect().width, breakpoints);
  }

  /**
   * 根据容器宽度更新CSS类名
   */
  private updateContainerClasses(container: HTMLElement, width: number, breakpoints: BreakpointConfig): void {
    // 移除所有断点类名
    const classList = container.classList;
    const breakpointClasses = ['cq-mobile', 'cq-tablet', 'cq-desktop', 'cq-large'];
    classList.remove(...breakpointClasses);

    // 添加当前断点对应的类名
    if (width < breakpoints.mobile) {
      classList.add('cq-mobile');
    } else if (width < breakpoints.tablet) {
      classList.add('cq-tablet');
    } else if (width < breakpoints.desktop) {
      classList.add('cq-desktop');
    } else {
      classList.add('cq-large');
    }

    // 添加最大列数类名
    const maxColumns = ResponsiveUtils.getMaxColumnsForWidth(width, breakpoints);
    classList.remove('cq-max-1', 'cq-max-2', 'cq-max-3', 'cq-max-4', 'cq-max-5');
    classList.add(`cq-max-${maxColumns}`);
  }

  /**
   * 动态注入容器查询CSS规则
   */
  private injectContainerQueryCSS(breakpoints: BreakpointConfig): void {
    const styleId = 'container-query-styles';
    
    // 避免重复注入
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 容器查询样式 */
      @container layout-container (max-width: ${breakpoints.mobile - 1}px) {
        .column-layout-container {
          grid-template-columns: 1fr !important;
        }
        
        .layout-switcher .layout-button:nth-child(n+2) {
          display: none;
        }
      }

      @container layout-container (min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px) {
        .column-layout-container.column-layout-3,
        .column-layout-container.column-layout-4,
        .column-layout-container.column-layout-5 {
          grid-template-columns: 1fr 1fr !important;
        }
        
        .layout-switcher .layout-button:nth-child(n+3) {
          opacity: 0.5;
          pointer-events: none;
        }
      }

      @container layout-container (min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px) {
        .column-layout-container.column-layout-5 {
          grid-template-columns: 1fr 1fr 1fr 1fr !important;
        }
        
        .layout-switcher .layout-button:nth-child(5) {
          opacity: 0.5;
          pointer-events: none;
        }
      }

      /* 响应式列宽调整 */
      @container layout-container (max-width: ${breakpoints.mobile - 1}px) {
        .column-resizer {
          display: none;
        }
      }

      /* 响应式工具栏 */
      @container layout-container (max-width: ${breakpoints.tablet - 1}px) {
        .layout-toolbar .toolbar-button.optional {
          display: none;
        }
        
        .layout-toolbar {
          padding: 4px 8px;
          gap: 4px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 获取容器的有效断点
   */
  getContainerBreakpoint(container: HTMLElement, breakpoints: BreakpointConfig): string {
    const width = container.getBoundingClientRect().width;
    return ResponsiveUtils.getCurrentBreakpoint(width, breakpoints);
  }

  /**
   * 检查容器是否匹配指定断点
   */
  containerMatchesBreakpoint(
    container: HTMLElement, 
    breakpointName: string, 
    breakpoints: BreakpointConfig
  ): boolean {
    const currentBreakpoint = this.getContainerBreakpoint(container, breakpoints);
    return currentBreakpoint === breakpointName;
  }

  /**
   * 为容器生成CSS Container Query规则
   */
  generateContainerQueryCSS(
    containerName: string, 
    breakpoints: BreakpointConfig
  ): string {
    return `
      @container ${containerName} (max-width: ${breakpoints.mobile - 1}px) {
        /* 移动端样式 */
      }
      
      @container ${containerName} (min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.tablet - 1}px) {
        /* 平板端样式 */
      }
      
      @container ${containerName} (min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px) {
        /* 桌面端样式 */
      }
      
      @container ${containerName} (min-width: ${breakpoints.desktop}px) {
        /* 大屏样式 */
      }
    `;
  }
}

/**
 * 容器查询工具函数
 */
export const ContainerQueryUtils = {
  /**
   * 为元素应用容器查询上下文
   */
  applyContainerContext(element: HTMLElement, name?: string): void {
    element.style.containerType = 'inline-size';
    if (name) {
      element.style.containerName = name;
    }
  },

  /**
   * 检查浏览器是否支持容器查询
   */
  isSupported(): boolean {
    return ResponsiveUtils.supportsContainerQueries();
  },

  /**
   * 创建容器查询媒体查询字符串
   */
  createQuery(containerName: string, condition: string): string {
    return `@container ${containerName} (${condition})`;
  },

  /**
   * 获取容器查询polyfill脚本URL
   */
  getPolyfillUrl(): string {
    return 'https://cdn.jsdelivr.net/npm/container-query-polyfill@1/dist/container-query-polyfill.modern.js';
  },

  /**
   * 异步加载容器查询polyfill
   */
  async loadPolyfill(): Promise<void> {
    if (this.isSupported()) {
      return; // 原生支持，无需polyfill
    }

    const script = document.createElement('script');
    script.src = this.getPolyfillUrl();
    script.type = 'module';
    
    return new Promise((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load container query polyfill'));
      document.head.appendChild(script);
    });
  }
};