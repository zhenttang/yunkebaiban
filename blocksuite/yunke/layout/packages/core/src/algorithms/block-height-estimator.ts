/**
 * Block高度估算器实现
 * 负责估算不同类型Block的渲染高度
 * 
 * 开发者A3任务：实现智能高度估算算法
 */

import { Block } from '../types/contracts.js';

/**
 * Block类型高度配置
 */
interface BlockTypeHeightConfig {
  baseHeight: number;
  lineHeight: number;
  padding: number;
  minHeight: number;
  maxHeight: number;
  aspectRatio?: number;
}

/**
 * 高度估算缓存项
 */
interface HeightCacheItem {
  blockId: string;
  height: number;
  timestamp: number;
  measurements: number; // 测量次数
  confidence: number;   // 置信度 (0-1)
}

/**
 * Block高度估算器
 */
export class BlockHeightEstimator {
  private cache = new Map<string, HeightCacheItem>();
  private typeConfigs: Record<string, BlockTypeHeightConfig>;
  private cacheSize = 1000;
  private cacheTTL = 300000; // 5分钟
  
  constructor() {
    this.typeConfigs = this.createDefaultTypeConfigs();
  }
  
  /**
   * 估算单个Block的高度
   */
  estimate(block: Block): number {
    // 1. 检查缓存
    const cached = this.getCachedHeight(block.id);
    if (cached !== null && this.isCacheValid(block.id)) {
      return cached;
    }
    
    // 2. 基于类型估算
    const estimated = this.estimateByType(block);
    
    // 3. 内容长度调整
    const contentAdjusted = this.adjustForContent(estimated, block);
    
    // 4. 属性调整
    const finalHeight = this.adjustForProperties(contentAdjusted, block);
    
    // 5. 缓存结果（低置信度）
    this.cacheHeight(block.id, finalHeight, 0.6);
    
    return Math.max(finalHeight, 20); // 最小高度20px
  }
  
  /**
   * 基于Block类型的基础估算
   */
  private estimateByType(block: Block): number {
    const config = this.typeConfigs[block.type] || this.typeConfigs.default;
    
    switch (block.type) {
      case 'paragraph':
        return this.estimateParagraphHeight(block, config);
      
      case 'heading':
        return this.estimateHeadingHeight(block, config);
      
      case 'list':
        return this.estimateListHeight(block, config);
      
      case 'image':
        return this.estimateImageHeight(block, config);
      
      case 'code':
        return this.estimateCodeHeight(block, config);
      
      case 'table':
        return this.estimateTableHeight(block, config);
      
      case 'embed':
        return this.estimateEmbedHeight(block, config);
      
      default:
        return config.baseHeight;
    }
  }
  
  /**
   * 估算段落高度
   */
  private estimateParagraphHeight(block: Block, config: BlockTypeHeightConfig): number {
    const content = this.getTextContent(block);
    const lines = this.estimateLines(content, 600); // 假设列宽600px
    return config.padding * 2 + lines * config.lineHeight;
  }
  
  /**
   * 估算标题高度
   */
  private estimateHeadingHeight(block: Block, config: BlockTypeHeightConfig): number {
    const level = block.properties?.level || 1;
    const heightMultiplier = [2.5, 2.2, 1.8, 1.5, 1.3, 1.1][level - 1] || 1.1;
    return config.baseHeight * heightMultiplier + config.padding * 2;
  }
  
  /**
   * 估算列表高度
   */
  private estimateListHeight(block: Block, config: BlockTypeHeightConfig): number {
    const items = block.children?.length || 1;
    const itemHeight = config.lineHeight + 8; // 8px间距
    return config.padding * 2 + items * itemHeight;
  }
  
  /**
   * 估算图片高度
   */
  private estimateImageHeight(block: Block, config: BlockTypeHeightConfig): number {
    const width = block.properties?.width || 600;
    const aspectRatio = config.aspectRatio || 0.75;
    const imageHeight = width * aspectRatio;
    
    // 考虑标题和描述
    const captionHeight = block.properties?.caption ? 40 : 0;
    
    return imageHeight + captionHeight + config.padding * 2;
  }
  
