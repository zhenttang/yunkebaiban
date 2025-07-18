/**
 * 数据透明化系统入口文件
 * 
 * 这个系统提供了完整的数据透明化解决方案，让用户清楚地了解：
 * - 数据存储在哪里（本地、云端、缓存）
 * - 数据同步状态
 * - 数据完整性状态
 * - 离线操作队列
 * - 版本一致性
 */

// 导出类型定义
export type {
  DataLocation,
  DataSyncStatus,
  DataIntegrity,
  DocumentTransparencyInfo,
  WorkspaceTransparencyInfo,
  DataTransparencyConfig,
  DataTransparencyEvents,
  DataTransparencyEventHandler,
} from './types';

// 导出核心检测器
export { DataTransparencyDetector } from './detector';

// 导出UI组件
export {
  DocumentDataTransparency,
  WorkspaceDataTransparency,
  DataTransparencyPanel,
} from './components';

// 默认配置
export const DEFAULT_DATA_TRANSPARENCY_CONFIG: DataTransparencyConfig = {
  enabled: true,
  refreshInterval: 30000, // 30秒刷新一次
  showDetails: false,
  showDebugInfo: false,
  checkDepth: 'basic',
};

// 便捷钩子
export { useDataTransparency } from './hooks';

// 数据透明化服务
export { DataTransparencyService } from './service';