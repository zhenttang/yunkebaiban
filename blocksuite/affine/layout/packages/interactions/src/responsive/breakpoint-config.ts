import type { BreakpointConfig, PageLayoutMode } from '../types/responsive-contracts.js';

// 默认断点配置
export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 768,
  tablet: 1024, 
  desktop: 1440,
  large: 1920
};

// 布局模式配置 (临时定义，等待Team A的正式版本)
export const LayoutModeConfig = {
  [PageLayoutMode.Normal]: { columns: 1, icon: '▊', label: '单列' },
  [PageLayoutMode.TwoColumn]: { columns: 2, icon: '▊▊', label: '双列' },
  [PageLayoutMode.ThreeColumn]: { columns: 3, icon: '▊▊▊', label: '三列' },
  [PageLayoutMode.FourColumn]: { columns: 4, icon: '▊▊▊▊', label: '四列' },
  [PageLayoutMode.FiveColumn]: { columns: 5, icon: '▊▊▊▊▊', label: '五列' }
};

// 响应式工具函数
export class ResponsiveUtils {
  /**
   * 根据屏幕宽度获取当前断点名称
   */
  static getCurrentBreakpoint(width: number, breakpoints: BreakpointConfig): string {
    if (width < breakpoints.mobile) return 'mobile';
    if (width < breakpoints.tablet) return 'tablet';
    if (width < breakpoints.desktop) return 'desktop';
    if (breakpoints.large && width < breakpoints.large) return 'large';
    return 'xlarge';
  }

  /**
   * 根据宽度获取最大支持的列数
   */
  static getMaxColumnsForWidth(width: number, breakpoints: BreakpointConfig): number {
    if (width < breakpoints.mobile) return 1;      // 移动端：最多1列
    if (width < breakpoints.tablet) return 2;      // 平板端：最多2列
    if (width < breakpoints.desktop) return 4;     // 桌面端：最多4列
    return 5;                                       // 大屏幕：最多5列
  }

  /**
   * 根据列数获取对应的布局模式
   */
  static getModeByColumnCount(columns: number): PageLayoutMode {
    const modeMap: Record<number, PageLayoutMode> = {
      1: PageLayoutMode.Normal,
      2: PageLayoutMode.TwoColumn,
      3: PageLayoutMode.ThreeColumn,
      4: PageLayoutMode.FourColumn,
      5: PageLayoutMode.FiveColumn
    };
    
    return modeMap[Math.max(1, Math.min(5, columns))] || PageLayoutMode.Normal;
  }

  /**
   * 检查是否匹配指定断点
   */
  static matchesBreakpoint(
    currentWidth: number, 
    breakpointName: string, 
    breakpoints: BreakpointConfig
  ): boolean {
    const currentBreakpoint = this.getCurrentBreakpoint(currentWidth, breakpoints);
    return currentBreakpoint === breakpointName;
  }

  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func(...args), delay);
    };
  }

  /**
   * 检查设备方向
   */
  static getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  /**
   * 检查是否支持容器查询
   */
  static supportsContainerQueries(): boolean {
    return 'container' in document.documentElement.style;
  }

  /**
   * 生成唯一ID
   */
  static generateId(): string {
    return `responsive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 常用断点查询函数
export const BreakpointQueries = {
  isMobile: (width: number, breakpoints = DEFAULT_BREAKPOINTS) => 
    width < breakpoints.mobile,
  
  isTablet: (width: number, breakpoints = DEFAULT_BREAKPOINTS) => 
    width >= breakpoints.mobile && width < breakpoints.tablet,
  
  isDesktop: (width: number, breakpoints = DEFAULT_BREAKPOINTS) => 
    width >= breakpoints.tablet && width < breakpoints.desktop,
  
  isLarge: (width: number, breakpoints = DEFAULT_BREAKPOINTS) => 
    breakpoints.large ? width >= breakpoints.large : width >= breakpoints.desktop
};