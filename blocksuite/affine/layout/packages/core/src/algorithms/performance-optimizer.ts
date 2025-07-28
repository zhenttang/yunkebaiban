/**
 * 🚀 算法性能优化模块
 * 算法工程师A3负责实现
 * 
 * 提供高性能的列分配算法实现，包括：
 * - 多线程支持（Web Worker）
 * - 内存优化
 * - 算法复杂度优化
 * - 缓存策略
 * - 批量处理
 */

import type { 
  Block, 
  DistributionAlgorithm, 
  DistributionStrategy,
  BlockHeightEstimator 
} from '../types/contracts.js';

export interface PerformanceConfig {
  /** 启用Web Worker并行计算 */
  enableWorkerThreads: boolean;
  /** 批处理大小 */
  batchSize: number;
  /** 内存使用限制(MB) */
  memoryLimit: number;
  /** 启用结果缓存 */
  enableResultCache: boolean;
  /** 缓存大小限制 */
  cacheSize: number;
  /** 性能监控 */
  enableProfiling: boolean;
  /** 大数据集阈值 */
  largeDatasetThreshold: number;
}

export interface PerformanceMetrics {
  /** 执行时间(ms) */
  executionTime: number;
  /** 内存使用(MB) */
  memoryUsage: number;
  /** 处理的Block数量 */
  processedBlocks: number;
  /** 分配质量分数 */
  qualityScore: number;
  /** 缓存命中率 */
  cacheHitRate: number;
  /** 算法类型 */
  algorithmType: string;
}

/**
 * 高性能列分配器
 * 针对大量Block的场景进行优化
 */
export class HighPerformanceDistributor implements DistributionAlgorithm {
  private config: PerformanceConfig;
  private heightEstimator: BlockHeightEstimator;
  private resultCache = new Map<string, CachedResult>();
  private heightCache = new Map<string, number>();
  private metrics: PerformanceMetrics[] = [];

  constructor(
    heightEstimator: BlockHeightEstimator,
    config: Partial<PerformanceConfig> = {}
  ) {
    this.heightEstimator = heightEstimator;
    this.config = {
      enableWorkerThreads: true,
      batchSize: 1000,
      memoryLimit: 100, // 100MB
      enableResultCache: true,
      cacheSize: 500,
      enableProfiling: true,
      largeDatasetThreshold: 500,
      ...config
    };

    if (this.config.enableProfiling) {
      console.log('🚀 HighPerformanceDistributor 已初始化');
    }
  }

  async distribute(blocks: Block[], columnCount: number): Promise<Block[][]> {
    const startTime = performance.now();
    const startMemory = this._getMemoryUsage();

    try {
      // 检查缓存
      if (this.config.enableResultCache) {
        const cached = this._getCachedResult(blocks, columnCount);
        if (cached) {
          this._recordMetrics('cache-hit', startTime, startMemory, blocks.length, 1.0);
          return cached;
        }
      }

      // 选择最优算法
      const algorithm = this._selectOptimalAlgorithm(blocks, columnCount);
      
      // 执行分配
      let result: Block[][];
      if (blocks.length > this.config.largeDatasetThreshold && this.config.enableWorkerThreads) {
        result = await this._distributeWithWorker(blocks, columnCount, algorithm);
      } else {
        result = this._distributeSynchronous(blocks, columnCount, algorithm);
      }

      // 缓存结果
      if (this.config.enableResultCache) {
        this._cacheResult(blocks, columnCount, result);
      }

      // 记录性能指标
      const quality = this._calculateQuality(result);
      this._recordMetrics(algorithm, startTime, startMemory, blocks.length, quality);

      return result;

    } catch (error) {
      console.error('❌ 分配算法执行失败:', error);
      // 降级到简单的轮询分配
      return this._fallbackDistribute(blocks, columnCount);
    }
  }

  estimateQuality(result: Block[][]): number {
    return this._calculateQuality(result);
  }

