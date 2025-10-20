import type { 
  ResponsiveChangeEvent,
  PageLayoutMode 
} from '../types/responsive-contracts.js';
import { ResponsiveManager } from '../responsive/responsive-manager.js';
import { IntelligentBreakpointDetector } from '../responsive/intelligent-breakpoint-detector.js';

/**
 * 响应式感知动画管理器
 * 
 * 为开发者C1（动画工程师）提供的集成示例
 * 展示如何创建感知响应式状态的智能动画
 */
export class ResponsiveAwareAnimationManager {
  private responsiveManager = new ResponsiveManager();
  private breakpointDetector = new IntelligentBreakpointDetector();
  private isReducedMotion = false;

  constructor() {
    this.detectMotionPreferences();
  }

  /**
   * 检测用户动画偏好
   */
  private detectMotionPreferences() {
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 监听偏好变化
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.isReducedMotion = e.matches;
    });
  }

  /**
   * 响应式感知的布局切换动画
   */
  async animateLayoutTransition(
    fromMode: PageLayoutMode,
    toMode: PageLayoutMode,
    container: HTMLElement
  ): Promise<void> {
    // 检查响应式约束
    const effectiveToMode = this.responsiveManager.getEffectiveMode(toMode);
    const currentBreakpoint = this.responsiveManager.getCurrentBreakpoint();
    
    if (effectiveToMode !== toMode) {
      console.log(`响应式约束: ${toMode} -> ${effectiveToMode} (${currentBreakpoint})`);
      toMode = effectiveToMode;
    }

    // 根据断点选择动画策略
    const animationStrategy = this.selectAnimationStrategy(currentBreakpoint);
    
    // 执行响应式动画
    await this.executeResponsiveAnimation(fromMode, toMode, container, animationStrategy);
  }

  /**
   * 根据断点选择动画策略
   */
  private selectAnimationStrategy(breakpoint: string): AnimationStrategy {
    if (this.isReducedMotion) {
      return 'instant';
    }

    switch (breakpoint) {
      case 'mobile':
        return 'slide'; // 移动端使用滑动动画
      case 'tablet':
        return 'fade'; // 平板端使用淡入淡出
      case 'desktop':
      case 'large':
        return 'morph'; // 桌面端使用变形动画
      default:
        return 'fade';
    }
  }

  /**
   * 执行响应式动画
   */
  private async executeResponsiveAnimation(
    fromMode: PageLayoutMode,
    toMode: PageLayoutMode,
    container: HTMLElement,
    strategy: AnimationStrategy
  ): Promise<void> {
    const columns = container.querySelectorAll('.column');
    
    switch (strategy) {
      case 'instant':
        await this.instantTransition(container, toMode);
        break;
      case 'slide':
        await this.slideTransition(columns, fromMode, toMode);
        break;
      case 'fade':
        await this.fadeTransition(columns, fromMode, toMode);
        break;
      case 'morph':
        await this.morphTransition(columns, fromMode, toMode);
        break;
    }
  }

  /**
   * 即时转换（无动画）
   */
  private async instantTransition(container: HTMLElement, toMode: PageLayoutMode): Promise<void> {
    const columnCount = this.getColumnCount(toMode);
    container.className = `column-layout-${columnCount}`;
  }

  /**
   * 滑动转换动画
   */
  private async slideTransition(
    columns: NodeListOf<Element>,
    fromMode: PageLayoutMode,
    toMode: PageLayoutMode
  ): Promise<void> {
    const fromColumns = this.getColumnCount(fromMode);
    const toColumns = this.getColumnCount(toMode);
    
    if (fromColumns > toColumns) {
      // 减少列数：向左滑动
      await this.animateColumns(columns, 'slideLeft', 300);
    } else {
      // 增加列数：向右滑动
      await this.animateColumns(columns, 'slideRight', 300);
    }
  }

  /**
   * 淡入淡出转换动画
   */
  private async fadeTransition(
    columns: NodeListOf<Element>,
    fromMode: PageLayoutMode,
    toMode: PageLayoutMode
  ): Promise<void> {
    // 淡出
    await this.animateColumns(columns, 'fadeOut', 200);
    
    // 更新布局
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 淡入
    await this.animateColumns(columns, 'fadeIn', 200);
  }

  /**
   * 变形转换动画
   */
  private async morphTransition(
    columns: NodeListOf<Element>,
    fromMode: PageLayoutMode,
    toMode: PageLayoutMode
  ): Promise<void> {
    const fromColumns = this.getColumnCount(fromMode);
    const toColumns = this.getColumnCount(toMode);
    
    // 使用FLIP技术实现平滑变形
    const flipData = this.captureFlipData(columns);
    
    // 应用新布局
    this.applyNewLayout(toMode);
    
    // 执行FLIP动画
    await this.executeFlipAnimation(columns, flipData, 400);
  }

  /**
   * 智能列宽调整动画
   */
  async animateColumnResize(
    columnIndex: number,
    newWidth: number,
    container: HTMLElement,
    contentAnalysis?: any
  ): Promise<void> {
    const column = container.querySelector(`[data-column-index="${columnIndex}"]`) as HTMLElement;
    if (!column) return;

    // 检查响应式约束
    const currentBreakpoint = this.responsiveManager.getCurrentBreakpoint();
    const maxColumns = this.responsiveManager.getMaxColumnsForWidth(window.innerWidth);
    
    // 根据断点调整动画参数
    const animationParams = this.getResizeAnimationParams(currentBreakpoint);
    
    // 应用内容感知的约束
    if (contentAnalysis) {
      const recommendation = this.breakpointDetector.generateAdaptiveLayoutRecommendation(
        contentAnalysis,
        container.getBoundingClientRect().width,
        'single'
      );
      
      if (recommendation.confidence > 0.8) {
        // 如果内容分析置信度高，使用推荐的列宽
        newWidth = recommendation.columnWidths[columnIndex] || newWidth;
      }
    }

    // 执行调整动画
    await this.executeResizeAnimation(column, newWidth, animationParams);
  }

  /**
   * 获取调整动画参数
   */
  private getResizeAnimationParams(breakpoint: string): ResizeAnimationParams {
    const baseParams = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      showGuide: true
    };

    switch (breakpoint) {
      case 'mobile':
        return {
          ...baseParams,
          duration: 200, // 移动端更快的动画
          showGuide: false // 移动端不显示引导线
        };
      case 'tablet':
        return {
          ...baseParams,
          duration: 250
        };
      default:
        return baseParams;
    }
  }

  /**
   * 执行调整动画
   */
  private async executeResizeAnimation(
    column: HTMLElement,
    newWidth: number,
    params: ResizeAnimationParams
  ): Promise<void> {
    if (this.isReducedMotion) {
      // 减弱动画：直接应用
      column.style.width = `${newWidth}%`;
      return;
    }

    // 创建引导线
    let guideLine: HTMLElement | null = null;
    if (params.showGuide) {
      guideLine = this.createGuideLine();
    }

    try {
      // 执行宽度动画
      await column.animate([
        { width: column.style.width || 'auto' },
        { width: `${newWidth}%` }
      ], {
        duration: params.duration,
        easing: params.easing,
        fill: 'forwards'
      }).finished;

    } finally {
      // 清理引导线
      if (guideLine) {
        guideLine.remove();
      }
    }
  }

  /**
   * 块移动的响应式动画
   */
  async animateBlockMovement(
    block: HTMLElement,
    fromColumn: number,
    toColumn: number,
    container: HTMLElement
  ): Promise<void> {
    const currentBreakpoint = this.responsiveManager.getCurrentBreakpoint();
    
    // 根据断点选择移动动画
    switch (currentBreakpoint) {
      case 'mobile':
        // 移动端：简单的淡入淡出
        await this.animateMobileDrop(block, toColumn);
        break;
      case 'tablet':
        // 平板：弧形移动
        await this.animateArcMovement(block, fromColumn, toColumn);
        break;
      default:
        // 桌面：复杂的物理动画
        await this.animatePhysicsMovement(block, fromColumn, toColumn, container);
        break;
    }
  }

  /**
   * 移动端拖放动画
   */
  private async animateMobileDrop(block: HTMLElement, toColumn: number): Promise<void> {
    if (this.isReducedMotion) return;

    await block.animate([
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0.5, transform: 'scale(0.95)' },
      { opacity: 1, transform: 'scale(1)' }
    ], {
      duration: 200,
      easing: 'ease-out'
    }).finished;
  }

  /**
   * 弧形移动动画
   */
  private async animateArcMovement(
    block: HTMLElement,
    fromColumn: number,
    toColumn: number
  ): Promise<void> {
    if (this.isReducedMotion) return;

    const startRect = block.getBoundingClientRect();
    const targetColumn = document.querySelector(`[data-column-index="${toColumn}"]`);
    const endRect = targetColumn?.getBoundingClientRect();
    
    if (!endRect) return;

    const deltaX = endRect.left - startRect.left;
    const deltaY = endRect.top - startRect.top;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 创建控制点（弧形路径）
    const controlX = startRect.left + deltaX * 0.5;
    const controlY = startRect.top - Math.min(100, distance * 0.3);
    
    await block.animate([
      { transform: `translate(0, 0)`, offset: 0 },
      { transform: `translate(${controlX - startRect.left}px, ${controlY - startRect.top}px)`, offset: 0.5 },
      { transform: `translate(${deltaX}px, ${deltaY}px)`, offset: 1 }
    ], {
      duration: 600,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).finished;
  }

  /**
   * 物理感知移动动画
   */
  private async animatePhysicsMovement(
    block: HTMLElement,
    fromColumn: number,
    toColumn: number,
    container: HTMLElement
  ): Promise<void> {
    // 实现更复杂的物理动画，考虑重力、弹性等
    // 这里简化为弹性动画
    await block.animate([
      { transform: 'translate(0, 0) scale(1)', offset: 0 },
      { transform: 'translate(50%, -20px) scale(1.05)', offset: 0.3 },
      { transform: 'translate(100%, 0) scale(0.95)', offset: 0.8 },
      { transform: 'translate(100%, 0) scale(1)', offset: 1 }
    ], {
      duration: 800,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }).finished;
  }

  /**
   * 工具方法
   */
  private animateColumns(columns: NodeListOf<Element>, animation: string, duration: number): Promise<void> {
    const animations = Array.from(columns).map(column => {
      return (column as HTMLElement).animate(
        this.getAnimationKeyframes(animation),
        { duration, easing: 'ease-out' }
      ).finished;
    });
    
    return Promise.all(animations).then(() => {});
  }

  private getAnimationKeyframes(animation: string): Keyframe[] {
    switch (animation) {
      case 'fadeOut':
        return [{ opacity: 1 }, { opacity: 0 }];
      case 'fadeIn':
        return [{ opacity: 0 }, { opacity: 1 }];
      case 'slideLeft':
        return [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }];
      case 'slideRight':
        return [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }];
      default:
        return [{ opacity: 1 }, { opacity: 1 }];
    }
  }

  private getColumnCount(mode: PageLayoutMode): number {
    const counts = {
      'normal': 1,
      '2-column': 2,
      '3-column': 3,
      '4-column': 4,
      '5-column': 5
    };
    return counts[mode] || 1;
  }

  private captureFlipData(columns: NodeListOf<Element>): FlipData[] {
    return Array.from(columns).map(column => ({
      element: column as HTMLElement,
      bounds: column.getBoundingClientRect()
    }));
  }

  private applyNewLayout(mode: PageLayoutMode): void {
    // 应用新的CSS类或样式
    const container = document.querySelector('.column-layout-container');
    if (container) {
      const columnCount = this.getColumnCount(mode);
      container.className = `column-layout-container column-layout-${columnCount}`;
    }
  }

  private async executeFlipAnimation(
    columns: NodeListOf<Element>,
    flipData: FlipData[],
    duration: number
  ): Promise<void> {
    const animations = Array.from(columns).map((column, index) => {
      const oldBounds = flipData[index]?.bounds;
      const newBounds = column.getBoundingClientRect();
      
      if (!oldBounds) return Promise.resolve();
      
      const deltaX = oldBounds.left - newBounds.left;
      const deltaY = oldBounds.top - newBounds.top;
      const deltaWidth = oldBounds.width / newBounds.width;
      const deltaHeight = oldBounds.height / newBounds.height;
      
      return (column as HTMLElement).animate([
        { 
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaWidth}, ${deltaHeight})` 
        },
        { 
          transform: 'translate(0, 0) scale(1, 1)' 
        }
      ], {
        duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }).finished;
    });
    
    await Promise.all(animations);
  }

  private createGuideLine(): HTMLElement {
    const line = document.createElement('div');
    line.style.cssText = `
      position: fixed;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--yunke-primary-color);
      opacity: 0.8;
      z-index: 1000;
      pointer-events: none;
    `;
    document.body.appendChild(line);
    return line;
  }
}

// 类型定义
type AnimationStrategy = 'instant' | 'slide' | 'fade' | 'morph';

interface ResizeAnimationParams {
  duration: number;
  easing: string;
  showGuide: boolean;
}

interface FlipData {
  element: HTMLElement;
  bounds: DOMRect;
}

/**
 * 响应式动画工具函数
 */
export const ResponsiveAnimationUtils = {
  /**
   * 创建响应式感知的动画管理器
   */
  createManager(): ResponsiveAwareAnimationManager {
    return new ResponsiveAwareAnimationManager();
  },

  /**
   * 检查是否应该减弱动画
   */
  shouldReduceMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * 根据断点获取推荐的动画时长
   */
  getRecommendedDuration(breakpoint: string, baseMs: number): number {
    const multipliers = {
      'mobile': 0.8,
      'tablet': 0.9,
      'desktop': 1.0,
      'large': 1.1
    };
    
    return baseMs * (multipliers[breakpoint as keyof typeof multipliers] || 1.0);
  },

  /**
   * 创建响应式动画配置
   */
  createResponsiveConfig(breakpoint: string): any {
    return {
      duration: this.getRecommendedDuration(breakpoint, 300),
      easing: breakpoint === 'mobile' ? 'ease-out' : 'cubic-bezier(0.4, 0, 0.2, 1)',
      reduceMotion: this.shouldReduceMotion()
    };
  }
};