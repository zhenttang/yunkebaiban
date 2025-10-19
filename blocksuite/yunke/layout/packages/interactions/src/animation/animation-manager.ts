/**
 * 动画管理器核心实现
 * 负责管理所有布局相关的动画效果
 */

import { signal } from '@preact/signals-core';
import { 
  IAnimationManager, 
  AnimationConfig, 
  AnimationEvent, 
  AnimationOptions,
  PageLayoutMode 
} from '../types/animation-contracts';
import { 
  DEFAULT_ANIMATION_CONFIG,
  ANIMATION_PRESETS,
  KEYFRAME_PRESETS,
  QUALITY_SETTINGS,
  AnimationState
} from '../types/animation-types';
import { LayoutTransitionAnimator } from './layout-transition-animator';
import { BlockMovementAnimator } from './block-movement-animator';
import { ColumnResizeAnimator } from './column-resize-animator';
import { AdvancedEffectsManager } from './advanced-effects';

/**
 * 动画实例类
 */
class AnimationInstance {
  public readonly id: string;
  public readonly animation: Animation;
  public state: AnimationState = 'preparing';
  public startTime: number = 0;
  public element: HTMLElement;
  
  constructor(
    id: string,
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ) {
    this.id = id;
    this.element = element;
    this.animation = element.animate(keyframes, options);
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.animation.addEventListener('finish', () => {
      this.state = 'completed';
    });
    
    this.animation.addEventListener('cancel', () => {
      this.state = 'cancelled';
    });
  }
  
  public play() {
    this.state = 'running';
    this.startTime = performance.now();
    this.animation.play();
  }
  
  public pause() {
    this.state = 'paused';
    this.animation.pause();
  }
  
  public cancel() {
    this.state = 'cancelled';
    this.animation.cancel();
  }
  
  public get progress(): number {
    if (!this.animation.currentTime || !this.animation.effect?.getTiming().duration) {
      return 0;
    }
    const duration = this.animation.effect.getTiming().duration as number;
    return Math.min(1, (this.animation.currentTime as number) / duration);
  }
}

/**
 * 动画管理器实现
 */
export class AnimationManager implements IAnimationManager {
  // 配置和状态
  private config$ = signal<AnimationConfig>(DEFAULT_ANIMATION_CONFIG);
  private isGloballyPaused$ = signal<boolean>(false);
  private activeAnimations = new Map<string, AnimationInstance>();
  private animationQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  
  // 事件发射器
  private eventListeners = new Map<string, Array<(event: AnimationEvent) => void>>();
  
  // 动画器实例
  private layoutTransitionAnimator = new LayoutTransitionAnimator();
  private blockMovementAnimator = new BlockMovementAnimator();
  private columnResizeAnimator = new ColumnResizeAnimator();
  private effectsManager = new AdvancedEffectsManager();
  
  constructor(config?: Partial<AnimationConfig>) {
    if (config) {
      this.setAnimationConfig({ ...DEFAULT_ANIMATION_CONFIG, ...config });
    }
    
    this.setupReducedMotionDetection();
    this.setupPerformanceMonitoring();
  }
  
  /**
   * 设置动画配置
   */
  setAnimationConfig(config: AnimationConfig): void {
    this.config$.value = config;
    
    // 如果禁用动画，取消所有正在进行的动画
    if (!config.enableAnimations) {
      this.cancelAllAnimations();
    }
  }
  
  /**
   * 获取当前配置
   */
  getAnimationConfig(): AnimationConfig {
    return this.config$.value;
  }
  
  /**
   * 检查是否有动画正在进行
   */
  isAnimating(): boolean {
    return this.activeAnimations.size > 0 || this.isProcessingQueue;
  }
  
  /**
   * 取消所有正在进行的动画
   */
  cancelAllAnimations(): void {
    for (const [id, instance] of this.activeAnimations) {
      instance.cancel();
      this.emitEvent({
        type: 'cancel',
        animationId: id,
        timestamp: performance.now(),
        target: instance.element
      });
    }
    this.activeAnimations.clear();
    this.animationQueue = [];
    
    // 取消各个动画器的动画
    this.blockMovementAnimator.cancelAllMovements();
    this.columnResizeAnimator.cancelAllResizes();
  }
  
  /**
   * 暂停所有动画
   */
  pauseAnimations(): void {
    this.isGloballyPaused$.value = true;
    for (const instance of this.activeAnimations.values()) {
      instance.pause();
    }
  }
  
  /**
   * 恢复所有动画
   */
  resumeAnimations(): void {
    this.isGloballyPaused$.value = false;
    for (const instance of this.activeAnimations.values()) {
      if (instance.state === 'paused') {
        instance.play();
      }
    }
  }
  
