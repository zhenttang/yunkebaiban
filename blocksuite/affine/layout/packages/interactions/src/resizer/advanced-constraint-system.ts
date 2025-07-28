import type { ContentAnalysisResult } from '../responsive/intelligent-breakpoint-detector.js';
import type { BreakpointConfig } from '../types/responsive-contracts.js';

/**
 * 约束规则类型
 */
export type ConstraintRuleType = 
  | 'min-width' 
  | 'max-width' 
  | 'aspect-ratio' 
  | 'content-based' 
  | 'proportional' 
  | 'custom';

/**
 * 约束规则接口
 */
export interface ConstraintRule {
  id: string;
  type: ConstraintRuleType;
  priority: number; // 1-10，10为最高优先级
  columnIndex?: number; // 可选，应用于特定列
  value: number | [number, number]; // 单值或范围
  condition?: (widths: number[], containerWidth: number) => boolean;
  message?: string;
  enabled: boolean;
}

/**
 * 约束违规信息
 */
export interface ConstraintViolation {
  ruleId: string;
  columnIndex: number;
  expectedValue: number;
  actualValue: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

/**
 * 约束应用结果
 */
export interface ConstraintApplicationResult {
  constrainedWidths: number[];
  violations: ConstraintViolation[];
  applied: string[]; // 应用的规则ID
  originalWidths: number[];
  success: boolean;
}

/**
 * 智能约束配置
 */
export interface SmartConstraintConfig {
  enableContentAnalysis: boolean;
  enableResponsiveConstraints: boolean;
  enableProportionalConstraints: boolean;
  autoAdjustOnViolation: boolean;
  preferredDistribution: 'equal' | 'golden-ratio' | 'content-based' | 'custom';
  customDistribution?: number[];
}

/**
 * 高级列宽约束系统
 */
export class AdvancedConstraintSystem {
  private rules = new Map<string, ConstraintRule>();
  private violationHistory = new Map<string, ConstraintViolation[]>();
  private config: SmartConstraintConfig;
  
