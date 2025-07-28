/**
 * 🎭 开发者C1动画系统集成指南
 * 
 * 动画系统与核心服务集成
 * 开发者A1 + C2协助提供
 */

import { PageLayoutMode, type LayoutModeChangeEvent } from '@blocksuite/affine-layout-core/types';
import { createMockServices } from '@blocksuite/affine-layout-testing/mocks';

/**
 * 🎯 布局切换动画管理器
 */
export class LayoutTransitionAnimator {
  private services = createMockServices();
  private currentAnimation: Animation | null = null;

  /**
   * 执行布局模式切换动画
   */
  async animateLayoutModeChange(
    fromMode: PageLayoutMode, 
    toMode: PageLayoutMode,
    container: HTMLElement
  ): Promise<void> {
    console.log(`🎬 动画: ${fromMode} -> ${toMode}`);

    // 取消当前动画
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
    }

    // 获取列数变化
    const fromColumns = this.getColumnCount(fromMode);
    const toColumns = this.getColumnCount(toMode);

    // 选择动画类型
    if (fromColumns === toColumns) {
      await this.animateColumnResize(container, fromMode, toMode);
    } else if (fromColumns < toColumns) {
      await this.animateColumnSplit(container, fromColumns, toColumns);
    } else {
      await this.animateColumnMerge(container, fromColumns, toColumns);
    }
  }

  /**
   * 列分割动画 (1列 -> 多列)
   */
  private async animateColumnSplit(
    container: HTMLElement, 
    fromCols: number, 
    toCols: number
  ): Promise<void> {
    console.log(`📐 分割动画: ${fromCols} -> ${toCols}列`);

    // 设置新的网格模板
    const gridTemplate = this.getGridTemplate(toCols);
    
    // 创建动画
    this.currentAnimation = container.animate([
      { 
        gridTemplateColumns: this.getGridTemplate(fromCols),
        opacity: 1
      },
      { 
        gridTemplateColumns: gridTemplate,
        opacity: 0.8
      },
      { 
        gridTemplateColumns: gridTemplate,
        opacity: 1
      }
    ], {
      duration: 600,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      fill: 'forwards'
    });

    await this.currentAnimation.finished;
  }

  /**
   * 列合并动画 (多列 -> 少列)
   */
  private async animateColumnMerge(
    container: HTMLElement,
    fromCols: number,
    toCols: number
  ): Promise<void> {
    console.log(`🔗 合并动画: ${fromCols} -> ${toCols}列`);

    // 先添加合并指示器
    this.addMergeIndicators(container, fromCols, toCols);

    // 执行合并动画
    this.currentAnimation = container.animate([
      {
        gridTemplateColumns: this.getGridTemplate(fromCols),
        transform: 'scale(1)'
      },
      {
        gridTemplateColumns: this.getGridTemplate(fromCols),
        transform: 'scale(0.95)'
      },
      {
        gridTemplateColumns: this.getGridTemplate(toCols),
        transform: 'scale(1)'
      }
    ], {
      duration: 500,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });

    await this.currentAnimation.finished;
    this.removeMergeIndicators(container);
  }

  /**
   * 列宽调整动画
   */
  private async animateColumnResize(
    container: HTMLElement,
    fromMode: PageLayoutMode,
    toMode: PageLayoutMode
  ): Promise<void> {
    console.log(`📏 调整动画: ${fromMode} -> ${toMode}`);

    const fromTemplate = this.getGridTemplate(this.getColumnCount(fromMode));
    const toTemplate = this.getGridTemplate(this.getColumnCount(toMode));

    this.currentAnimation = container.animate([
      { gridTemplateColumns: fromTemplate },
      { gridTemplateColumns: toTemplate }
    ], {
      duration: 400,
      easing: 'ease-in-out',
      fill: 'forwards'
    });

    await this.currentAnimation.finished;
  }

  /**
   * Block移动动画
   */
  async animateBlockMove(
    blockElement: HTMLElement,
    fromColumn: number,
    toColumn: number,
    fromIndex: number,
    toIndex: number
  ): Promise<void> {
    console.log(`🎯 Block移动动画: 列${fromColumn} -> 列${toColumn}`);

    // 计算移动路径
    const fromRect = blockElement.getBoundingClientRect();
    const toContainer = this.getColumnElement(toColumn);
    const toRect = toContainer.getBoundingClientRect();

    const deltaX = toRect.left - fromRect.left;
    const deltaY = toRect.top - fromRect.top + (toIndex * 100); // 估算位置

    // 执行移动动画
    this.currentAnimation = blockElement.animate([
      { 
        transform: 'translate(0, 0) scale(1)',
        zIndex: '1'
      },
      { 
        transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.5}px) scale(1.05)`,
        zIndex: '1000'
      },
      { 
        transform: `translate(${deltaX}px, ${deltaY}px) scale(1)`,
        zIndex: '1'
      }
    ], {
      duration: 500,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      fill: 'forwards'
    });

    await this.currentAnimation.finished;
  }

  /**
   * 工具方法
   */
  private getColumnCount(mode: PageLayoutMode): number {
    const counts = {
      [PageLayoutMode.Normal]: 1,
      [PageLayoutMode.TwoColumn]: 2,
      [PageLayoutMode.ThreeColumn]: 3,
      [PageLayoutMode.FourColumn]: 4,
      [PageLayoutMode.FiveColumn]: 5
    };
    return counts[mode];
  }

  private getGridTemplate(columns: number): string {
    if (columns === 1) return '1fr';
    if (columns === 2) return '3fr 2fr';
    if (columns === 3) return '2fr 1fr 1fr';
    return `repeat(${columns}, 1fr)`;
  }

  private addMergeIndicators(container: HTMLElement, fromCols: number, toCols: number): void {
    // 添加合并指示器的视觉效果
    container.style.position = 'relative';
    
    // 这里可以添加指示器元素
    const indicator = document.createElement('div');
    indicator.className = 'merge-indicator';
    indicator.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      background: linear-gradient(90deg, 
        rgba(59, 130, 246, 0.1) 0%, 
        rgba(59, 130, 246, 0.05) 50%, 
        rgba(59, 130, 246, 0.1) 100%
      );
      z-index: 10;
    `;
    
    container.appendChild(indicator);
  }

  private removeMergeIndicators(container: HTMLElement): void {
    const indicators = container.querySelectorAll('.merge-indicator');
    indicators.forEach(indicator => indicator.remove());
  }

  private getColumnElement(columnIndex: number): HTMLElement {
    // 实际实现中需要根据具体的DOM结构来获取列元素
    return document.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
  }
}

