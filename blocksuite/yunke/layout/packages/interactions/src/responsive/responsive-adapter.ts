/**
 * 响应式布局适配器模板
 * 开发者C2任务：实现响应式检测和适配逻辑
 */

import { signal, computed } from '@preact/signals-core';
import { PageLayoutMode } from '@blocksuite/yunke-layout-interactions';

/**
 * 屏幕断点配置
 */
export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  ultrawide: number;
}

/**
 * 响应式配置
 */
export interface ResponsiveConfig {
  breakpoints: BreakpointConfig;
  modeMapping: {
    mobile: PageLayoutMode;
    tablet: PageLayoutMode;
    desktop: PageLayoutMode;
    ultrawide: PageLayoutMode;
  };
  enableAutoSwitch: boolean;
  enableOrientationDetection: boolean;
  debounceDelay: number;
}

/**
 * 设备信息
 */
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
  width: number;
  height: number;
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  touch: boolean;
  platform: string;
}

/**
 * 响应式适配器类
 */
export class ResponsiveLayoutAdapter {
  private config$ = signal<ResponsiveConfig>({
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1440,
      ultrawide: 1920
    },
    modeMapping: {
      mobile: PageLayoutMode.Normal,
      tablet: PageLayoutMode.TwoColumn,
      desktop: PageLayoutMode.ThreeColumn,
      ultrawide: PageLayoutMode.FourColumn
    },
    enableAutoSwitch: true,
    enableOrientationDetection: true,
    debounceDelay: 300
  });
  
  private viewport$ = signal({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  private orientation$ = signal<'portrait' | 'landscape'>(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );
  
  // 计算当前设备类型
  private deviceType$ = computed(() => {
    const { width } = this.viewport$.value;
    const { breakpoints } = this.config$.value;
    
    if (width < breakpoints.mobile) return 'mobile';
    if (width < breakpoints.tablet) return 'tablet';
    if (width < breakpoints.desktop) return 'desktop';
    return 'ultrawide';
  });
  
  // 计算推荐的布局模式
  private recommendedMode$ = computed(() => {
    const deviceType = this.deviceType$.value;
    const { modeMapping } = this.config$.value;
    return modeMapping[deviceType];
  });
  
  private resizeObserver: ResizeObserver | null = null;
  private orientationChangeListener: (() => void) | null = null;
  private debounceTimer: number | null = null;
  
  constructor(config?: Partial<ResponsiveConfig>) {
    if (config) {
      this.updateConfig(config);
    }
    
    this.setupEventListeners();
    this.detectInitialState();
  }
  
  /**
   * 获取当前设备信息
   */
  getDeviceInfo(): DeviceInfo {
    const { width, height } = this.viewport$.value;
    
    return {
      type: this.deviceType$.value,
      width,
      height,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: this.orientation$.value,
      touch: 'ontouchstart' in window,
      platform: this.detectPlatform()
    };
  }
  
  /**
   * 获取推荐的布局模式
   */
  getRecommendedLayoutMode(): PageLayoutMode {
    return this.recommendedMode$.value;
  }
  
  /**
   * 检查指定模式是否适合当前设备
   */
  isLayoutModeAppropriate(mode: PageLayoutMode): boolean {
    const deviceType = this.deviceType$.value;
    const { width } = this.viewport$.value;
    
    // 开发者C2：实现适合性检查逻辑
    const modeRequirements = {
      [PageLayoutMode.Normal]: { minWidth: 320 },
      [PageLayoutMode.TwoColumn]: { minWidth: 768 },
      [PageLayoutMode.ThreeColumn]: { minWidth: 1024 },
      [PageLayoutMode.FourColumn]: { minWidth: 1440 },
      [PageLayoutMode.FiveColumn]: { minWidth: 1920 }
    };
    
    const requirement = modeRequirements[mode];
    return width >= requirement.minWidth;
  }
  
  /**
   * 监听设备变化
   */
  onDeviceChange(callback: (deviceInfo: DeviceInfo) => void): () => void {
    const unsubscribe = this.deviceType$.subscribe(() => {
      callback(this.getDeviceInfo());
    });
    
    return unsubscribe;
  }
  
  /**
   * 监听推荐模式变化
   */
  onRecommendedModeChange(callback: (mode: PageLayoutMode) => void): () => void {
    const unsubscribe = this.recommendedMode$.subscribe(callback);
    return unsubscribe;
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<ResponsiveConfig>): void {
    this.config$.value = { ...this.config$.value, ...config };
  }
  
  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 窗口大小变化监听
    const handleResize = () => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      this.debounceTimer = window.setTimeout(() => {
        this.updateViewport();
      }, this.config$.value.debounceDelay);
    };
    
    window.addEventListener('resize', handleResize);
    
    // 方向变化监听
    if (this.config$.value.enableOrientationDetection) {
      this.orientationChangeListener = () => {
        setTimeout(() => {
          this.updateOrientation();
        }, 100); // 等待方向变化完成
      };
      
      window.addEventListener('orientationchange', this.orientationChangeListener);
      window.addEventListener('resize', this.orientationChangeListener);
    }
    
    // 开发者C2：添加更多事件监听
    // TODO: 监听键盘显示/隐藏（移动端）
    // TODO: 监听全屏状态变化
    // TODO: 监听外接显示器连接/断开
  }
  
  /**
   * 检测初始状态
   */
  private detectInitialState(): void {
    this.updateViewport();
    this.updateOrientation();
    
    // 开发者C2：添加更多初始检测
    // TODO: 检测网络状态
    // TODO: 检测性能等级
    // TODO: 检测电池状态（如果支持）
  }
  
  /**
   * 更新视口信息
   */
  private updateViewport(): void {
    this.viewport$.value = {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }
  
  /**
   * 更新方向信息
   */
  private updateOrientation(): void {
    this.orientation$.value = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }
  
  /**
   * 检测平台
   */
  private detectPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    if (/windows/.test(userAgent)) return 'windows';
    if (/macintosh|mac os x/.test(userAgent)) return 'macos';
    if (/linux/.test(userAgent)) return 'linux';
    
    return 'unknown';
  }
  
  /**
   * 获取性能等级建议
   */
  getPerformanceLevel(): 'low' | 'medium' | 'high' {
    const deviceInfo = this.getDeviceInfo();
    
    // 开发者C2：实现性能等级评估
    // 基于设备类型、像素密度、内存等因素
    
    if (deviceInfo.type === 'mobile') {
      return deviceInfo.pixelRatio > 2 ? 'medium' : 'low';
    }
    
    if (deviceInfo.type === 'tablet') {
      return 'medium';
    }
    
    return 'high';
  }
  
  /**
   * 获取推荐的动画质量
   */
  getRecommendedAnimationQuality(): 'low' | 'medium' | 'high' {
    const performanceLevel = this.getPerformanceLevel();
    const deviceInfo = this.getDeviceInfo();
    
    // 开发者C2：基于设备性能和用户偏好推荐动画质量
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 'low';
    }
    
    if (deviceInfo.type === 'mobile' && performanceLevel === 'low') {
      return 'low';
    }
    
    return performanceLevel;
  }
  
  /**
   * 创建媒体查询监听器
   */
  createMediaQueryListener(
    query: string,
    callback: (matches: boolean) => void
  ): () => void {
    const mediaQuery = window.matchMedia(query);
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };
    
    mediaQuery.addEventListener('change', handler);
    
    // 立即执行一次
    callback(mediaQuery.matches);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    if (this.orientationChangeListener) {
      window.removeEventListener('orientationchange', this.orientationChangeListener);
      window.removeEventListener('resize', this.orientationChangeListener);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

// 创建全局实例
export const responsiveAdapter = new ResponsiveLayoutAdapter();

// 便捷的钩子函数供UI组件使用
export function useResponsiveLayout() {
  return {
    getDeviceInfo: () => responsiveAdapter.getDeviceInfo(),
    getRecommendedMode: () => responsiveAdapter.getRecommendedLayoutMode(),
    isAppropriate: (mode: PageLayoutMode) => responsiveAdapter.isLayoutModeAppropriate(mode),
    onDeviceChange: (callback: (info: DeviceInfo) => void) => 
      responsiveAdapter.onDeviceChange(callback),
    onModeChange: (callback: (mode: PageLayoutMode) => void) => 
      responsiveAdapter.onRecommendedModeChange(callback)
  };
}