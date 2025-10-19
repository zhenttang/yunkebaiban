import type { 
  BreakpointConfig, 
  PageLayoutMode,
  ResponsiveChangeEvent 
} from '../types/responsive-contracts.js';
import { ResponsiveUtils, LayoutModeConfig } from './breakpoint-config.js';

/**
 * 内容分析结果接口
 */
export interface ContentAnalysisResult {
  totalElements: number;
  textElements: number;
  mediaElements: number;
  complexElements: number;
  averageElementWidth: number;
  averageElementHeight: number;
  contentDensity: number;
  recommendedColumns: number;
  confidence: number;
}

/**
 * 智能断点建议接口
 */
export interface IntelligentBreakpointSuggestion {
  breakpoint: number;
  reason: string;
  confidence: number;
  layoutMode: PageLayoutMode;
  expectedColumns: number;
}

/**
 * 自适应布局推荐接口
 */
export interface AdaptiveLayoutRecommendation {
  mode: PageLayoutMode;
  columnWidths: number[];
  reason: string;
  confidence: number;
  alternatives: Array<{
    mode: PageLayoutMode;
    confidence: number;
    reason: string;
  }>;
}

/**
 * 智能断点检测器 - 基于内容分析的自适应断点计算
 */
export class IntelligentBreakpointDetector {
  private contentAnalysisCache = new Map<string, ContentAnalysisResult>();
  private breakpointSuggestions = new Map<string, IntelligentBreakpointSuggestion[]>();
  private performanceOptimization = true;
  
  constructor(
    private baseBreakpoints: BreakpointConfig,
    private enablePerformanceOptimization = true
  ) {
    this.performanceOptimization = enablePerformanceOptimization;
  }

  /**
   * 分析容器内容并生成智能断点建议
   */
  async analyzeContent(container: HTMLElement): Promise<ContentAnalysisResult> {
    const containerId = this.getContainerId(container);
    
    // 检查缓存
    if (this.contentAnalysisCache.has(containerId)) {
      return this.contentAnalysisCache.get(containerId)!;
    }

    const analysis = await this.performContentAnalysis(container);
    
    // 缓存结果
    this.contentAnalysisCache.set(containerId, analysis);
    
    return analysis;
  }

  /**
   * 执行详细的内容分析
   */
  private async performContentAnalysis(container: HTMLElement): Promise<ContentAnalysisResult> {
    const elements = this.getContentElements(container);
    const elementMetrics = await this.analyzeElements(elements);
    
    const totalElements = elements.length;
    const textElements = elements.filter(el => this.isTextElement(el)).length;
    const mediaElements = elements.filter(el => this.isMediaElement(el)).length;
    const complexElements = elements.filter(el => this.isComplexElement(el)).length;
    
    const averageElementWidth = elementMetrics.totalWidth / totalElements || 0;
    const averageElementHeight = elementMetrics.totalHeight / totalElements || 0;
    
    const containerArea = container.offsetWidth * container.offsetHeight;
    const contentArea = elementMetrics.totalWidth * elementMetrics.totalHeight;
    const contentDensity = containerArea > 0 ? contentArea / containerArea : 0;
    
    const recommendedColumns = this.calculateRecommendedColumns(
      totalElements,
      averageElementWidth,
      contentDensity,
      container.offsetWidth
    );
    
    const confidence = this.calculateConfidence(
      totalElements,
      contentDensity,
      elementMetrics.varianceWidth,
      elementMetrics.varianceHeight
    );

    return {
      totalElements,
      textElements,
      mediaElements,
      complexElements,
      averageElementWidth,
      averageElementHeight,
      contentDensity,
      recommendedColumns,
      confidence
    };
  }

  /**
   * 获取容器内的内容元素
   */
  private getContentElements(container: HTMLElement): HTMLElement[] {
    const contentSelectors = [
      '[data-block-id]',
      '.block-element',
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'img', 'video', 'canvas',
      '.content-block',
      '.text-block',
      '.media-block'
    ];
    
    const elements: HTMLElement[] = [];
    
    for (const selector of contentSelectors) {
      const found = container.querySelectorAll(selector);
      found.forEach(el => {
        if (el instanceof HTMLElement && !elements.includes(el)) {
          elements.push(el);
        }
      });
    }
    
    return elements.filter(el => this.isValidContentElement(el));
  }

