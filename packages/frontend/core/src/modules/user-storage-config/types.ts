/**
 * 存储提供商类型
 */
export enum StorageProvider {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  R2 = 'R2',
  COS = 'COS',
}

/**
 * 用户存储配置
 */
export interface UserStorageConfig {
  id?: number;
  userId?: string;
  enabled: boolean;
  provider: StorageProvider;
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  publicUrlPrefix?: string;
  localPath?: string;
  pathPrefix?: string;
  configName?: string;
  description?: string;
  verified?: boolean;
  lastVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 存储配置测试结果
 */
export interface StorageTestResult {
  success: boolean;
  message: string;
}

/**
 * 存储使用统计
 */
export interface StorageStats {
  userId: string;
  totalFiles: number;
  totalSize: number;
  usedQuota: string;
}

/**
 * 存储提供商信息
 */
export interface ProviderInfo {
  value: StorageProvider;
  label: string;
  description: string;
  icon?: string;
  requiresCloud: boolean;
}

/**
 * 存储提供商列表
 */
export const STORAGE_PROVIDERS: ProviderInfo[] = [
  {
    value: StorageProvider.LOCAL,
    label: '本地存储',
    description: '文件保存在服务器本地磁盘',
    icon: '💾',
    requiresCloud: false,
  },
  {
    value: StorageProvider.S3,
    label: 'Amazon S3',
    description: 'AWS S3 对象存储服务',
    icon: '☁️',
    requiresCloud: true,
  },
  {
    value: StorageProvider.R2,
    label: 'Cloudflare R2',
    description: 'Cloudflare R2 对象存储',
    icon: '🌐',
    requiresCloud: true,
  },
  {
    value: StorageProvider.COS,
    label: '腾讯云 COS',
    description: '腾讯云对象存储服务',
    icon: '☁️',
    requiresCloud: true,
  },
];
