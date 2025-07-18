import { EventEmitter } from 'events';
import type { Socket } from 'socket.io-client';
import {
  DataLocation,
  DataSyncStatus,
  DataIntegrity,
  DocumentTransparencyInfo,
  WorkspaceTransparencyInfo,
  DataTransparencyConfig,
  DataTransparencyEvents,
  DataTransparencyEventHandler,
} from './types';

/**
 * 数据透明化检测器
 * 负责检测和监控数据在各个存储位置的状态
 */
export class DataTransparencyDetector extends EventEmitter {
  private config: DataTransparencyConfig;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  
  constructor(config: DataTransparencyConfig) {
    super();
    this.config = config;
  }

  /**
   * 初始化检测器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🔍 [数据透明化] 初始化检测器');
    
    // 启动定时刷新
    if (this.config.refreshInterval > 0) {
      this.startAutoRefresh();
    }
    
    this.isInitialized = true;
  }

  /**
   * 销毁检测器
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.removeAllListeners();
    this.isInitialized = false;
  }

  /**
   * 检测单个文档的透明化信息
   */
  async getDocumentTransparencyInfo(docId: string, workspaceId: string): Promise<DocumentTransparencyInfo> {
    console.log(`🔍 [数据透明化] 检测文档状态: ${docId}`);
    
    try {
      // 并行检测各个存储位置
      const [localLocation, cloudLocation, cacheLocation, syncStatus, integrity] = await Promise.all([
        this.detectLocalStorage(docId, workspaceId),
        this.detectCloudStorage(docId, workspaceId),
        this.detectCacheStorage(docId, workspaceId),
        this.detectSyncStatus(docId, workspaceId),
        this.detectDataIntegrity(docId, workspaceId)
      ]);

      const offlineOperations = await this.getOfflineOperations(docId, workspaceId);
      const version = await this.getVersionInfo(docId, workspaceId);
      const usage = await this.getUsageInfo(docId, workspaceId);

      const transparencyInfo: DocumentTransparencyInfo = {
        docId,
        title: await this.getDocumentTitle(docId, workspaceId),
        workspaceId,
        locations: {
          local: localLocation,
          cloud: cloudLocation,
          cache: cacheLocation,
        },
        syncStatus,
        integrity,
        offlineOperations,
        version,
        usage,
      };

      return transparencyInfo;
    } catch (error) {
      console.error('❌ [数据透明化] 文档状态检测失败:', error);
      throw error;
    }
  }

  /**
   * 检测工作空间的透明化信息
   */
  async getWorkspaceTransparencyInfo(workspaceId: string): Promise<WorkspaceTransparencyInfo> {
    console.log(`🔍 [数据透明化] 检测工作空间状态: ${workspaceId}`);
    
    try {
      const docIds = await this.getDocumentIds(workspaceId);
      const documents = await Promise.all(
        docIds.map(docId => this.getDocumentTransparencyInfo(docId, workspaceId))
      );

      const storage = await this.calculateStorageInfo(workspaceId, documents);
      const syncSummary = this.calculateSyncSummary(documents);
      const connection = await this.getConnectionInfo(workspaceId);

      const transparencyInfo: WorkspaceTransparencyInfo = {
        workspaceId,
        name: await this.getWorkspaceName(workspaceId),
        storage,
        syncSummary,
        connection,
        documents,
      };

      return transparencyInfo;
    } catch (error) {
      console.error('❌ [数据透明化] 工作空间状态检测失败:', error);
      throw error;
    }
  }

  /**
   * 检测本地存储状态
   */
  private async detectLocalStorage(docId: string, workspaceId: string): Promise<DataLocation> {
    try {
      // 检查 IndexedDB 中的文档
      const docExists = await this.checkIndexedDBDocument(docId, workspaceId);
      const docTimestamp = await this.getIndexedDBTimestamp(docId, workspaceId);
      const docSize = await this.getIndexedDBSize(docId, workspaceId);

      if (docExists) {
        return {
          location: 'local',
          description: '文档存储在本地浏览器缓存中',
          available: true,
          lastUpdated: docTimestamp,
          size: docSize,
        };
      } else {
        return {
          location: 'none',
          description: '文档不存在于本地存储',
          available: false,
        };
      }
    } catch (error) {
      console.error('❌ [数据透明化] 本地存储检测失败:', error);
      return {
        location: 'none',
        description: '本地存储检测失败',
        available: false,
      };
    }
  }

  /**
   * 检测云端存储状态
   */
  private async detectCloudStorage(docId: string, workspaceId: string): Promise<DataLocation> {
    try {
      // 检查云端连接状态
      const cloudManager = (window as any).__CLOUD_STORAGE_MANAGER__;
      if (!cloudManager || !cloudManager.isConnected) {
        return {
          location: 'none',
          description: '云端连接不可用',
          available: false,
        };
      }

      // 检查云端文档状态
      const cloudTimestamp = await this.getCloudTimestamp(docId, workspaceId);
      const cloudSize = await this.getCloudSize(docId, workspaceId);

      if (cloudTimestamp) {
        return {
          location: 'cloud',
          description: '文档已同步到云端数据库',
          available: true,
          lastUpdated: cloudTimestamp,
          size: cloudSize,
        };
      } else {
        return {
          location: 'none',
          description: '文档未同步到云端',
          available: false,
        };
      }
    } catch (error) {
      console.error('❌ [数据透明化] 云端存储检测失败:', error);
      return {
        location: 'none',
        description: '云端存储检测失败',
        available: false,
      };
    }
  }

