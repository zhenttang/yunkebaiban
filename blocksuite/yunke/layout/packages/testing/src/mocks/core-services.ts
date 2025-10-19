/**
 * BlockSuite Layout - 核心Mock服务集合
 * 
 * @author 开发者A2协助项目 - 加速团队开发
 * @description 为并行开发提供完整的Mock服务实现
 */

import type { 
  IPageLayoutService,
  IColumnDistributor,
  IBlockHeightEstimator,
  DocLayoutConfig,
  PageLayoutMode,
  LayoutModeChangeEvent,
  Block
} from '../../core/src/types/contracts.js';

/**
 * Mock页面布局服务
 * 🎯 关键依赖：Team B等待的核心服务
 */
export class MockPageLayoutService implements IPageLayoutService {
  private currentConfigs = new Map<string, DocLayoutConfig>();
  private listeners: Array<(event: LayoutModeChangeEvent) => void> = [];

  constructor() {
    console.log('🎭 MockPageLayoutService initialized - Team B可以开始开发了！');
  }

  async setLayoutMode(mode: PageLayoutMode, docId: string): Promise<void> {
    await this._delay(30);
    
    const currentConfig = this.getLayoutConfig(docId);
    const previousMode = currentConfig?.layoutMode || PageLayoutMode.Normal;
    
    if (previousMode === mode) return;

    // 创建新配置
    const newConfig: DocLayoutConfig = {
      docId,
      layoutMode: mode,
      columnWidths: this._getDefaultWidths(mode),
      responsive: true,
      lastModified: Date.now(),
      version: '1.0.0'
    };

    this.currentConfigs.set(docId, newConfig);

    // 发送变更事件
    const event: LayoutModeChangeEvent = {
      docId,
      previousMode,
      currentMode: mode,
      columnWidths: newConfig.columnWidths,
      timestamp: Date.now(),
      source: 'user'
    };

    this.listeners.forEach(listener => listener(event));
    
    console.log(`🎭 Layout mode changed: ${docId} -> ${mode}`);
  }

  getLayoutMode(docId: string): PageLayoutMode {
    const config = this.currentConfigs.get(docId);
    return config?.layoutMode || PageLayoutMode.Normal;
  }

  async setColumnWidths(widths: number[], docId: string): Promise<void> {
    await this._delay(20);
    
    const config = this.currentConfigs.get(docId);
    if (config) {
      config.columnWidths = [...widths];
      config.lastModified = Date.now();
      this.currentConfigs.set(docId, config);
    }
    
    console.log(`🎭 Column widths updated: ${docId}`, widths);
  }

  getColumnWidths(docId: string): number[] {
    const config = this.currentConfigs.get(docId);
    return config?.columnWidths || [1];
  }

  onLayoutModeChange() {
    return {
      subscribe: (callback: (event: LayoutModeChangeEvent) => void) => {
        this.listeners.push(callback);
        return () => {
          const index = this.listeners.indexOf(callback);
          if (index > -1) this.listeners.splice(index, 1);
        };
      }
    };
  }

  getLayoutConfig(docId: string): DocLayoutConfig | null {
    return this.currentConfigs.get(docId) || null;
  }

  async updateLayoutConfig(docId: string, config: Partial<DocLayoutConfig>): Promise<void> {
    await this._delay(25);
    
    const existing = this.currentConfigs.get(docId) || this._createDefaultConfig(docId);
    const updated = { ...existing, ...config, lastModified: Date.now() };
    
    this.currentConfigs.set(docId, updated);
    console.log(`🎭 Layout config updated: ${docId}`);
  }

  async initialize(): Promise<void> {
    console.log('🎭 MockPageLayoutService initialized');
  }

  async dispose(): Promise<void> {
    this.currentConfigs.clear();
    this.listeners.length = 0;
    console.log('🎭 MockPageLayoutService disposed');
  }

