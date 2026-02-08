/**
 * 云存储模块 - Core模块
 * 提供跨应用的云存储基础设施
 */

export { 
  // Provider
  CloudStorageProvider, 
  
  // 向后兼容的聚合 Hook
  useCloudStorage,
  
  // 类型
  type CloudStorageStatus,
  
  // 🔧 云同步开关函数
  isCloudSyncEnabled,
  setCloudSyncEnabled,
} from './provider';

// 🔧 性能优化：细粒度 Hooks
export {
  useCloudStorageConnection,  // 连接状态（中频变化）
  useCloudStorageSync,        // 同步状态（高频变化）
  useCloudStorageSession,     // 会话信息（低频变化）
  useCloudStorageActions,     // 操作方法（几乎不变）
  // 类型
  type CloudStorageConnection,
  type CloudStorageSync,
  type CloudStorageSession,
  type CloudStorageActions,
} from './hooks';

export * from './utils/yjs-utils';

// 🔧 P2 优化：文档合并 Worker
export {
  mergeUpdates,
  batchMergeUpdates,
  validateUpdate,
  getUpdateStats,
  getMergeStats,
  isWorkerAvailable,
} from './workers';
