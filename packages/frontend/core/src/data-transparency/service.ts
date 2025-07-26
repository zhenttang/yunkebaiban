import { EventEmitter } from 'events';
import { DataTransparencyDetector } from './detector';
import { 
  DataTransparencyConfig, 
  DocumentTransparencyInfo, 
  WorkspaceTransparencyInfo 
} from './types';

/**
 * 数据透明化服务
 * 提供全局的数据透明化管理功能
 */
export class DataTransparencyService extends EventEmitter {
  private static instance: DataTransparencyService;
  private detectors: Map<string, DataTransparencyDetector> = new Map();
  private config: DataTransparencyConfig;
  private isInitialized = false;

  constructor(config: DataTransparencyConfig) {
    super();
    this.config = config;
  }

  /**
   * 获取全局实例
   */
  static getInstance(config?: DataTransparencyConfig): DataTransparencyService {
    if (!DataTransparencyService.instance) {
      if (!config) {
        throw new Error('首次调用必须提供配置');
      }
      DataTransparencyService.instance = new DataTransparencyService(config);
    }
    return DataTransparencyService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    
    // 初始化全局事件监听
    this.setupGlobalListeners();
    
    this.isInitialized = true;
    this.emit('initialized');
    
  }

  /**
   * 获取或创建工作空间检测器
   */
  getDetector(workspaceId: string): DataTransparencyDetector {
    if (!this.detectors.has(workspaceId)) {
      const detector = new DataTransparencyDetector(this.config);
      this.detectors.set(workspaceId, detector);
      
      // 初始化检测器
      detector.initialize().catch(err => {
        console.error(`❌ [数据透明化服务] 检测器初始化失败 ${workspaceId}:`, err);
      });
    }
    
    return this.detectors.get(workspaceId)!;
  }

  /**
   * 获取工作空间透明化信息
   */
  async getWorkspaceTransparencyInfo(workspaceId: string): Promise<WorkspaceTransparencyInfo> {
    const detector = this.getDetector(workspaceId);
    return detector.getWorkspaceTransparencyInfo(workspaceId);
  }

  /**
   * 获取文档透明化信息
   */
  async getDocumentTransparencyInfo(docId: string, workspaceId: string): Promise<DocumentTransparencyInfo> {
    const detector = this.getDetector(workspaceId);
    return detector.getDocumentTransparencyInfo(docId, workspaceId);
  }

  /**
   * 批量获取文档透明化信息
   */
  async getMultipleDocumentTransparencyInfo(
    docIds: string[], 
    workspaceId: string
  ): Promise<Map<string, DocumentTransparencyInfo>> {
    const detector = this.getDetector(workspaceId);
    const results = new Map<string, DocumentTransparencyInfo>();
    
    // 并行获取
    const promises = docIds.map(async (docId) => {
      try {
        const info = await detector.getDocumentTransparencyInfo(docId, workspaceId);
        results.set(docId, info);
      } catch (error) {
        console.error(`❌ [数据透明化服务] 获取文档信息失败 ${docId}:`, error);
      }
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * 获取全局数据透明化摘要
   */
  async getGlobalTransparencySummary(): Promise<{
    totalWorkspaces: number;
    totalDocuments: number;
    syncedDocuments: number;
    pendingDocuments: number;
    offlineOperations: number;
    storageUsage: {
      local: number;
      cloud: number;
      cache: number;
    };
  }> {
    const workspaceIds = Array.from(this.detectors.keys());
    const summaries = await Promise.all(
      workspaceIds.map(async (workspaceId) => {
        try {
          return await this.getWorkspaceTransparencyInfo(workspaceId);
        } catch (error) {
          console.error(`❌ [数据透明化服务] 获取工作空间摘要失败 ${workspaceId}:`, error);
          return null;
        }
      })
    );

    const validSummaries = summaries.filter(s => s !== null) as WorkspaceTransparencyInfo[];

    return {
      totalWorkspaces: validSummaries.length,
      totalDocuments: validSummaries.reduce((sum, s) => sum + s.storage.documents, 0),
      syncedDocuments: validSummaries.reduce((sum, s) => sum + s.syncSummary.syncedDocs, 0),
      pendingDocuments: validSummaries.reduce((sum, s) => sum + s.syncSummary.pendingDocs, 0),
      offlineOperations: validSummaries.reduce((sum, s) => sum + s.syncSummary.offlineOperations, 0),
      storageUsage: {
        local: validSummaries.reduce((sum, s) => sum + s.storage.total.local, 0),
        cloud: validSummaries.reduce((sum, s) => sum + s.storage.total.cloud, 0),
        cache: validSummaries.reduce((sum, s) => sum + s.storage.total.cache, 0),
      },
    };
  }

  /**
   * 刷新所有检测器
   */
  async refreshAll(): Promise<void> {
    
    const promises = Array.from(this.detectors.values()).map(detector => {
      detector.emit('refresh-requested');
    });
    
    await Promise.all(promises);
    this.emit('global-refresh-completed');
  }

  /**
   * 刷新特定工作空间的检测器
   */
  async refreshWorkspace(workspaceId: string): Promise<void> {
    const detector = this.detectors.get(workspaceId);
    if (detector) {
      detector.emit('refresh-requested');
    }
  }

  /**
   * 清理不使用的检测器
   */
  cleanupDetectors(): void {
    
    // 这里可以实现清理逻辑，比如清理超过一定时间未使用的检测器
    // 暂时保留所有检测器
    
    this.emit('cleanup-completed');
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<DataTransparencyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 更新所有检测器的配置
    this.detectors.forEach((detector, workspaceId) => {
      // 这里需要检测器支持配置更新
    });
    
    this.emit('config-updated', this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): DataTransparencyConfig {
    return { ...this.config };
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    console.log('🗑️ [数据透明化服务] 销毁服务...');
    
    // 销毁所有检测器
    this.detectors.forEach((detector, workspaceId) => {
      detector.destroy();
    });
    
    this.detectors.clear();
    this.removeAllListeners();
    this.isInitialized = false;
    
    // 清理全局实例
    DataTransparencyService.instance = null as any;
  }

  /**
   * 设置全局事件监听
   */
  private setupGlobalListeners(): void {
    // 监听云存储管理器状态变化
    const cloudManager = (window as any).__CLOUD_STORAGE_MANAGER__;
    if (cloudManager) {
      // 可以监听云存储状态变化并触发检测器更新
    }

    // 监听网络状态变化
    window.addEventListener('online', () => {
      console.log('🌐 [数据透明化服务] 网络恢复在线');
      this.refreshAll();
    });

    window.addEventListener('offline', () => {
      console.log('🚫 [数据透明化服务] 网络离线');
      this.emit('network-offline');
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [数据透明化服务] 页面变为可见');
        this.refreshAll();
      }
    });
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    activeDetectors: number;
    isInitialized: boolean;
    config: DataTransparencyConfig;
    uptime: number;
  } {
    return {
      activeDetectors: this.detectors.size,
      isInitialized: this.isInitialized,
      config: this.config,
      uptime: Date.now() - (this as any).startTime || 0,
    };
  }
}

/**
 * 导出全局服务实例获取函数
 */
export const getDataTransparencyService = (config?: DataTransparencyConfig): DataTransparencyService => {
  return DataTransparencyService.getInstance(config);
};