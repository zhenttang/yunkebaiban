/**
 * 布局切换动画实现
 * 负责处理不同布局模式间的切换动画
 */

import { PageLayoutMode } from '../types/animation-contracts';
import { KEYFRAME_PRESETS, ANIMATION_PRESETS, DURATION } from '../types/animation-types';

/**
 * 布局转换动画器
 */
export class LayoutTransitionAnimator {
  private container: HTMLElement | null = null;
  private isTransitioning = false;
  
  constructor() {
    this.findLayoutContainer();
  }
  
  /**
   * 查找布局容器
   */
  private findLayoutContainer(): void {
    this.container = document.querySelector('.column-layout-container') as HTMLElement;
  }
  
  /**
   * 执行布局切换动画
   */
  async executeTransition(from: PageLayoutMode, to: PageLayoutMode): Promise<void> {
    if (this.isTransitioning) {
      throw new Error('Another layout transition is already in progress');
    }
    
    if (!this.container) {
      this.findLayoutContainer();
      if (!this.container) {
        throw new Error('Layout container not found');
      }
    }
    
    this.isTransitioning = true;
    
    try {
      // 根据转换类型选择动画策略
      const strategy = this.getTransitionStrategy(from, to);
      await this.executeTransitionStrategy(strategy, from, to);
    } finally {
      this.isTransitioning = false;
    }
  }
  
  /**
   * 获取转换策略
   */
  private getTransitionStrategy(from: PageLayoutMode, to: PageLayoutMode): TransitionStrategy {
    const fromColumns = this.getColumnCount(from);
    const toColumns = this.getColumnCount(to);
    
    if (fromColumns === toColumns) {
      return 'none'; // 相同布局，无需动画
    } else if (fromColumns < toColumns) {
      return 'expand'; // 列数增加
    } else {
      return 'collapse'; // 列数减少
    }
  }
  
  /**
   * 执行转换策略
   */
  private async executeTransitionStrategy(
    strategy: TransitionStrategy, 
    from: PageLayoutMode, 
    to: PageLayoutMode
  ): Promise<void> {
    switch (strategy) {
      case 'none':
        return; // 无需动画
        
      case 'expand':
        await this.executeExpandAnimation(from, to);
        break;
        
      case 'collapse':
        await this.executeCollapseAnimation(from, to);
        break;
    }
  }
  
  /**
   * 执行展开动画（列数增加）
   */
  private async executeExpandAnimation(from: PageLayoutMode, to: PageLayoutMode): Promise<void> {
    const fromColumns = this.getColumnCount(from);
    const toColumns = this.getColumnCount(to);
    
    // 1. 淡出当前布局
    await this.fadeOutCurrentLayout();
    
    // 2. 更新CSS Grid布局
    this.updateGridLayout(to);
    
    // 3. 预先隐藏新列
    const newColumns = this.getNewColumns(fromColumns, toColumns);
    this.hideColumns(newColumns);
    
    // 4. 淡入整体布局
    await this.fadeInLayout();
    
    // 5. 依次展示新列
    await this.staggerShowColumns(newColumns);
  }
  
  /**
   * 执行收缩动画（列数减少）
   */
  private async executeCollapseAnimation(from: PageLayoutMode, to: PageLayoutMode): Promise<void> {
    const fromColumns = this.getColumnCount(from);
    const toColumns = this.getColumnCount(to);
    
    // 1. 标识要移除的列
    const columnsToRemove = this.getColumnsToRemove(fromColumns, toColumns);
    
    // 2. 依次淡出要移除的列
    await this.staggerHideColumns(columnsToRemove);
    
    // 3. 淡出剩余布局
    await this.fadeOutCurrentLayout();
    
    // 4. 更新CSS Grid布局
    this.updateGridLayout(to);
    
    // 5. 淡入新布局
    await this.fadeInLayout();
  }
  
  /**
   * 淡出当前布局
   */
  private async fadeOutCurrentLayout(): Promise<void> {
    if (!this.container) return;
    
    const animation = this.container.animate([
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.98)' }
    ], {
      duration: DURATION.fast,
      easing: ANIMATION_PRESETS.fast.easing,
      fill: 'forwards'
    });
    
