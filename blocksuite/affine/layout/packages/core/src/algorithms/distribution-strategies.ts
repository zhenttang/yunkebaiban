/**
 * 🎯 多种列分配策略实现
 * 算法工程师A3负责实现
 * 
 * 为不同场景和用户偏好提供多样化的Block分配策略
 */

import type { 
  Block, 
  DistributionAlgorithm, 
  BlockHeightEstimator,
  DistributionStrategy 
} from '../types/contracts.js';

// ===== 轮询分配策略 =====

/**
 * Round Robin 分配策略
 * 按顺序依次分配Block到各列，确保数量平衡
 */
export class RoundRobinDistributor implements DistributionAlgorithm {
  distribute(blocks: Block[], columnCount: number): Block[][] {
    const columns: Block[][] = Array.from({ length: columnCount }, () => []);
    
    blocks.forEach((block, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(block);
    });
    
    return columns;
  }

  estimateQuality(result: Block[][]): number {
    if (result.length === 0) return 1;
    
    const counts = result.map(col => col.length);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    
    // 数量差异越小，质量越高
    return max === 0 ? 1 : (min / max);
  }

  getDescription(): string {
    return '轮询分配策略 - 按顺序依次分配，保证各列Block数量平衡';
  }
}

// ===== 内容感知分配策略 =====

/**
 * Content Aware 分配策略
 * 根据Block内容类型和特征进行智能分配
 */
export class ContentAwareDistributor implements DistributionAlgorithm {
  private heightEstimator: BlockHeightEstimator;

  constructor(heightEstimator: BlockHeightEstimator) {
    this.heightEstimator = heightEstimator;
  }

  distribute(blocks: Block[], columnCount: number): Block[][] {
    // 根据内容类型对Block进行分组和排序
    const categorizedBlocks = this._categorizeBlocks(blocks);
    const optimizedOrder = this._optimizeBlockOrder(categorizedBlocks);
    
    // 使用增强的高度平衡算法分配
    return this._distributeWithContentAwareness(optimizedOrder, columnCount);
  }

  estimateQuality(result: Block[][]): number {
    // 综合考虑高度平衡、内容类型分布和视觉连贯性
    const heightScore = this._calculateHeightBalance(result);
    const contentScore = this._calculateContentBalance(result);
    const coherenceScore = this._calculateVisualCoherence(result);
    
    // 加权平均
    return (heightScore * 0.4 + contentScore * 0.3 + coherenceScore * 0.3);
  }

  getDescription(): string {
    return '内容感知分配策略 - 根据Block类型和内容特征进行智能分配';
  }

  private _categorizeBlocks(blocks: Block[]): CategorizedBlocks {
    const categories: CategorizedBlocks = {
      text: [],
      media: [],
      interactive: [],
      structural: []
    };

    blocks.forEach(block => {
      switch (block.flavour) {
        case 'affine:paragraph':
        case 'affine:heading':
          categories.text.push(block);
          break;
        case 'affine:image':
        case 'affine:video':
          categories.media.push(block);
          break;
        case 'affine:database':
        case 'affine:code':
          categories.interactive.push(block);
          break;
        case 'affine:list':
        case 'affine:callout':
          categories.structural.push(block);
          break;
        default:
          categories.text.push(block); // 默认归类为文本
      }
    });

    return categories;
  }

  private _optimizeBlockOrder(categories: CategorizedBlocks): Block[] {
    // 交替混合不同类型的内容，避免单一类型集中
    const result: Block[] = [];
    const queues = [
      categories.text,
      categories.media,
      categories.interactive,
      categories.structural
    ].filter(queue => queue.length > 0);

    while (queues.some(queue => queue.length > 0)) {
      for (const queue of queues) {
        if (queue.length > 0) {
          result.push(queue.shift()!);
        }
      }
    }

    return result;
  }