  /**
   * 检测缓存存储状态
   */
  private async detectCacheStorage(docId: string, workspaceId: string): Promise<DataLocation> {
    try {
      // 检查离线缓存
      const offlineOperations = this.getOfflineOperationsFromStorage(workspaceId);
      const docOperations = offlineOperations.filter(op => op.docId === docId);

      if (docOperations.length > 0) {
        const totalSize = docOperations.reduce((sum, op) => sum + op.update.length, 0);
        const lastOperation = docOperations[docOperations.length - 1];

        return {
          location: 'local',
          description: `离线缓存中有 ${docOperations.length} 个待同步操作`,
          available: true,
          lastUpdated: new Date(lastOperation.timestamp),
          size: totalSize,
        };
      } else {
        return {
          location: 'none',
          description: '无离线缓存数据',
          available: false,
        };
      }
    } catch (error) {
      console.error('❌ [数据透明化] 缓存存储检测失败:', error);
      return {
        location: 'none',
        description: '缓存存储检测失败',
        available: false,
      };
    }
  }

  /**
   * 检测同步状态
   */
  private async detectSyncStatus(docId: string, workspaceId: string): Promise<DataSyncStatus> {
    try {
      const cloudManager = (window as any).__CLOUD_STORAGE_MANAGER__;
      if (!cloudManager) {
        return {
          status: 'offline',
          description: '云存储管理器不可用',
        };
      }

      const localTimestamp = await this.getIndexedDBTimestamp(docId, workspaceId);
      const cloudTimestamp = await this.getCloudTimestamp(docId, workspaceId);
      const offlineOperations = this.getOfflineOperationsFromStorage(workspaceId)
        .filter(op => op.docId === docId);

      // 检查同步状态
      if (offlineOperations.length > 0) {
        return {
          status: 'pending',
          description: `有 ${offlineOperations.length} 个操作待同步`,
          progress: 0,
        };
      }

      if (!cloudManager.isConnected) {
        return {
          status: 'offline',
          description: '云端连接断开',
        };
      }

      if (localTimestamp && cloudTimestamp) {
        if (Math.abs(localTimestamp.getTime() - cloudTimestamp.getTime()) < 1000) {
          return {
            status: 'synced',
            description: '数据已同步',
            lastSyncTime: cloudTimestamp,
            progress: 100,
          };
        } else {
          return {
            status: 'conflict',
            description: '本地和云端数据不一致',
          };
        }
      } else if (cloudTimestamp) {
        return {
          status: 'pending',
          description: '等待从云端同步',
        };
      } else if (localTimestamp) {
        return {
          status: 'pending',
          description: '等待同步到云端',
        };
      } else {
        return {
          status: 'failed',
          description: '文档不存在',
        };
      }
    } catch (error) {
      console.error('❌ [数据透明化] 同步状态检测失败:', error);
      return {
        status: 'failed',
        description: '同步状态检测失败',
        error: error.message,
      };
    }
  }

  /**
   * 检测数据完整性
   */
  private async detectDataIntegrity(docId: string, workspaceId: string): Promise<DataIntegrity> {
    try {
      const checkTime = new Date();
      
      // 检查本地数据
      const localExists = await this.checkIndexedDBDocument(docId, workspaceId);
      const cloudExists = await this.checkCloudDocument(docId, workspaceId);

      if (localExists && cloudExists) {
        // 比较数据一致性
        const localChecksum = await this.calculateLocalChecksum(docId, workspaceId);
        const cloudChecksum = await this.calculateCloudChecksum(docId, workspaceId);

        if (localChecksum === cloudChecksum) {
          return {
            status: 'intact',
            description: '数据完整且一致',
            checkTime,
            checksum: localChecksum,
          };
        } else {
          return {
            status: 'corrupted',
            description: '本地和云端数据不一致',
            checkTime,
          };
        }
      } else if (localExists || cloudExists) {
        return {
          status: 'partial',
          description: localExists ? '仅存在本地副本' : '仅存在云端副本',
          checkTime,
        };
      } else {
        return {
          status: 'missing',
          description: '文档不存在',
          checkTime,
        };
      }
    } catch (error) {
      console.error('❌ [数据透明化] 数据完整性检测失败:', error);
      return {
        status: 'corrupted',
        description: '数据完整性检测失败',
        checkTime: new Date(),
      };
    }
  }

  /**
   * 获取离线操作信息
   */
  private async getOfflineOperations(docId: string, workspaceId: string) {
    const operations = this.getOfflineOperationsFromStorage(workspaceId)
      .filter(op => op.docId === docId);

    return {
      count: operations.length,
      operations: operations.map(op => ({
        id: op.id,
        type: 'doc-update',
        timestamp: new Date(op.timestamp),
        size: op.update.length,
      })),
    };
  }

