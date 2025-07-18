/**
 * 数据透明化系统 - 类型定义
 * 让用户清楚地了解数据存储位置和状态
 */

export interface DataLocation {
  /** 数据存储位置 */
  location: 'local' | 'cloud' | 'both' | 'none';
  /** 位置描述 */
  description: string;
  /** 是否可用 */
  available: boolean;
  /** 最后更新时间 */
  lastUpdated?: Date;
  /** 数据大小 */
  size?: number;
}

export interface DataSyncStatus {
  /** 同步状态 */
  status: 'synced' | 'pending' | 'failed' | 'conflict' | 'offline';
  /** 状态描述 */
  description: string;
  /** 最后同步时间 */
  lastSyncTime?: Date;
  /** 同步进度 (0-100) */
  progress?: number;
  /** 错误信息 */
  error?: string;
}

export interface DataIntegrity {
  /** 数据完整性状态 */
  status: 'intact' | 'corrupted' | 'partial' | 'missing';
  /** 状态描述 */
  description: string;
  /** 检查时间 */
  checkTime: Date;
  /** 数据校验和 */
  checksum?: string;
}

export interface DocumentTransparencyInfo {
  /** 文档ID */
  docId: string;
  /** 文档标题 */
  title: string;
  /** 工作空间ID */
  workspaceId: string;
  
  /** 存储位置信息 */
  locations: {
    local: DataLocation;
    cloud: DataLocation;
    cache: DataLocation;
  };
  
  /** 同步状态 */
  syncStatus: DataSyncStatus;
  
  /** 数据完整性 */
  integrity: DataIntegrity;
  
  /** 离线操作 */
  offlineOperations: {
    count: number;
    operations: Array<{
      id: string;
      type: string;
      timestamp: Date;
      size: number;
    }>;
  };
  
  /** 版本信息 */
  version: {
    local?: string;
    cloud?: string;
    isConsistent: boolean;
  };
  
  /** 使用统计 */
  usage: {
    lastAccessed: Date;
    accessCount: number;
    editCount: number;
  };
}

export interface WorkspaceTransparencyInfo {
  /** 工作空间ID */
  workspaceId: string;
  /** 工作空间名称 */
  name: string;
  
  /** 总体存储信息 */
  storage: {
    total: {
      local: number;
      cloud: number;
      cache: number;
    };
    documents: number;
    blobs: number;
  };
  
  /** 同步状态摘要 */
  syncSummary: {
    syncedDocs: number;
    pendingDocs: number;
    failedDocs: number;
    offlineOperations: number;
  };
  
  /** 连接状态 */
  connection: {
    isOnline: boolean;
    isCloudConnected: boolean;
    lastConnected?: Date;
    reconnectAttempts: number;
  };
  
  /** 文档列表 */
  documents: DocumentTransparencyInfo[];
}

export interface DataTransparencyConfig {
  /** 是否启用数据透明化 */
  enabled: boolean;
  /** 自动刷新间隔 (毫秒) */
  refreshInterval: number;
  /** 是否显示详细信息 */
  showDetails: boolean;
  /** 是否显示调试信息 */
  showDebugInfo: boolean;
  /** 数据检查深度 */
  checkDepth: 'basic' | 'detailed' | 'comprehensive';
}

export interface DataTransparencyEvents {
  /** 数据状态变化 */
  'data-status-changed': {
    docId: string;
    oldStatus: DocumentTransparencyInfo;
    newStatus: DocumentTransparencyInfo;
  };
  
  /** 同步状态变化 */
  'sync-status-changed': {
    docId: string;
    oldStatus: DataSyncStatus;
    newStatus: DataSyncStatus;
  };
  
  /** 连接状态变化 */
  'connection-changed': {
    isOnline: boolean;
    isCloudConnected: boolean;
  };
  
  /** 数据完整性检查完成 */
  'integrity-check-completed': {
    docId: string;
    result: DataIntegrity;
  };
}

export type DataTransparencyEventHandler<T extends keyof DataTransparencyEvents> = (
  event: DataTransparencyEvents[T]
) => void;