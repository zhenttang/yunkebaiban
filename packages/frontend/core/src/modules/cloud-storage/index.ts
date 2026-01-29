/**
 * 云存储模块 - Core模块
 * 提供跨应用的云存储基础设施
 */

export { 
  CloudStorageProvider, 
  useCloudStorage, 
  type CloudStorageStatus,
  // 🔧 云同步开关函数
  isCloudSyncEnabled,
  setCloudSyncEnabled,
} from './provider';
export * from './utils/yjs-utils';