  /**
   * 估算代码块高度
   */
  private estimateCodeHeight(block: Block, config: BlockTypeHeightConfig): number {
    const content = this.getTextContent(block);
    const lines = content.split('\n').length;
    const lineHeight = 20; // 代码行高通常较小
    return config.padding * 2 + lines * lineHeight + 40; // 40px for header
  }
  
  /**
   * 估算表格高度
   */
  private estimateTableHeight(block: Block, config: BlockTypeHeightConfig): number {
    const rows = block.properties?.rows || 3;
    const rowHeight = 40; // 标准表格行高
    const headerHeight = 50;
    return headerHeight + rows * rowHeight + config.padding * 2;
  }
  
  /**
   * 估算嵌入内容高度
   */
  private estimateEmbedHeight(block: Block, config: BlockTypeHeightConfig): number {
    const embedType = block.properties?.embedType || 'default';
    
    const embedHeights = {
      video: 300,
      tweet: 200,
      map: 400,
      calendar: 500,
      default: 200
    };
    
    return embedHeights[embedType as keyof typeof embedHeights] || embedHeights.default;
  }
  
  /**
   * 根据内容长度调整高度
   */
  private adjustForContent(baseHeight: number, block: Block): number {
    const content = this.getTextContent(block);
    
    if (!content || content.length < 50) {
      return baseHeight * 0.8; // 短内容稍微减少高度
    }
    
    if (content.length > 500) {
      const extraLines = Math.floor((content.length - 500) / 100);
      return baseHeight + extraLines * 20; // 长内容增加高度
    }
    
    return baseHeight;
  }
  
  /**
   * 根据Block属性调整高度
   */
  private adjustForProperties(baseHeight: number, block: Block): number {
    let height = baseHeight;
    
    // 根据样式属性调整
    if (block.properties?.styles) {
      const styles = block.properties.styles;
      
      if (styles.margin) {
        height += this.parseSpacing(styles.margin) * 2;
      }
      
      if (styles.padding) {
        height += this.parseSpacing(styles.padding) * 2;
      }
      
      if (styles.fontSize) {
        const fontMultiplier = this.parseFontSize(styles.fontSize) / 16;
        height *= fontMultiplier;
      }
    }
    
    // 根据交互状态调整
    if (block.properties?.expanded === false) {
      height *= 0.3; // 收缩状态
    }
    
    return height;
  }
  
  /**
   * 估算文本行数
   */
  private estimateLines(text: string, containerWidth: number): number {
    if (!text) return 1;
    
    const avgCharWidth = 8; // 平均字符宽度
    const charsPerLine = Math.floor(containerWidth / avgCharWidth);
    const lines = Math.ceil(text.length / charsPerLine);
    
    // 考虑硬换行
    const hardBreaks = (text.match(/\n/g) || []).length;
    
    return Math.max(lines, hardBreaks + 1);
  }
  
  /**
   * 获取Block的文本内容
   */
  private getTextContent(block: Block): string {
    if (typeof block.content === 'string') {
      return block.content;
    }
    
    if (block.content?.text) {
      return block.content.text;
    }
    
    if (block.content?.delta) {
      // Delta格式的文本提取
      return block.content.delta.map((op: any) => op.insert || '').join('');
    }
    
    return '';
  }
  
