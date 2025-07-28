/**
 * 布局渲染器服务
 * 负责将Block内容渲染到多列布局中
 */

import { html, TemplateResult } from 'lit';
import { 
  PageLayoutMode, 
  Block, 
  IColumnDistributor,
  LayoutModeConfigMap 
} from '../types/component-contracts.js';

/**
 * 布局渲染配置
 */
export interface LayoutRenderConfig {
  /** 列间距 */
  columnGap?: string;
  /** 最大宽度 */
  maxWidth?: string;
  /** 是否启用响应式 */
  responsive?: boolean;
  /** 自定义CSS类名 */
  className?: string;
}

/**
 * 布局渲染器实现
 */
export class LayoutRenderer {
  private columnDistributor?: IColumnDistributor;
  
  constructor() {
    this.initializeDistributor();
  }
  
  /**
   * 渲染多列布局
   */
  async renderLayout(
    mode: PageLayoutMode,
    blocks: Block[],
    container: HTMLElement,
    config: LayoutRenderConfig = {}
  ): Promise<void> {
    const columnCount = LayoutModeConfigMap[mode].columns;
    
    // 分配Block到各列
    const columnBlocks = this.distributeBlocksToColumns(blocks, columnCount);
    
    // 应用布局样式
    this.applyLayoutStyles(container, mode, config);
    
    // 创建列容器
    const columnElements = this.createColumnElements(columnBlocks, config);
    
    // 清空容器并添加列
    container.innerHTML = '';
    columnElements.forEach(columnElement => {
      container.appendChild(columnElement);
    });
    
    console.log(`✅ LayoutRenderer: 已渲染 ${columnCount} 列布局，包含 ${blocks.length} 个Block`);
  }
  
  /**
   * 创建响应式布局容器
   */
  createResponsiveContainer(
    mode: PageLayoutMode,
    config: LayoutRenderConfig = {}
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = `column-layout-container ${config.className || ''}`;
    
    this.applyLayoutStyles(container, mode, config);
    
    return container;
  }
  
  /**
   * 更新现有布局
   */
  async updateLayout(
    container: HTMLElement,
    newMode: PageLayoutMode,
    blocks: Block[],
    config: LayoutRenderConfig = {}
  ): Promise<void> {
    // 添加过渡动画类
    container.classList.add('layout-transitioning');
    
    try {
      await this.renderLayout(newMode, blocks, container, config);
      
      // 移除过渡类
      setTimeout(() => {
        container.classList.remove('layout-transitioning');
      }, 300);
      
    } catch (error) {
      console.error('Layout update failed:', error);
      container.classList.remove('layout-transitioning');
      throw error;
    }
  }
  
  /**
   * 获取布局质量评估
   */
  evaluateLayoutQuality(columnBlocks: Block[][]): number {
    if (!columnBlocks.length) return 0;
    
    // 计算列高度平衡度
    const columnHeights = columnBlocks.map(blocks => 
      blocks.reduce((total, block) => total + this.estimateBlockHeight(block), 0)
    );
    
    const avgHeight = columnHeights.reduce((sum, h) => sum + h, 0) / columnHeights.length;
    const variance = columnHeights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / columnHeights.length;
    
    // 平衡度分数 (0-1)
    const balanceScore = avgHeight > 0 ? Math.max(0, 1 - (variance / (avgHeight * avgHeight))) : 1;
    
    return balanceScore;
  }
  
  // ============= 私有方法 =============
  
  /**
   * 初始化分配器
   */
  private async initializeDistributor(): Promise<void> {
    try {
      const { MockColumnDistributor } = await import('@blocksuite/affine-layout-testing/mocks/core-services');
      this.columnDistributor = new MockColumnDistributor();
      console.log('✅ LayoutRenderer: 已连接到MockColumnDistributor');
    } catch (error) {
      console.warn('⚠️ 无法加载分配器，使用简单实现:', error);
      
      // 简单的分配实现
      this.columnDistributor = {
        distributeBlocks: (blocks: Block[], columnCount: number): Block[][] => {
          const columns: Block[][] = Array.from({ length: columnCount }, () => []);
          blocks.forEach((block, index) => {
            columns[index % columnCount].push(block);
          });
          return columns;
        },
        redistributeOnModeChange: (currentColumns: Block[][], newColumnCount: number): Block[][] => {
          const allBlocks = currentColumns.flat();
          return this.columnDistributor!.distributeBlocks(allBlocks, newColumnCount);
        },
        moveBlock: () => [],
        evaluateDistribution: () => 0.8
      };
    }
  }
  
  /**
   * 分配Block到列
   */
  private distributeBlocksToColumns(blocks: Block[], columnCount: number): Block[][] {
    if (!this.columnDistributor) {
      // 简单的轮询分配
      const columns: Block[][] = Array.from({ length: columnCount }, () => []);
      blocks.forEach((block, index) => {
        columns[index % columnCount].push(block);
      });
      return columns;
    }
    
    return this.columnDistributor.distributeBlocks(blocks, columnCount);
  }
  
  /**
   * 应用布局样式
   */
  private applyLayoutStyles(
    container: HTMLElement,
    mode: PageLayoutMode,
    config: LayoutRenderConfig
  ): void {
    const columnCount = LayoutModeConfigMap[mode].columns;
    
    // 设置CSS Grid
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${columnCount}, 1fr)`;
    container.style.gap = config.columnGap || '24px';
    container.style.maxWidth = config.maxWidth || '1200px';
    container.style.margin = '0 auto';
    container.style.width = '100%';
    
    // 添加布局类名
    container.className = `column-layout-container column-layout-${columnCount} ${config.className || ''}`;
    
    // 响应式处理
    if (config.responsive !== false) {
      this.applyResponsiveStyles(container, columnCount);
    }
  }
  
  /**
   * 应用响应式样式
   */
  private applyResponsiveStyles(container: HTMLElement, columnCount: number): void {
    // 移动端降级为单列
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleResponsive = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        // 移动端：单列布局
        container.style.gridTemplateColumns = '1fr';
        container.style.gap = '16px';
      } else {
        // 桌面端：恢复多列
        container.style.gridTemplateColumns = `repeat(${columnCount}, 1fr)`;
        container.style.gap = '24px';
      }
    };
    
    // 初始检查
    handleResponsive(mediaQuery);
    
    // 监听变化
    mediaQuery.addEventListener('change', handleResponsive);
  }
  
  /**
   * 创建列元素
   */
  private createColumnElements(
    columnBlocks: Block[][],
    config: LayoutRenderConfig
  ): HTMLElement[] {
    return columnBlocks.map((blocks, index) => {
      const columnElement = document.createElement('column-content');
      
      // 设置属性
      columnElement.setAttribute('column-index', index.toString());
      columnElement.setAttribute('data-column', index.toString());
      
      // 设置Block数据 (简化实现)
      (columnElement as any).blocks = blocks;
      
      return columnElement;
    });
  }
  
  /**
   * 估算Block高度
   */
  private estimateBlockHeight(block: Block): number {
    // 简单的高度估算
    switch (block.flavour) {
      case 'affine:paragraph':
        return 60 + (block.text?.length || 0) * 0.5;
      case 'affine:heading':
        return 80;
      case 'affine:image':
        return 200;
      case 'affine:code':
        const lines = (block.text?.split('\n').length || 1);
        return 40 + lines * 20;
      case 'affine:list':
        return 40 + (block.children?.length || 0) * 30;
      default:
        return 100;
    }
  }
  
  /**
   * 清理资源
   */
  cleanup(): void {
    this.columnDistributor = undefined;
  }
}