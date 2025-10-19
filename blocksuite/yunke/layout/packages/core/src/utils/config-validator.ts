/**
 * BlockSuite Layout - 配置验证和迁移工具
 * 
 * @author 开发者A2 - 数据存储专家
 * @description 配置数据验证和版本迁移功能
 */

import type { 
  DocLayoutConfig, 
  ValidationResult,
  MigrationInfo
} from '../types/contracts.js';

import type { PageLayoutMode } from '../types/layout.js';
import { LayoutModeConfig } from '../types/layout.js';

/**
 * 配置验证器
 * 提供完整的配置数据验证功能
 */
export class ConfigValidator {
  
  /**
   * 验证布局配置的完整性和有效性
   */
  static validateConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 基础字段验证
    this._validateRequiredFields(config, errors);
    this._validateFieldTypes(config, errors, warnings);
    this._validateLayoutMode(config, errors);
    this._validateColumnWidths(config, errors, warnings);
    this._validateVersion(config, warnings);
    this._validateTimestamp(config, warnings);

    // 业务逻辑验证
    this._validateBusinessRules(config, errors, warnings);

    // 生成建议
    if (errors.length > 0) {
      suggestions.push('请检查配置结构和必需字段');
    }
    if (warnings.length > 0) {
      suggestions.push('建议更新配置以符合最新格式');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * 快速验证配置是否有效
   */
  static isValidConfig(config: any): boolean {
    return this.validateConfig(config).valid;
  }

  /**
   * 验证配置兼容性
   */
  static validateCompatibility(config: DocLayoutConfig, targetVersion: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 版本兼容性检查
    if (config.version !== targetVersion) {
      warnings.push(`配置版本 ${config.version} 与目标版本 ${targetVersion} 不匹配`);
    }

    // 字段兼容性检查
    if (targetVersion === '1.0.0') {
      if (!config.responsive) {
        warnings.push('缺少响应式标志，将使用默认值');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions: warnings.length > 0 ? ['建议进行版本迁移'] : undefined
    };
  }

  // ================================
  // 私有验证方法
  // ================================

  private static _validateRequiredFields(config: any, errors: string[]): void {
    const requiredFields = ['docId', 'layoutMode', 'columnWidths', 'responsive', 'lastModified', 'version'];
    
    for (const field of requiredFields) {
      if (!(field in config) || config[field] === null || config[field] === undefined) {
        errors.push(`缺少必需字段: ${field}`);
      }
    }
  }

  private static _validateFieldTypes(config: any, errors: string[], warnings: string[]): void {
    // docId 类型检查
    if (config.docId && typeof config.docId !== 'string') {
      errors.push('docId 必须是字符串类型');
    }

    // layoutMode 类型检查
    if (config.layoutMode && typeof config.layoutMode !== 'string') {
      errors.push('layoutMode 必须是字符串类型');
    }

    // columnWidths 类型检查
    if (config.columnWidths && !Array.isArray(config.columnWidths)) {
      errors.push('columnWidths 必须是数组类型');
    }

    // responsive 类型检查
    if (config.responsive !== undefined && typeof config.responsive !== 'boolean') {
      warnings.push('responsive 应该是布尔类型');
    }

    // lastModified 类型检查
    if (config.lastModified !== undefined && typeof config.lastModified !== 'number') {
      errors.push('lastModified 必须是数字类型');
    }

    // version 类型检查
    if (config.version !== undefined && typeof config.version !== 'string') {
      warnings.push('version 应该是字符串类型');
    }
  }

  private static _validateLayoutMode(config: any, errors: string[]): void {
    if (!config.layoutMode) return;

    const validModes = Object.values(PageLayoutMode);
    if (!validModes.includes(config.layoutMode)) {
      errors.push(`无效的布局模式: ${config.layoutMode}，有效值: ${validModes.join(', ')}`);
    }
  }

  private static _validateColumnWidths(config: any, errors: string[], warnings: string[]): void {
    if (!config.columnWidths || !Array.isArray(config.columnWidths)) return;

    // 检查数组长度
    if (config.layoutMode) {
      const expectedColumns = LayoutModeConfig[config.layoutMode as PageLayoutMode]?.columns;
      if (expectedColumns && config.columnWidths.length !== expectedColumns) {
        errors.push(`列宽数组长度 (${config.columnWidths.length}) 与期望列数 (${expectedColumns}) 不匹配`);
      }
    }

    // 检查宽度值
    for (let i = 0; i < config.columnWidths.length; i++) {
      const width = config.columnWidths[i];
      
      if (typeof width !== 'number') {
        errors.push(`columnWidths[${i}] 必须是数字类型`);
        continue;
      }

      if (width <= 0) {
        errors.push(`columnWidths[${i}] 必须是正数`);
      }

      if (width > 10) {
        warnings.push(`columnWidths[${i}] 值 (${width}) 可能过大`);
      }
    }

    // 检查宽度总和的合理性
    if (config.columnWidths.every((w: any) => typeof w === 'number')) {
      const totalWidth = config.columnWidths.reduce((sum: number, width: number) => sum + width, 0);
      const expectedTotal = config.columnWidths.length;
      const tolerance = 0.1;

      if (Math.abs(totalWidth - expectedTotal) > tolerance) {
        warnings.push(`列宽总和 (${totalWidth.toFixed(2)}) 与期望值 (${expectedTotal}) 差异较大`);
      }
    }
  }

  private static _validateVersion(config: any, warnings: string[]): void {
    if (!config.version) return;

    // 版本格式检查
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(config.version)) {
      warnings.push(`版本格式不符合 x.y.z 模式: ${config.version}`);
    }

    // 检查是否为已知版本
    const knownVersions = ['1.0.0', '0.9.0', '0.8.0'];
    if (!knownVersions.includes(config.version)) {
      warnings.push(`未知的版本号: ${config.version}`);
    }
  }

  private static _validateTimestamp(config: any, warnings: string[]): void {
    if (!config.lastModified) return;

    const now = Date.now();
    const timestamp = config.lastModified;

    // 检查时间戳是否合理
    if (timestamp > now) {
      warnings.push('lastModified 时间戳指向未来');
    }

    // 检查时间戳是否过旧 (超过1年)
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    if (timestamp < oneYearAgo) {
      warnings.push('配置最后修改时间超过一年前，可能需要更新');
    }
  }

  private static _validateBusinessRules(config: any, errors: string[], warnings: string[]): void {
    // 检查文档ID格式
    if (config.docId && typeof config.docId === 'string') {
      if (config.docId.length === 0) {
        errors.push('docId 不能为空字符串');
      } else if (config.docId.length > 100) {
        warnings.push('docId 长度过长，可能影响性能');
      }
    }

    // 检查响应式与布局模式的兼容性
    if (config.responsive === false && config.layoutMode !== PageLayoutMode.Normal) {
      warnings.push('禁用响应式模式时建议使用单列布局');
    }
  }
}

/**
 * 配置迁移器
 * 处理不同版本之间的配置迁移
 */
export class ConfigMigrator {
  
