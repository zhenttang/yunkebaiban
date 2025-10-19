/**
 * 高级分配策略接口设计
 * 开发者A1协助A3完成算法设计
 */

import type { Block } from '@blocksuite/yunke-layout-core/types';

/**
 * 分配策略枚举
 */
export enum DistributionStrategy {
  ROUND_ROBIN = 'round-robin',
  BALANCED_HEIGHT = 'balanced-height', 
  CONTENT_AWARE = 'content-aware',
  MASONRY = 'masonry',
  WEIGHT_BASED = 'weight-based',
  AI_OPTIMIZED = 'ai-optimized'
}

/**
 * 分配算法接口
 */
export interface IDistributionAlgorithm {
  /**
   * 算法名称
   */
  readonly name: string;
  
  /**
   * 算法描述
   */
  readonly description: string;
  
  /**
   * 支持的最小/最大列数
   */
  readonly supportedColumns: { min: number; max: number };
  
  /**
   * 执行分配
   */
  distribute(blocks: Block[], columnCount: number, options?: DistributionOptions): DistributionResult;
  
  /**
   * 估算分配质量
   */
  estimateQuality(result: DistributionResult): QualityMetrics;
  
  /**
   * 算法配置
   */
  configure(config: AlgorithmConfig): void;
}

/**
 * 分配选项
 */
export interface DistributionOptions {
  /** 高度估算器 */
  heightEstimator?: IBlockHeightEstimator;
  
  /** 权重配置 */
  weights?: DistributionWeights;
  
  /** 约束条件 */
  constraints?: DistributionConstraints;
  
  /** 性能模式 */
  performanceMode?: 'fast' | 'balanced' | 'quality';
  
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 分配结果
 */
export interface DistributionResult {
  /** 分配后的列 */
  columns: Block[][];
  
  /** 算法元数据 */
  metadata: {
    algorithm: string;
    executionTime: number;
    columnHeights: number[];
    totalHeight: number;
    balanceScore: number;
  };
  
  /** 分配决策记录 */
  decisions?: DistributionDecision[];
}

/**
 * 分配决策记录
 */
export interface DistributionDecision {
  blockId: string;
  targetColumn: number;
  reason: string;
  score: number;
  alternatives: Array<{ column: number; score: number; reason: string }>;
}

/**
 * 质量指标
 */
export interface QualityMetrics {
  /** 高度平衡度 (0-1) */
  heightBalance: number;
  
  /** 内容分布均匀性 (0-1) */
  contentDistribution: number;
  
  /** 类型多样性 (0-1) */
  typeDiversity: number;
  
  /** 视觉协调性 (0-1) */
  visualHarmony: number;
  
  /** 综合质量分数 (0-1) */
  overallQuality: number;
  
  /** 改进建议 */
  suggestions: string[];
}

/**
 * 分配权重
 */
export interface DistributionWeights {
  /** 高度平衡权重 */
  heightBalance: number;
  
  /** 内容类型权重 */
  contentType: number;
  
  /** 视觉重要性权重 */
  visualImportance: number;
  
  /** 用户偏好权重 */
  userPreference: number;
  
  /** 性能考虑权重 */
  performance: number;
}

/**
 * 分配约束
 */
export interface DistributionConstraints {
  /** 最大列高度差 */
  maxHeightDifference?: number;
  
  /** 每列最小/最大Block数 */
  blocksPerColumn?: { min?: number; max?: number };
  
  /** 禁止分离的Block组 */
  keepTogetherGroups?: string[][];
  
  /** 必须分离的Block */
  keepApartBlocks?: string[][];
  
  /** 固定位置的Block */
  fixedPositions?: Array<{ blockId: string; column: number; index?: number }>;
}

/**
 * 算法配置
 */
export interface AlgorithmConfig {
  /** 算法特定参数 */
  parameters?: Record<string, any>;
  
  /** 缓存配置 */
  caching?: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  
  /** 性能限制 */
  performance?: {
    maxExecutionTime: number;
    maxIterations: number;
  };
}

/**
 * Block高度估算器接口 (协助A3设计)
 */
export interface IBlockHeightEstimator {
  /**
   * 估算单个Block的高度
   */
  estimate(block: Block, context?: EstimationContext): number;
  
  /**
   * 批量估算
   */
  batchEstimate(blocks: Block[], context?: EstimationContext): number[];
  
  /**
   * 缓存实际高度
   */
  cacheActualHeight(blockId: string, height: number): void;
  
  /**
   * 获取缓存的高度
   */
  getCachedHeight(blockId: string): number | null;
  
  /**
   * 学习和改进估算
   */
  learnFromActual(blockId: string, actualHeight: number): void;
  
  /**
   * 获取估算统计
   */
  getEstimationStats(): EstimationStats;
  
  /**
   * 清理缓存
   */
  clearCache(): void;
}

/**
 * 估算上下文
 */
export interface EstimationContext {
  /** 容器宽度 */
  containerWidth: number;
  
  /** 字体配置 */
  fontConfig?: {
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
  };
  
  /** 主题配置 */
  theme?: 'light' | 'dark' | string;
  
  /** 设备类型 */
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  
  /** 缩放级别 */
  zoomLevel?: number;
}

/**
 * 估算统计
 */
export interface EstimationStats {
  /** 缓存命中率 */
  cacheHitRate: number;
  
  /** 平均估算误差 */
  averageError: number;
  
  /** 按类型的准确性 */
  accuracyByType: Record<string, { accuracy: number; sampleCount: number }>;
  
  /** 总估算次数 */
  totalEstimations: number;
  
  /** 学习改进次数 */
  learningUpdates: number;
}

/**
 * 分配算法管理器
 */
export interface IDistributionAlgorithmManager {
  /**
   * 注册算法
   */
  registerAlgorithm(algorithm: IDistributionAlgorithm): void;
  
  /**
   * 获取算法
   */
  getAlgorithm(strategy: DistributionStrategy): IDistributionAlgorithm | null;
  
  /**
   * 获取最佳算法建议
   */
  recommendAlgorithm(blocks: Block[], columnCount: number, preferences?: AlgorithmPreferences): DistributionStrategy;
  
  /**
   * 比较算法性能
   */
  benchmarkAlgorithms(blocks: Block[], columnCount: number, strategies?: DistributionStrategy[]): BenchmarkResult[];
  
  /**
   * 获取所有可用算法
   */
  getAvailableAlgorithms(): DistributionStrategy[];
}

/**
 * 算法偏好
 */
export interface AlgorithmPreferences {
  /** 优先考虑的因素 */
  priority: 'speed' | 'quality' | 'balance';
  
  /** 内容类型权重 */
  contentTypeWeights?: Record<string, number>;
  
  /** 性能要求 */
  performanceRequirements?: {
    maxExecutionTime?: number;
    maxMemoryUsage?: number;
  };
}

/**
 * 基准测试结果
 */
export interface BenchmarkResult {
  strategy: DistributionStrategy;
  executionTime: number;
  memoryUsage: number;
  qualityScore: number;
  result: DistributionResult;
}