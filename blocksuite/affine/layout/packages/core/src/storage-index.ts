/**
 * BlockSuite Layout - 存储模块总导出
 * 
 * @author 开发者A2 - 数据存储专家
 * @description 提供统一的存储功能导出接口
 */

// 核心存储服务
export { StorageService, createStorageService } from './services/storage-service.js';
export { MockStorageService, createMockStorageService } from '../testing/src/mocks/storage-service.js';

// 配置验证和迁移工具
export { 
  ConfigValidator, 
  ConfigMigrator, 
  ConfigRepairer, 
  ConfigUtils 
} from './utils/config-validator.js';

// 高级存储功能
export { 
  StorageEventManager,
  SyncStateManager,
  ConflictResolver,
  AdvancedCacheManager,
  AdvancedStorageUtils
} from './utils/advanced-storage.js';

// 测试数据生成器
export { 
  MockDataGenerator,
  MockDataValidator,
  MockDataExamples,
  MockDataPresets,
  createTestData
} from '../testing/src/fixtures/mock-data.js';

// 类型定义
export type {
  IStorageService,
  DocLayoutConfig,
  StorageOptions,
  DocLayoutConfigBatch,
  StorageStats,
  ValidationResult,
  MigrationInfo,
  SyncStatus,
  StorageEvent,
  CacheStrategy
} from './types/contracts.js';

export type {
  PageLayoutMode,
  DistributionAnalysis,
  Block,
  LayoutModeChangeEvent
} from './types/layout.js';

/**
 * 存储功能的便捷工厂函数
 */
export class StorageFactory {
  
  /**
   * 创建生产环境的存储服务
   */
  static createProductionStorage(options?: StorageOptions): StorageService {
    const service = createStorageService(options);
    console.debug('[StorageFactory] Created production storage service');
    return service;
  }

  /**
   * 创建开发环境的Mock存储服务
   */
  static createDevelopmentStorage(options?: StorageOptions): MockStorageService {
    const service = createMockStorageService(options);
    console.debug('[StorageFactory] Created development mock storage service');
    return service;
  }

  /**
   * 自动选择合适的存储服务
   */
  static createAutoStorage(
    preferProduction: boolean = true, 
    options?: StorageOptions
  ): IStorageService {
    if (preferProduction && typeof localStorage !== 'undefined') {
      return this.createProductionStorage(options);
    } else {
      return this.createDevelopmentStorage(options);
    }
  }
}

/**
 * 存储服务管理器
 * 提供全局的存储服务实例管理
 */
export class StorageManager {
  private static instance: IStorageService | null = null;
  private static initialized = false;

  /**
   * 初始化全局存储服务
   */
  static async initialize(
    service?: IStorageService, 
    options?: StorageOptions
  ): Promise<void> {
    if (this.initialized) {
      console.warn('[StorageManager] Storage already initialized');
      return;
    }

    this.instance = service || StorageFactory.createAutoStorage(true, options);
    
    if (this.instance.initialize) {
      await this.instance.initialize(options);
    }

    this.initialized = true;
    console.debug('[StorageManager] Global storage service initialized');
  }

  /**
   * 获取全局存储服务实例
   */
  static getInstance(): IStorageService {
    if (!this.instance || !this.initialized) {
      throw new Error('Storage service not initialized. Call StorageManager.initialize() first.');
    }
    return this.instance;
  }

  /**
   * 检查存储服务是否已初始化
   */
  static isInitialized(): boolean {
    return this.initialized && this.instance !== null;
  }

  /**
   * 销毁全局存储服务
   */
  static async dispose(): Promise<void> {
    if (this.instance && this.instance.dispose) {
      await this.instance.dispose();
    }
    
    this.instance = null;
    this.initialized = false;
    console.debug('[StorageManager] Global storage service disposed');
  }

  /**
   * 重置存储服务（用于测试）
   */
  static reset(): void {
    this.instance = null;
    this.initialized = false;
  }
}

