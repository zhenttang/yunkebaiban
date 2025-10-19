/**
 * BlockSuite Layout - Mock存储服务实现
 * 
 * @author 开发者A2 - 数据存储专家
 * @description Mock存储服务，供其他开发者在开发阶段使用
 */

import type { 
  IStorageService, 
  DocLayoutConfig, 
  DocLayoutConfigBatch, 
  StorageOptions, 
  StorageStats,
  ValidationResult,
  MigrationInfo,
  SyncStatus
} from '../types/contracts.js';

import type { 
  PageLayoutMode,
  LayoutModeConfigMap,
  LayoutError,
  LayoutErrorCode
} from '../types/layout.js';

/**
 * Mock存储服务实现
 * 使用内存存储，提供完整的IStorageService接口
 */
export class MockStorageService implements IStorageService {
  private storage = new Map<string, DocLayoutConfig>();
  private cache = new Map<string, DocLayoutConfig>();
  private stats = {
    saves: 0,
    loads: 0,
    deletes: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  private options: Required<StorageOptions> = {
    enableCache: true,
    cacheSize: 100,
    enableLocalStorage: false, // Mock不使用真实localStorage
    compressionLevel: 0,
    storagePrefix: 'mock-layout'
  };

  // ================================
  // 基础存储操作
  // ================================

  async saveLayoutConfig(docId: string, config: Partial<DocLayoutConfig>): Promise<void> {
    // 模拟异步延迟
    await this._delay(30);
    
    // 验证输入
    if (!docId) {
      throw new Error('DocId is required');
    }

    // 获取现有配置或创建默认配置
    const existingConfig = this.storage.get(docId) || this._createDefaultConfig(docId);
    
    // 合并配置
    const newConfig: DocLayoutConfig = {
      ...existingConfig,
      ...config,
      docId, // 确保docId不被覆盖
      lastModified: Date.now()
    };

    // 验证配置有效性
    const validation = this.validateConfig(newConfig);
    if (!validation.valid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
    }

    // 保存到内存存储
    this.storage.set(docId, newConfig);
    
    // 更新缓存
    if (this.options.enableCache) {
      this.cache.set(docId, { ...newConfig });
    }

    // 更新统计
    this.stats.saves++;

    console.log(`[MockStorageService] Saved config for doc: ${docId}`, newConfig);
  }

  async loadLayoutConfig(docId: string): Promise<DocLayoutConfig | null> {
    // 模拟异步延迟
    await this._delay(20);
    
    if (!docId) {
      return null;
    }

    // 首先检查缓存
    if (this.options.enableCache && this.cache.has(docId)) {
      this.stats.cacheHits++;
      const cached = this.cache.get(docId)!;
      console.log(`[MockStorageService] Cache hit for doc: ${docId}`);
      return { ...cached }; // 返回副本
    }

    // 从存储加载
    const config = this.storage.get(docId);
    this.stats.loads++;
    
    if (config) {
      // 添加到缓存
      if (this.options.enableCache) {
        this.cache.set(docId, { ...config });
      }
      console.log(`[MockStorageService] Loaded config for doc: ${docId}`, config);
      return { ...config }; // 返回副本
    } else {
      this.stats.cacheMisses++;
      console.log(`[MockStorageService] No config found for doc: ${docId}`);
      return null;
    }
  }

  async updateLayoutConfig(docId: string, updates: Partial<DocLayoutConfig>): Promise<void> {
    // 模拟异步延迟
    await this._delay(25);
    
    const existingConfig = await this.loadLayoutConfig(docId);
    if (!existingConfig) {
      throw new Error(`Config not found for doc: ${docId}`);
    }

    // 合并更新
    const updatedConfig = {
      ...existingConfig,
      ...updates,
      docId, // 确保docId不被更改
      lastModified: Date.now()
    };

    await this.saveLayoutConfig(docId, updatedConfig);
  }

  async deleteLayoutConfig(docId: string): Promise<void> {
    // 模拟异步延迟
    await this._delay(15);
    
    if (!docId) {
      return;
    }

    // 从存储删除
    const deleted = this.storage.delete(docId);
    
    // 从缓存删除
    this.cache.delete(docId);
    
    // 更新统计
    if (deleted) {
      this.stats.deletes++;
      console.log(`[MockStorageService] Deleted config for doc: ${docId}`);
    }
  }

  // ================================
  // 批量操作
  // ================================

  async saveMultipleConfigs(configs: DocLayoutConfigBatch): Promise<void> {
    // 模拟批量操作延迟
    await this._delay(50);
    
    console.log(`[MockStorageService] Saving batch: ${configs.batchId} with ${configs.configs.length} configs`);
    
    for (const config of configs.configs) {
      await this.saveLayoutConfig(config.docId, config);
    }
  }

  async loadMultipleConfigs(docIds: string[]): Promise<Map<string, DocLayoutConfig>> {
    // 模拟批量操作延迟
    await this._delay(40);
    
    const result = new Map<string, DocLayoutConfig>();
    
    for (const docId of docIds) {
      const config = await this.loadLayoutConfig(docId);
      if (config) {
        result.set(docId, config);
      }
    }
    
    console.log(`[MockStorageService] Loaded ${result.size} configs from ${docIds.length} requested`);
    return result;
  }

  async listStoredDocuments(): Promise<string[]> {
    await this._delay(10);
    return Array.from(this.storage.keys());
  }

  // ================================
  // 缓存管理
  // ================================

  clearCache(): void {
    this.cache.clear();
    console.log('[MockStorageService] Cache cleared');
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  setCacheOptions(options: Partial<StorageOptions>): void {
    this.options = { ...this.options, ...options };
    console.log('[MockStorageService] Cache options updated:', options);
  }

  // ================================
  // 统计和监控
  // ================================

  async getStorageStats(): Promise<StorageStats> {
    await this._delay(5);
    
    const hitRate = this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0;
    
    return {
      totalConfigs: this.storage.size,
      cacheHitRate: hitRate,
      storageSize: this._calculateStorageSize(),
      lastUpdated: Date.now()
    };
  }

  async getStorageUsage(): Promise<number> {
    await this._delay(5);
    return this._calculateStorageSize();
  }

  // ================================
  // 数据验证和迁移
  // ================================

  validateConfig(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必需字段
    if (!config.docId) {
      errors.push('docId is required');
    }
    if (!config.layoutMode) {
      errors.push('layoutMode is required');
    }
    if (!Array.isArray(config.columnWidths)) {
      errors.push('columnWidths must be an array');
    }

    // 检查布局模式有效性
    if (config.layoutMode && !Object.values(PageLayoutMode).includes(config.layoutMode)) {
      errors.push(`Invalid layoutMode: ${config.layoutMode}`);
    }

    // 检查列宽度
    if (config.layoutMode && config.columnWidths) {
      const expectedColumns = LayoutModeConfigMap[config.layoutMode as PageLayoutMode]?.columns;
      if (expectedColumns && config.columnWidths.length !== expectedColumns) {
        errors.push(`columnWidths length (${config.columnWidths.length}) doesn't match expected columns (${expectedColumns})`);
      }
      
      // 检查宽度值
      for (let i = 0; i < config.columnWidths.length; i++) {
        const width = config.columnWidths[i];
        if (typeof width !== 'number' || width <= 0) {
          errors.push(`columnWidths[${i}] must be a positive number`);
        }
      }
    }

    // 检查版本
    if (config.version && typeof config.version !== 'string') {
      warnings.push('version should be a string');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions: errors.length > 0 ? ['Check the config structure and required fields'] : undefined
    };
  }

  async checkMigrationNeeded(docId: string): Promise<MigrationInfo | null> {
    await this._delay(10);
    
    const config = await this.loadLayoutConfig(docId);
    if (!config) {
      return null;
    }

    // Mock数据通常不需要迁移
    if (config.version !== '1.0.0') {
      return {
        fromVersion: config.version || '0.0.0',
        toVersion: '1.0.0',
        steps: ['Update data structure', 'Normalize column widths'],
        requiresConfirmation: false
      };
    }

    return null;
  }

  async performMigration(docId: string, migrationInfo: MigrationInfo): Promise<void> {
    await this._delay(30);
    
    console.log(`[MockStorageService] Performing migration for doc: ${docId}`, migrationInfo);
    
    const config = await this.loadLayoutConfig(docId);
    if (!config) {
      throw new Error(`Config not found for migration: ${docId}`);
    }

    // 执行简单的版本更新
    const migratedConfig = {
      ...config,
      version: migrationInfo.toVersion,
      lastModified: Date.now()
    };

    await this.saveLayoutConfig(docId, migratedConfig);
  }

  // ================================
  // 生命周期管理
  // ================================

  async initialize(options?: StorageOptions): Promise<void> {
    await this._delay(50);
    
    if (options) {
      this.options = { ...this.options, ...options };
    }

    // 创建一些示例数据
    await this._createSampleData();
    
    console.log('[MockStorageService] Initialized with options:', this.options);
  }

  async dispose(): Promise<void> {
    await this._delay(20);
    
    this.storage.clear();
    this.cache.clear();
    this.stats = {
      saves: 0,
      loads: 0,
      deletes: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    console.log('[MockStorageService] Disposed');
  }

  // ================================
  // 私有辅助方法
  // ================================

  private async _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private _createDefaultConfig(docId: string): DocLayoutConfig {
    return {
      docId,
      layoutMode: PageLayoutMode.Normal,
      columnWidths: [1],
      responsive: true,
      lastModified: Date.now(),
      version: '1.0.0'
    };
  }

  private _calculateStorageSize(): number {
    let size = 0;
    for (const config of this.storage.values()) {
      // 简单估算JSON字符串长度
      size += JSON.stringify(config).length;
    }
    return size;
  }

  private async _createSampleData(): Promise<void> {
    // 创建一些示例配置供开发测试使用
    const sampleConfigs: Array<{docId: string, config: Partial<DocLayoutConfig>}> = [
      {
        docId: 'sample-doc-1',
        config: {
          layoutMode: PageLayoutMode.Normal,
          columnWidths: [1],
          responsive: true
        }
      },
      {
        docId: 'sample-doc-2',
        config: {
          layoutMode: PageLayoutMode.TwoColumn,
          columnWidths: [0.6, 0.4],
          responsive: true
        }
      },
      {
        docId: 'sample-doc-3',
        config: {
          layoutMode: PageLayoutMode.ThreeColumn,
          columnWidths: [0.3, 0.4, 0.3],
          responsive: true
        }
      }
    ];

    for (const { docId, config } of sampleConfigs) {
      await this.saveLayoutConfig(docId, config);
    }

    console.log('[MockStorageService] Created sample data for development');
  }

  // ================================
  // 调试和开发辅助方法
  // ================================

  /**
   * 获取当前存储的所有数据 (仅用于调试)
   */
  _getAllConfigs(): Map<string, DocLayoutConfig> {
    return new Map(this.storage);
  }

  /**
   * 获取详细统计信息 (仅用于调试)
   */
  _getDetailedStats() {
    return {
      ...this.stats,
      storageSize: this.storage.size,
      cacheSize: this.cache.size,
      memoryUsage: this._calculateStorageSize()
    };
  }

  /**
   * 重置所有数据 (仅用于测试)
   */
  _reset(): void {
    this.storage.clear();
    this.cache.clear();
    this.stats = {
      saves: 0,
      loads: 0,
      deletes: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

/**
 * 创建Mock存储服务实例的工厂函数
 */
export function createMockStorageService(options?: StorageOptions): MockStorageService {
  const service = new MockStorageService();
  if (options) {
    service.setCacheOptions(options);
  }
  return service;
}

/**
 * 导出类型 (供TypeScript使用)
 */
export type { IStorageService } from '../types/contracts.js';