  /**
   * 分析元素尺寸和属性
   */
  private async analyzeElements(elements: HTMLElement[]): Promise<{
    totalWidth: number;
    totalHeight: number;
    varianceWidth: number;
    varianceHeight: number;
  }> {
    const measurements = elements.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height
      };
    });

    const totalWidth = measurements.reduce((sum, m) => sum + m.width, 0);
    const totalHeight = measurements.reduce((sum, m) => sum + m.height, 0);
    
    const avgWidth = totalWidth / measurements.length;
    const avgHeight = totalHeight / measurements.length;
    
    const varianceWidth = measurements.reduce((sum, m) => 
      sum + Math.pow(m.width - avgWidth, 2), 0) / measurements.length;
    const varianceHeight = measurements.reduce((sum, m) => 
      sum + Math.pow(m.height - avgHeight, 2), 0) / measurements.length;

    return {
      totalWidth,
      totalHeight,
      varianceWidth,
      varianceHeight
    };
  }

  /**
   * 计算推荐的列数
   */
  private calculateRecommendedColumns(
    totalElements: number,
    averageElementWidth: number,
    contentDensity: number,
    containerWidth: number
  ): number {
    // 基于元素宽度的列数计算
    const widthBasedColumns = Math.floor(containerWidth / (averageElementWidth + 20));
    
    // 基于内容密度的调整
    let densityMultiplier = 1;
    if (contentDensity < 0.3) {
      densityMultiplier = 0.8; // 内容稀疏，减少列数
    } else if (contentDensity > 0.7) {
      densityMultiplier = 1.2; // 内容密集，增加列数
    }
    
    // 基于元素总数的调整
    let elementCountMultiplier = 1;
    if (totalElements < 5) {
      elementCountMultiplier = 0.7;
    } else if (totalElements > 20) {
      elementCountMultiplier = 1.3;
    }
    
    const recommendedColumns = Math.round(
      widthBasedColumns * densityMultiplier * elementCountMultiplier
    );
    
    // 限制在合理范围内
    return Math.max(1, Math.min(5, recommendedColumns));
  }

  /**
   * 计算分析置信度
   */
  private calculateConfidence(
    totalElements: number,
    contentDensity: number,
    varianceWidth: number,
    varianceHeight: number
  ): number {
    let confidence = 0.5; // 基础置信度
    
    // 元素数量影响置信度
    if (totalElements >= 10) {
      confidence += 0.2;
    } else if (totalElements < 3) {
      confidence -= 0.2;
    }
    
    // 内容密度影响置信度
    if (contentDensity >= 0.2 && contentDensity <= 0.8) {
      confidence += 0.2;
    }
    
    // 尺寸一致性影响置信度
    if (varianceWidth < 1000 && varianceHeight < 1000) {
      confidence += 0.1;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 生成智能断点建议
   */
  generateBreakpointSuggestions(
    analysis: ContentAnalysisResult,
    containerWidth: number
  ): IntelligentBreakpointSuggestion[] {
    const suggestions: IntelligentBreakpointSuggestion[] = [];
    
    // 基于推荐列数生成断点建议
    const targetColumns = analysis.recommendedColumns;
    
    for (let columns = 1; columns <= 5; columns++) {
      const requiredWidth = this.calculateRequiredWidth(columns, analysis.averageElementWidth);
      const layoutMode = ResponsiveUtils.getModeByColumnCount(columns);
      
      let confidence = analysis.confidence;
      
      // 调整置信度
      if (columns === targetColumns) {
        confidence *= 1.2; // 提高推荐列数的置信度
      } else {
        const deviation = Math.abs(columns - targetColumns);
        confidence *= Math.max(0.3, 1 - deviation * 0.2);
      }
      
      const reason = this.generateBreakpointReason(columns, analysis, requiredWidth);
      
      suggestions.push({
        breakpoint: requiredWidth,
        reason,
        confidence: Math.min(1, confidence),
        layoutMode,
        expectedColumns: columns
      });
    }
    
    // 按置信度排序
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 计算所需的最小宽度
   */
  private calculateRequiredWidth(columns: number, averageElementWidth: number): number {
    const minElementWidth = 200; // 最小元素宽度
    const elementWidth = Math.max(minElementWidth, averageElementWidth);
    const gap = 16; // 列间距
    
    return columns * elementWidth + (columns - 1) * gap + 40; // 加上容器内边距
  }

  /**
   * 生成断点建议的原因说明
   */
  private generateBreakpointReason(
    columns: number,
    analysis: ContentAnalysisResult,
    requiredWidth: number
  ): string {
    const reasons: string[] = [];
    
    if (columns === analysis.recommendedColumns) {
      reasons.push('基于内容分析的最佳列数');
    }
    
    if (analysis.contentDensity > 0.7) {
      reasons.push('内容密集，适合多列布局');
    } else if (analysis.contentDensity < 0.3) {
      reasons.push('内容稀疏，适合少列布局');
    }
    
    if (analysis.averageElementWidth > 300) {
      reasons.push('元素宽度较大，需要更多空间');
    }
    
    if (columns === 1) {
      reasons.push('移动端友好的单列布局');
    }
    
    return reasons.join('，') || `${columns}列布局 (最小宽度: ${requiredWidth}px)`;
  }

  /**
   * 生成自适应布局推荐
   */
  generateAdaptiveLayoutRecommendation(
    analysis: ContentAnalysisResult,
    currentWidth: number,
    currentMode: PageLayoutMode
  ): AdaptiveLayoutRecommendation {
    const suggestions = this.generateBreakpointSuggestions(analysis, currentWidth);
    const primarySuggestion = suggestions[0];
    
    if (!primarySuggestion) {
      return this.getDefaultRecommendation(currentMode);
    }
    
    const recommendedMode = primarySuggestion.layoutMode;
    const columnCount = LayoutModeConfig[recommendedMode].columns;
    
    // 生成列宽度建议
    const columnWidths = this.generateOptimalColumnWidths(
      columnCount,
      analysis,
      currentWidth
    );
    
    // 生成替代方案
    const alternatives = suggestions.slice(1, 4).map(suggestion => ({
      mode: suggestion.layoutMode,
      confidence: suggestion.confidence,
      reason: suggestion.reason
    }));
    
    return {
      mode: recommendedMode,
      columnWidths,
      reason: primarySuggestion.reason,
      confidence: primarySuggestion.confidence,
      alternatives
    };
  }

  /**
   * 生成最优列宽度分配
   */
  private generateOptimalColumnWidths(
    columnCount: number,
    analysis: ContentAnalysisResult,
    containerWidth: number
  ): number[] {
    const widths = new Array(columnCount);
    
    // 基于内容类型调整列宽度
    if (analysis.mediaElements > analysis.textElements) {
      // 媒体内容较多，主列宽度更大
      if (columnCount === 2) {
        return [0.6, 0.4];
      } else if (columnCount === 3) {
        return [0.5, 0.3, 0.2];
      }
    } else if (analysis.textElements > analysis.mediaElements * 2) {
      // 文本内容较多，平均分配
      return Array(columnCount).fill(1 / columnCount);
    }
    
    // 默认策略：主列稍大，其他列平均分配
    if (columnCount === 2) {
      return [0.55, 0.45];
    } else if (columnCount === 3) {
      return [0.4, 0.3, 0.3];
    } else if (columnCount === 4) {
      return [0.35, 0.25, 0.2, 0.2];
    } else if (columnCount === 5) {
      return [0.3, 0.2, 0.2, 0.15, 0.15];
    }
    
    return Array(columnCount).fill(1 / columnCount);
  }

  /**
   * 获取默认推荐
   */
  private getDefaultRecommendation(currentMode: PageLayoutMode): AdaptiveLayoutRecommendation {
    const columnCount = LayoutModeConfig[currentMode].columns;
    return {
      mode: currentMode,
      columnWidths: Array(columnCount).fill(1 / columnCount),
      reason: '保持当前布局模式',
      confidence: 0.5,
      alternatives: []
    };
  }

  /**
   * 实时监控和自适应调整
   */
  setupAdaptiveMonitoring(
    container: HTMLElement,
    callback: (recommendation: AdaptiveLayoutRecommendation) => void
  ): () => void {
    let isAnalyzing = false;
    
    const observer = new MutationObserver(async () => {
      if (isAnalyzing) return;
      
      isAnalyzing = true;
      
      try {
        // 清除缓存以获取最新分析
        const containerId = this.getContainerId(container);
        this.contentAnalysisCache.delete(containerId);
        
        // 重新分析内容
        const analysis = await this.analyzeContent(container);
        const currentWidth = container.getBoundingClientRect().width;
        const currentMode = this.getCurrentLayoutMode(container);
        
        // 生成新的推荐
        const recommendation = this.generateAdaptiveLayoutRecommendation(
          analysis,
          currentWidth,
          currentMode
        );
        
        // 只有在置信度足够高时才触发回调
        if (recommendation.confidence > 0.7) {
          callback(recommendation);
        }
      } finally {
        isAnalyzing = false;
      }
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    return () => observer.disconnect();
  }

  /**
   * 辅助方法
   */
  private getContainerId(container: HTMLElement): string {
    return container.id || container.dataset.containerId || 
           `container-${container.getBoundingClientRect().left}-${container.getBoundingClientRect().top}`;
  }

  private isTextElement(element: HTMLElement): boolean {
    const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV'];
    return textTags.includes(element.tagName) || 
           element.classList.contains('text-block') ||
           element.dataset.blockType === 'text';
  }

  private isMediaElement(element: HTMLElement): boolean {
    const mediaTags = ['IMG', 'VIDEO', 'CANVAS', 'SVG'];
    return mediaTags.includes(element.tagName) ||
           element.classList.contains('media-block') ||
           element.dataset.blockType === 'image';
  }

  private isComplexElement(element: HTMLElement): boolean {
    return element.children.length > 5 ||
           element.classList.contains('complex-block') ||
           element.dataset.blockType === 'code';
  }

  private isValidContentElement(element: HTMLElement): boolean {
    // 过滤掉不相关的元素
    const ignoredClasses = ['resizer', 'toolbar', 'menu', 'tooltip'];
    return !ignoredClasses.some(cls => element.classList.contains(cls)) &&
           element.offsetWidth > 0 && element.offsetHeight > 0;
  }

  private getCurrentLayoutMode(container: HTMLElement): PageLayoutMode {
    // 从容器类名或数据属性获取当前布局模式
    if (container.classList.contains('column-layout-1')) return 'single';
    if (container.classList.contains('column-layout-2')) return 'double';
    if (container.classList.contains('column-layout-3')) return 'triple';
    if (container.classList.contains('column-layout-4')) return 'quad';
    if (container.classList.contains('column-layout-5')) return 'five';
    
    return 'single'; // 默认值
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.contentAnalysisCache.clear();
    this.breakpointSuggestions.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): { contentAnalysis: number; breakpointSuggestions: number } {
    return {
      contentAnalysis: this.contentAnalysisCache.size,
      breakpointSuggestions: this.breakpointSuggestions.size
    };
  }
}

/**
 * 智能断点检测工具函数
 */
export const IntelligentBreakpointUtils = {
  /**
   * 快速分析容器并获取布局建议
   */
  async quickAnalyze(
    container: HTMLElement,
    baseBreakpoints: BreakpointConfig
  ): Promise<AdaptiveLayoutRecommendation> {
    const detector = new IntelligentBreakpointDetector(baseBreakpoints);
    const analysis = await detector.analyzeContent(container);
    const currentWidth = container.getBoundingClientRect().width;
    
    return detector.generateAdaptiveLayoutRecommendation(
      analysis,
      currentWidth,
      'single' // 默认当前模式
    );
  },

  /**
   * 创建内容感知的响应式监听器
   */
  createContentAwareListener(
    container: HTMLElement,
    baseBreakpoints: BreakpointConfig,
    callback: (event: ResponsiveChangeEvent & { recommendation?: AdaptiveLayoutRecommendation }) => void
  ): () => void {
    const detector = new IntelligentBreakpointDetector(baseBreakpoints);
    
    const observer = new ResizeObserver(async (entries) => {
      for (const entry of entries) {
        const analysis = await detector.analyzeContent(entry.target as HTMLElement);
        const { width, height } = entry.contentRect;
        
        const recommendation = detector.generateAdaptiveLayoutRecommendation(
          analysis,
          width,
          'single'
        );
        
        const event: ResponsiveChangeEvent & { recommendation?: AdaptiveLayoutRecommendation } = {
          width,
          height,
          breakpoint: ResponsiveUtils.getCurrentBreakpoint(width, baseBreakpoints),
          previousBreakpoint: '',
          orientation: ResponsiveUtils.getOrientation(),
          effectiveMode: recommendation.mode,
          maxColumns: recommendation.columnWidths.length,
          recommendation
        };
        
        callback(event);
      }
    });
    
    observer.observe(container);
    return () => observer.disconnect();
  }
};