  constructor(config: Partial<SmartConstraintConfig> = {}) {
    this.config = {
      enableContentAnalysis: true,
      enableResponsiveConstraints: true,
      enableProportionalConstraints: true,
      autoAdjustOnViolation: true,
      preferredDistribution: 'content-based',
      ...config
    };
    
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认约束规则
   */
  private initializeDefaultRules(): void {
    // 最小宽度约束
    this.addRule({
      id: 'global-min-width',
      type: 'min-width',
      priority: 9,
      value: 0.1, // 10%
      message: '列宽不能小于10%',
      enabled: true
    });

    // 最大宽度约束
    this.addRule({
      id: 'global-max-width',
      type: 'max-width',
      priority: 9,
      value: 0.8, // 80%
      message: '列宽不能大于80%',
      enabled: true
    });

    // 黄金比例约束（可选）
    this.addRule({
      id: 'golden-ratio-main',
      type: 'proportional',
      priority: 5,
      value: 0.618,
      condition: (widths) => widths.length === 2,
      message: '主列建议使用黄金比例',
      enabled: false
    });

    // 内容感知约束
    this.addRule({
      id: 'content-adaptive',
      type: 'content-based',
      priority: 7,
      value: [0.15, 0.7], // 范围
      message: '根据内容调整列宽',
      enabled: this.config.enableContentAnalysis
    });
  }

  /**
   * 添加约束规则
   */
  addRule(rule: ConstraintRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * 移除约束规则
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * 启用/禁用规则
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * 应用约束到列宽度数组
   */
  applyConstraints(
    widths: number[],
    containerWidth: number,
    contentAnalysis?: ContentAnalysisResult
  ): ConstraintApplicationResult {
    const originalWidths = [...widths];
    let constrainedWidths = [...widths];
    const violations: ConstraintViolation[] = [];
    const appliedRules: string[] = [];

    // 获取启用的规则并按优先级排序
    const enabledRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    // 逐个应用规则
    for (const rule of enabledRules) {
      const result = this.applyRule(rule, constrainedWidths, containerWidth, contentAnalysis);
      
      if (result.modified) {
        constrainedWidths = result.widths;
        appliedRules.push(rule.id);
      }
      
      violations.push(...result.violations);
    }

    // 归一化处理
    constrainedWidths = this.normalizeWidths(constrainedWidths);

    // 自动调整违规情况
    if (this.config.autoAdjustOnViolation && violations.length > 0) {
      constrainedWidths = this.autoCorrectViolations(constrainedWidths, violations, containerWidth);
    }

    return {
      constrainedWidths,
      violations,
      applied: appliedRules,
      originalWidths,
      success: violations.filter(v => v.severity === 'error').length === 0
    };
  }

  /**
   * 应用单个规则
   */
  private applyRule(
    rule: ConstraintRule,
    widths: number[],
    containerWidth: number,
    contentAnalysis?: ContentAnalysisResult
  ): { widths: number[]; violations: ConstraintViolation[]; modified: boolean } {
    const result = {
      widths: [...widths],
      violations: [] as ConstraintViolation[],
      modified: false
    };

    // 检查条件
    if (rule.condition && !rule.condition(widths, containerWidth)) {
      return result;
    }

    switch (rule.type) {
      case 'min-width':
        return this.applyMinWidthRule(rule, result.widths, containerWidth);
      
      case 'max-width':
        return this.applyMaxWidthRule(rule, result.widths, containerWidth);
      
      case 'aspect-ratio':
        return this.applyAspectRatioRule(rule, result.widths, containerWidth);
      
      case 'content-based':
        return this.applyContentBasedRule(rule, result.widths, containerWidth, contentAnalysis);
      
      case 'proportional':
        return this.applyProportionalRule(rule, result.widths, containerWidth);
      
      case 'custom':
        return this.applyCustomRule(rule, result.widths, containerWidth);
      
      default:
        return result;
    }
  }

  /**
   * 应用最小宽度规则
   */
  private applyMinWidthRule(
    rule: ConstraintRule,
    widths: number[],
    containerWidth: number
  ): { widths: number[]; violations: ConstraintViolation[]; modified: boolean } {
    const violations: ConstraintViolation[] = [];
    let modified = false;
    const minWidth = typeof rule.value === 'number' ? rule.value : rule.value[0];

    const targetColumns = rule.columnIndex !== undefined ? [rule.columnIndex] : 
                         Array.from({ length: widths.length }, (_, i) => i);

    for (const columnIndex of targetColumns) {
      if (columnIndex < widths.length && widths[columnIndex] < minWidth) {
        violations.push({
          ruleId: rule.id,
          columnIndex,
          expectedValue: minWidth,
          actualValue: widths[columnIndex],
          severity: 'error',
          message: rule.message || `列${columnIndex + 1}宽度不能小于${(minWidth * 100).toFixed(1)}%`,
          suggestion: `建议调整为${(minWidth * 100).toFixed(1)}%`
        });

        widths[columnIndex] = minWidth;
        modified = true;
      }
    }

    return { widths, violations, modified };
  }

  /**
   * 应用最大宽度规则
   */
  private applyMaxWidthRule(
    rule: ConstraintRule,
    widths: number[],
    containerWidth: number
  ): { widths: number[]; violations: ConstraintViolation[]; modified: boolean } {
    const violations: ConstraintViolation[] = [];
    let modified = false;
    const maxWidth = typeof rule.value === 'number' ? rule.value : rule.value[1];

    const targetColumns = rule.columnIndex !== undefined ? [rule.columnIndex] : 
                         Array.from({ length: widths.length }, (_, i) => i);

    for (const columnIndex of targetColumns) {
      if (columnIndex < widths.length && widths[columnIndex] > maxWidth) {
        violations.push({
          ruleId: rule.id,
          columnIndex,
          expectedValue: maxWidth,
          actualValue: widths[columnIndex],
          severity: 'warning',
          message: rule.message || `列${columnIndex + 1}宽度不能大于${(maxWidth * 100).toFixed(1)}%`,
          suggestion: `建议调整为${(maxWidth * 100).toFixed(1)}%`
        });

        widths[columnIndex] = maxWidth;
        modified = true;
      }
    }

    return { widths, violations, modified };
  }

  /**
   * 应用宽高比规则
   */
  private applyAspectRatioRule(
    rule: ConstraintRule,
    widths: number[],
    containerWidth: number
  ): { widths: number[]; violations: ConstraintViolation[]; modified: boolean } {
    // 这里可以根据容器高度和期望的宽高比调整列宽
    // 当前简化实现
    return { widths, violations: [], modified: false };
  }

  /**
   * 应用基于内容的规则
   */
  private applyContentBasedRule(
    rule: ConstraintRule,
    widths: number[],
    containerWidth: number,
    contentAnalysis?: ContentAnalysisResult
  ): { widths: number[]; violations: ConstraintViolation[]; modified: boolean } {
    if (!contentAnalysis || !this.config.enableContentAnalysis) {
      return { widths, violations: [], modified: false };
    }

    const violations: ConstraintViolation[] = [];
    let modified = false;

    // 根据内容分析调整列宽
    const recommendedWidths = this.calculateContentBasedWidths(widths, contentAnalysis);
    
    for (let i = 0; i < widths.length; i++) {
      const recommendedWidth = recommendedWidths[i];
      const currentWidth = widths[i];
      const difference = Math.abs(recommendedWidth - currentWidth);
      
      // 如果差异较大，给出建议
      if (difference > 0.1) {
        violations.push({
          ruleId: rule.id,
          columnIndex: i,
          expectedValue: recommendedWidth,
          actualValue: currentWidth,
          severity: 'info',
          message: `根据内容分析，建议调整列${i + 1}的宽度`,
          suggestion: `建议宽度: ${(recommendedWidth * 100).toFixed(1)}%`
        });
      }
    }

    return { widths: recommendedWidths, violations, modified: true };
  }

  /**
   * 应用比例规则
   */
  private applyProportionalRule(
    rule: ConstraintRule,
    widths: number[],
    containerWidth: number
  ): { widths: number[]; violations: ConstraintViolation[]; modified: boolean } {
    if (!this.config.enableProportionalConstraints) {
      return { widths, violations: [], modified: false };
    }

    const violations: ConstraintViolation[] = [];
    let modified = false;
    const ratio = typeof rule.value === 'number' ? rule.value : rule.value[0];

    // 黄金比例约束的示例实现
    if (widths.length === 2 && rule.id === 'golden-ratio-main') {
      const goldenRatio = 0.618;
      const newWidths = [goldenRatio, 1 - goldenRatio];
      
      return { widths: newWidths, violations, modified: true };
    }

    return { widths, violations, modified };
  }

  /**
   * 应用自定义规则
   */
  private applyCustomRule(
    rule: ConstraintRule,
    widths: number[],
    containerWidth: number
  ): { widths: number[]; violations: ConstraintViolation[]; modified: boolean } {
    // 自定义规则的实现取决于具体需求
    return { widths, violations: [], modified: false };
  }

  /**
   * 基于内容分析计算推荐列宽
   */
  private calculateContentBasedWidths(
    currentWidths: number[],
    analysis: ContentAnalysisResult
  ): number[] {
    const columnCount = currentWidths.length;
    const weights = new Array(columnCount).fill(1);

    // 根据内容密度调整权重
    if (analysis.contentDensity > 0.7) {
      // 高密度内容，主列需要更多空间
      weights[0] *= 1.3;
    } else if (analysis.contentDensity < 0.3) {
      // 低密度内容，可以更平均分配
      // 保持默认权重
    }

    // 根据元素类型调整权重
    if (analysis.mediaElements > analysis.textElements) {
      // 媒体内容较多，需要更宽的列
      weights[0] *= 1.2;
    }

    // 归一化权重
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    return weights.map(weight => weight / totalWeight);
  }

  /**
   * 归一化列宽度确保总和为1
   */
  private normalizeWidths(widths: number[]): number[] {
    const sum = widths.reduce((total, width) => total + width, 0);
    if (sum === 0) {
      return new Array(widths.length).fill(1 / widths.length);
    }
    return widths.map(width => width / sum);
  }

  /**
   * 自动修正违规情况
   */
  private autoCorrectViolations(
    widths: number[],
    violations: ConstraintViolation[],
    containerWidth: number
  ): number[] {
    let correctedWidths = [...widths];

    // 按严重程度排序违规
    const sortedViolations = violations.sort((a, b) => {
      const severityOrder = { error: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    for (const violation of sortedViolations) {
      if (violation.severity === 'error') {
        correctedWidths[violation.columnIndex] = violation.expectedValue;
      }
    }

    return this.normalizeWidths(correctedWidths);
  }

  /**
   * 生成智能分布建议
   */
  generateSmartDistribution(
    columnCount: number,
    containerWidth: number,
    contentAnalysis?: ContentAnalysisResult
  ): number[] {
    switch (this.config.preferredDistribution) {
      case 'equal':
        return new Array(columnCount).fill(1 / columnCount);
      
      case 'golden-ratio':
        return this.generateGoldenRatioDistribution(columnCount);
      
      case 'content-based':
        return this.generateContentBasedDistribution(columnCount, contentAnalysis);
      
      case 'custom':
        return this.config.customDistribution?.slice(0, columnCount) || 
               new Array(columnCount).fill(1 / columnCount);
      
      default:
        return new Array(columnCount).fill(1 / columnCount);
    }
  }

  /**
   * 生成黄金比例分布
   */
  private generateGoldenRatioDistribution(columnCount: number): number[] {
    if (columnCount === 2) {
      return [0.618, 0.382];
    } else if (columnCount === 3) {
      return [0.5, 0.309, 0.191];
    } else {
      // 对于其他列数，使用递减的黄金比例
      const weights = [];
      let remaining = 1;
      for (let i = 0; i < columnCount - 1; i++) {
        const weight = remaining * 0.618;
        weights.push(weight);
        remaining -= weight;
      }
      weights.push(remaining);
      return weights;
    }
  }

  /**
   * 生成基于内容的分布
   */
  private generateContentBasedDistribution(
    columnCount: number,
    analysis?: ContentAnalysisResult
  ): number[] {
    if (!analysis) {
      return new Array(columnCount).fill(1 / columnCount);
    }
    
    return this.calculateContentBasedWidths(
      new Array(columnCount).fill(1 / columnCount),
      analysis
    );
  }

  /**
   * 获取所有约束规则
   */
  getRules(): ConstraintRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 获取违规历史
   */
  getViolationHistory(ruleId?: string): ConstraintViolation[] {
    if (ruleId) {
      return this.violationHistory.get(ruleId) || [];
    }
    
    const allViolations: ConstraintViolation[] = [];
    for (const violations of this.violationHistory.values()) {
      allViolations.push(...violations);
    }
    return allViolations;
  }

  /**
   * 清理违规历史
   */
  clearViolationHistory(): void {
    this.violationHistory.clear();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SmartConstraintConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 根据新配置更新规则状态
    this.toggleRule('content-adaptive', this.config.enableContentAnalysis);
  }

  /**
   * 导出约束配置
   */
  exportConfig(): { rules: ConstraintRule[]; config: SmartConstraintConfig } {
    return {
      rules: this.getRules(),
      config: { ...this.config }
    };
  }

  /**
   * 导入约束配置
   */
  importConfig(data: { rules: ConstraintRule[]; config: SmartConstraintConfig }): void {
    this.rules.clear();
    data.rules.forEach(rule => this.addRule(rule));
    this.updateConfig(data.config);
  }
}

/**
 * 约束系统工具函数
 */
export const ConstraintSystemUtils = {
  /**
   * 创建预设约束配置
   */
  createPresetConfig(preset: 'strict' | 'balanced' | 'flexible'): SmartConstraintConfig {
    const configs = {
      strict: {
        enableContentAnalysis: true,
        enableResponsiveConstraints: true,
        enableProportionalConstraints: true,
        autoAdjustOnViolation: true,
        preferredDistribution: 'content-based' as const
      },
      balanced: {
        enableContentAnalysis: true,
        enableResponsiveConstraints: true,
        enableProportionalConstraints: false,
        autoAdjustOnViolation: true,
        preferredDistribution: 'equal' as const
      },
      flexible: {
        enableContentAnalysis: false,
        enableResponsiveConstraints: false,
        enableProportionalConstraints: false,
        autoAdjustOnViolation: false,
        preferredDistribution: 'equal' as const
      }
    };
    
    return configs[preset];
  },

  /**
   * 验证约束规则
   */
  validateRule(rule: ConstraintRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!rule.id) {
      errors.push('规则必须有ID');
    }
    
    if (rule.priority < 1 || rule.priority > 10) {
      errors.push('优先级必须在1-10之间');
    }
    
    if (typeof rule.value === 'number' && (rule.value < 0 || rule.value > 1)) {
      errors.push('数值类型的值必须在0-1之间');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 生成约束报告
   */
  generateConstraintReport(
    result: ConstraintApplicationResult,
    rules: ConstraintRule[]
  ): string {
    const lines: string[] = [];
    
    lines.push('=== 列宽约束应用报告 ===');
    lines.push(`应用状态: ${result.success ? '成功' : '失败'}`);
    lines.push(`应用的规则: ${result.applied.join(', ')}`);
    lines.push(`违规数量: ${result.violations.length}`);
    
    if (result.violations.length > 0) {
      lines.push('\n=== 违规详情 ===');
      result.violations.forEach((violation, index) => {
        lines.push(`${index + 1}. ${violation.message}`);
        lines.push(`   列: ${violation.columnIndex + 1}, 严重程度: ${violation.severity}`);
        if (violation.suggestion) {
          lines.push(`   建议: ${violation.suggestion}`);
        }
      });
    }
    
    lines.push('\n=== 宽度变化 ===');
    lines.push(`原始宽度: ${result.originalWidths.map(w => (w * 100).toFixed(1) + '%').join(', ')}`);
    lines.push(`约束后宽度: ${result.constrainedWidths.map(w => (w * 100).toFixed(1) + '%').join(', ')}`);
    
    return lines.join('\n');
  }
};