  /**
   * 布局切换动画（第3-4天实现具体逻辑）
   */
  async animateLayoutTransition(from: PageLayoutMode, to: PageLayoutMode): Promise<void> {
    if (!this.shouldAnimate()) {
      return Promise.resolve();
    }
    
    const animationId = this.generateAnimationId('layout-transition');
    
    try {
      this.emitEvent({
        type: 'start',
        animationId,
        timestamp: performance.now()
      });
      
      // 实际的布局切换动画逻辑将在第3-4天实现
      await this.executeLayoutTransitionAnimation(from, to, animationId);
      
      this.emitEvent({
        type: 'complete',
        animationId,
        timestamp: performance.now()
      });
      
    } catch (error) {
      this.emitEvent({
        type: 'cancel',
        animationId,
        timestamp: performance.now()
      });
      throw error;
    }
  }
  
  /**
   * Block移动动画（第5-6天实现具体逻辑）
   */
  async animateBlockMovement(block: HTMLElement, fromCol: number, toCol: number): Promise<void> {
    if (!this.shouldAnimate()) {
      return Promise.resolve();
    }
    
    const animationId = this.generateAnimationId('block-movement');
    
    try {
      this.emitEvent({
        type: 'start',
        animationId,
        timestamp: performance.now(),
        target: block
      });
      
      // 实际的Block移动动画逻辑将在第5-6天实现
      await this.executeBlockMovementAnimation(block, fromCol, toCol, animationId);
      
      this.emitEvent({
        type: 'complete',
        animationId,
        timestamp: performance.now(),
        target: block
      });
      
    } catch (error) {
      this.emitEvent({
        type: 'cancel',
        animationId,
        timestamp: performance.now(),
        target: block
      });
      throw error;
    }
  }
  
  /**
   * 列宽调整动画（第7-8天实现具体逻辑）
   */
  async animateColumnResize(columnIndex: number, newWidth: number): Promise<void> {
    if (!this.shouldAnimate()) {
      return Promise.resolve();
    }
    
    const animationId = this.generateAnimationId('column-resize');
    
    try {
      this.emitEvent({
        type: 'start',
        animationId,
        timestamp: performance.now()
      });
      
      // 实际的列宽调整动画逻辑将在第7-8天实现
      await this.executeColumnResizeAnimation(columnIndex, newWidth, animationId);
      
      this.emitEvent({
        type: 'complete',
        animationId,
        timestamp: performance.now()
      });
      
    } catch (error) {
      this.emitEvent({
        type: 'cancel',
        animationId,
        timestamp: performance.now()
      });
      throw error;
    }
  }
  
  /**
   * 创建基础动画实例
   */
  public async createAnimation(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: AnimationOptions = {}
  ): Promise<AnimationInstance> {
    const config = this.config$.value;
    const animationId = this.generateAnimationId('custom');
    
    // 合并默认选项
    const finalOptions: KeyframeAnimationOptions = {
      duration: options.duration ?? config.defaultDuration,
      easing: options.easing ?? config.defaultEasing,
      delay: options.delay ?? 0,
      iterations: options.iterations ?? 1,
      fill: options.fill ?? 'forwards',
      ...this.getQualityOptions()
    };
    
    // 检查并发限制
    if (this.activeAnimations.size >= config.maxConcurrentAnimations) {
      await this.waitForSlot();
    }
    
    const instance = new AnimationInstance(animationId, element, keyframes, finalOptions);
    this.activeAnimations.set(animationId, instance);
    
    // 设置完成回调
    instance.animation.addEventListener('finish', () => {
      this.activeAnimations.delete(animationId);
      options.onComplete?.();
    });
    
    instance.animation.addEventListener('cancel', () => {
      this.activeAnimations.delete(animationId);
    });
    
    return instance;
  }
  
