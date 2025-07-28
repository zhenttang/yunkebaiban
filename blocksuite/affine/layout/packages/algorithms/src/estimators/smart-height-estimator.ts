/**
 * 智能Block高度估算器设计
 * 开发者A1协助A3完成高度估算系统
 */

import type { Block } from '@blocksuite/affine-layout-core/types';
import type { 
  IBlockHeightEstimator, 
  EstimationContext, 
  EstimationStats 
} from '../strategies/distribution-interfaces.js';

/**
 * Block类型高度规则
 */
export interface BlockHeightRules {
  /** 基础高度 */
  baseHeight: number;
  
  /** 每行额外高度 */
  lineHeight?: number;
  
  /** 内边距 */
  padding?: { top: number; bottom: number };
  
  /** 外边距 */
  margin?: { top: number; bottom: number };
  
  /** 最小高度 */
  minHeight?: number;
  
  /** 最大高度 */
  maxHeight?: number;
  
  /** 动态计算函数 */
  dynamicCalculator?: (block: Block, context: EstimationContext) => number;
}

/**
 * 高度估算器配置
 */
export interface HeightEstimatorConfig {
  /** 按Block类型的规则 */
  rules: Record<string, BlockHeightRules>;
  
  /** 默认规则 */
  defaultRule: BlockHeightRules;
  
  /** 缓存配置 */
  cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number; // Time to live in ms
  };
  
  /** 学习配置 */
  learning: {
    enabled: boolean;
    adaptationRate: number; // 0-1
    minSamples: number;
  };
  
  /** 性能配置 */
  performance: {
    enableBatching: boolean;
    batchSize: number;
    enablePrediction: boolean;
  };
}

/**
 * 智能高度估算器实现
 */
export class SmartBlockHeightEstimator implements IBlockHeightEstimator {
  private config: HeightEstimatorConfig;
  private cache = new Map<string, { height: number; timestamp: number; confidence: number }>();
  private learningData = new Map<string, number[]>(); // blockType -> actual heights
  private adaptedRules = new Map<string, BlockHeightRules>();
  private stats: EstimationStats;

  constructor(config?: Partial<HeightEstimatorConfig>) {
    this.config = this.mergeWithDefaults(config);
    this.stats = this.initializeStats();
    this.initializeDefaultRules();
  }

  estimate(block: Block, context?: EstimationContext): number {
    const cacheKey = this.getCacheKey(block, context);
    
    // 检查缓存
    if (this.config.cache.enabled) {
      const cached = this.getCachedEstimation(cacheKey);
      if (cached) {
        this.stats.totalEstimations++;
        return cached.height;
      }
    }

    // 执行估算
    const estimatedHeight = this.performEstimation(block, context);
    
    // 缓存结果
    if (this.config.cache.enabled) {
      this.cacheEstimation(cacheKey, estimatedHeight, 0.8); // 默认置信度
    }

    this.stats.totalEstimations++;
    return estimatedHeight;
  }

  batchEstimate(blocks: Block[], context?: EstimationContext): number[] {
    if (!this.config.performance.enableBatching) {
      return blocks.map(block => this.estimate(block, context));
    }

    // 批量处理优化
    const results: number[] = [];
    const batchSize = this.config.performance.batchSize;
    
    for (let i = 0; i < blocks.length; i += batchSize) {
      const batch = blocks.slice(i, i + batchSize);
      const batchResults = this.processBatch(batch, context);
      results.push(...batchResults);
    }

    return results;
  }

  cacheActualHeight(blockId: string, height: number): void {
    const key = `actual_${blockId}`;
    this.cache.set(key, { 
      height, 
      timestamp: Date.now(), 
      confidence: 1.0 
    });
  }

  getCachedHeight(blockId: string): number | null {
    const cached = this.cache.get(`actual_${blockId}`);
    return cached ? cached.height : null;
  }