  private _distributeWithContentAwareness(blocks: Block[], columnCount: number): Block[][] {
    const columns: Block[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights: number[] = Array(columnCount).fill(0);
    const columnContentScores: number[] = Array(columnCount).fill(0);

    for (const block of blocks) {
      const bestColumnIndex = this._findBestColumn(
        block, 
        columns, 
        columnHeights, 
        columnContentScores
      );

      columns[bestColumnIndex].push(block);
      columnHeights[bestColumnIndex] += this.heightEstimator.estimate(block);
      columnContentScores[bestColumnIndex] += this._getContentScore(block);
    }

    return columns;
  }

  private _findBestColumn(
    block: Block,
    columns: Block[][],
    heights: number[],
    contentScores: number[]
  ): number {
    let bestIndex = 0;
    let bestScore = -Infinity;

    const blockHeight = this.heightEstimator.estimate(block);
    const blockContentScore = this._getContentScore(block);

    for (let i = 0; i < columns.length; i++) {
      // 计算加入此Block后的效果
      const newHeight = heights[i] + blockHeight;
      const newContentScore = contentScores[i] + blockContentScore;

      // 高度平衡分数（高度越低越好）
      const heightScore = 1 / (1 + newHeight / 1000); // 归一化
      
      // 内容多样性分数
      const diversityScore = this._calculateDiversityScore(columns[i], block);
      
      // 综合分数
      const totalScore = heightScore * 0.6 + diversityScore * 0.4;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  private _getContentScore(block: Block): number {
    // 为不同类型的内容分配权重
    switch (block.flavour) {
      case 'affine:heading': return 10;
      case 'affine:image': return 8;
      case 'affine:database': return 7;
      case 'affine:code': return 6;
      case 'affine:callout': return 5;
      case 'affine:list': return 4;
      case 'affine:paragraph': return 2;
      default: return 1;
    }
  }

  private _calculateDiversityScore(column: Block[], newBlock: Block): number {
    if (column.length === 0) return 1;

    // 计算列中已有类型的分布
    const typeCount = new Map<string, number>();
    column.forEach(block => {
      const count = typeCount.get(block.flavour) || 0;
      typeCount.set(block.flavour, count + 1);
    });

    const existingCount = typeCount.get(newBlock.flavour) || 0;
    const totalBlocks = column.length + 1;
    
    // 如果这种类型已经很多，多样性分数较低
    return 1 - (existingCount / totalBlocks);
  }

  private _calculateHeightBalance(result: Block[][]): number {
    const heights = result.map(column => 
      column.reduce((sum, block) => sum + this.heightEstimator.estimate(block), 0)
    );

    if (heights.length === 0) return 1;

    const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    const variance = heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length;
    
    return Math.max(0, 1 - (variance / (avgHeight * avgHeight)));
  }

  private _calculateContentBalance(result: Block[][]): number {
    // 检查内容类型在各列间的分布平衡
    const typeDistribution = new Map<string, number[]>();
    
    result.forEach((column, columnIndex) => {
      column.forEach(block => {
        if (!typeDistribution.has(block.flavour)) {
          typeDistribution.set(block.flavour, Array(result.length).fill(0));
        }
        typeDistribution.get(block.flavour)![columnIndex]++;
      });
    });

    let totalBalance = 0;
    let typeCount = 0;

    for (const distribution of typeDistribution.values()) {
      const max = Math.max(...distribution);
      const min = Math.min(...distribution);
      const balance = max === 0 ? 1 : (min / max);
      totalBalance += balance;
      typeCount++;
    }

    return typeCount === 0 ? 1 : (totalBalance / typeCount);
  }

  private _calculateVisualCoherence(result: Block[][]): number {
    // 评估视觉连贯性（相关内容应该接近）
    let coherenceScore = 0;
    let totalPairs = 0;

    result.forEach(column => {
      for (let i = 0; i < column.length - 1; i++) {
        const currentBlock = column[i];
        const nextBlock = column[i + 1];
        
        const similarity = this._calculateBlockSimilarity(currentBlock, nextBlock);
        coherenceScore += similarity;
        totalPairs++;
      }
    });

    return totalPairs === 0 ? 1 : (coherenceScore / totalPairs);
  }

  private _calculateBlockSimilarity(block1: Block, block2: Block): number {
    // 简单的相似度计算
    if (block1.flavour === block2.flavour) {
      return 0.8; // 同类型Block相似度高
    }

    // 检查语义相关性
    const textTypes = ['affine:paragraph', 'affine:heading', 'affine:list'];
    const mediaTypes = ['affine:image', 'affine:video'];
    
    if (textTypes.includes(block1.flavour) && textTypes.includes(block2.flavour)) {
      return 0.6;
    }
    
    if (mediaTypes.includes(block1.flavour) && mediaTypes.includes(block2.flavour)) {
      return 0.6;
    }

    return 0.2; // 默认低相似度
  }
}

// ===== 自定义分配策略 =====

/**
 * Custom 分配策略
 * 允许用户定义自己的分配逻辑
 */
export class CustomDistributor implements DistributionAlgorithm {
  private customLogic: CustomDistributionLogic;

  constructor(customLogic: CustomDistributionLogic) {
    this.customLogic = customLogic;
  }

  distribute(blocks: Block[], columnCount: number): Block[][] {
    return this.customLogic.distribute(blocks, columnCount);
  }

  estimateQuality(result: Block[][]): number {
    return this.customLogic.estimateQuality ? 
      this.customLogic.estimateQuality(result) : 0.5;
  }

  getDescription(): string {
    return this.customLogic.description || '自定义分配策略';
  }
}

// ===== 策略工厂 =====

/**
 * 分配策略工厂
 * 提供统一的策略创建接口
 */
export class DistributionStrategyFactory {
  private heightEstimator: BlockHeightEstimator;

  constructor(heightEstimator: BlockHeightEstimator) {
    this.heightEstimator = heightEstimator;
  }

  /**
   * 创建指定类型的分配策略
   */
  createStrategy(strategyType: DistributionStrategy): DistributionAlgorithm {
    switch (strategyType) {
      case 'round-robin':
        return new RoundRobinDistributor();
      
      case 'content-aware':
        return new ContentAwareDistributor(this.heightEstimator);
      
      case 'balanced-height':
        // 使用之前实现的HeightBalancedDistributor
        const { HeightBalancedDistributor } = require('./height-balanced-distributor.js');
        return new HeightBalancedDistributor(this.heightEstimator);
      
      default:
        throw new Error(`未支持的分配策略: ${strategyType}`);
    }
  }

  /**
   * 获取所有可用策略的信息
   */
  getAvailableStrategies(): StrategyInfo[] {
    return [
      {
        name: 'round-robin',
        displayName: '轮询分配',
        description: '按顺序依次分配，保证数量平衡',
        bestFor: ['简单布局', '快速分配', '内容类型单一'],
        performance: 'high'
      },
      {
        name: 'balanced-height',
        displayName: '平衡高度',
        description: '智能平衡各列高度，优化视觉效果',
        bestFor: ['混合内容', '视觉平衡', '阅读体验'],
        performance: 'medium'
      },
      {
        name: 'content-aware',
        displayName: '内容感知',
        description: '根据内容类型和特征智能分配',
        bestFor: ['复杂内容', '最佳体验', '多样化布局'],
        performance: 'low'
      }
    ];
  }

  /**
   * 根据内容特征推荐最佳策略
   */
  recommendStrategy(blocks: Block[]): StrategyRecommendation {
    const analysis = this._analyzeBlocks(blocks);
    
    if (analysis.complexity === 'low' && analysis.uniformity > 0.8) {
      return {
        recommended: 'round-robin',
        confidence: 0.9,
        reason: '内容简单且类型统一，轮询分配效率最高'
      };
    }
    
    if (analysis.heightVariation > 0.6) {
      return {
        recommended: 'balanced-height',
        confidence: 0.8,
        reason: '内容高度差异较大，需要高度平衡算法'
      };
    }
    
    if (analysis.complexity === 'high' && analysis.typeCount > 4) {
      return {
        recommended: 'content-aware',
        confidence: 0.85,
        reason: '内容复杂多样，建议使用内容感知分配'
      };
    }
    
    return {
      recommended: 'balanced-height',
      confidence: 0.7,
      reason: '综合考虑，平衡高度策略适合大多数场景'
    };
  }

  private _analyzeBlocks(blocks: Block[]): BlockAnalysis {
    const typeCount = new Set(blocks.map(b => b.flavour)).size;
    const heights = blocks.map(b => this.heightEstimator.estimate(b));
    
    const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    const heightVariation = Math.sqrt(
      heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length
    ) / avgHeight;
    
    const uniformity = 1 - (typeCount / blocks.length);
    
    const complexity = typeCount <= 2 ? 'low' : 
                      typeCount <= 4 ? 'medium' : 'high';

    return {
      typeCount,
      heightVariation,
      uniformity,
      complexity,
      totalBlocks: blocks.length
    };
  }
}

// ===== 辅助接口和类型 =====

interface CategorizedBlocks {
  text: Block[];
  media: Block[];
  interactive: Block[];
  structural: Block[];
}

export interface CustomDistributionLogic {
  distribute(blocks: Block[], columnCount: number): Block[][];
  estimateQuality?(result: Block[][]): number;
  description?: string;
}

export interface StrategyInfo {
  name: string;
  displayName: string;
  description: string;
  bestFor: string[];
  performance: 'high' | 'medium' | 'low';
}

export interface StrategyRecommendation {
  recommended: DistributionStrategy;
  confidence: number;
  reason: string;
}

interface BlockAnalysis {
  typeCount: number;
  heightVariation: number;
  uniformity: number;
  complexity: 'low' | 'medium' | 'high';
  totalBlocks: number;
}

// ===== 导出便捷函数 =====

/**
 * 创建策略工厂的便捷函数
 */
export function createStrategyFactory(heightEstimator: BlockHeightEstimator): DistributionStrategyFactory {
  return new DistributionStrategyFactory(heightEstimator);
}

/**
 * 创建自定义策略的便捷函数
 */
export function createCustomStrategy(logic: CustomDistributionLogic): CustomDistributor {
  return new CustomDistributor(logic);
}

/**
 * 批量创建所有策略
 */
export function createAllStrategies(heightEstimator: BlockHeightEstimator): Map<DistributionStrategy, DistributionAlgorithm> {
  const factory = new DistributionStrategyFactory(heightEstimator);
  const strategies = new Map<DistributionStrategy, DistributionAlgorithm>();
  
  const strategyTypes: DistributionStrategy[] = ['round-robin', 'balanced-height', 'content-aware'];
  
  strategyTypes.forEach(type => {
    strategies.set(type, factory.createStrategy(type));
  });
  
  return strategies;
}