/**
 * 🎯 平衡高度分配算法 - 核心实现
 * 算法工程师A3负责实现
 * 
 * 此算法的目标是在多列布局中尽可能保持各列高度平衡，
 * 通过智能的Block分配策略来优化用户阅读体验
 */

import type { 
  Block, 
  DistributionAlgorithm,
  BlockHeightEstimator,
  DistributionAnalysis
} from '../types/contracts.js';

export interface BalancedDistributorConfig {
  /** 高度差异容忍度(px) - 小于此值认为高度平衡 */
  heightTolerance: number;
  /** 是否启用预排序优化 */
  enablePreSort: boolean;
  /** 最大优化迭代次数 */
  maxOptimizationPasses: number;
  /** 是否启用调试输出 */
  debugMode: boolean;
}

/**
 * 基于高度平衡的智能分配算法
 */
export class HeightBalancedDistributor implements DistributionAlgorithm {
  private heightEstimator: BlockHeightEstimator;
  private config: BalancedDistributorConfig;

  constructor(
    heightEstimator: BlockHeightEstimator, 
    config: Partial<BalancedDistributorConfig> = {}
  ) {
    this.heightEstimator = heightEstimator;
    this.config = {
      heightTolerance: 50,
      enablePreSort: true,
      maxOptimizationPasses: 3,
      debugMode: false,
      ...config
    };

    if (this.config.debugMode) {
      console.log('🎯 HeightBalancedDistributor 已初始化，配置:', this.config);
    }
  }

  /**
   * 执行平衡高度分配算法
   */
  distribute(blocks: Block[], columnCount: number): Block[][] {
    if (this.config.debugMode) {
      console.log(`🚀 开始平衡高度分配: ${blocks.length} 个Block -> ${columnCount} 列`);
    }

    // 边界情况处理
    if (columnCount <= 0) {
      throw new Error('列数必须大于0');
    }
    if (blocks.length === 0) {
      return Array.from({ length: columnCount }, () => []);
    }
    if (columnCount === 1) {
      return [blocks];
    }

    // 预估算每个Block的高度
    const blocksWithHeight = this._estimateBlockHeights(blocks);
    
    // 可选的预排序优化
    const sortedBlocks = this.config.enablePreSort 
      ? this._presortBlocks(blocksWithHeight)
      : blocksWithHeight;

    // 执行初始分配
    let columns = this._performInitialDistribution(sortedBlocks, columnCount);

    // 执行优化passes
    for (let pass = 0; pass < this.config.maxOptimizationPasses; pass++) {
      const improved = this._optimizeDistribution(columns);
      if (!improved) {
        if (this.config.debugMode) {
          console.log(`📊 优化在第 ${pass + 1} 轮收敛`);
        }
        break;
      }
    }

    if (this.config.debugMode) {
      const heights = this._calculateColumnHeights(columns);
      console.log(`✅ 分配完成，各列高度:`, heights);
    }

    // 移除临时的高度信息，返回原始Block结构
    return columns.map(column => column.map(item => item.block));
  }

  /**
   * 估算分配质量
   */
  estimateQuality(result: Block[][]): number {
    const heights = result.map(column => 
      column.reduce((sum, block) => sum + this.heightEstimator.estimate(block), 0)
    );

    if (heights.length === 0) return 1;

    const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    const variance = heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length;
    
    // 标准化质量分数: 方差越小，质量越高
    const maxVariance = avgHeight * avgHeight; // 最大可能方差
    const normalizedVariance = Math.min(variance / maxVariance, 1);
    
    return Math.max(0, 1 - normalizedVariance);
  }

  /**
   * 获取算法描述
   */
  getDescription(): string {
    return '平衡高度分配算法 - 通过智能优化保持各列高度平衡，提升阅读体验';
  }

  /**
   * 获取详细的分配分析
   */
  analyzeDistribution(result: Block[][]): DistributionAnalysis {
    const heights = result.map(column => 
      column.reduce((sum, block) => sum + this.heightEstimator.estimate(block), 0)
    );

    const totalBlocks = result.reduce((sum, col) => sum + col.length, 0);
    const averageBlocksPerColumn = totalBlocks / result.length;
    
    const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    const variance = heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length;
    const heightBalance = this.estimateQuality(result);

    // 统计Block类型分布
    const typeDistribution = new Map<string, number>();
    result.flat().forEach(block => {
      const count = typeDistribution.get(block.flavour) || 0;
      typeDistribution.set(block.flavour, count + 1);
    });

    // 生成建议
    const recommendations = this._generateOptimizationRecommendations(heights, result);

    return {
      totalBlocks,
      averageBlocksPerColumn,
      heightBalance,
      typeDistribution,
      recommendations
    };
  }

  // ===== 私有方法 =====

  private _estimateBlockHeights(blocks: Block[]): BlockWithHeight[] {
    return blocks.map(block => ({
      block,
      estimatedHeight: this.heightEstimator.estimate(block)
    }));
  }

  private _presortBlocks(blocksWithHeight: BlockWithHeight[]): BlockWithHeight[] {
    // 按估算高度降序排序（大的优先分配）
    return [...blocksWithHeight].sort((a, b) => b.estimatedHeight - a.estimatedHeight);
  }

  private _performInitialDistribution(
    blocksWithHeight: BlockWithHeight[], 
    columnCount: number
  ): ColumnWithHeight[] {
    const columns: ColumnWithHeight[] = Array.from({ length: columnCount }, () => ({
      blocks: [],
      totalHeight: 0
    }));

    // 贪心算法：每次选择当前高度最小的列
    for (const blockWithHeight of blocksWithHeight) {
      const targetColumn = this._findMinHeightColumn(columns);
      targetColumn.blocks.push(blockWithHeight);
      targetColumn.totalHeight += blockWithHeight.estimatedHeight;
    }

    return columns;
  }

