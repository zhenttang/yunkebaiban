/**
 * 🎯 算法模块入口文件
 * 算法工程师A3负责实现
 * 
 * 统一导出所有算法组件，为其他开发者提供简洁的导入接口
 */

// ===== 核心算法导出 =====

export {
  HeightBalancedDistributor,
  createHeightBalancedDistributor,
  createHighPerformanceDistributor,
  createHighPrecisionDistributor,
  type BalancedDistributorConfig
} from './height-balanced-distributor.js';

export {
  SmartBlockHeightEstimator,
  createSmartHeightEstimator,
  createHighPerformanceEstimator,
  createLearningEstimator,
  type HeightEstimatorConfig,
  type EstimatorStats
} from './smart-height-estimator.js';

export {
  RoundRobinDistributor,
  ContentAwareDistributor,
  CustomDistributor,
  DistributionStrategyFactory,
  createStrategyFactory,
  createCustomStrategy,
  createAllStrategies,
  type CustomDistributionLogic,
  type StrategyInfo,
  type StrategyRecommendation
} from './distribution-strategies.js';

export {
  HighPerformanceDistributor,
  createHighPerformanceDistributor as createPerformanceDistributor,
  createMemoryOptimizedDistributor,
  createSpeedOptimizedDistributor,
  type PerformanceConfig,
  type PerformanceMetrics,
  type PerformanceStats
} from './performance-optimizer.js';

// ===== 便捷工厂函数 =====

import type { BlockHeightEstimator } from '../types/contracts.js';
import { SmartBlockHeightEstimator } from './smart-height-estimator.js';
import { DistributionStrategyFactory } from './distribution-strategies.js';
import { HighPerformanceDistributor } from './performance-optimizer.js';

/**
 * 创建完整的算法套件
 * 为开发者提供一站式的算法解决方案
 */
export function createAlgorithmSuite(config: AlgorithmSuiteConfig = {}): AlgorithmSuite {
  // 创建高度估算器
  const heightEstimator = new SmartBlockHeightEstimator({
    enableLearning: config.enableLearning ?? true,
    debugMode: config.debugMode ?? false,
    baseFontSize: config.baseFontSize ?? 14,
    ...config.estimatorConfig
  });

  // 创建策略工厂
  const strategyFactory = new DistributionStrategyFactory(heightEstimator);

  // 创建高性能分配器
  const performanceDistributor = new HighPerformanceDistributor(heightEstimator, {
    enableWorkerThreads: config.enableWorkerThreads ?? true,
    enableResultCache: config.enableCache ?? true,
    enableProfiling: config.enableProfiling ?? false,
    ...config.performanceConfig
  });

  return {
    heightEstimator,
    strategyFactory,
    performanceDistributor,
    
    // 便捷方法
    getRecommendedStrategy: (blocks) => strategyFactory.recommendStrategy(blocks),
    createStrategy: (type) => strategyFactory.createStrategy(type),
    distributeBlocks: (blocks, columnCount, strategy = 'balanced-height') => {
      const algorithm = strategyFactory.createStrategy(strategy);
      return algorithm.distribute(blocks, columnCount);
    },
    distributeHighPerformance: (blocks, columnCount) => {
      return performanceDistributor.distribute(blocks, columnCount);
    },
    getPerformanceStats: () => performanceDistributor.getPerformanceStats(),
    clearCache: () => {
      heightEstimator.clearExpiredCache();
      performanceDistributor.clearCache();
    }
  };
}

/**
 * 创建轻量级算法套件（适合小项目）
 */
export function createLightweightSuite(): LightweightAlgorithmSuite {
  const heightEstimator = new SmartBlockHeightEstimator({
    enableLearning: false,
    maxCacheSize: 100,
    debugMode: false
  });

  const strategyFactory = new DistributionStrategyFactory(heightEstimator);

  return {
    heightEstimator,
    distributeBlocks: (blocks, columnCount, strategy = 'round-robin') => {
      const algorithm = strategyFactory.createStrategy(strategy);
      return algorithm.distribute(blocks, columnCount);
    },
    estimateHeight: (block) => heightEstimator.estimate(block),
    getAvailableStrategies: () => strategyFactory.getAvailableStrategies()
  };
}

/**
 * 创建开发模式算法套件（启用所有调试功能）
 */
export function createDevelopmentSuite(): AlgorithmSuite {
  return createAlgorithmSuite({
    debugMode: true,
    enableProfiling: true,
    enableLearning: true,
    enableCache: true,
    enableWorkerThreads: false, // 开发时禁用Worker便于调试
    estimatorConfig: {
      debugMode: true,
      enableLearning: true
    },
    performanceConfig: {
      enableProfiling: true,
      enableResultCache: true
    }
  });
}

/**
 * 创建生产模式算法套件（性能优化）
 */
export function createProductionSuite(): AlgorithmSuite {
  return createAlgorithmSuite({
    debugMode: false,
    enableProfiling: false,
    enableLearning: true,
    enableCache: true,
    enableWorkerThreads: true,
    estimatorConfig: {
      debugMode: false,
      enableLearning: true,
      maxCacheSize: 1000
    },
    performanceConfig: {
      enableProfiling: false,
      enableResultCache: true,
      enableWorkerThreads: true,
      largeDatasetThreshold: 200
    }
  });
}

// ===== 类型定义 =====

export interface AlgorithmSuiteConfig {
  /** 启用学习功能 */
  enableLearning?: boolean;
  /** 启用调试模式 */
  debugMode?: boolean;
  /** 基础字体大小 */
  baseFontSize?: number;
  /** 启用Web Worker */
  enableWorkerThreads?: boolean;
  /** 启用缓存 */
  enableCache?: boolean;
  /** 启用性能分析 */
  enableProfiling?: boolean;
  /** 高度估算器配置 */
  estimatorConfig?: Partial<import('./smart-height-estimator.js').HeightEstimatorConfig>;
  /** 性能优化配置 */
  performanceConfig?: Partial<import('./performance-optimizer.js').PerformanceConfig>;
}