  /**
   * 检查是否需要迁移
   */
  static checkMigrationNeeded(config: DocLayoutConfig, targetVersion: string = '1.0.0'): MigrationInfo | null {
    const currentVersion = config.version || '0.0.0';
    
    if (currentVersion === targetVersion) {
      return null;
    }

    return {
      fromVersion: currentVersion,
      toVersion: targetVersion,
      steps: this._getMigrationSteps(currentVersion, targetVersion),
      requiresConfirmation: this._requiresUserConfirmation(currentVersion, targetVersion)
    };
  }

  /**
   * 执行配置迁移
   */
  static async migrateConfig(config: DocLayoutConfig, migrationInfo: MigrationInfo): Promise<DocLayoutConfig> {
    let migratedConfig = { ...config };

    console.debug(`[ConfigMigrator] 开始迁移配置从 ${migrationInfo.fromVersion} 到 ${migrationInfo.toVersion}`);

    // 按步骤执行迁移
    for (const step of migrationInfo.steps) {
      migratedConfig = await this._executeStep(migratedConfig, step);
      console.debug(`[ConfigMigrator] 完成迁移步骤: ${step}`);
    }

    // 更新版本和时间戳
    migratedConfig.version = migrationInfo.toVersion;
    migratedConfig.lastModified = Date.now();

    // 验证迁移结果
    const validation = ConfigValidator.validateConfig(migratedConfig);
    if (!validation.valid) {
      throw new Error(`迁移后配置验证失败: ${validation.errors.join(', ')}`);
    }

    console.debug(`[ConfigMigrator] 配置迁移完成`);
    return migratedConfig;
  }

