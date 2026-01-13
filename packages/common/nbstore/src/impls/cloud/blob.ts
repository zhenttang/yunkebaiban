import { UserFriendlyError } from '@yunke/error';
// import {
//   deleteBlobMutation,
//   listBlobsQuery,
//   releaseDeletedBlobsMutation,
//   setBlobMutation,
//   workspaceBlobQuotaQuery,
// } from '@yunke/graphql';

// Temporary placeholder functions for GraphQL queries
const setBlobMutation = null;
const deleteBlobMutation = null;
const releaseDeletedBlobsMutation = null;
const listBlobsQuery = null;
const workspaceBlobQuotaQuery = null;

import {
  type BlobRecord,
  BlobStorageBase,
  OverCapacityError,
  OverSizeError,
} from '../../storage';
import { HttpConnection } from './http';

interface CloudBlobStorageOptions {
  serverBaseUrl: string;
  id: string;
}

const SHOULD_MANUAL_REDIRECT = BUILD_CONFIG.isAndroid || BUILD_CONFIG.isIOS;

export class CloudBlobStorage extends BlobStorageBase {
  static readonly identifier = 'CloudBlobStorage';
  override readonly isReadonly = false;

  constructor(private readonly options: CloudBlobStorageOptions) {
    super();
  }

  readonly connection = new HttpConnection(this.options.serverBaseUrl);