    await animation.finished;
  }
  
  /**
   * 淡入布局
   */
  private async fadeInLayout(): Promise<void> {
    if (!this.container) return;
    
    const animation = this.container.animate([
      { opacity: 0, transform: 'scale(0.98)' },
      { opacity: 1, transform: 'scale(1)' }
    ], {
      duration: DURATION.normal,
      easing: ANIMATION_PRESETS.normal.easing,
      fill: 'forwards'
    });
    
    await animation.finished;
  }
  
  /**
   * 更新CSS Grid布局
   */
  private updateGridLayout(mode: PageLayoutMode): void {
    if (!this.container) return;
    
    // 移除之前的布局类
    this.container.classList.remove(
      'column-layout-1', 
      'column-layout-2', 
      'column-layout-3', 
      'column-layout-4', 
      'column-layout-5'
    );
    
    // 添加新的布局类
    const columnCount = this.getColumnCount(mode);
    this.container.classList.add(`column-layout-${columnCount}`);
    
    // 强制重排
    void this.container.offsetHeight;
  }
  
  /**
   * 隐藏指定列
   */
  private hideColumns(columnIndices: number[]): void {
    columnIndices.forEach(index => {
      const column = document.querySelector(`[data-column="${index}"]`) as HTMLElement;
      if (column) {
        column.style.opacity = '0';
        column.style.transform = 'translateY(20px) scale(0.95)';
      }
    });
  }
  
  /**
   * 依次显示列
   */
  private async staggerShowColumns(columnIndices: number[]): Promise<void> {
    const staggerDelay = 100; // 每列间隔100ms
    
    const promises = columnIndices.map((index, i) => {
      return new Promise<void>(resolve => {
        setTimeout(async () => {
          const column = document.querySelector(`[data-column="${index}"]`) as HTMLElement;
          if (column) {
            const animation = column.animate([
              { opacity: 0, transform: 'translateY(20px) scale(0.95)' },
              { opacity: 1, transform: 'translateY(0) scale(1)' }
            ], {
              duration: DURATION.normal,
              easing: ANIMATION_PRESETS.normal.easing,
              fill: 'forwards'
            });
            
            await animation.finished;
          }
          resolve();
        }, i * staggerDelay);
      });
    });
    
    await Promise.all(promises);
  }
  
  /**
   * 依次隐藏列
   */
  private async staggerHideColumns(columnIndices: number[]): Promise<void> {
    const staggerDelay = 80; // 收缩时稍快一些
    
    const promises = columnIndices.map((index, i) => {
      return new Promise<void>(resolve => {
        setTimeout(async () => {
          const column = document.querySelector(`[data-column="${index}"]`) as HTMLElement;
          if (column) {
            const animation = column.animate([
              { opacity: 1, transform: 'translateY(0) scale(1)' },
              { opacity: 0, transform: 'translateY(-10px) scale(0.95)' }
            ], {
              duration: DURATION.fast,
              easing: ANIMATION_PRESETS.fast.easing,
              fill: 'forwards'
            });
            
            await animation.finished;
          }
          resolve();
        }, i * staggerDelay);
      });
    });
    
    await Promise.all(promises);
  }
  
  /**
   * 获取新增的列索引
   */
  private getNewColumns(fromCount: number, toCount: number): number[] {
    const newColumns: number[] = [];
    for (let i = fromCount; i < toCount; i++) {
      newColumns.push(i);
    }
    return newColumns;
  }
  
  /**
   * 获取要移除的列索引
   */
  private getColumnsToRemove(fromCount: number, toCount: number): number[] {
    const columnsToRemove: number[] = [];
    for (let i = toCount; i < fromCount; i++) {
      columnsToRemove.push(i);
    }
    return columnsToRemove;
  }
  
  /**
   * 获取列数
   */
  private getColumnCount(mode: PageLayoutMode): number {
    const modeToColumns = {
      [PageLayoutMode.Normal]: 1,
      [PageLayoutMode.TwoColumn]: 2,
      [PageLayoutMode.ThreeColumn]: 3,
      [PageLayoutMode.FourColumn]: 4,
      [PageLayoutMode.FiveColumn]: 5
    };
    
    return modeToColumns[mode];
  }
}

