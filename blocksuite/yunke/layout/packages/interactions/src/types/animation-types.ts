/**
 * 动画工具类型和配置
 * 包含动画系统需要的各种工具类型和默认配置
 */

import { AnimationConfig, AnimationOptions, KeyframeDefinition } from './animation-contracts';

/**
 * 默认动画配置
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  enableAnimations: true,
  defaultDuration: 300,
  defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  reducedMotion: false, // 会在运行时检测系统设置
  quality: 'high',
  maxConcurrentAnimations: 10
};

/**
 * 动画预设配置
 */
export const ANIMATION_PRESETS = {
  /** 快速动画 - 用于简单状态变化 */
  fast: {
    duration: 150,
    easing: 'cubic-bezier(0.4, 0, 1, 1)' // ease-out
  },
  
  /** 标准动画 - 用于大部分场景 */
  normal: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)' // ease-in-out
  },
  
  /** 慢速动画 - 用于复杂变换 */
  slow: {
    duration: 500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // ease-out
  },
  
  /** 弹性动画 - 用于有趣的交互 */
  bounce: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' // back-out
  },
  
  /** 减弱动画 - 用于无障碍模式 */
  reduced: {
    duration: 100,
    easing: 'linear'
  }
} as const;

/**
 * 关键帧预设
 */
export const KEYFRAME_PRESETS = {
  /** 淡入效果 */
  fadeIn: [
    { offset: 0, opacity: 0 },
    { offset: 1, opacity: 1 }
  ] as KeyframeDefinition[],
  
  /** 淡出效果 */
  fadeOut: [
    { offset: 0, opacity: 1 },
    { offset: 1, opacity: 0 }
  ] as KeyframeDefinition[],
  
  /** 向上滑入 */
  slideUp: [
    { offset: 0, transform: 'translateY(20px)', opacity: 0 },
    { offset: 1, transform: 'translateY(0)', opacity: 1 }
  ] as KeyframeDefinition[],
  
  /** 向下滑出 */
  slideDown: [
    { offset: 0, transform: 'translateY(0)', opacity: 1 },
    { offset: 1, transform: 'translateY(20px)', opacity: 0 }
  ] as KeyframeDefinition[],
  
  /** 缩放进入 */
  scaleIn: [
    { offset: 0, transform: 'scale(0.95)', opacity: 0 },
    { offset: 1, transform: 'scale(1)', opacity: 1 }
  ] as KeyframeDefinition[],
  
  /** 缩放退出 */
  scaleOut: [
    { offset: 0, transform: 'scale(1)', opacity: 1 },
    { offset: 1, transform: 'scale(0.95)', opacity: 0 }
  ] as KeyframeDefinition[],
  
  /** 旋转进入 */
  rotateIn: [
    { offset: 0, transform: 'rotate(-5deg) scale(0.95)', opacity: 0 },
    { offset: 1, transform: 'rotate(0deg) scale(1)', opacity: 1 }
  ] as KeyframeDefinition[],
  
  /** 左右摇摆 */
  shake: [
    { offset: 0, transform: 'translateX(0)' },
    { offset: 0.1, transform: 'translateX(-10px)' },
    { offset: 0.2, transform: 'translateX(10px)' },
    { offset: 0.3, transform: 'translateX(-10px)' },
    { offset: 0.4, transform: 'translateX(10px)' },
    { offset: 0.5, transform: 'translateX(-5px)' },
    { offset: 0.6, transform: 'translateX(5px)' },
    { offset: 0.7, transform: 'translateX(-5px)' },
    { offset: 0.8, transform: 'translateX(5px)' },
    { offset: 1, transform: 'translateX(0)' }
  ] as KeyframeDefinition[],
  
  /** 脉冲效果 */
  pulse: [
    { offset: 0, transform: 'scale(1)' },
    { offset: 0.5, transform: 'scale(1.05)' },
    { offset: 1, transform: 'scale(1)' }
  ] as KeyframeDefinition[]
} as const;

/**
 * 缓动函数预设
 */
export const EASING_FUNCTIONS = {
  // 标准缓动
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // 贝塞尔曲线缓动
  easeInSine: 'cubic-bezier(0.12, 0, 0.39, 0)',
  easeOutSine: 'cubic-bezier(0.61, 1, 0.88, 1)',
  easeInOutSine: 'cubic-bezier(0.37, 0, 0.63, 1)',
  
  easeInQuad: 'cubic-bezier(0.11, 0, 0.5, 0)',
  easeOutQuad: 'cubic-bezier(0.5, 1, 0.89, 1)',
  easeInOutQuad: 'cubic-bezier(0.45, 0, 0.55, 1)',
  
  easeInCubic: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeInOutCubic: 'cubic-bezier(0.65, 0, 0.35, 1)',
  
  // 弹性缓动
  easeInBack: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeInOutBack: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  
  // 材质设计缓动
  materialStandard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  materialDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  materialAccelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  materialSharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
} as const;

/**
 * 动画持续时间常量
 */
export const DURATION = {
  /** 极快 - 用于微交互 */
  instant: 0,
  
  /** 很快 - 用于简单状态变化 */
  veryFast: 100,
  
  /** 快速 - 用于小幅度变化 */
  fast: 150,
  
  /** 标准 - 大部分动画的默认时长 */
  normal: 300,
  
  /** 慢速 - 用于复杂布局变化 */
  slow: 500,
  
  /** 很慢 - 用于大幅度变换 */
  verySlow: 700,
  
  /** 超慢 - 用于演示或特殊效果 */
  ultra: 1000
} as const;

/**
 * 动画质量设置
 */
export const QUALITY_SETTINGS = {
  low: {
    fps: 30,
    useGPUAcceleration: false,
    maxConcurrentAnimations: 3,
    simplifyAnimations: true
  },
  medium: {
    fps: 45,
    useGPUAcceleration: true,
    maxConcurrentAnimations: 6,
    simplifyAnimations: false
  },
  high: {
    fps: 60,
    useGPUAcceleration: true,
    maxConcurrentAnimations: 10,
    simplifyAnimations: false
  }
} as const;

/**
 * 动画工具类型
 */
export type AnimationPreset = keyof typeof ANIMATION_PRESETS;
export type KeyframePreset = keyof typeof KEYFRAME_PRESETS;
export type EasingFunction = keyof typeof EASING_FUNCTIONS;
export type AnimationDuration = keyof typeof DURATION;
export type AnimationQuality = keyof typeof QUALITY_SETTINGS;

/**
 * 动画状态类型
 */
export type AnimationState = 'idle' | 'preparing' | 'running' | 'paused' | 'completed' | 'cancelled';

/**
 * 动画方向类型
 */
export type AnimationDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

/**
 * 动画填充模式类型
 */
export type AnimationFillMode = 'none' | 'forwards' | 'backwards' | 'both';

/**
 * 动画组合模式类型
 */
export type AnimationComposite = 'replace' | 'add' | 'accumulate';