  /**
   * 批量迁移配置
   */
  static async migrateMultipleConfigs(
    configs: DocLayoutConfig[], 
    targetVersion: string = '1.0.0'
  ): Promise<DocLayoutConfig[]> {
    const results: DocLayoutConfig[] = [];
    const errors: Array<{docId: string, error: Error}> = [];

    for (const config of configs) {
      try {
        const migrationInfo = this.checkMigrationNeeded(config, targetVersion);
        if (migrationInfo) {
          const migratedConfig = await this.migrateConfig(config, migrationInfo);
          results.push(migratedConfig);
        } else {
          results.push(config);
        }
      } catch (error) {
        errors.push({ docId: config.docId, error: error as Error });
      }
    }

    if (errors.length > 0) {
      console.warn(`[ConfigMigrator] 批量迁移中出现 ${errors.length} 个错误:`, errors);
    }

    return results;
  }

  // ================================
  // 私有迁移方法
  // ================================

  private static _getMigrationSteps(fromVersion: string, toVersion: string): string[] {
    const steps: string[] = [];

    // 从 0.x.x 到 1.0.0 的迁移步骤
    if (fromVersion.startsWith('0.') && toVersion === '1.0.0') {
      steps.push('normalize-column-widths');
      steps.push('add-responsive-flag');
      steps.push('update-version-format');
    }

    // 从无版本到 1.0.0 的迁移步骤
    if (!fromVersion || fromVersion === '0.0.0') {
      steps.push('initialize-version');
      steps.push('normalize-column-widths');
      steps.push('add-responsive-flag');
      steps.push('validate-layout-mode');
    }

    return steps;
  }

  private static _requiresUserConfirmation(fromVersion: string, toVersion: string): boolean {
    // 主版本升级需要用户确认
    const fromMajor = parseInt(fromVersion.split('.')[0] || '0');
    const toMajor = parseInt(toVersion.split('.')[0] || '0');
    
    return toMajor > fromMajor;
  }

  private static async _executeStep(config: DocLayoutConfig, step: string): Promise<DocLayoutConfig> {
    const migratedConfig = { ...config };

    switch (step) {
      case 'initialize-version':
        if (!migratedConfig.version) {
          migratedConfig.version = '1.0.0';
        }
        break;

      case 'normalize-column-widths':
        if (migratedConfig.columnWidths && Array.isArray(migratedConfig.columnWidths)) {
          const widths = migratedConfig.columnWidths;
          const sum = widths.reduce((total, width) => total + width, 0);
          const expectedSum = widths.length;
          
          // 如果总和不等于列数，则标准化
          if (Math.abs(sum - expectedSum) > 0.01) {
            migratedConfig.columnWidths = widths.map(width => (width / sum) * expectedSum);
          }
        }
        break;

      case 'add-responsive-flag':
        if (migratedConfig.responsive === undefined) {
          migratedConfig.responsive = true; // 默认启用响应式
        }
        break;

      case 'validate-layout-mode':
        if (!Object.values(PageLayoutMode).includes(migratedConfig.layoutMode)) {
          console.warn(`[ConfigMigrator] 无效的布局模式 ${migratedConfig.layoutMode}，重置为单列`);
          migratedConfig.layoutMode = PageLayoutMode.Normal;
          migratedConfig.columnWidths = [1];
        }
        break;

      case 'update-version-format':
        // 确保版本格式为 x.y.z
        if (migratedConfig.version && !/^\d+\.\d+\.\d+$/.test(migratedConfig.version)) {
          migratedConfig.version = '1.0.0';
        }
        break;

      default:
        console.warn(`[ConfigMigrator] 未知的迁移步骤: ${step}`);
    }

    return migratedConfig;
  }
}

/**
 * 配置修复器
 * 修复损坏或不完整的配置
 */
export class ConfigRepairer {
  
