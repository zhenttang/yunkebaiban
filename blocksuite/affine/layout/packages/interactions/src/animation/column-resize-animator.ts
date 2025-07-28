/**
 * 列宽调整动画实现
 * 负责处理列宽度变化时的平滑动画效果
 */

import { DURATION, ANIMATION_PRESETS } from '../types/animation-types';
import { AdvancedEffectsManager } from './advanced-effects';

/**
 * 列调整配置
 */
interface ColumnResizeConfig {
  duration: number;
  easing: string;
  showGuides: boolean;
  snapThreshold: number;
  minWidth: number;
  maxWidth: number;
}

/**
 * 列宽调整动画器
 */
export class ColumnResizeAnimator {
  private activeResizes = new Map<number, Animation>();
  private resizeGuides: HTMLElement[] = [];
  private effectsManager: AdvancedEffectsManager;
  
  private defaultConfig: ColumnResizeConfig = {
    duration: DURATION.normal,
    easing: ANIMATION_PRESETS.normal.easing,
    showGuides: true,
    snapThreshold: 10,
    minWidth: 100,
    maxWidth: 800
  };
  
  constructor() {
    this.effectsManager = new AdvancedEffectsManager();
  }
  
  /**
   * 执行列宽调整动画
   */
  async executeResize(
    columnIndex: number,
    currentWidth: number,
    targetWidth: number,
    config?: Partial<ColumnResizeConfig>
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // 取消之前的调整动画
    if (this.activeResizes.has(columnIndex)) {
      this.activeResizes.get(columnIndex)?.cancel();
    }
    
    try {
      // 验证目标宽度
      const clampedWidth = this.clampWidth(targetWidth, finalConfig);
      
      // 显示调整指导线
      if (finalConfig.showGuides) {
        this.showResizeGuides(columnIndex, clampedWidth);
      }
      
      // 执行宽度调整动画
      await this.animateColumnWidth(columnIndex, currentWidth, clampedWidth, finalConfig);
      
      // 添加完成效果
      await this.showResizeCompletedEffect(columnIndex);
      
    } catch (error) {
      console.error('Column resize animation failed:', error);
      throw error;
    } finally {
      this.activeResizes.delete(columnIndex);
      this.hideResizeGuides();
    }
  }
  
  /**
   * 限制宽度在有效范围内
   */
  private clampWidth(width: number, config: ColumnResizeConfig): number {
    return Math.max(config.minWidth, Math.min(config.maxWidth, width));
  }
  
  /**
   * 执行列宽动画
   */
  private async animateColumnWidth(
    columnIndex: number,
    fromWidth: number,
    toWidth: number,
    config: ColumnResizeConfig
  ): Promise<void> {
    const column = document.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
    
    if (!column) {
      throw new Error(`Column ${columnIndex} not found`);
    }
    
    // 创建宽度变化动画
    const animation = this.createWidthAnimation(column, fromWidth, toWidth, config);
    this.activeResizes.set(columnIndex, animation);
    
    // 同时调整相邻列
    await Promise.all([
      animation.finished,
      this.adjustAdjacentColumns(columnIndex, fromWidth, toWidth, config)
    ]);
  }
  