  /**
   * 获取版本信息
   */
  private async getVersionInfo(docId: string, workspaceId: string) {
    const localTimestamp = await this.getIndexedDBTimestamp(docId, workspaceId);
    const cloudTimestamp = await this.getCloudTimestamp(docId, workspaceId);

    const localVersion = localTimestamp ? localTimestamp.getTime().toString() : undefined;
    const cloudVersion = cloudTimestamp ? cloudTimestamp.getTime().toString() : undefined;

    return {
      local: localVersion,
      cloud: cloudVersion,
      isConsistent: localVersion === cloudVersion,
    };
  }

  /**
   * 获取使用统计信息
   */
  private async getUsageInfo(docId: string, workspaceId: string) {
    // 这里可以从本地存储或统计服务获取使用信息
    return {
      lastAccessed: new Date(),
      accessCount: 0,
      editCount: 0,
    };
  }

  /**
   * 启动自动刷新
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      // 触发状态检查事件
      this.emit('refresh-requested');
    }, this.config.refreshInterval);
  }

  /**
   * 从localStorage获取离线操作
   */
  private getOfflineOperationsFromStorage(workspaceId: string): Array<{
    id: string;
    docId: string;
    update: string;
    timestamp: number;
    workspaceId: string;
  }> {
    const OFFLINE_OPERATIONS_KEY = 'cloud_storage_offline_operations';
    try {
      const existing = localStorage.getItem(OFFLINE_OPERATIONS_KEY);
      const operations = existing ? JSON.parse(existing) : [];
      return operations.filter((op: any) => op.workspaceId === workspaceId);
    } catch (error) {
      console.error('❌ [数据透明化] 读取离线操作失败:', error);
      return [];
    }
  }

  // 以下是辅助方法的占位符实现
  private async checkIndexedDBDocument(docId: string, workspaceId: string): Promise<boolean> {
    // 实现IndexedDB文档检查逻辑
    return false;
  }

  private async getIndexedDBTimestamp(docId: string, workspaceId: string): Promise<Date | null> {
    // 实现IndexedDB时间戳获取逻辑
    return null;
  }

  private async getIndexedDBSize(docId: string, workspaceId: string): Promise<number> {
    // 实现IndexedDB大小获取逻辑
    return 0;
  }

  private async getCloudTimestamp(docId: string, workspaceId: string): Promise<Date | null> {
    // 实现云端时间戳获取逻辑
    return null;
  }

  private async getCloudSize(docId: string, workspaceId: string): Promise<number> {
    // 实现云端大小获取逻辑
    return 0;
  }

  private async checkCloudDocument(docId: string, workspaceId: string): Promise<boolean> {
    // 实现云端文档检查逻辑
    return false;
  }

  private async calculateLocalChecksum(docId: string, workspaceId: string): Promise<string> {
    // 实现本地数据校验和计算
    return '';
  }

  private async calculateCloudChecksum(docId: string, workspaceId: string): Promise<string> {
    // 实现云端数据校验和计算
    return '';
  }

  private async getDocumentIds(workspaceId: string): Promise<string[]> {
    // 实现文档ID列表获取逻辑
    return [];
  }

  private async getDocumentTitle(docId: string, workspaceId: string): Promise<string> {
    // 实现文档标题获取逻辑
    return 'Untitled Document';
  }

  private async getWorkspaceName(workspaceId: string): Promise<string> {
    // 实现工作空间名称获取逻辑
    return 'Untitled Workspace';
  }

  private async calculateStorageInfo(workspaceId: string, documents: DocumentTransparencyInfo[]) {
    // 实现存储信息计算逻辑
    return {
      total: {
        local: 0,
        cloud: 0,
        cache: 0,
      },
      documents: documents.length,
      blobs: 0,
    };
  }

  private calculateSyncSummary(documents: DocumentTransparencyInfo[]) {
    // 实现同步摘要计算逻辑
    return {
      syncedDocs: 0,
      pendingDocs: 0,
      failedDocs: 0,
      offlineOperations: 0,
    };
  }

  private async getConnectionInfo(workspaceId: string) {
    // 实现连接信息获取逻辑
    const cloudManager = (window as any).__CLOUD_STORAGE_MANAGER__;
    return {
      isOnline: navigator.onLine,
      isCloudConnected: cloudManager?.isConnected || false,
      lastConnected: cloudManager?.lastSync,
      reconnectAttempts: 0,
    };
  }

  /**
   * 事件监听器
   */
  on<T extends keyof DataTransparencyEvents>(
    event: T,
    handler: DataTransparencyEventHandler<T>
  ): this {
    return super.on(event, handler);
  }

  off<T extends keyof DataTransparencyEvents>(
    event: T,
    handler: DataTransparencyEventHandler<T>
  ): this {
    return super.off(event, handler);
  }

  emit<T extends keyof DataTransparencyEvents>(
    event: T,
    data: DataTransparencyEvents[T]
  ): boolean {
    return super.emit(event, data);
  }
}