  private _findMinHeightColumn(columns: ColumnWithHeight[]): ColumnWithHeight {
    return columns.reduce((minColumn, currentColumn) => 
      currentColumn.totalHeight < minColumn.totalHeight ? currentColumn : minColumn
    );
  }

  private _optimizeDistribution(columns: ColumnWithHeight[]): boolean {
    const heights = columns.map(col => col.totalHeight);
    const maxHeight = Math.max(...heights);
    const minHeight = Math.min(...heights);
    
    // 如果高度差异在容忍范围内，则不需要优化
    if (maxHeight - minHeight <= this.config.heightTolerance) {
      return false;
    }

    // 寻找最高列和最低列
    const maxHeightIndex = heights.indexOf(maxHeight);
    const minHeightIndex = heights.indexOf(minHeight);
    
    const maxColumn = columns[maxHeightIndex];
    const minColumn = columns[minHeightIndex];

    // 尝试从最高列移动一个Block到最低列
    const candidateBlock = this._findBestBlockToMove(maxColumn, minColumn);
    
    if (candidateBlock) {
      // 执行移动
      const blockIndex = maxColumn.blocks.indexOf(candidateBlock);
      maxColumn.blocks.splice(blockIndex, 1);
      maxColumn.totalHeight -= candidateBlock.estimatedHeight;
      
      minColumn.blocks.push(candidateBlock);
      minColumn.totalHeight += candidateBlock.estimatedHeight;

      if (this.config.debugMode) {
        console.log(`🔄 优化: 移动Block(${candidateBlock.estimatedHeight}px) 从列${maxHeightIndex} 到列${minHeightIndex}`);
      }
      
      return true;
    }

    return false;
  }

  private _findBestBlockToMove(
    fromColumn: ColumnWithHeight, 
    toColumn: ColumnWithHeight
  ): BlockWithHeight | null {
    if (fromColumn.blocks.length === 0) return null;

    const heightDiff = fromColumn.totalHeight - toColumn.totalHeight;
    
    // 寻找移动后能最大程度平衡高度的Block
    let bestBlock: BlockWithHeight | null = null;
    let bestScore = -Infinity;

    for (const block of fromColumn.blocks) {
      // 计算移动此Block后的高度差异改善
      const newFromHeight = fromColumn.totalHeight - block.estimatedHeight;
      const newToHeight = toColumn.totalHeight + block.estimatedHeight;
      const newHeightDiff = Math.abs(newFromHeight - newToHeight);
      
      // 分数越高越好 (原高度差异 - 新高度差异)
      const improvementScore = heightDiff - newHeightDiff;
      
      if (improvementScore > bestScore && improvementScore > 0) {
        bestScore = improvementScore;
        bestBlock = block;
      }
    }

    return bestBlock;
  }

  private _calculateColumnHeights(columns: ColumnWithHeight[]): number[] {
    return columns.map(col => col.totalHeight);
  }

  private _generateOptimizationRecommendations(
    heights: number[], 
    result: Block[][]
  ): string[] {
    const recommendations: string[] = [];
    
    const maxHeight = Math.max(...heights);
    const minHeight = Math.min(...heights);
    const heightDiff = maxHeight - minHeight;
    
    if (heightDiff > this.config.heightTolerance * 2) {
      recommendations.push(`高度不平衡较严重(${heightDiff.toFixed(0)}px差异)，建议启用更多优化轮次`);
    }
    
    // 检查空列
    const emptyColumns = result.filter(col => col.length === 0).length;
    if (emptyColumns > 0) {
      recommendations.push(`存在 ${emptyColumns} 个空列，建议减少列数或增加内容`);
    }
    
    // 检查Block分布不均
    const blockCounts = result.map(col => col.length);
    const maxBlocks = Math.max(...blockCounts);
    const minBlocks = Math.min(...blockCounts);
    if (maxBlocks - minBlocks > Math.ceil(result.length * 0.3)) {
      recommendations.push('Block数量分布不均，可能影响视觉平衡');
    }

    if (recommendations.length === 0) {
      recommendations.push('分配质量良好，各列高度平衡');
    }

    return recommendations;
  }
}

// ===== 辅助接口 =====

interface BlockWithHeight {
  block: Block;
  estimatedHeight: number;
}

interface ColumnWithHeight {
  blocks: BlockWithHeight[];
  totalHeight: number;
}

/**
 * 创建默认配置的平衡高度分配器
 */
export function createHeightBalancedDistributor(
  heightEstimator: BlockHeightEstimator,
  options: Partial<BalancedDistributorConfig> = {}
): HeightBalancedDistributor {
  return new HeightBalancedDistributor(heightEstimator, options);
}

/**
 * 创建高性能配置的分配器（适合大量Block）
 */
export function createHighPerformanceDistributor(
  heightEstimator: BlockHeightEstimator
): HeightBalancedDistributor {
  return new HeightBalancedDistributor(heightEstimator, {
    heightTolerance: 100,
    enablePreSort: true,
    maxOptimizationPasses: 1,
    debugMode: false
  });
}

/**
 * 创建高精度配置的分配器（适合精确布局）
 */
export function createHighPrecisionDistributor(
  heightEstimator: BlockHeightEstimator
): HeightBalancedDistributor {
  return new HeightBalancedDistributor(heightEstimator, {
    heightTolerance: 20,
    enablePreSort: true,
    maxOptimizationPasses: 5,
    debugMode: false
  });
}