  /**
   * 创建宽度动画
   */
  private createWidthAnimation(
    column: HTMLElement,
    fromWidth: number,
    toWidth: number,
    config: ColumnResizeConfig
  ): Animation {
    // 设置CSS自定义属性来控制宽度
    column.style.setProperty('--column-width', `${fromWidth}px`);
    
    const keyframes = [
      {
        width: `${fromWidth}px`,
        transform: 'scaleX(1)',
        filter: 'brightness(1)'
      },
      {
        width: `${toWidth}px`,
        transform: 'scaleX(1)',
        filter: 'brightness(1.05)'
      }
    ];
    
    return column.animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      fill: 'forwards'
    });
  }
  
  /**
   * 调整相邻列
   */
  private async adjustAdjacentColumns(
    targetColumnIndex: number,
    fromWidth: number,
    toWidth: number,
    config: ColumnResizeConfig
  ): Promise<void> {
    const widthDelta = toWidth - fromWidth;
    const adjacentColumns = this.getAdjacentColumns(targetColumnIndex);
    
    if (adjacentColumns.length === 0) return;
    
    // 平均分配宽度变化到相邻列
    const adjustmentPerColumn = -widthDelta / adjacentColumns.length;
    
    const adjustmentPromises = adjacentColumns.map(async (columnData, index) => {
      const { element, currentWidth } = columnData;
      const newWidth = this.clampWidth(currentWidth + adjustmentPerColumn, config);
      
      // 错开调整时间，创建波浪效果
      await this.delay(index * 50);
      
      const keyframes = [
        {
          width: `${currentWidth}px`,
          transform: 'scaleX(1)',
          opacity: 1
        },
        {
          width: `${newWidth}px`,
          transform: 'scaleX(1)',
          opacity: 0.95
        },
        {
          width: `${newWidth}px`,
          transform: 'scaleX(1)',
          opacity: 1
        }
      ];
      
      const animation = element.animate(keyframes, {
        duration: config.duration * 0.8,
        easing: config.easing,
        fill: 'forwards'
      });
      
      return animation.finished;
    });
    
    await Promise.all(adjustmentPromises);
  }
  
  /**
   * 获取相邻列
   */
  private getAdjacentColumns(targetIndex: number): Array<{element: HTMLElement, currentWidth: number}> {
    const columns: Array<{element: HTMLElement, currentWidth: number}> = [];
    
    // 查找左右相邻的列
    for (const adjacentIndex of [targetIndex - 1, targetIndex + 1]) {
      const column = document.querySelector(`[data-column="${adjacentIndex}"]`) as HTMLElement;
      if (column) {
        const currentWidth = column.getBoundingClientRect().width;
        columns.push({ element: column, currentWidth });
      }
    }
    
    return columns;
  }
  
  /**
   * 显示调整指导线
   */
  private showResizeGuides(columnIndex: number, targetWidth: number): void {
    this.hideResizeGuides();
    
    const column = document.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
    if (!column) return;
    
    const rect = column.getBoundingClientRect();
    
    // 创建左右边界指导线
    const leftGuide = this.createGuide(rect.left, 'left');
    const rightGuide = this.createGuide(rect.left + targetWidth, 'right');
    
    this.resizeGuides.push(leftGuide, rightGuide);
    
    // 添加入场动画
    [leftGuide, rightGuide].forEach((guide, index) => {
      setTimeout(() => {
        guide.animate([
          { opacity: 0, transform: 'scaleY(0)' },
          { opacity: 1, transform: 'scaleY(1)' }
        ], {
          duration: 200,
          easing: 'ease-out',
          fill: 'forwards'
        });
      }, index * 50);
    });
  }
  
  /**
   * 创建指导线
   */
  private createGuide(x: number, side: 'left' | 'right'): HTMLElement {
    const guide = document.createElement('div');
    guide.style.cssText = `
      position: fixed;
      top: 0;
      left: ${x}px;
      width: 2px;
      height: 100vh;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(59, 130, 246, 0.8) 20%,
        rgba(59, 130, 246, 0.8) 80%,
        transparent 100%
      );
      z-index: 10000;
      pointer-events: none;
      transform-origin: top center;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
    `;
    
    // 添加侧边标识
    const label = document.createElement('div');
    label.textContent = side === 'left' ? '◀' : '▶';
    label.style.cssText = `
      position: absolute;
      top: 50%;
      ${side}: 5px;
      color: rgba(59, 130, 246, 0.9);
      font-size: 12px;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.9);
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: bold;
    `;
    
    guide.appendChild(label);
    document.body.appendChild(guide);
    
    return guide;
  }
  
  /**
   * 隐藏调整指导线
   */
  private hideResizeGuides(): void {
    this.resizeGuides.forEach(guide => {
      guide.animate([
        { opacity: 1, transform: 'scaleY(1)' },
        { opacity: 0, transform: 'scaleY(0)' }
      ], {
        duration: 150,
        easing: 'ease-in',
        fill: 'forwards'
      }).addEventListener('finish', () => {
        guide.remove();
      });
    });
    
    this.resizeGuides = [];
  }
  
  /**
   * 显示调整完成效果
   */
  private async showResizeCompletedEffect(columnIndex: number): Promise<void> {
    const column = document.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
    if (!column) return;
    
    // 添加粒子效果
    await this.effectsManager.createLayoutTransitionEffect(column, 'transform');
    
    // 添加边框闪烁效果
    const originalBorder = column.style.border;
    
    const flashAnimation = column.animate([
      { borderColor: 'transparent' },
      { borderColor: 'rgba(59, 130, 246, 0.8)' },
      { borderColor: 'transparent' }
    ], {
      duration: 300,
      easing: 'ease-in-out',
      iterations: 2
    });
    
    await flashAnimation.finished;
    column.style.border = originalBorder;
  }
  
  /**
   * 创建实时调整预览
   */
  createLiveResizePreview(
    columnIndex: number,
    onResize: (width: number) => void
  ): {
    startPreview: () => void;
    updatePreview: (width: number) => void;
    endPreview: () => void;
  } {
    const column = document.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
    let previewOverlay: HTMLElement | null = null;
    
    return {
      startPreview: () => {
        if (!column) return;
        
        // 创建预览覆盖层
        previewOverlay = document.createElement('div');
        previewOverlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 2px dashed rgba(59, 130, 246, 0.5);
          background: rgba(59, 130, 246, 0.05);
          pointer-events: none;
          z-index: 100;
          transition: all 0.1s ease-out;
        `;
        
        column.style.position = 'relative';
        column.appendChild(previewOverlay);
        
        // 显示调整指导线
        this.showResizeGuides(columnIndex, column.getBoundingClientRect().width);
      },
      
      updatePreview: (width: number) => {
        if (!previewOverlay || !column) return;
        
        const clampedWidth = this.clampWidth(width, this.defaultConfig);
        onResize(clampedWidth);
        
        // 更新预览大小
        previewOverlay.style.width = `${clampedWidth}px`;
        
        // 更新指导线位置
        this.hideResizeGuides();
        this.showResizeGuides(columnIndex, clampedWidth);
      },
      
      endPreview: () => {
        if (previewOverlay) {
          previewOverlay.animate([
            { opacity: 1 },
            { opacity: 0 }
          ], {
            duration: 200,
            easing: 'ease-out'
          }).addEventListener('finish', () => {
            previewOverlay?.remove();
          });
        }
        
        this.hideResizeGuides();
      }
    };
  }
  
  /**
   * 智能宽度建议
   */
  suggestOptimalWidth(
    columnIndex: number,
    contentWidth: number
  ): {
    suggested: number;
    reason: string;
  } {
    const column = document.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
    if (!column) {
      return { suggested: this.defaultConfig.minWidth, reason: 'Column not found' };
    }
    
    const containerWidth = column.parentElement?.getBoundingClientRect().width || 1000;
    const totalColumns = column.parentElement?.children.length || 1;
    const averageWidth = containerWidth / totalColumns;
    
    // 基于内容宽度和平均宽度计算建议值
    let suggested = Math.max(contentWidth + 40, this.defaultConfig.minWidth); // 40px padding
    let reason = 'Based on content width';
    
    // 如果建议宽度远大于平均宽度，适当调整
    if (suggested > averageWidth * 1.5) {
      suggested = averageWidth * 1.2;
      reason = 'Balanced with other columns';
    }
    
    // 确保在有效范围内
    suggested = this.clampWidth(suggested, this.defaultConfig);
    
    return { suggested, reason };
  }
  
  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 取消指定列的调整动画
   */
  public cancelResize(columnIndex: number): void {
    const animation = this.activeResizes.get(columnIndex);
    if (animation) {
      animation.cancel();
      this.activeResizes.delete(columnIndex);
    }
    this.hideResizeGuides();
  }
  
  /**
   * 取消所有调整动画
   */
  public cancelAllResizes(): void {
    for (const [index, animation] of this.activeResizes) {
      animation.cancel();
    }
    this.activeResizes.clear();
    this.hideResizeGuides();
  }
  
  /**
   * 检查是否有调整动画正在进行
   */
  public hasActiveResizes(): boolean {
    return this.activeResizes.size > 0;
  }
  
  /**
   * 清理资源
   */
  public cleanup(): void {
    this.cancelAllResizes();
    this.effectsManager.cleanup();
  }
}