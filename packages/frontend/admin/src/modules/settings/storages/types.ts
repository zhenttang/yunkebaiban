export interface StorageConfigDto {
  provider: 'fs' | 'aws-s3' | 'cloudflare-r2' | 'tencent-cos';
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKey: string;
  secretKey: string;
  publicRead: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  enabled: boolean;
}

export interface StorageUsageDto {
  totalFiles: number;
  totalSize: number;
  usedSpace: number;
  availableSpace: number;
  filesByType: Record<string, number>;
  sizeByType: Record<string, number>;
  dailyUploads: number;
  monthlyUploads: number;
}

export interface StorageProviderInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
  requiresConfig: string[];
}

export interface StorageFileDto {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
  isPublic: boolean;
  downloadCount: number;
  lastAccessed?: string;
}

export interface StorageTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface StorageStatsDto {
  uploadsToday: number;
  uploadsThisWeek: number;
  uploadsThisMonth: number;
  popularFiles: StorageFileDto[];
  largestFiles: StorageFileDto[];
  recentUploads: StorageFileDto[];
}

export interface StorageBackupConfig {
  enabled: boolean;
  schedule: string;
  retentionDays: number;
  destination: StorageConfigDto;
}

export type StorageProvider = 'fs' | 'aws-s3' | 'cloudflare-r2' | 'tencent-cos';