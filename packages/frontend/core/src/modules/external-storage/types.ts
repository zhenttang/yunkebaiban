export interface S3Config {
  endpoint: string;
  bucket: string;
  region?: string;
  accessKey: string;
  secretKey: string;
}

export interface OSSConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
}

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

export type ExternalStorageType = 'local' | 's3' | 'oss' | 'webdav';

export interface ExternalStorageConfig {
  type: ExternalStorageType;
  config: S3Config | OSSConfig | WebDAVConfig | Record<string, never>;
}

export interface StorageFile {
  key: string;
  size: number;
  lastModified: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
}

export interface ListFilesResult {
  success: boolean;
  files?: StorageFile[];
  message?: string;
}
