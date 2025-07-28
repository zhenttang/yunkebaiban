/**
 * 🎯 智能Block高度估算器 - 核心实现
 * 算法工程师A3负责实现
 * 
 * 准确的高度估算是实现平衡布局的关键，
 * 此实现支持多种Block类型的精确估算，并具备学习能力
 */

import type { Block, BlockHeightEstimator } from '../types/contracts.js';

export interface HeightEstimatorConfig {
  /** 是否启用实测值学习 */
  enableLearning: boolean;
  /** 缓存大小限制 */
  maxCacheSize: number;
  /** 缓存过期时间(ms) */
  cacheExpirationTime: number;
  /** 是否启用调试模式 */
  debugMode: boolean;
  /** 字体大小(px) - 影响文本高度计算 */
  baseFontSize: number;
  /** 行高倍数 */
  lineHeightMultiplier: number;
}

interface CachedHeight {
  height: number;
  timestamp: number;
  source: 'estimated' | 'measured';
  accuracy?: number; // 估算准确度 (0-1)
}

interface BlockTypeMetrics {
  baseHeight: number;
  minHeight: number;
  maxHeight: number;
  avgAccuracy: number;
  sampleCount: number;
}

/**
 * 智能Block高度估算器
 * 支持多种Block类型，具备学习和优化能力
 */
export class SmartBlockHeightEstimator implements BlockHeightEstimator {
  private config: HeightEstimatorConfig;
  private cache = new Map<string, CachedHeight>();
  private typeMetrics = new Map<string, BlockTypeMetrics>();
  private learningData = new Map<string, number[]>(); // 用于记录实测值进行学习

  constructor(config: Partial<HeightEstimatorConfig> = {}) {
    this.config = {
      enableLearning: true,
      maxCacheSize: 2000,
      cacheExpirationTime: 5 * 60 * 1000, // 5分钟
      debugMode: false,
      baseFontSize: 14,
      lineHeightMultiplier: 1.6,
      ...config
    };

    this._initializeTypeMetrics();
    
    if (this.config.debugMode) {
      console.log('🧠 SmartBlockHeightEstimator 已初始化，配置:', this.config);
    }
  }

  /**
   * 估算Block高度
   */
  estimate(block: Block): number {
    // 检查缓存
    const cached = this.getCachedHeight(block.id);
    if (cached !== null && !this._isCacheExpired(block.id)) {
      if (this.config.debugMode) {
        console.log(`📋 使用缓存高度 ${block.id}: ${cached}px`);
      }
      return cached;
    }

    // 计算估算高度
    const estimatedHeight = this._calculateEstimatedHeight(block);
    
    // 缓存结果
    this.cacheHeight(block.id, estimatedHeight);

    if (this.config.debugMode) {
      console.log(`📏 估算Block高度 ${block.flavour}: ${estimatedHeight}px`);
    }

    return estimatedHeight;
  }