  // 辅助方法
  private async _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private _getDefaultWidths(mode: PageLayoutMode): number[] {
    const widthMap = {
      [PageLayoutMode.Normal]: [1],
      [PageLayoutMode.TwoColumn]: [0.6, 0.4],
      [PageLayoutMode.ThreeColumn]: [0.4, 0.3, 0.3],
      [PageLayoutMode.FourColumn]: [0.25, 0.25, 0.25, 0.25],
      [PageLayoutMode.FiveColumn]: [0.2, 0.2, 0.2, 0.2, 0.2]
    };
    return widthMap[mode] || [1];
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
}

/**
 * Mock列分配器
 * 🎯 为开发者B1提供Block分配能力
 */
export class MockColumnDistributor implements IColumnDistributor {
  
  constructor() {
    console.log('🎭 MockColumnDistributor initialized - 算法功能就绪！');
  }

  distributeBlocks(blocks: Block[], columnCount: number): Block[][] {
    if (columnCount <= 0) {
      throw new Error('Column count must be positive');
    }

    const columns: Block[][] = Array.from({ length: columnCount }, () => []);
    
    if (blocks.length === 0) {
      return columns;
    }

    // 模拟智能分配：平衡Block数量
    blocks.forEach((block, index) => {
      const targetColumn = index % columnCount;
      columns[targetColumn].push(block);
    });

    console.log(`🎭 Distributed ${blocks.length} blocks into ${columnCount} columns`);
    return columns;
  }

  redistributeOnModeChange(currentColumns: Block[][], newColumnCount: number): Block[][] {
    // 重新收集所有Block
    const allBlocks: Block[] = [];
    currentColumns.forEach(column => allBlocks.push(...column));
    
    // 使用标准分配算法重新分配
    return this.distributeBlocks(allBlocks, newColumnCount);
  }

  moveBlock(blockId: string, targetColumn: number, targetIndex: number, columns: Block[][]): Block[][] {
    const newColumns = columns.map(col => [...col]);
    
    // 找到Block并移除
    let blockToMove: Block | null = null;
    for (let colIndex = 0; colIndex < newColumns.length; colIndex++) {
      const blockIndex = newColumns[colIndex].findIndex(block => block.id === blockId);
      if (blockIndex !== -1) {
        blockToMove = newColumns[colIndex].splice(blockIndex, 1)[0];
        break;
      }
    }

    // 插入到目标位置
    if (blockToMove && targetColumn >= 0 && targetColumn < newColumns.length) {
      const safeIndex = Math.min(targetIndex, newColumns[targetColumn].length);
      newColumns[targetColumn].splice(safeIndex, 0, blockToMove);
    }

    console.log(`🎭 Moved block ${blockId} to column ${targetColumn}`);
    return newColumns;
  }

  evaluateDistribution(columns: Block[][]): number {
    if (columns.length === 0) return 1;
    
    const columnSizes = columns.map(col => col.length);
    const avgSize = columnSizes.reduce((sum, size) => sum + size, 0) / columns.length;
    
    // 计算平衡度 (方差的倒数)
    const variance = columnSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / columns.length;
    return variance === 0 ? 1 : 1 / (1 + variance);
  }
}

/**
 * Mock Block高度估算器
 * 🎯 为开发者B1提供高度估算能力
 */
export class MockBlockHeightEstimator implements IBlockHeightEstimator {
  private heightCache = new Map<string, number>();
  
  constructor() {
    console.log('🎭 MockBlockHeightEstimator initialized - 高度估算就绪！');
  }

  estimate(block: Block): number {
    // 检查缓存
    const cached = this.getCachedHeight(block.id);
    if (cached !== null) {
      return cached;
    }

    // 模拟不同类型Block的高度估算
    let estimatedHeight = 100; // 默认高度

    switch (block.type) {
      case 'paragraph':
        // 基于文本长度估算
        const textLength = (block.content?.text || '').length;
        estimatedHeight = Math.max(60, Math.ceil(textLength / 50) * 20 + 40);
        break;
        
      case 'heading':
        estimatedHeight = 80;
        break;
        
      case 'image':
        estimatedHeight = block.properties?.height || 200;
        break;
        
      case 'list':
        const itemCount = block.children?.length || 1;
        estimatedHeight = itemCount * 30 + 20;
        break;
        
      case 'code':
        const lineCount = (block.content?.code || '').split('\n').length;
        estimatedHeight = lineCount * 18 + 40;
        break;
        
      case 'table':
        const rowCount = block.properties?.rows || 3;
        estimatedHeight = rowCount * 40 + 60;
        break;
        
      default:
        estimatedHeight = 80;
    }

    // 添加随机性模拟真实情况
    estimatedHeight += Math.random() * 20 - 10;
    
    // 缓存结果
    this.cacheHeight(block.id, estimatedHeight);
    
    return Math.round(estimatedHeight);
  }

