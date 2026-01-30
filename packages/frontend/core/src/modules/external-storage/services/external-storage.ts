import type { Workspace } from '@blocksuite/affine/store';
import { Service } from '@toeverything/infra';

import type {
  ExternalStorageConfig,
  ExternalStorageType,
  S3Config,
  TestConnectionResult,
  ListFilesResult,
} from '../types';
import {
  testS3Connection,
  listS3Files,
  uploadToS3,
  downloadFromS3,
} from '../clients/s3-client';
import {
  exportWorkspaceSnapshot,
  serializeSnapshot,
  deserializeSnapshot,
  importWorkspaceSnapshot,
} from './workspace-sync';

const STORAGE_CONFIG_KEY = 'yunke:external-storage-config';

export class ExternalStorageService extends Service {
  private _config: ExternalStorageConfig | null = null;

  constructor() {
    super();
    this.loadConfig();
  }

  private loadConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (stored) {
        this._config = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[ExternalStorage] 加载配置失败:', error);
    }
  }

  get config(): ExternalStorageConfig | null {
    return this._config;
  }

  get type(): ExternalStorageType {
    return this._config?.type || 'local';
  }

  get isConfigured(): boolean {
    return this._config !== null && this._config.type !== 'local';
  }

  saveConfig(config: ExternalStorageConfig) {
    this._config = config;
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('[ExternalStorage] 保存配置失败:', error);
    }
  }

  clearConfig() {
    this._config = null;
    try {
      localStorage.removeItem(STORAGE_CONFIG_KEY);
    } catch (error) {
      console.error('[ExternalStorage] 清除配置失败:', error);
    }
  }

  async testConnection(): Promise<TestConnectionResult> {
    if (!this._config || this._config.type === 'local') {
      return { success: false, message: '未配置外部存储' };
    }

    switch (this._config.type) {
      case 's3':
        return testS3Connection(this._config.config as S3Config);
      case 'oss':
        // TODO: 实现 OSS 测试连接
        return { success: false, message: 'OSS 支持开发中' };
      case 'webdav':
        // TODO: 实现 WebDAV 测试连接
        return { success: false, message: 'WebDAV 支持开发中' };
      default:
        return { success: false, message: '不支持的存储类型' };
    }
  }

  async testConnectionWithConfig(
    type: ExternalStorageType,
    config: Record<string, string>
  ): Promise<TestConnectionResult> {
    switch (type) {
      case 's3':
        return testS3Connection(config as unknown as S3Config);
      case 'oss':
        return { success: false, message: 'OSS 支持开发中' };
      case 'webdav':
        return { success: false, message: 'WebDAV 支持开发中' };
      case 'local':
        return { success: true, message: '本地存储无需测试' };
      default:
        return { success: false, message: '不支持的存储类型' };
    }
  }

  async listFiles(prefix: string = ''): Promise<ListFilesResult> {
    if (!this._config || this._config.type === 'local') {
      return { success: false, message: '未配置外部存储' };
    }

    switch (this._config.type) {
      case 's3':
        return listS3Files(this._config.config as S3Config, prefix);
      default:
        return { success: false, message: '不支持的存储类型' };
    }
  }

  async uploadData(
    remotePath: string,
    data: ArrayBuffer | Blob | string
  ): Promise<TestConnectionResult> {
    if (!this._config || this._config.type === 'local') {
      return { success: false, message: '未配置外部存储' };
    }

    switch (this._config.type) {
      case 's3':
        return uploadToS3(this._config.config as S3Config, remotePath, data);
      default:
        return { success: false, message: '不支持的存储类型' };
    }
  }

  async downloadData(
    remotePath: string
  ): Promise<{ success: boolean; data?: ArrayBuffer; message?: string }> {
    if (!this._config || this._config.type === 'local') {
      return { success: false, message: '未配置外部存储' };
    }

    switch (this._config.type) {
      case 's3':
        return downloadFromS3(this._config.config as S3Config, remotePath);
      default:
        return { success: false, message: '不支持的存储类型' };
    }
  }

  /**
   * 上传工作区数据到云端 - 统一格式，全平台互通
   * 包含：文档数据 + Blob 数据（图片、附件等）
   * 
   * @param workspace - BlockSuite 工作区
   * @param workspaceId - 工作区 ID
   * @param docStorage - 可选的文档存储接口，如果提供则从存储直接读取数据（更可靠）
   */
  async syncWorkspaceToCloud(
    workspace: Workspace,
    workspaceId: string,
    docStorage?: { getDoc(docId: string): Promise<{ bin: Uint8Array; timestamp?: Date } | null> }
  ): Promise<TestConnectionResult> {
    if (!this._config || this._config.type === 'local') {
      return { success: false, message: '未配置外部存储' };
    }

    try {
      // 导出工作区快照（Yjs 格式 + Blob）
      // 如果提供了 docStorage，则从存储直接读取数据，避免内存中数据不完整的问题
      const snapshot = await exportWorkspaceSnapshot(workspace, docStorage);
      const data = serializeSnapshot(snapshot);
      
      // 使用统一路径，不区分平台
      const remotePath = `yunke-workspaces/${workspaceId}/snapshot.json`;
      const result = await this.uploadData(remotePath, data);
      
      if (result.success) {
        return { 
          success: true, 
          message: `上传成功: ${snapshot.docCount} 个文档, ${snapshot.blobCount} 个附件, 共 ${(data.byteLength / 1024).toFixed(1)} KB` 
        };
      }
      return result;
    } catch (error) {
      return { success: false, message: `导出失败: ${String(error)}` };
    }
  }

  /**
   * 从云端下载工作区数据 - 统一格式，全平台互通
   * 包含：文档数据 + Blob 数据（图片、附件等）
   */
  async syncWorkspaceFromCloud(
    workspace: Workspace,
    workspaceId: string
  ): Promise<TestConnectionResult> {
    if (!this._config || this._config.type === 'local') {
      return { success: false, message: '未配置外部存储' };
    }

    try {
      // 使用统一路径
      const remotePath = `yunke-workspaces/${workspaceId}/snapshot.json`;
      const result = await this.downloadData(remotePath);
      
      if (!result.success || !result.data) {
        return { success: false, message: result.message || '云端没有找到该工作区的数据' };
      }
      
      // 反序列化并导入
      const snapshot = deserializeSnapshot(result.data);
      await importWorkspaceSnapshot(workspace, snapshot);
      
      return { 
        success: true, 
        message: `下载成功: ${snapshot.docCount} 个文档, ${snapshot.blobCount} 个附件\n快照时间: ${new Date(snapshot.timestamp).toLocaleString()}` 
      };
    } catch (error) {
      return { success: false, message: `导入失败: ${String(error)}` };
    }
  }

  /**
   * 获取云端工作区列表 - 统一格式
   */
  async getCloudWorkspaces(): Promise<{
    success: boolean;
    workspaces?: Array<{ id: string; size: number; lastModified: string }>;
    message?: string;
  }> {
    const listResult = await this.listFiles('yunke-workspaces/');
    if (!listResult.success) {
      return { success: false, message: listResult.message };
    }

    const workspaceMap = new Map<string, { id: string; size: number; lastModified: string }>();
    
    for (const file of listResult.files || []) {
      // 匹配统一格式的快照
      const match = file.key.match(/yunke-workspaces\/([^/]+)\/snapshot\.json/);
      if (match) {
        workspaceMap.set(match[1], {
          id: match[1],
          size: file.size,
          lastModified: file.lastModified,
        });
      }
    }

    return { success: true, workspaces: Array.from(workspaceMap.values()) };
  }
}