/**
 * 🎯 响应式动画管理器 (与C2系统集成)
 */
export class ResponsiveAnimationManager {
  private layoutAnimator = new LayoutTransitionAnimator();
  private breakpointObserver: ResizeObserver | null = null;

  /**
   * 初始化响应式动画监听
   */
  initializeResponsiveAnimations(container: HTMLElement): void {
    console.log('📱 初始化响应式动画系统');

    this.breakpointObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.handleResponsiveChange(entry.contentRect.width, container);
      }
    });

    this.breakpointObserver.observe(container);
  }

  /**
   * 处理响应式变化
   */
  private async handleResponsiveChange(width: number, container: HTMLElement): Promise<void> {
    const newMode = this.getResponsiveMode(width);
    const currentMode = this.getCurrentMode(container);

    if (newMode !== currentMode) {
      console.log(`📱 响应式切换: ${currentMode} -> ${newMode} (宽度: ${width}px)`);
      
      await this.layoutAnimator.animateLayoutModeChange(
        currentMode,
        newMode,
        container
      );

      // 更新模式标记
      container.setAttribute('data-layout-mode', newMode);
    }
  }

  private getResponsiveMode(width: number): PageLayoutMode {
    if (width < 480) return PageLayoutMode.Normal;
    if (width < 768) return PageLayoutMode.TwoColumn;
    if (width < 1024) return PageLayoutMode.ThreeColumn;
    if (width < 1440) return PageLayoutMode.FourColumn;
    return PageLayoutMode.FiveColumn;
  }

  private getCurrentMode(container: HTMLElement): PageLayoutMode {
    return container.getAttribute('data-layout-mode') as PageLayoutMode || PageLayoutMode.Normal;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.breakpointObserver) {
      this.breakpointObserver.disconnect();
      this.breakpointObserver = null;
    }
  }
}

/**
 * 🎯 动画配置系统
 */
export class AnimationConfig {
  static readonly PRESETS = {
    // 快速切换
    fast: {
      duration: 200,
      easing: 'ease-out'
    },
    
    // 标准切换
    normal: {
      duration: 400,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    },
    
    // 平滑切换
    smooth: {
      duration: 600,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    },
    
    // 弹性效果
    elastic: {
      duration: 500,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  };

  /**
   * 获取动画配置
   */
  static getConfig(preset: keyof typeof AnimationConfig.PRESETS) {
    return this.PRESETS[preset];
  }
}

/**
 * 🚀 C1立即可用的动画工具
 */
export const C1_ANIMATION_TOOLS = {
  layoutAnimator: new LayoutTransitionAnimator(),
  responsiveAnimator: new ResponsiveAnimationManager(),
  config: AnimationConfig,
  mockServices: createMockServices(),
  
  // 快速启动函数
  async quickDemo(container: HTMLElement) {
    console.log('🎬 动画系统演示');
    
    const animator = new LayoutTransitionAnimator();
    
    // 演示不同的布局切换
    await animator.animateLayoutModeChange(
      PageLayoutMode.Normal,
      PageLayoutMode.TwoColumn,
      container
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await animator.animateLayoutModeChange(
      PageLayoutMode.TwoColumn,
      PageLayoutMode.ThreeColumn,
      container
    );
    
    console.log('✅ 动画演示完成');
  }
};

console.log('🎭 开发者C1动画工具包已就绪:', Object.keys(C1_ANIMATION_TOOLS));