/**
 * 转换策略类型
 */
type TransitionStrategy = 'none' | 'expand' | 'collapse';

/**
 * 高级布局转换动画器
 * 提供更丰富的动画效果
 */
export class AdvancedLayoutTransitionAnimator extends LayoutTransitionAnimator {
  /**
   * 执行展开动画的高级版本
   */
  protected async executeExpandAnimation(from: PageLayoutMode, to: PageLayoutMode): Promise<void> {
    // 使用更复杂的动画序列
    
    // 1. 创建展开动画序列
    await this.createExpandSequence(from, to);
    
    // 2. 添加粒子效果（可选）
    if (this.shouldUseParticleEffects()) {
      await this.addExpandParticleEffect();
    }
    
    // 3. 执行内容重新排列动画
    await this.animateContentRearrangement(from, to);
  }
  
  /**
   * 创建展开序列
   */
  private async createExpandSequence(from: PageLayoutMode, to: PageLayoutMode): Promise<void> {
    // 使用更平滑的动画曲线和时间控制
    const container = this.container;
    if (!container) return;
    
    // 分步骤动画，而不是简单的淡入淡出
    
    // Step 1: 容器预备动画
    await container.animate([
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(1.02)', filter: 'brightness(1.1)' },
      { transform: 'scale(1)', filter: 'brightness(1)' }
    ], {
      duration: 200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }).finished;
    
    // Step 2: 更新布局
    this.updateGridLayout(to);
    
    // Step 3: 执行展开动画
    await this.executeColumnExpansion(from, to);
  }
  
  /**
   * 执行列展开
   */
  private async executeColumnExpansion(from: PageLayoutMode, to: PageLayoutMode): Promise<void> {
    const fromColumns = this.getColumnCount(from);
    const toColumns = this.getColumnCount(to);
    const newColumns = this.getNewColumns(fromColumns, toColumns);
    
    // 为新列添加入场动画
    const columnAnimations = newColumns.map((columnIndex, i) => {
      return new Promise<void>(resolve => {
        setTimeout(async () => {
          const column = document.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
          if (column) {
            // 从右侧滑入
            const animation = column.animate([
              { 
                opacity: 0, 
                transform: 'translateX(50px) rotateY(15deg) scale(0.9)',
                filter: 'blur(5px)'
              },
              { 
                opacity: 1, 
                transform: 'translateX(0) rotateY(0deg) scale(1)',
                filter: 'blur(0px)'
              }
            ], {
              duration: 400,
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // 弹性效果
              fill: 'forwards'
            });
            
            await animation.finished;
          }
          resolve();
        }, i * 120); // 错开时间
      });
    });
    
    await Promise.all(columnAnimations);
  }
  
  /**
   * 添加展开粒子效果
   */
  private async addExpandParticleEffect(): Promise<void> {
    // 创建简单的视觉反馈效果
    const container = this.container;
    if (!container) return;
    
    // 添加闪烁效果
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1000;
    `;
    
    container.appendChild(flash);
    
    // 闪烁动画
    await flash.animate([
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1.2)' },
      { opacity: 0, transform: 'scale(1.5)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    }).finished;
    
    flash.remove();
  }
  
  /**
   * 动画化内容重新排列
   */
  private async animateContentRearrangement(from: PageLayoutMode, to: PageLayoutMode): Promise<void> {
    // 为内容Block添加重新排列的动画
    const blocks = document.querySelectorAll('.block-item');
    
    blocks.forEach((block, index) => {
      const element = block as HTMLElement;
      
      // 添加微妙的入场动画
      setTimeout(() => {
        element.animate([
          { transform: 'translateY(5px)', opacity: 0.8 },
          { transform: 'translateY(0)', opacity: 1 }
        ], {
          duration: 200,
          easing: 'ease-out',
          fill: 'forwards'
        });
      }, index * 20);
    });
  }
  
  /**
   * 是否应该使用粒子效果
   */
  private shouldUseParticleEffects(): boolean {
    // 根据性能和用户偏好决定
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}