  /**
   * 获取包含认证token的请求头
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'x-yunke-version': BUILD_CONFIG.appVersion,
    };

    // 尝试从localStorage获取JWT token
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('yunke-admin-token') || 
                   localStorage.getItem('yunke-access-token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  override async get(key: string, signal?: AbortSignal) {
    const res = await this.connection.fetch(
      '/api/workspaces/' +
        this.options.id +
        '/blobs/' +
        key +
        (SHOULD_MANUAL_REDIRECT ? '?redirect=manual' : ''),
      {
        cache: 'default',
        headers: this.getAuthHeaders(),
        signal,
      }
    );

    if (res.status === 404) {
      return null;
    }

    try {
      const contentType = res.headers.get('content-type');

      let blob;

      if (
        SHOULD_MANUAL_REDIRECT &&
        contentType?.startsWith('application/json')
      ) {
        const json = await res.json();
        if ('url' in json && typeof json.url === 'string') {
          const res = await this.connection.fetch(json.url, {
            cache: 'default',
            headers: this.getAuthHeaders(),
            signal,
          });

          blob = await res.blob();
        } else {
          throw new Error('无效的blob响应');
        }
      } else {
        blob = await res.blob();
      }

      return {
        key,
        data: new Uint8Array(await blob.arrayBuffer()),
        mime: blob.type,
        size: blob.size,
        createdAt: new Date(res.headers.get('last-modified') || Date.now()),
      };
    } catch (err) {
      throw new Error('blob download error: ' + err);
    }
  }

  override async set(blob: BlobRecord, signal?: AbortSignal) {
    try {
      const blobSizeLimit = await this.getBlobSizeLimit();
      if (blobSizeLimit !== null && blob.data.byteLength > blobSizeLimit) {
        throw new OverSizeError(this.humanReadableBlobSizeLimitCache);
      }
      
      // 使用REST API上传blob - 替代原来的GraphQL方式
      const formData = new FormData();
      const file = new File([blob.data], blob.key, { type: blob.mime });
      formData.append('file', file);
      
      console.log('🔄 [CloudBlobStorage] 开始上传blob');
      console.log(`  📊 参数: key=${blob.key}, size=${blob.data.byteLength}, type=${blob.mime}`);
      console.log(`  📋 文件对象:`, file);
      
      const res = await this.connection.fetch(
        `/api/workspaces/${this.options.id}/blobs/${blob.key}`,
        {
          method: 'PUT',
          body: formData,
          headers: this.getAuthHeaders(),
          signal,
        }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [CloudBlobStorage] 上传失败:', res.status, errorText);
        throw new Error(`Blob upload failed: ${res.status} - ${errorText}`);
      }
      
      console.log('✅ [CloudBlobStorage] Blob上传成功');
      
    } catch (err) {
      console.error('❌ [CloudBlobStorage] 上传错误:', err);
      const userFriendlyError = UserFriendlyError.fromAny(err);
      if (userFriendlyError.is('STORAGE_QUOTA_EXCEEDED')) {
        throw new OverCapacityError();
      }
      if (userFriendlyError.is('BLOB_QUOTA_EXCEEDED')) {
        throw new OverSizeError(this.humanReadableBlobSizeLimitCache);
      }
      if (userFriendlyError.is('CONTENT_TOO_LARGE')) {
        throw new OverSizeError(this.humanReadableBlobSizeLimitCache);
      }
      throw err;
    }
  }

  override async delete(key: string, permanently: boolean) {
    try {
      console.log('🗑️ [CloudBlobStorage] 开始删除blob');
      console.log(`  📊 参数: key=${key}, permanently=${permanently}`);
      
      const res = await this.connection.fetch(
        `/api/workspaces/${this.options.id}/blobs/${key}?permanently=${permanently}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [CloudBlobStorage] 删除失败:', res.status, errorText);
        throw new Error(`Blob delete failed: ${res.status} - ${errorText}`);
      }
      
      console.log('✅ [CloudBlobStorage] Blob删除成功');
    } catch (err) {
      console.error('❌ [CloudBlobStorage] 删除错误:', err);
      throw err;
    }
  }

  override async release() {
    try {
      console.log('🧹 [CloudBlobStorage] 开始释放已删除的blobs');
      
      const res = await this.connection.fetch(
        `/api/workspaces/${this.options.id}/blobs/release`,
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
        }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [CloudBlobStorage] 释放失败:', res.status, errorText);
        throw new Error(`Blob release failed: ${res.status} - ${errorText}`);
      }
      
      console.log('✅ [CloudBlobStorage] Blob释放成功');
    } catch (err) {
      console.error('❌ [CloudBlobStorage] 释放错误:', err);
      throw err;
    }
  }

  override async list() {
    try {
      console.log('📋 [CloudBlobStorage] 开始列出blobs');
      
      const res = await this.connection.fetch(
        `/api/workspaces/${this.options.id}/blobs`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [CloudBlobStorage] 列表获取失败:', res.status, errorText);
        throw new Error(`Blob list failed: ${res.status} - ${errorText}`);
      }
      
      const blobList = await res.json();
      console.log('✅ [CloudBlobStorage] Blob列表获取成功:', blobList.length);
      
      return blobList.map((blob: any) => ({
        ...blob,
        createdAt: new Date(blob.createdAt),
      }));
    } catch (err) {
      console.error('❌ [CloudBlobStorage] 列表错误:', err);
      // 如果获取失败，返回空数组而不是抛出错误
      return [];
    }
  }

  private humanReadableBlobSizeLimitCache: string | null = null;
  private blobSizeLimitCache: number | null = null;
  private blobSizeLimitCacheTime = 0;
  private async getBlobSizeLimit() {
    // If cache time is less than 120 seconds, return the cached value directly
    if (
      this.blobSizeLimitCache !== null &&
      Date.now() - this.blobSizeLimitCacheTime < 120 * 1000
    ) {
      return this.blobSizeLimitCache;
    }
    
    // Temporary: Return a default size limit since GraphQL is disabled
    const defaultSizeLimit = 100 * 1024 * 1024; // 100MB default
    this.blobSizeLimitCache = defaultSizeLimit;
    this.blobSizeLimitCacheTime = Date.now();
    this.humanReadableBlobSizeLimitCache = '100MB';
    return defaultSizeLimit;
    
    // try {
    //   // 尝试从API获取工作区的Blob配额
    //   const res = await this.connection.gql({
    //     query: workspaceBlobQuotaQuery,
    //     variables: { id: this.options.id },
    //   });

    //   // 如果成功获取配额信息，则缓存并返回
    //   if (res?.workspace?.quota) {
    //     this.humanReadableBlobSizeLimitCache =
    //       res.workspace.quota.humanReadable.blobLimit;
    //     this.blobSizeLimitCache = res.workspace.quota.blobLimit;
    //     this.blobSizeLimitCacheTime = Date.now();
    //     return this.blobSizeLimitCache;
    //   } else {
    //     console.error('Invalid quota response from server:', res);
    //   }
    // } catch (err) {
    //   console.error('Error getting blob size limit:', err);
    // }

    // 如果无法从API获取配额，则使用默认值
    // 腾讯云COS单文件上限为5GB
    // this.humanReadableBlobSizeLimitCache = '5GB';
    // this.blobSizeLimitCache = 5 * 1024 * 1024 * 1024; // 5GB
    // this.blobSizeLimitCacheTime = Date.now();
    
    // return this.blobSizeLimitCache;
  }
}