  cacheHeight(blockId: string, height: number): void {
    this.heightCache.set(blockId, height);
    
    // 限制缓存大小
    if (this.heightCache.size > 1000) {
      const firstKey = this.heightCache.keys().next().value;
      this.heightCache.delete(firstKey);
    }
  }

  getCachedHeight(blockId: string): number | null {
    return this.heightCache.get(blockId) || null;
  }

  clearCache(): void {
    this.heightCache.clear();
    console.log('🎭 Height cache cleared');
  }

  batchEstimate(blocks: Block[]): number[] {
    return blocks.map(block => this.estimate(block));
  }
}

/**
 * 🚀 Mock服务快速启动器
 * 一键启动所有Mock服务，解除Team B阻塞！
 */
export class MockServiceBootstrap {
  
  /**
   * 快速注册所有Mock服务到容器
   */
  static bootstrapAllServices(container: any) {
    // 注册页面布局服务
    container.registerFactory('PageLayoutService', () => new MockPageLayoutService());
    
    // 注册列分配器
    container.registerFactory('ColumnDistributor', () => new MockColumnDistributor());
    
    // 注册高度估算器
    container.registerFactory('BlockHeightEstimator', () => new MockBlockHeightEstimator());
    
    // 注册已有的存储服务
    const { MockStorageService } = require('./storage-service.js');
    container.registerFactory('StorageService', () => new MockStorageService());
    
    console.log('🚀 所有Mock服务已注册！Team B可以立即开始开发！');
    console.log('📋 可用服务：');
    console.log('  ✅ PageLayoutService - 布局模式管理');
    console.log('  ✅ StorageService - 数据持久化');
    console.log('  ✅ ColumnDistributor - Block分配算法');
    console.log('  ✅ BlockHeightEstimator - 高度估算');
  }

  /**
   * 创建完整的Mock服务套件
   */
  static createFullServiceSuite() {
    const { MockStorageService } = require('./storage-service.js');
    
    return {
      pageLayoutService: new MockPageLayoutService(),
      storageService: new MockStorageService(),
      columnDistributor: new MockColumnDistributor(),
      blockHeightEstimator: new MockBlockHeightEstimator()
    };
  }

  /**
   * 验证Mock服务完整性
   */
  static validateMockServices(): {
    ready: boolean;
    services: string[];
    missing: string[];
  } {
    const requiredServices = [
      'PageLayoutService',
      'StorageService', 
      'ColumnDistributor',
      'BlockHeightEstimator'
    ];

    const availableServices: string[] = [];
    const missingServices: string[] = [];

    // 验证每个服务是否可用
    try {
      new MockPageLayoutService();
      availableServices.push('PageLayoutService');
    } catch {
      missingServices.push('PageLayoutService');
    }

    try {
      const { MockStorageService } = require('./storage-service.js');
      new MockStorageService();
      availableServices.push('StorageService');
    } catch {
      missingServices.push('StorageService');
    }

    try {
      new MockColumnDistributor();
      availableServices.push('ColumnDistributor');
    } catch {
      missingServices.push('ColumnDistributor');
    }

    try {
      new MockBlockHeightEstimator();
      availableServices.push('BlockHeightEstimator');
    } catch {
      missingServices.push('BlockHeightEstimator');
    }

    return {
      ready: missingServices.length === 0,
      services: availableServices,
      missing: missingServices
    };
  }
}

// 🎉 立即验证Mock服务状态
const serviceStatus = MockServiceBootstrap.validateMockServices();
console.log('🔍 Mock服务状态检查：', serviceStatus);

if (serviceStatus.ready) {
  console.log('🎉 所有Mock服务就绪！Team B可以立即开始开发！');
} else {
  console.warn('⚠️ 部分Mock服务缺失：', serviceStatus.missing);
}

// 导出所有服务
export {
  MockPageLayoutService,
  MockColumnDistributor,
  MockBlockHeightEstimator,
  MockServiceBootstrap
};