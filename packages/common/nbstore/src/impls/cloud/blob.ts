import { UserFriendlyError } from '@affine/error';
// import {
//   deleteBlobMutation,
//   listBlobsQuery,
//   releaseDeletedBlobsMutation,
//   setBlobMutation,
//   workspaceBlobQuotaQuery,
// } from '@affine/graphql';

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

  override async get(key: string, signal?: AbortSignal) {
    const res = await this.connection.fetch(
      '/api/workspaces/' +
        this.options.id +
        '/blobs/' +
        key +
        (SHOULD_MANUAL_REDIRECT ? '?redirect=manual' : ''),
      {
        cache: 'default',
        headers: {
          'x-affine-version': BUILD_CONFIG.appVersion,
        },
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
            headers: {
              'x-affine-version': BUILD_CONFIG.appVersion,
            },
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
      
      // Temporary: GraphQL functionality disabled
      throw new Error('Blob storage temporarily disabled - GraphQL backend removed');
      
      // 尝试上传
      // try {
      // await this.connection.gql({
      //   query: setBlobMutation,
      //   variables: {
      //     workspaceId: this.options.id,
      //     blob: new File([blob.data], blob.key, { type: blob.mime }),
      //   },
      //   context: {
      //     signal,
      //   },
      // });
      // } catch (err) {
      //   console.error('File upload failed, details:', err);
      //   throw err;
      // }
    } catch (err) {
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

  override async delete(_key: string, _permanently: boolean) {
    // Temporary: GraphQL functionality disabled
    throw new Error('Blob delete temporarily disabled - GraphQL backend removed');
    
    // await this.connection.gql({
    //   query: deleteBlobMutation,
    //   variables: { workspaceId: this.options.id, key, permanently },
    // });
  }

  override async release() {
    // Temporary: GraphQL functionality disabled
    throw new Error('Blob release temporarily disabled - GraphQL backend removed');
    
    // await this.connection.gql({
    //   query: releaseDeletedBlobsMutation,
    //   variables: { workspaceId: this.options.id },
    // });
  }

  override async list() {
    // Temporary: GraphQL functionality disabled
    return [];
    
    // const res = await this.connection.gql({
    //   query: listBlobsQuery,
    //   variables: { workspaceId: this.options.id },
    // });

    // return res.workspace.blobs.map(blob => ({
    //   ...blob,
    //   createdAt: new Date(blob.createdAt),
    // }));
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