  /**
   * 尝试修复损坏的配置
   */
  static repairConfig(config: any): DocLayoutConfig {
    console.debug('[ConfigRepairer] 开始修复配置:', config);

    const repairedConfig: Partial<DocLayoutConfig> = {};

    // 修复 docId
    repairedConfig.docId = this._repairDocId(config.docId);

    // 修复 layoutMode
    repairedConfig.layoutMode = this._repairLayoutMode(config.layoutMode);

    // 修复 columnWidths
    repairedConfig.columnWidths = this._repairColumnWidths(config.columnWidths, repairedConfig.layoutMode);

    // 修复 responsive
    repairedConfig.responsive = this._repairResponsive(config.responsive);

    // 修复 lastModified
    repairedConfig.lastModified = this._repairLastModified(config.lastModified);

    // 修复 version
    repairedConfig.version = this._repairVersion(config.version);

    // 保留其他有效字段
    if (config.customData && typeof config.customData === 'object') {
      (repairedConfig as any).customData = config.customData;
    }

    console.debug('[ConfigRepairer] 配置修复完成:', repairedConfig);
    return repairedConfig as DocLayoutConfig;
  }

  /**
   * 检查配置是否可以修复
   */
  static canRepair(config: any): boolean {
    // 至少需要有一个可识别的字段
    return !!(
      config &&
      (config.docId || config.layoutMode || config.columnWidths || config.version)
    );
  }

  // ================================
  // 私有修复方法
  // ================================

  private static _repairDocId(docId: any): string {
    if (typeof docId === 'string' && docId.trim().length > 0) {
      return docId.trim();
    }
    
    // 生成一个默认的文档ID
    return `repaired-doc-${Date.now()}`;
  }

  private static _repairLayoutMode(layoutMode: any): PageLayoutMode {
    if (typeof layoutMode === 'string' && Object.values(PageLayoutMode).includes(layoutMode as PageLayoutMode)) {
      return layoutMode as PageLayoutMode;
    }
    
    return PageLayoutMode.Normal;
  }

  private static _repairColumnWidths(columnWidths: any, layoutMode: PageLayoutMode): number[] {
    const expectedColumns = LayoutModeConfig[layoutMode].columns;
    
    if (Array.isArray(columnWidths) && 
        columnWidths.length === expectedColumns &&
        columnWidths.every(w => typeof w === 'number' && w > 0)) {
      return columnWidths;
    }
    
    // 返回默认宽度
    return LayoutModeConfig[layoutMode].defaultWidths;
  }

  private static _repairResponsive(responsive: any): boolean {
    if (typeof responsive === 'boolean') {
      return responsive;
    }
    
    return true; // 默认启用响应式
  }

  private static _repairLastModified(lastModified: any): number {
    if (typeof lastModified === 'number' && lastModified > 0 && lastModified <= Date.now()) {
      return lastModified;
    }
    
    return Date.now();
  }

  private static _repairVersion(version: any): string {
    if (typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version)) {
      return version;
    }
    
    return '1.0.0';
  }
}

/**
 * 导出的工具函数
 */
export const ConfigUtils = {
  validate: ConfigValidator.validateConfig.bind(ConfigValidator),
  isValid: ConfigValidator.isValidConfig.bind(ConfigValidator),
  migrate: ConfigMigrator.migrateConfig.bind(ConfigMigrator),
  checkMigration: ConfigMigrator.checkMigrationNeeded.bind(ConfigMigrator),
  repair: ConfigRepairer.repairConfig.bind(ConfigRepairer),
  canRepair: ConfigRepairer.canRepair.bind(ConfigRepairer)
};