  learnFromActual(blockId: string, actualHeight: number): void {
    if (!this.config.learning.enabled) return;

    // 获取对应的Block信息用于学习
    const blockInfo = this.getBlockInfo(blockId);
    if (!blockInfo) return;

    // 记录实际高度数据
    const blockType = blockInfo.type;
    if (!this.learningData.has(blockType)) {
      this.learningData.set(blockType, []);
    }
    
    const heights = this.learningData.get(blockType)!;
    heights.push(actualHeight);

    // 限制数据大小
    if (heights.length > 100) {
      heights.shift();
    }

    // 触发规则适应
    if (heights.length >= this.config.learning.minSamples) {
      this.adaptRules(blockType, heights);
    }

    this.stats.learningUpdates++;
  }

  getEstimationStats(): EstimationStats {
    return { ...this.stats };
  }

  clearCache(): void {
    this.cache.clear();
  }

  private performEstimation(block: Block, context?: EstimationContext): number {
    const rules = this.getApplicableRules(block.type);
    const ctx = context || this.getDefaultContext();

    let height = rules.baseHeight;

    // 处理文本内容
    if (block.content && typeof block.content === 'string') {
      const lines = this.estimateLines(block.content, ctx);
      height += (lines - 1) * (rules.lineHeight || 20);
    }

    // 处理子元素
    if (block.children && block.children.length > 0) {
      const childHeight = this.estimateChildrenHeight(block.children, ctx);
      height += childHeight;
    }

    // 应用内边距和外边距
    if (rules.padding) {
      height += rules.padding.top + rules.padding.bottom;
    }
    if (rules.margin) {
      height += rules.margin.top + rules.margin.bottom;
    }

    // 应用动态计算
    if (rules.dynamicCalculator) {
      height = rules.dynamicCalculator(block, ctx);
    }

    // 应用最小/最大高度限制
    if (rules.minHeight) {
      height = Math.max(height, rules.minHeight);
    }
    if (rules.maxHeight) {
      height = Math.min(height, rules.maxHeight);
    }

    return Math.round(height);
  }

  private estimateLines(content: string, context: EstimationContext): number {
    const containerWidth = context.containerWidth;
    const fontSize = context.fontConfig?.fontSize || 14;
    const avgCharWidth = fontSize * 0.6; // 近似字符宽度
    
    const lines = content.split('\n');
    let totalLines = 0;

    for (const line of lines) {
      const lineWidth = line.length * avgCharWidth;
      const wrappedLines = Math.ceil(lineWidth / containerWidth) || 1;
      totalLines += wrappedLines;
    }

    return totalLines;
  }

  private estimateChildrenHeight(children: Block[], context: EstimationContext): number {
    return children.reduce((total, child) => {
      return total + this.estimate(child, context);
    }, 0);
  }

  private getApplicableRules(blockType: string): BlockHeightRules {
    // 优先使用适应后的规则
    if (this.adaptedRules.has(blockType)) {
      return this.adaptedRules.get(blockType)!;
    }

    // 使用配置的规则
    if (this.config.rules[blockType]) {
      return this.config.rules[blockType];
    }

    // 使用默认规则
    return this.config.defaultRule;
  }

  private adaptRules(blockType: string, actualHeights: number[]): void {
    const currentRules = this.config.rules[blockType] || this.config.defaultRule;
    const avgActualHeight = actualHeights.reduce((sum, h) => sum + h, 0) / actualHeights.length;
    
    const adaptationRate = this.config.learning.adaptationRate;
    const newBaseHeight = currentRules.baseHeight * (1 - adaptationRate) + 
                         avgActualHeight * adaptationRate;

    const adaptedRules: BlockHeightRules = {
      ...currentRules,
      baseHeight: Math.round(newBaseHeight)
    };

    this.adaptedRules.set(blockType, adaptedRules);
  }

  private processBatch(blocks: Block[], context?: EstimationContext): number[] {
    // 批量处理的优化逻辑
    return blocks.map(block => this.performEstimation(block, context));
  }

  private getCacheKey(block: Block, context?: EstimationContext): string {
    const contextHash = context ? this.hashContext(context) : 'default';
    return `${block.id}_${block.type}_${contextHash}`;
  }