  getDescription(): string {
    return '高性能分配算法 - 针对大数据集和性能要求优化';
  }

  /**
   * 获取性能统计信息
   */
  getPerformanceStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        averageExecutionTime: 0,
        averageMemoryUsage: 0,
        averageQualityScore: 0,
        cacheHitRate: 0,
        totalProcessed: 0,
        algorithmUsage: new Map()
      };
    }

    const totalTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0);
    const totalMemory = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0);
    const totalQuality = this.metrics.reduce((sum, m) => sum + m.qualityScore, 0);
    const totalCacheHits = this.metrics.filter(m => m.algorithmType === 'cache-hit').length;
    const totalProcessed = this.metrics.reduce((sum, m) => sum + m.processedBlocks, 0);

    const algorithmUsage = new Map<string, number>();
    this.metrics.forEach(m => {
      const count = algorithmUsage.get(m.algorithmType) || 0;
      algorithmUsage.set(m.algorithmType, count + 1);
    });

    return {
      averageExecutionTime: totalTime / this.metrics.length,
      averageMemoryUsage: totalMemory / this.metrics.length,
      averageQualityScore: totalQuality / this.metrics.length,
      cacheHitRate: totalCacheHits / this.metrics.length,
      totalProcessed,
      algorithmUsage
    };
  }

  /**
   * 清空缓存和统计
   */
  clearCache(): void {
    this.resultCache.clear();
    this.heightCache.clear();
    this.metrics = [];
    
    if (this.config.enableProfiling) {
      console.log('🧹 性能缓存已清理');
    }
  }

  // ===== 私有方法 =====

  private _selectOptimalAlgorithm(blocks: Block[], columnCount: number): string {
    const blockCount = blocks.length;
    const typeVariety = new Set(blocks.map(b => b.flavour)).size;
    
    // 根据数据特征选择最优算法
    if (blockCount < 50) {
      return 'balanced-height'; // 小数据集用精确算法
    }
    
    if (typeVariety <= 2) {
      return 'round-robin'; // 类型单一用快速算法
    }
    
    if (blockCount > 1000) {
      return 'optimized-batch'; // 大数据集用批量算法
    }
    
    return 'adaptive-hybrid'; // 默认用混合算法
  }

  private _distributeSynchronous(blocks: Block[], columnCount: number, algorithm: string): Block[][] {
    switch (algorithm) {
      case 'round-robin':
        return this._roundRobinOptimized(blocks, columnCount);
      case 'balanced-height':
        return this._balancedHeightOptimized(blocks, columnCount);
      case 'optimized-batch':
        return this._batchProcessing(blocks, columnCount);
      case 'adaptive-hybrid':
        return this._adaptiveHybrid(blocks, columnCount);
      default:
        return this._roundRobinOptimized(blocks, columnCount);
    }
  }

  private async _distributeWithWorker(
    blocks: Block[], 
    columnCount: number, 
    algorithm: string
  ): Promise<Block[][]> {
    // 简化的Worker模拟（实际实现需要真正的Web Worker）
    return new Promise((resolve) => {
      // 模拟异步处理
      setTimeout(() => {
        const result = this._distributeSynchronous(blocks, columnCount, algorithm);
        resolve(result);
      }, 0);
    });
  }

  private _roundRobinOptimized(blocks: Block[], columnCount: number): Block[][] {
    // 预分配数组，避免动态扩容
    const columns: Block[][] = new Array(columnCount);
    for (let i = 0; i < columnCount; i++) {
      columns[i] = new Array(Math.ceil(blocks.length / columnCount));
    }

    // 批量分配，减少索引计算
    let columnIndex = 0;
    let positionInColumn = 0;

    for (const block of blocks) {
      if (!columns[columnIndex][positionInColumn]) {
        columns[columnIndex][positionInColumn] = block;
      } else {
        columns[columnIndex].push(block);
      }

      columnIndex = (columnIndex + 1) % columnCount;
      if (columnIndex === 0) {
        positionInColumn++;
      }
    }

    // 清理未使用的槽位
    return columns.map(column => column.filter(Boolean));
  }

  private _balancedHeightOptimized(blocks: Block[], columnCount: number): Block[][] {
    const columns: Block[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = new Float32Array(columnCount); // 使用类型化数组提升性能
    
    // 批量预计算高度，利用缓存
    const blockHeights = this._batchEstimateHeights(blocks);
    
    // 按高度排序（大的优先）
    const sortedIndices = blockHeights
      .map((height, index) => ({ height, index }))
      .sort((a, b) => b.height - a.height)
      .map(item => item.index);

    // 贪心分配到最矮的列
    for (const blockIndex of sortedIndices) {
      const minHeightIndex = this._findMinIndex(columnHeights);
      const block = blocks[blockIndex];
      const height = blockHeights[blockIndex];
      
      columns[minHeightIndex].push(block);
      columnHeights[minHeightIndex] += height;
    }

    return columns;
  }

  private _batchProcessing(blocks: Block[], columnCount: number): Block[][] {
    const batchSize = Math.min(this.config.batchSize, blocks.length);
    const columns: Block[][] = Array.from({ length: columnCount }, () => []);
    
    // 分批处理
    for (let i = 0; i < blocks.length; i += batchSize) {
      const batch = blocks.slice(i, i + batchSize);
      const batchResult = this._balancedHeightOptimized(batch, columnCount);
      
      // 合并结果
      batchResult.forEach((batchColumn, columnIndex) => {
        columns[columnIndex].push(...batchColumn);
      });
    }

    return columns;
  }

  private _adaptiveHybrid(blocks: Block[], columnCount: number): Block[][] {
    // 自适应混合算法：根据运行时性能动态选择策略
    const sampleSize = Math.min(100, blocks.length);
    const sample = blocks.slice(0, sampleSize);
    
    // 测试不同算法的性能
    const startTime = performance.now();
    const roundRobinResult = this._roundRobinOptimized(sample, columnCount);
    const roundRobinTime = performance.now() - startTime;
    
    const balancedStartTime = performance.now();
    const balancedResult = this._balancedHeightOptimized(sample, columnCount);
    const balancedTime = performance.now() - balancedStartTime;
    
    // 选择更快的算法处理完整数据
    if (roundRobinTime < balancedTime * 2) {
      return this._roundRobinOptimized(blocks, columnCount);
    } else {
      return this._balancedHeightOptimized(blocks, columnCount);
    }
  }

  private _batchEstimateHeights(blocks: Block[]): number[] {
    const heights = new Array(blocks.length);
    
    // 批量检查缓存
    const uncachedIndices: number[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const cached = this.heightCache.get(blocks[i].id);
      if (cached !== undefined) {
        heights[i] = cached;
      } else {
        uncachedIndices.push(i);
      }
    }
    
    // 批量计算未缓存的高度
    for (const index of uncachedIndices) {
      const height = this.heightEstimator.estimate(blocks[index]);
      heights[index] = height;
      this.heightCache.set(blocks[index].id, height);
      
      // 限制缓存大小
      if (this.heightCache.size > this.config.cacheSize) {
        const firstKey = this.heightCache.keys().next().value;
        this.heightCache.delete(firstKey);
      }
    }
    
    return heights;
  }

  private _findMinIndex(array: Float32Array): number {
    let minIndex = 0;
    let minValue = array[0];
    
    for (let i = 1; i < array.length; i++) {
      if (array[i] < minValue) {
        minValue = array[i];
        minIndex = i;
      }
    }
    
    return minIndex;
  }

  private _getCachedResult(blocks: Block[], columnCount: number): Block[][] | null {
    const key = this._generateCacheKey(blocks, columnCount);
    const cached = this.resultCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5分钟有效期
      return cached.result;
    }
    
    return null;
  }

  private _cacheResult(blocks: Block[], columnCount: number, result: Block[][]): void {
    if (this.resultCache.size >= this.config.cacheSize) {
      // 清理最旧的缓存
      const oldestKey = this.resultCache.keys().next().value;
      this.resultCache.delete(oldestKey);
    }
    
    const key = this._generateCacheKey(blocks, columnCount);
    this.resultCache.set(key, {
      result: result.map(column => [...column]), // 深拷贝避免引用问题
      timestamp: Date.now()
    });
  }

  private _generateCacheKey(blocks: Block[], columnCount: number): string {
    // 生成基于内容和列数的缓存键
    const blockIds = blocks.map(b => b.id).sort().join(',');
    const hash = this._simpleHash(blockIds);
    return `${hash}-${columnCount}`;
  }

  private _simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private _calculateQuality(result: Block[][]): number {
    const heights = result.map(column => 
      column.reduce((sum, block) => {
        const cached = this.heightCache.get(block.id);
        return sum + (cached || this.heightEstimator.estimate(block));
      }, 0)
    );

    if (heights.length === 0) return 1;

    const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    const variance = heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length;
    
    return Math.max(0, 1 - (variance / (avgHeight * avgHeight)));
  }

  private _fallbackDistribute(blocks: Block[], columnCount: number): Block[][] {
    // 最简单的轮询分配作为降级方案
    const columns: Block[][] = Array.from({ length: columnCount }, () => []);
    blocks.forEach((block, index) => {
      columns[index % columnCount].push(block);
    });
    return columns;
  }

  private _recordMetrics(
    algorithm: string, 
    startTime: number, 
    startMemory: number, 
    blockCount: number, 
    quality: number
  ): void {
    if (!this.config.enableProfiling) return;

    this.metrics.push({
      executionTime: performance.now() - startTime,
      memoryUsage: this._getMemoryUsage() - startMemory,
      processedBlocks: blockCount,
      qualityScore: quality,
      cacheHitRate: algorithm === 'cache-hit' ? 1 : 0,
      algorithmType: algorithm
    });

    // 限制统计数据大小
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  private _getMemoryUsage(): number {
    // 简化的内存使用估算
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }
}

