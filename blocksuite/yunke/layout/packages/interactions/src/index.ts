/**
 * 动画系统导出文件
 * 提供所有动画相关功能的统一入口
 */

// 核心接口和类型
export type {
  IAnimationManager,
  AnimationConfig,
  AnimationEvent,
  AnimationOptions,
  KeyframeDefinition,
  AnimationPath,
  PageLayoutMode
} from './types/animation-contracts';

export type {
  AnimationPreset,
  KeyframePreset,
  EasingFunction,
  AnimationDuration,
  AnimationQuality,
  AnimationState,
  AnimationDirection,
  AnimationFillMode,
  AnimationComposite
} from './types/animation-types';

// 配置和预设
export {
  DEFAULT_ANIMATION_CONFIG,
  ANIMATION_PRESETS,
  KEYFRAME_PRESETS,
  EASING_FUNCTIONS,
  DURATION,
  QUALITY_SETTINGS
} from './types/animation-types';

// 核心动画管理器
export { AnimationManager } from './animation/animation-manager';

// 专门的动画器
export { LayoutTransitionAnimator, AdvancedLayoutTransitionAnimator } from './animation/layout-transition-animator';
export { BlockMovementAnimator, AdvancedBlockMovementAnimator } from './animation/block-movement-animator';
export { ColumnResizeAnimator } from './animation/column-resize-animator';

// 高级效果
export { AdvancedEffectsManager, PerformanceMonitor } from './animation/advanced-effects';

// 工具函数
export const AnimationUtils = {
  /**
   * 检查是否支持Web Animations API
   */
  isWebAnimationsSupported(): boolean {
    return typeof Element !== 'undefined' && 'animate' in Element.prototype;
  },
  
  /**
   * 检查用户是否偏好减弱动画
   */
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  /**
   * 获取设备像素比
   */
  getDevicePixelRatio(): number {
    return typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
  },
  
  /**
   * 检查是否为触摸设备
   */
  isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  /**
   * 计算两点间距离
   */
  calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  },
  
  /**
   * 线性插值
   */
  lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  },
  
  /**
   * 缓动函数：ease-in-out
   */
  easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  },
  
  /**
   * 缓动函数：弹性效果
   */
  easeElastic(t: number): number {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },
  
  /**
   * 限制值在指定范围内
   */
  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  },
  
  /**
   * 将值从一个范围映射到另一个范围
   */
  map(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
    return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
  }
};

// 创建默认动画管理器实例的工厂函数
export function createAnimationManager(config?: Partial<AnimationConfig>): AnimationManager {
  return new AnimationManager(config);
}

// 版本信息
export const VERSION = '1.0.0';

// 默认导出动画管理器类
export { AnimationManager as default } from './animation/animation-manager';