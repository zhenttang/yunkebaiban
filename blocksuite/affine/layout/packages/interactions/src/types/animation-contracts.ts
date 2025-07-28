/**
 * 动画管理接口契约
 * 定义了所有动画相关功能的标准接口
 */

// 引入基础类型（目前先定义，后续会从core包导入）
export enum PageLayoutMode {
  Normal = 'normal',
  TwoColumn = '2-column',
  ThreeColumn = '3-column',
  FourColumn = '4-column',
  FiveColumn = '5-column'
}

/**
 * 动画管理器接口
 * 负责管理所有布局相关的动画效果
 */
export interface IAnimationManager {
  /**
   * 执行布局切换动画
   * @param from 起始布局模式
   * @param to 目标布局模式
   * @returns Promise，动画完成时resolve
   */
  animateLayoutTransition(from: PageLayoutMode, to: PageLayoutMode): Promise<void>;

  /**
   * 执行Block移动动画
   * @param block 要移动的Block元素
   * @param fromCol 起始列索引
   * @param toCol 目标列索引
   * @returns Promise，动画完成时resolve
   */
  animateBlockMovement(block: HTMLElement, fromCol: number, toCol: number): Promise<void>;

  /**
   * 执行列宽调整动画
   * @param columnIndex 列索引
   * @param newWidth 新的宽度值
   * @returns Promise，动画完成时resolve
   */
  animateColumnResize(columnIndex: number, newWidth: number): Promise<void>;

  /**
   * 设置动画配置
   * @param config 动画配置对象
   */
  setAnimationConfig(config: AnimationConfig): void;

  /**
   * 取消所有正在进行的动画
   */
  cancelAllAnimations(): void;

  /**
   * 暂停所有动画
   */
  pauseAnimations(): void;

  /**
   * 恢复所有动画
   */
  resumeAnimations(): void;

  /**
   * 检查是否有动画正在进行
   */
  isAnimating(): boolean;
}

/**
 * 动画配置接口
 */
export interface AnimationConfig {
  /** 是否启用动画 */
  enableAnimations: boolean;
  
  /** 默认动画持续时间 (毫秒) */
  defaultDuration: number;
  
  /** 默认缓动函数 */
  defaultEasing: string;
  
  /** 是否启用减弱动画模式 (遵循用户系统设置) */
  reducedMotion: boolean;
  
  /** 动画质量级别 */
  quality: 'low' | 'medium' | 'high';
  
  /** 最大并发动画数量 */
  maxConcurrentAnimations: number;
}

/**
 * 动画事件接口
 */
export interface AnimationEvent {
  /** 事件类型 */
  type: 'start' | 'progress' | 'complete' | 'cancel';
  
  /** 动画ID */
  animationId: string;
  
  /** 动画进度 (0-1) */
  progress?: number;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 动画目标元素 */
  target?: HTMLElement;
}

/**
 * 动画选项接口
 */
export interface AnimationOptions {
  /** 动画持续时间 */
  duration?: number;
  
  /** 缓动函数 */
  easing?: string;
  
  /** 动画延迟 */
  delay?: number;
  
  /** 重复次数 */
  iterations?: number;
  
  /** 填充模式 */
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
  
  /** 动画完成回调 */
  onComplete?: () => void;
  
  /** 动画开始回调 */
  onStart?: () => void;
  
  /** 动画进度回调 */
  onProgress?: (progress: number) => void;
}

/**
 * 关键帧动画接口
 */
export interface KeyframeDefinition {
  /** 关键帧位置 (0-1) */
  offset: number;
  
  /** CSS变换属性 */
  transform?: string;
  
  /** 透明度 */
  opacity?: number;
  
  /** 其他CSS属性 */
  [property: string]: string | number | undefined;
}

/**
 * 动画路径接口
 */
export interface AnimationPath {
  /** 路径类型 */
  type: 'linear' | 'arc' | 'bezier' | 'custom';
  
  /** 起始点 */
  start: { x: number; y: number };
  
  /** 结束点 */
  end: { x: number; y: number };
  
  /** 控制点 (用于贝塞尔曲线) */
  controlPoints?: Array<{ x: number; y: number }>;
  
  /** 自定义路径函数 */
  customPath?: (progress: number) => { x: number; y: number };
}