export interface AlgorithmSuite {
  /** 高度估算器实例 */
  heightEstimator: BlockHeightEstimator;
  /** 策略工厂实例 */
  strategyFactory: DistributionStrategyFactory;
  /** 高性能分配器实例 */
  performanceDistributor: HighPerformanceDistributor;
  
  // 便捷方法
  /** 获取推荐策略 */
  getRecommendedStrategy: (blocks: import('../types/layout.js').Block[]) => import('./distribution-strategies.js').StrategyRecommendation;
  /** 创建分配策略 */
  createStrategy: (type: import('../types/contracts.js').DistributionStrategy) => import('../types/contracts.js').DistributionAlgorithm;
  /** 分配Block到列 */
  distributeBlocks: (blocks: import('../types/layout.js').Block[], columnCount: number, strategy?: import('../types/contracts.js').DistributionStrategy) => import('../types/layout.js').Block[][];
  /** 高性能分配 */
  distributeHighPerformance: (blocks: import('../types/layout.js').Block[], columnCount: number) => Promise<import('../types/layout.js').Block[][]>;
  /** 获取性能统计 */
  getPerformanceStats: () => import('./performance-optimizer.js').PerformanceStats;
  /** 清理缓存 */
  clearCache: () => void;
}

export interface LightweightAlgorithmSuite {
  /** 高度估算器实例 */
  heightEstimator: BlockHeightEstimator;
  /** 分配Block到列 */
  distributeBlocks: (blocks: import('../types/layout.js').Block[], columnCount: number, strategy?: import('../types/contracts.js').DistributionStrategy) => import('../types/layout.js').Block[][];
  /** 估算Block高度 */
  estimateHeight: (block: import('../types/layout.js').Block) => number;
  /** 获取可用策略 */
  getAvailableStrategies: () => import('./distribution-strategies.js').StrategyInfo[];
}

// ===== 算法性能基准测试 =====

/**
 * 算法性能基准测试工具
 */
export class AlgorithmBenchmark {
  private suite: AlgorithmSuite;

  constructor(suite: AlgorithmSuite) {
    this.suite = suite;
  }

  /**
   * 运行完整的基准测试
   */
  async runBenchmark(testCases: BenchmarkTestCase[]): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const testCase of testCases) {
      console.log(`🧪 运行基准测试: ${testCase.name}`);
      
      const strategies: import('../types/contracts.js').DistributionStrategy[] = ['round-robin', 'balanced-height', 'content-aware'];
      
      for (const strategy of strategies) {
        const startTime = performance.now();
        
        try {
          const result = this.suite.distributeBlocks(testCase.blocks, testCase.columnCount, strategy);
          const endTime = performance.now();
          const quality = this._calculateTestQuality(result);
          
          results.push({
            testCaseName: testCase.name,
            strategy,
            executionTime: endTime - startTime,
            qualityScore: quality,
            blockCount: testCase.blocks.length,
            columnCount: testCase.columnCount,
            success: true
          });
        } catch (error) {
          results.push({
            testCaseName: testCase.name,
            strategy,
            executionTime: 0,
            qualityScore: 0,
            blockCount: testCase.blocks.length,
            columnCount: testCase.columnCount,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    return results;
  }

  /**
   * 生成基准测试报告
   */
  generateReport(results: BenchmarkResult[]): BenchmarkReport {
    const strategyStats = new Map<string, StrategyStats>();

    results.forEach(result => {
      if (!result.success) return;

      if (!strategyStats.has(result.strategy)) {
        strategyStats.set(result.strategy, {
          totalTime: 0,
          totalQuality: 0,
          testCount: 0,
          failureCount: 0
        });
      }

      const stats = strategyStats.get(result.strategy)!;
      stats.totalTime += result.executionTime;
      stats.totalQuality += result.qualityScore;
      stats.testCount++;
    });

    const report: BenchmarkReport = {
      timestamp: Date.now(),
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      strategyPerformance: new Map()
    };

    strategyStats.forEach((stats, strategy) => {
      report.strategyPerformance.set(strategy, {
        averageTime: stats.totalTime / stats.testCount,
        averageQuality: stats.totalQuality / stats.testCount,
        successRate: stats.testCount / (stats.testCount + stats.failureCount)
      });
    });

    return report;
  }

  private _calculateTestQuality(result: import('../types/layout.js').Block[][]): number {
    // 使用策略工厂的质量评估
    const algorithm = this.suite.createStrategy('balanced-height');
    return algorithm.estimateQuality ? algorithm.estimateQuality(result) : 0.5;
  }
}

// ===== 基准测试相关类型 =====

export interface BenchmarkTestCase {
  name: string;
  blocks: import('../types/layout.js').Block[];
  columnCount: number;
  expectedQuality?: number;
}

export interface BenchmarkResult {
  testCaseName: string;
  strategy: string;
  executionTime: number;
  qualityScore: number;
  blockCount: number;
  columnCount: number;
  success: boolean;
  error?: string;
}

interface StrategyStats {
  totalTime: number;
  totalQuality: number;
  testCount: number;
  failureCount: number;
}

export interface BenchmarkReport {
  timestamp: number;
  totalTests: number;
  successfulTests: number;
  strategyPerformance: Map<string, {
    averageTime: number;
    averageQuality: number;
    successRate: number;
  }>;
}

// ===== 默认导出 =====

export default {
  createAlgorithmSuite,
  createLightweightSuite,
  createDevelopmentSuite,
  createProductionSuite,
  AlgorithmBenchmark
};