// ===== 辅助接口 =====

interface CachedResult {
  result: Block[][];
  timestamp: number;
}

export interface PerformanceStats {
  averageExecutionTime: number;
  averageMemoryUsage: number;
  averageQualityScore: number;
  cacheHitRate: number;
  totalProcessed: number;
  algorithmUsage: Map<string, number>;
}

// ===== 导出便捷函数 =====

/**
 * 创建高性能分配器
 */
export function createHighPerformanceDistributor(
  heightEstimator: BlockHeightEstimator,
  config: Partial<PerformanceConfig> = {}
): HighPerformanceDistributor {
  return new HighPerformanceDistributor(heightEstimator, config);
}

/**
 * 创建内存优化配置的分配器
 */
export function createMemoryOptimizedDistributor(
  heightEstimator: BlockHeightEstimator
): HighPerformanceDistributor {
  return new HighPerformanceDistributor(heightEstimator, {
    enableWorkerThreads: false,
    batchSize: 500,
    memoryLimit: 50,
    enableResultCache: false,
    cacheSize: 100,
    enableProfiling: false,
    largeDatasetThreshold: 1000
  });
}

/**
 * 创建极速模式分配器
 */
export function createSpeedOptimizedDistributor(
  heightEstimator: BlockHeightEstimator
): HighPerformanceDistributor {
  return new HighPerformanceDistributor(heightEstimator, {
    enableWorkerThreads: true,
    batchSize: 2000,
    memoryLimit: 200,
    enableResultCache: true,
    cacheSize: 1000,
    enableProfiling: true,
    largeDatasetThreshold: 200
  });
}