  /**
   * 事件监听
   */
  public addEventListener(eventType: string, listener: (event: AnimationEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }
  
  public removeEventListener(eventType: string, listener: (event: AnimationEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  // ============ 私有方法 ============
  
  /**
   * 检查是否应该执行动画
   */
  private shouldAnimate(): boolean {
    const config = this.config$.value;
    
    if (!config.enableAnimations) {
      return false;
    }
    
    if (this.isGloballyPaused$.value) {
      return false;
    }
    
    // 检查用户的减弱动画偏好
    if (config.reducedMotion && this.prefersReducedMotion()) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 检测用户是否偏好减弱动画
   */
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * 设置减弱动画检测
   */
  private setupReducedMotionDetection(): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const config = this.config$.value;
      this.setAnimationConfig({
        ...config,
        reducedMotion: e.matches
      });
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // 设置初始值
    const config = this.config$.value;
    this.setAnimationConfig({
      ...config,
      reducedMotion: mediaQuery.matches
    });
  }
  
  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 监控动画性能，必要时自动降级
    setInterval(() => {
      this.checkPerformanceAndAdjust();
    }, 5000);
  }
  
  /**
   * 检查性能并调整
   */
  private checkPerformanceAndAdjust(): void {
    const config = this.config$.value;
    
    // 简单的性能检测：如果并发动画过多，降低质量
    if (this.activeAnimations.size > 8 && config.quality === 'high') {
      this.setAnimationConfig({
        ...config,
        quality: 'medium'
      });
    }
  }
  
  /**
   * 获取质量相关选项
   */
  private getQualityOptions(): Partial<KeyframeAnimationOptions> {
    const quality = this.config$.value.quality;
    const settings = QUALITY_SETTINGS[quality];
    
    return {
      // 根据质量设置调整选项
    };
  }
  
  /**
   * 生成动画ID
   */
  private generateAnimationId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}`;
  }
  
  /**
   * 等待动画槽位
   */
  private async waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const checkSlot = () => {
        const config = this.config$.value;
        if (this.activeAnimations.size < config.maxConcurrentAnimations) {
          resolve();
        } else {
          setTimeout(checkSlot, 16); // 约60fps
        }
      };
      checkSlot();
    });
  }
  
  /**
   * 触发事件
   */
  private emitEvent(event: AnimationEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Animation event listener error:', error);
        }
      });
    }
  }
  
  // ============ 具体动画实现（占位符，后续实现） ============
  
  private async executeLayoutTransitionAnimation(
    from: PageLayoutMode, 
    to: PageLayoutMode, 
    animationId: string
  ): Promise<void> {
    // 使用专门的布局转换动画器
    await this.layoutTransitionAnimator.executeTransition(from, to);
  }
  
  private async executeBlockMovementAnimation(
    block: HTMLElement, 
    fromCol: number, 
    toCol: number, 
    animationId: string
  ): Promise<void> {
    // 使用专门的Block移动动画器
    await this.blockMovementAnimator.executeMovement(block, fromCol, toCol);
  }
  
  private async executeColumnResizeAnimation(
    columnIndex: number, 
    newWidth: number, 
    animationId: string
  ): Promise<void> {
    // 使用专门的列宽调整动画器
    const column = document.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
    if (column) {
      const currentWidth = column.getBoundingClientRect().width;
      await this.columnResizeAnimator.executeResize(columnIndex, currentWidth, newWidth);
    }
  }
  
  // ============ 高级动画功能 ============
  
  /**
   * 创建粒子效果
   */
  public async createParticleEffect(
    element: HTMLElement,
    effectType: 'expand' | 'collapse' | 'transform' = 'expand'
  ): Promise<void> {
    await this.effectsManager.createLayoutTransitionEffect(element, effectType);
  }
  
  /**
   * 创建弹性动画
   */
  public createElasticAnimation(
    element: HTMLElement,
    options?: { scale?: number; duration?: number; elasticity?: number }
  ): Animation {
    return this.effectsManager.createElasticAnimation(element, options);
  }
  
  /**
   * 创建3D翻转动画
   */
  public create3DFlipAnimation(
    element: HTMLElement,
    axis: 'x' | 'y' = 'y',
    angle: number = 180
  ): Animation {
    return this.effectsManager.create3DFlipAnimation(element, axis, angle);
  }
  
  /**
   * 创建磁性吸附效果
   */
  public async createMagneticEffect(
    element: HTMLElement,
    targetX: number,
    targetY: number
  ): Promise<void> {
    return this.effectsManager.createMagneticEffect(element, targetX, targetY);
  }
  
  /**
   * 获取Block移动动画器（用于高级功能）
   */
  public getBlockMovementAnimator(): BlockMovementAnimator {
    return this.blockMovementAnimator;
  }
  
  /**
   * 获取列宽调整动画器（用于高级功能）
   */
  public getColumnResizeAnimator(): ColumnResizeAnimator {
    return this.columnResizeAnimator;
  }
  
  /**
   * 获取高级效果管理器（用于自定义效果）
   */
  public getEffectsManager(): AdvancedEffectsManager {
    return this.effectsManager;
  }
  
  /**
   * 清理所有资源
   */
  public cleanup(): void {
    this.cancelAllAnimations();
    this.effectsManager.cleanup();
    this.columnResizeAnimator.cleanup();
  }
}