  private getCachedEstimation(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cache.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  private cacheEstimation(key: string, height: number, confidence: number): void {
    if (this.cache.size >= this.config.cache.maxSize) {
      // 简单的LRU清理
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      height,
      timestamp: Date.now(),
      confidence
    });
  }

  private hashContext(context: EstimationContext): string {
    const parts = [
      context.containerWidth,
      context.fontConfig?.fontSize || 'default',
      context.theme || 'default',
      context.deviceType || 'default',
      context.zoomLevel || 'default'
    ];
    return parts.join('_');
  }

  private getDefaultContext(): EstimationContext {
    return {
      containerWidth: 800,
      fontConfig: {
        fontSize: 14,
        lineHeight: 1.5,
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      theme: 'light',
      deviceType: 'desktop',
      zoomLevel: 1.0
    };
  }

  private getBlockInfo(blockId: string): Block | null {
    // 这里需要实际的Block查找逻辑
    // 暂时返回null，实际使用时需要注入Block存储
    return null;
  }

  private mergeWithDefaults(config?: Partial<HeightEstimatorConfig>): HeightEstimatorConfig {
    return {
      rules: config?.rules || {},
      defaultRule: config?.defaultRule || {
        baseHeight: 60,
        lineHeight: 20,
        padding: { top: 8, bottom: 8 },
        margin: { top: 4, bottom: 4 },
        minHeight: 20
      },
      cache: {
        enabled: true,
        maxSize: 1000,
        ttl: 300000, // 5分钟
        ...config?.cache
      },
      learning: {
        enabled: true,
        adaptationRate: 0.1,
        minSamples: 5,
        ...config?.learning
      },
      performance: {
        enableBatching: true,
        batchSize: 50,
        enablePrediction: false,
        ...config?.performance
      }
    };
  }

  private initializeStats(): EstimationStats {
    return {
      cacheHitRate: 0,
      averageError: 0,
      accuracyByType: {},
      totalEstimations: 0,
      learningUpdates: 0
    };
  }

  private initializeDefaultRules(): void {
    // 初始化常见Block类型的估算规则
    this.config.rules = {
      'paragraph': {
        baseHeight: 60,
        lineHeight: 24,
        padding: { top: 8, bottom: 8 },
        minHeight: 40
      },
      'heading': {
        baseHeight: 80,
        lineHeight: 32,
        padding: { top: 16, bottom: 16 },
        minHeight: 60,
        dynamicCalculator: (block, context) => {
          const level = block.properties?.level || 1;
          const sizeMultiplier = 2.5 - (level * 0.2);
          return Math.round(60 * sizeMultiplier);
        }
      },
      'image': {
        baseHeight: 200,
        minHeight: 100,
        maxHeight: 800,
        dynamicCalculator: (block, context) => {
          if (block.properties?.height) {
            return block.properties.height;
          }
          return 200;
        }
      },
      'code': {
        baseHeight: 120,
        lineHeight: 20,
        padding: { top: 12, bottom: 12 },
        minHeight: 80
      },
      'list': {
        baseHeight: 40,
        lineHeight: 28,
        padding: { top: 4, bottom: 4 },
        dynamicCalculator: (block, context) => {
          const items = block.children?.length || 1;
          return 40 + (items - 1) * 28;
        }
      },
      'table': {
        baseHeight: 200,
        minHeight: 100,
        dynamicCalculator: (block, context) => {
          const rows = block.properties?.rows || 3;
          const cols = block.properties?.cols || 3;
          return Math.max(100, rows * 40 + 60);
        }
      },
      'callout': {
        baseHeight: 100,
        lineHeight: 24,
        padding: { top: 16, bottom: 16 },
        minHeight: 80
      }
    };
  }
}

/**
 * 工厂函数
 */
export function createSmartHeightEstimator(config?: Partial<HeightEstimatorConfig>): SmartBlockHeightEstimator {
  return new SmartBlockHeightEstimator(config);
}