  /**
   * 缓存实测高度（用于学习优化）
   */
  cacheHeight(blockId: string, height: number): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxCacheSize) {
      this._evictOldestCacheEntries();
    }

    this.cache.set(blockId, {
      height,
      timestamp: Date.now(),
      source: 'estimated'
    });
  }

  /**
   * 记录实际测量的高度（用于学习）
   */
  recordMeasuredHeight(blockId: string, measuredHeight: number, blockType?: string): void {
    if (!this.config.enableLearning) return;

    // 更新缓存为实测值
    this.cache.set(blockId, {
      height: measuredHeight,
      timestamp: Date.now(),
      source: 'measured'
    });

    // 记录学习数据
    if (blockType) {
      const learningKey = blockType;
      if (!this.learningData.has(learningKey)) {
        this.learningData.set(learningKey, []);
      }
      this.learningData.get(learningKey)!.push(measuredHeight);
      
      // 定期更新类型指标
      this._updateTypeMetrics(blockType);
    }

    if (this.config.debugMode) {
      console.log(`📖 记录实测高度 ${blockId}: ${measuredHeight}px`);
    }
  }

  /**
   * 获取缓存的高度
   */
  getCachedHeight(blockId: string): number | null {
    const cached = this.cache.get(blockId);
    if (!cached || this._isCacheExpired(blockId)) {
      return null;
    }
    return cached.height;
  }

  /**
   * 清理过期缓存
   */
  clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheExpirationTime) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (this.config.debugMode && expiredKeys.length > 0) {
      console.log(`🧹 清理了 ${expiredKeys.length} 个过期缓存项`);
    }
  }

  /**
   * 获取估算器性能统计
   */
  getPerformanceStats(): EstimatorStats {
    const totalCached = this.cache.size;
    const measuredCount = Array.from(this.cache.values())
      .filter(item => item.source === 'measured').length;
    
    return {
      totalCached,
      measuredCount,
      cacheHitRate: totalCached > 0 ? measuredCount / totalCached : 0,
      typeMetrics: new Map(this.typeMetrics),
      learningEnabled: this.config.enableLearning
    };
  }

  /**
   * 重新校准估算器（基于学习数据）
   */
  recalibrate(): void {
    if (!this.config.enableLearning) return;

    let calibratedTypes = 0;

    for (const [blockType, measurements] of this.learningData.entries()) {
      if (measurements.length >= 5) { // 至少需要5个样本
        const avgMeasured = measurements.reduce((sum, h) => sum + h, 0) / measurements.length;
        const currentMetrics = this.typeMetrics.get(blockType);
        
        if (currentMetrics) {
          // 调整基础高度（权重平均）
          const weight = Math.min(measurements.length / 20, 0.5); // 最多50%权重
          currentMetrics.baseHeight = currentMetrics.baseHeight * (1 - weight) + avgMeasured * weight;
          currentMetrics.sampleCount += measurements.length;
          calibratedTypes++;
        }
      }
    }

    // 清理学习数据
    this.learningData.clear();

    if (this.config.debugMode) {
      console.log(`🎯 重新校准完成，调整了 ${calibratedTypes} 种Block类型的估算参数`);
    }
  }

  // ===== 私有方法 =====

  private _calculateEstimatedHeight(block: Block): number {
    const blockType = block.flavour;
    const metrics = this.typeMetrics.get(blockType);
    
    if (!metrics) {
      // 未知类型，使用默认估算
      return this._getDefaultHeight(block);
    }

    switch (blockType) {
      case 'affine:paragraph':
        return this._estimateParagraphHeight(block, metrics);
      case 'affine:heading':
        return this._estimateHeadingHeight(block, metrics);
      case 'affine:list':
        return this._estimateListHeight(block, metrics);
      case 'affine:code':
        return this._estimateCodeHeight(block, metrics);
      case 'affine:image':
        return this._estimateImageHeight(block, metrics);
      case 'affine:database':
        return this._estimateDatabaseHeight(block, metrics);
      case 'affine:callout':
        return this._estimateCalloutHeight(block, metrics);
      default:
        return metrics.baseHeight;
    }
  }

  private _estimateParagraphHeight(block: Block, metrics: BlockTypeMetrics): number {
    const text = block.text?.toString() || '';
    if (!text) return metrics.minHeight;

    const baseLineHeight = this.config.baseFontSize * this.config.lineHeightMultiplier;
    const avgCharsPerLine = this._calculateCharsPerLine();
    const estimatedLines = Math.max(1, Math.ceil(text.length / avgCharsPerLine));
    
    const estimatedHeight = estimatedLines * baseLineHeight + 16; // 加上padding
    
    return Math.max(metrics.minHeight, Math.min(estimatedHeight, metrics.maxHeight));
  }

  private _estimateHeadingHeight(block: Block, metrics: BlockTypeMetrics): number {
    // 标题通常是单行，但字体更大
    const headingLevel = this._extractHeadingLevel(block);
    const fontSize = this.config.baseFontSize * (2 - headingLevel * 0.2); // h1更大，h6更小
    const lineHeight = fontSize * 1.4;
    
    return lineHeight + 20; // 加上额外的margin
  }

  private _estimateListHeight(block: Block, metrics: BlockTypeMetrics): number {
    const itemCount = Math.max(1, block.children?.length || 1);
    const itemHeight = this.config.baseFontSize * this.config.lineHeightMultiplier + 8;
    
    return itemCount * itemHeight + 16; // 基础padding
  }

  private _estimateCodeHeight(block: Block, metrics: BlockTypeMetrics): number {
    const code = block.text?.toString() || '';
    const lines = Math.max(1, code.split('\n').length);
    const lineHeight = this.config.baseFontSize * 1.4; // 代码行高稍紧凑
    
    return lines * lineHeight + 32; // 代码块有更多padding
  }

  private _estimateImageHeight(block: Block, metrics: BlockTypeMetrics): number {
    const props = block.props || {};
    
    // 如果有明确的高度信息，使用它
    if (props.height && typeof props.height === 'number') {
      return props.height + 16; // 加上margin
    }
    
    // 如果有宽度信息，估算高度（假设16:9比例）
    if (props.width && typeof props.width === 'number') {
      return (props.width * 9 / 16) + 16;
    }
    
    // 使用默认图片高度
    return metrics.baseHeight;
  }

  private _estimateDatabaseHeight(block: Block, metrics: BlockTypeMetrics): number {
    const props = block.props || {};
    const rows = props.rows || 3;
    const rowHeight = 40; // 假设每行40px
    const headerHeight = 50;
    
    return headerHeight + (rows * rowHeight) + 20; // 加上边距
  }

  private _estimateCalloutHeight(block: Block, metrics: BlockTypeMetrics): number {
    const text = block.text?.toString() || '';
    const baseHeight = metrics.baseHeight;
    
    if (!text) return baseHeight;
    
    // Callout通常有额外的图标和边框空间
    const textHeight = this._estimateParagraphHeight(block, this.typeMetrics.get('affine:paragraph')!);
    return textHeight + 40; // 额外的callout装饰空间
  }

  private _getDefaultHeight(block: Block): number {
    // 根据Block类型提供基础估算
    const text = block.text?.toString() || '';
    if (text.length === 0) return 50;
    
    const lines = Math.max(1, Math.ceil(text.length / 60));
    return lines * (this.config.baseFontSize * this.config.lineHeightMultiplier) + 16;
  }

  private _calculateCharsPerLine(): number {
    // 根据字体大小估算每行字符数
    // 这是一个简化的估算，实际应该考虑容器宽度
    const charWidth = this.config.baseFontSize * 0.6; // 假设字符宽度
    const assumedLineWidth = 600; // 假设行宽
    return Math.floor(assumedLineWidth / charWidth);
  }

  private _extractHeadingLevel(block: Block): number {
    // 从Block属性中提取标题级别
    const props = block.props || {};
    return props.level || 1;
  }

  private _initializeTypeMetrics(): void {
    const defaultMetrics: Record<string, BlockTypeMetrics> = {
      'affine:paragraph': { baseHeight: 60, minHeight: 30, maxHeight: 500, avgAccuracy: 0.8, sampleCount: 0 },
      'affine:heading': { baseHeight: 80, minHeight: 40, maxHeight: 120, avgAccuracy: 0.9, sampleCount: 0 },
      'affine:list': { baseHeight: 120, minHeight: 40, maxHeight: 800, avgAccuracy: 0.7, sampleCount: 0 },
      'affine:code': { baseHeight: 150, minHeight: 60, maxHeight: 1000, avgAccuracy: 0.85, sampleCount: 0 },
      'affine:image': { baseHeight: 250, minHeight: 100, maxHeight: 600, avgAccuracy: 0.9, sampleCount: 0 },
      'affine:database': { baseHeight: 300, minHeight: 150, maxHeight: 800, avgAccuracy: 0.75, sampleCount: 0 },
      'affine:callout': { baseHeight: 120, minHeight: 80, maxHeight: 300, avgAccuracy: 0.8, sampleCount: 0 }
    };

    for (const [type, metrics] of Object.entries(defaultMetrics)) {
      this.typeMetrics.set(type, { ...metrics });
    }
  }

  private _updateTypeMetrics(blockType: string): void {
    const measurements = this.learningData.get(blockType);
    if (!measurements || measurements.length === 0) return;

    const metrics = this.typeMetrics.get(blockType);
    if (!metrics) return;

    // 计算新的统计信息
    const avg = measurements.reduce((sum, h) => sum + h, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    // 更新指标（使用指数移动平均）
    const alpha = 0.1; // 学习率
    metrics.baseHeight = metrics.baseHeight * (1 - alpha) + avg * alpha;
    metrics.minHeight = Math.min(metrics.minHeight, min);
    metrics.maxHeight = Math.max(metrics.maxHeight, max);
  }

  private _isCacheExpired(blockId: string): boolean {
    const cached = this.cache.get(blockId);
    if (!cached) return true;
    
    return Date.now() - cached.timestamp > this.config.cacheExpirationTime;
  }

  private _evictOldestCacheEntries(): void {
    // 移除最旧的25%缓存项
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const removeCount = Math.floor(entries.length * 0.25);
    for (let i = 0; i < removeCount; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
}

// ===== 辅助接口和类型 =====

export interface EstimatorStats {
  totalCached: number;
  measuredCount: number;
  cacheHitRate: number;
  typeMetrics: Map<string, BlockTypeMetrics>;
  learningEnabled: boolean;
}

/**
 * 创建默认配置的智能高度估算器
 */
export function createSmartHeightEstimator(
  config: Partial<HeightEstimatorConfig> = {}
): SmartBlockHeightEstimator {
  return new SmartBlockHeightEstimator(config);
}

/**
 * 创建高性能配置的估算器（禁用学习，减小缓存）
 */
export function createHighPerformanceEstimator(): SmartBlockHeightEstimator {
  return new SmartBlockHeightEstimator({
    enableLearning: false,
    maxCacheSize: 500,
    cacheExpirationTime: 2 * 60 * 1000, // 2分钟
    debugMode: false
  });
}

/**
 * 创建学习模式的估算器（启用所有学习功能）
 */
export function createLearningEstimator(): SmartBlockHeightEstimator {
  return new SmartBlockHeightEstimator({
    enableLearning: true,
    maxCacheSize: 5000,
    cacheExpirationTime: 10 * 60 * 1000, // 10分钟
    debugMode: true
  });
}