  /**
   * 解析间距值
   */
  private parseSpacing(spacing: string | number): number {
    if (typeof spacing === 'number') return spacing;
    
    const match = spacing.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  
  /**
   * 解析字体大小
   */
  private parseFontSize(fontSize: string | number): number {
    if (typeof fontSize === 'number') return fontSize;
    
    const match = fontSize.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 16;
  }
  
  /**
   * 缓存Block高度
   */
  cacheHeight(blockId: string, height: number, confidence: number = 1): void {
    // 清理过期缓存
    this.clearExpiredCache();
    
    // 限制缓存大小
    if (this.cache.size >= this.cacheSize) {
      this.evictOldestCache();
    }
    
    const existing = this.cache.get(blockId);
    const measurements = existing ? existing.measurements + 1 : 1;
    
    // 多次测量提高置信度
    const finalConfidence = Math.min(confidence + measurements * 0.1, 1);
    
    this.cache.set(blockId, {
      blockId,
      height,
      timestamp: Date.now(),
      measurements,
      confidence: finalConfidence
    });
  }
  
  /**
   * 获取缓存的高度
   */
  getCachedHeight(blockId: string): number | null {
    const cached = this.cache.get(blockId);
    
    if (!cached || !this.isCacheValid(blockId)) {
      return null;
    }
    
    return cached.height;
  }
  
  /**
   * 检查缓存是否有效
   */
  private isCacheValid(blockId: string): boolean {
    const cached = this.cache.get(blockId);
    
    if (!cached) return false;
    
    const now = Date.now();
    const age = now - cached.timestamp;
    
    // 高置信度的缓存保持更长时间
    const ttl = this.cacheTTL * cached.confidence;
    
    return age < ttl;
  }
  
  /**
   * 清理过期缓存
   */
  clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [blockId, cached] of this.cache.entries()) {
      const age = now - cached.timestamp;
      const ttl = this.cacheTTL * cached.confidence;
      
      if (age > ttl) {
        this.cache.delete(blockId);
      }
    }
  }
  
  /**
   * 移除最旧的缓存项
   */
  private evictOldestCache(): void {
    let oldestId = '';
    let oldestTime = Date.now();
    
    for (const [blockId, cached] of this.cache.entries()) {
      if (cached.timestamp < oldestTime) {
        oldestTime = cached.timestamp;
        oldestId = blockId;
      }
    }
    
    if (oldestId) {
      this.cache.delete(oldestId);
    }
  }
  
  /**
   * 批量估算Block高度
   */
  batchEstimate(blocks: Block[]): number[] {
    return blocks.map(block => this.estimate(block));
  }
  
  /**
   * 清空所有缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    let totalConfidence = 0;
    
    for (const cached of this.cache.values()) {
      const age = now - cached.timestamp;
      const ttl = this.cacheTTL * cached.confidence;
      
      if (age < ttl) {
        validCount++;
        totalConfidence += cached.confidence;
      } else {
        expiredCount++;
      }
    }
    
    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      averageConfidence: validCount > 0 ? totalConfidence / validCount : 0,
      hitRate: validCount / (validCount + expiredCount) || 0
    };
  }
  
  /**
   * 创建默认的类型配置
   */
  private createDefaultTypeConfigs(): Record<string, BlockTypeHeightConfig> {
    return {
      default: {
        baseHeight: 60,
        lineHeight: 24,
        padding: 12,
        minHeight: 20,
        maxHeight: 1000
      },
      paragraph: {
        baseHeight: 50,
        lineHeight: 22,
        padding: 8,
        minHeight: 30,
        maxHeight: 500
      },
      heading: {
        baseHeight: 60,
        lineHeight: 32,
        padding: 16,
        minHeight: 40,
        maxHeight: 100
      },
      list: {
        baseHeight: 40,
        lineHeight: 20,
        padding: 8,
        minHeight: 30,
        maxHeight: 800
      },
      image: {
        baseHeight: 200,
        lineHeight: 0,
        padding: 12,
        minHeight: 100,
        maxHeight: 600,
        aspectRatio: 0.75
      },
      code: {
        baseHeight: 100,
        lineHeight: 18,
        padding: 16,
        minHeight: 60,
        maxHeight: 800
      },
      table: {
        baseHeight: 150,
        lineHeight: 40,
        padding: 12,
        minHeight: 100,
        maxHeight: 1000
      },
      embed: {
        baseHeight: 200,
        lineHeight: 0,
        padding: 12,
        minHeight: 150,
        maxHeight: 500
      }
    };
  }
  
  /**
   * 更新类型配置
   */
  updateTypeConfig(type: string, config: Partial<BlockTypeHeightConfig>): void {
    this.typeConfigs[type] = {
      ...this.typeConfigs[type] || this.typeConfigs.default,
      ...config
    };
  }
  
  /**
   * 学习实际高度，优化估算算法
   */
  learnFromActual(blockId: string, actualHeight: number): void {
    const cached = this.cache.get(blockId);
    
    if (cached) {
      // 更新缓存，提高置信度
      this.cacheHeight(blockId, actualHeight, 1.0);
      
      // 如果差异很大，可以调整类型配置
      const estimatedHeight = cached.height;
      const error = Math.abs(actualHeight - estimatedHeight) / estimatedHeight;
      
      if (error > 0.3) {
        // 误差超过30%，记录用于后续优化
        console.debug(`Height estimation error for ${blockId}: estimated ${estimatedHeight}, actual ${actualHeight}`);
      }
    }
  }
}