/**
 * 存储工具集合
 * 提供常用的存储相关工具函数
 */
export const StorageUtils = {
  
  /**
   * 快速保存布局配置
   */
  async saveConfig(docId: string, config: Partial<DocLayoutConfig>): Promise<void> {
    const storage = StorageManager.getInstance();
    await storage.saveLayoutConfig(docId, config);
  },

  /**
   * 快速加载布局配置
   */
  async loadConfig(docId: string): Promise<DocLayoutConfig | null> {
    const storage = StorageManager.getInstance();
    return await storage.loadLayoutConfig(docId);
  },

  /**
   * 快速删除布局配置
   */
  async deleteConfig(docId: string): Promise<void> {
    const storage = StorageManager.getInstance();
    await storage.deleteLayoutConfig(docId);
  },

  /**
   * 验证布局配置
   */
  validateConfig(config: any): ValidationResult {
    return ConfigUtils.validate(config);
  },

  /**
   * 检查配置迁移需求
   */
  async checkMigration(docId: string): Promise<MigrationInfo | null> {
    const storage = StorageManager.getInstance();
    return await storage.checkMigrationNeeded(docId);
  },

  /**
   * 获取存储统计信息
   */
  async getStats(): Promise<StorageStats> {
    const storage = StorageManager.getInstance();
    return await storage.getStorageStats();
  },

  /**
   * 清理存储缓存
   */
  clearCache(): void {
    const storage = StorageManager.getInstance();
    storage.clearCache();
  }
};

/**
 * 开发调试工具
 */
export const StorageDebugUtils = {
  
  /**
   * 打印存储状态信息
   */
  async printStorageInfo(): Promise<void> {
    if (!StorageManager.isInitialized()) {
      console.log('🔍 Storage service not initialized');
      return;
    }

    const storage = StorageManager.getInstance();
    const stats = await storage.getStorageStats();
    const documents = await storage.listStoredDocuments();

    console.group('🔍 Storage Debug Info');
    console.log('📊 Statistics:', stats);
    console.log('📄 Stored Documents:', documents);
    console.log('💾 Cache Size:', storage.getCacheSize());
    console.groupEnd();
  },

  /**
   * 验证所有存储的配置
   */
  async validateAllConfigs(): Promise<ValidationResult[]> {
    const storage = StorageManager.getInstance();
    const documents = await storage.listStoredDocuments();
    const results: ValidationResult[] = [];

    for (const docId of documents) {
      try {
        const config = await storage.loadLayoutConfig(docId);
        if (config) {
          const validation = ConfigUtils.validate(config);
          results.push({
            ...validation,
            docId
          } as ValidationResult & { docId: string });
        }
      } catch (error) {
        results.push({
          valid: false,
          errors: [`Failed to load config: ${error}`],
          warnings: [],
          docId
        } as ValidationResult & { docId: string });
      }
    }

    console.log('🔍 Configuration Validation Results:', results);
    return results;
  },

  /**
   * 创建测试数据
   */
  async createTestData(): Promise<void> {
    const storage = StorageManager.getInstance();
    const testConfigs = MockDataPresets.basic;

    await storage.saveLayoutConfig('test-single', testConfigs.singleColumn().config);
    await storage.saveLayoutConfig('test-two', testConfigs.twoColumn().config);
    await storage.saveLayoutConfig('test-three', testConfigs.threeColumn().config);

    console.log('🎯 Test data created successfully');
  },

  /**
   * 清理所有测试数据
   */
  async cleanupTestData(): Promise<void> {
    const storage = StorageManager.getInstance();
    const testDocIds = ['test-single', 'test-two', 'test-three'];

    for (const docId of testDocIds) {
      try {
        await storage.deleteLayoutConfig(docId);
      } catch (error) {
        console.warn(`Failed to delete test config ${docId}:`, error);
      }
    }

    console.log('🧹 Test data cleaned up');
  }
};

/**
 * 默认导出：存储管理器
 */
export default StorageManager;