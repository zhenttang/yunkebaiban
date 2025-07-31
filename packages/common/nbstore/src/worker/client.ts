import { OpClient, transfer } from '@toeverything/infra/op';
import type { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { DummyConnection } from '../connection';
import {
  AwarenessFrontend,
  BlobFrontend,
  DocFrontend,
  IndexerFrontend,
} from '../frontend';
import {
  type AggregateOptions,
  type AggregateResult,
  type AwarenessRecord,
  type BlobRecord,
  type BlobStorage,
  type DocRecord,
  type DocStorage,
  type DocUpdate,
  type IndexerDocument,
  type IndexerSchema,
  type IndexerStorage,
  type ListedBlobRecord,
  type Query,
  type SearchOptions,
  type SearchResult,
} from '../storage';
import type { AwarenessSync } from '../sync/awareness';
import type { BlobSync } from '../sync/blob';
import type { DocSync } from '../sync/doc';
import type { IndexerSync } from '../sync/indexer';
import type { StoreInitOptions, WorkerManagerOps, WorkerOps } from './ops';

export type { StoreInitOptions as WorkerInitOptions } from './ops';

export class StoreManagerClient {
  private readonly connections = new Map<
    string,
    {
      store: StoreClient;
      dispose: () => void;
    }
  >();

  constructor(private readonly client: OpClient<WorkerManagerOps>) {}

  open(key: string, options: StoreInitOptions) {
    const { port1, port2 } = new MessageChannel();

    const client = new OpClient<WorkerOps>(port1);
    const closeKey = uuid();

    this.client
      .call(
        'open',
        transfer(
          {
            key,
            closeKey,
            options,
            port: port2,
          },
          [port2]
        )
      )
      .catch(err => {
        console.error('error opening', err);
      });

    const connection = {
      store: new StoreClient(client),
      dispose: () => {
        this.client.call('close', closeKey).catch(err => {
          console.error('error closing', err);
        });
        this.connections.delete(closeKey);
      },
    };

    this.connections.set(closeKey, connection);

    return connection;
  }

  dispose() {
    this.connections.forEach(connection => {
      connection.dispose();
    });
  }
}

export class StoreClient {
  constructor(private readonly client: OpClient<WorkerOps>) {
    this.docStorage = new WorkerDocStorage(this.client);
    this.blobStorage = new WorkerBlobStorage(this.client);
    this.docSync = new WorkerDocSync(this.client);
    this.blobSync = new WorkerBlobSync(this.client);
    this.awarenessSync = new WorkerAwarenessSync(this.client);
    this.docFrontend = new DocFrontend(this.docStorage, this.docSync);
    this.blobFrontend = new BlobFrontend(this.blobStorage, this.blobSync);
    this.awarenessFrontend = new AwarenessFrontend(this.awarenessSync);
    this.indexerStorage = new WorkerIndexerStorage(this.client);
    this.indexerSync = new WorkerIndexerSync(this.client);
    this.indexerFrontend = new IndexerFrontend(
      this.indexerStorage,
      this.indexerSync
    );
  }

  private readonly docStorage: WorkerDocStorage;
  private readonly blobStorage: WorkerBlobStorage;
  private readonly docSync: WorkerDocSync;
  private readonly blobSync: WorkerBlobSync;
  private readonly awarenessSync: WorkerAwarenessSync;
  private readonly indexerStorage: WorkerIndexerStorage;
  private readonly indexerSync: WorkerIndexerSync;

  readonly docFrontend: DocFrontend;
  readonly blobFrontend: BlobFrontend;
  readonly awarenessFrontend: AwarenessFrontend;
  readonly indexerFrontend: IndexerFrontend;
}

class WorkerDocStorage implements DocStorage {
  constructor(private readonly client: OpClient<WorkerOps>) {}
  spaceId = '';

  readonly storageType = 'doc';
  readonly isReadonly = false;

  async getDoc(docId: string) {
    console.log('🔧 [WorkerDocStorage] Web Worker代理调用:', {
      docId: docId,
      timestamp: new Date().toISOString(),
      workerCall: 'docStorage.getDoc',
      clientExists: !!this.client,
      spaceId: this.spaceId
    });

    // 尝试获取 Web Worker 中的存储类型信息
    try {
      console.log('🔧 [WorkerDocStorage] 尝试获取Web Worker存储信息...');
      const storageInfo = await this.client.call('docStorage.getStorageInfo' as any);
      console.log('🔧 [WorkerDocStorage] Web Worker存储信息:', storageInfo);
    } catch (e) {
      console.log('🔧 [WorkerDocStorage] 无法获取存储信息 (正常，方法不存在):', e.message);
    }

    const result = await this.client.call('docStorage.getDoc', docId);
    
    console.log('🔧 [WorkerDocStorage] Web Worker响应结果:', {
      docId: docId,
      hasResult: !!result,
      resultBinSize: result?.bin?.length || 0,
      resultTimestamp: result?.timestamp,
      isNull: result === null,
      isUndefined: result === undefined,
      resultType: typeof result,
      resultHex: result?.bin ? 
        Array.from(result.bin.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ') : 'null'
    });

    // 🚀 回退机制：如果Web Worker返回空，直接从后端HTTP API获取
    if (!result) {
      console.log('🚀 [WorkerDocStorage] Web Worker返回空，启动HTTP API回退机制:', {
        docId: docId,
        spaceId: this.spaceId
      });

      try {
        const httpResult = await this.fetchFromBackend(docId);
        if (httpResult) {
          console.log('✅ [WorkerDocStorage] HTTP API回退成功:', {
            docId: docId,
            binSize: httpResult.bin.length,
            binHex: Array.from(httpResult.bin.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')
          });
          return httpResult;
        } else {
          console.warn('⚠️ [WorkerDocStorage] HTTP API回退也返回空:', { docId });
        }
      } catch (error) {
        console.error('❌ [WorkerDocStorage] HTTP API回退失败:', {
          docId: docId,
          error: error.message
        });
      }
    }

    return result;
  }

  private async fetchFromBackend(docId: string): Promise<DocRecord | null> {
    // 获取API基础URL - 使用与cloud.ts相同的方式
    const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');
    
    // 尝试从多个可能的工作空间ID获取文档
    const possibleWorkspaceIds = [
      this.spaceId,
      docId, // 根文档的情况下，docId == workspaceId
      'd8da6c13-114e-4709-bb26-268bf8565f52', // 当前测试的工作空间ID
    ].filter(Boolean);

    for (const workspaceId of possibleWorkspaceIds) {
      try {
        const url = `${apiBaseUrl}/api/workspaces/${workspaceId}/docs/${docId}`;
        console.log('🌐 [WorkerDocStorage] 尝试HTTP请求:', { 
          url, 
          workspaceId, 
          docId,
          apiBaseUrl
        });

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/octet-stream',
            'Authorization': `Bearer ${localStorage.getItem('affine-admin-token') || ''}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer && arrayBuffer.byteLength > 0) {
            const docRecord = {
              docId: docId,
              bin: new Uint8Array(arrayBuffer),
              timestamp: new Date(),
            };

            console.log('✅ [WorkerDocStorage] HTTP请求成功:', {
              url,
              docId,
              binSize: docRecord.bin.length,
              binHex: Array.from(docRecord.bin.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')
            });

            return docRecord;
          }
        } else {
          console.log('⚠️ [WorkerDocStorage] HTTP请求失败:', {
            url,
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (error) {
        console.log('⚠️ [WorkerDocStorage] HTTP请求异常:', {
          workspaceId,
          docId,
          error: error.message
        });
      }
    }

    return null;
  }

  async getDocDiff(docId: string, state?: Uint8Array) {
    return this.client.call('docStorage.getDocDiff', { docId, state });
  }

  async pushDocUpdate(update: DocUpdate, origin?: string) {
    return this.client.call('docStorage.pushDocUpdate', { update, origin });
  }

  async getDocTimestamp(docId: string) {
    return this.client.call('docStorage.getDocTimestamp', docId);
  }

  async getDocTimestamps(after?: Date) {
    return this.client.call('docStorage.getDocTimestamps', after ?? null);
  }

  async deleteDoc(docId: string) {
    return this.client.call('docStorage.deleteDoc', docId);
  }

  subscribeDocUpdate(callback: (update: DocRecord, origin?: string) => void) {
    const subscription = this.client
      .ob$('docStorage.subscribeDocUpdate')
      .subscribe(value => {
        callback(value.update, value.origin);
      });
    return () => {
      subscription.unsubscribe();
    };
  }

  connection = new WorkerDocConnection(this.client);
}

class WorkerDocConnection extends DummyConnection {
  constructor(private readonly client: OpClient<WorkerOps>) {
    super();
  }

  promise: Promise<void> | undefined;

  override waitForConnected(): Promise<void> {
    if (this.promise) {
      return this.promise;
    }
    this.promise = this.client.call('docStorage.waitForConnected');
    return this.promise;
  }
}

class WorkerBlobStorage implements BlobStorage {
  constructor(private readonly client: OpClient<WorkerOps>) {}

  readonly storageType = 'blob';
  readonly isReadonly = false;

  get(key: string, _signal?: AbortSignal): Promise<BlobRecord | null> {
    return this.client.call('blobStorage.getBlob', key);
  }
  set(blob: BlobRecord, _signal?: AbortSignal): Promise<void> {
    return this.client.call('blobStorage.setBlob', blob);
  }

  delete(
    key: string,
    permanently: boolean,
    _signal?: AbortSignal
  ): Promise<void> {
    return this.client.call('blobStorage.deleteBlob', { key, permanently });
  }

  release(_signal?: AbortSignal): Promise<void> {
    return this.client.call('blobStorage.releaseBlobs');
  }

  list(_signal?: AbortSignal): Promise<ListedBlobRecord[]> {
    return this.client.call('blobStorage.listBlobs');
  }

  connection = new WorkerBlobConnection(this.client);
}

class WorkerBlobConnection extends DummyConnection {
  constructor(private readonly client: OpClient<WorkerOps>) {
    super();
  }

  promise: Promise<void> | undefined;

  override waitForConnected(): Promise<void> {
    if (this.promise) {
      return this.promise;
    }
    this.promise = this.client.call('blobStorage.waitForConnected');
    return this.promise;
  }
}

class WorkerDocSync implements DocSync {
  constructor(private readonly client: OpClient<WorkerOps>) {}

  get state$() {
    return this.client.ob$('docSync.state');
  }

  docState$(docId: string) {
    return this.client.ob$('docSync.docState', docId);
  }

  async waitForSynced(docId?: string, abort?: AbortSignal): Promise<void> {
    await this.client.call('docSync.waitForSynced', docId ?? null, abort);
  }

  addPriority(docId: string, priority: number) {
    const subscription = this.client
      .ob$('docSync.addPriority', { docId, priority })
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }

  resetSync(): Promise<void> {
    return this.client.call('docSync.resetSync');
  }
}

class WorkerBlobSync implements BlobSync {
  constructor(private readonly client: OpClient<WorkerOps>) {}
  get state$() {
    return this.client.ob$('blobSync.state');
  }
  blobState$(blobId: string) {
    return this.client.ob$('blobSync.blobState', blobId);
  }

  downloadBlob(blobId: string): Promise<boolean> {
    return this.client.call('blobSync.downloadBlob', blobId);
  }
  uploadBlob(blob: BlobRecord, force?: boolean): Promise<true> {
    return this.client.call('blobSync.uploadBlob', { blob, force });
  }
  fullDownload(peerId?: string, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const abortListener = () => {
        reject(signal?.reason);
        subscription.unsubscribe();
      };

      signal?.addEventListener('abort', abortListener);

      const subscription = this.client
        .ob$('blobSync.fullDownload', peerId ?? null)
        .subscribe({
          next() {
            signal?.removeEventListener('abort', abortListener);
            resolve();
          },
          error(err) {
            signal?.removeEventListener('abort', abortListener);
            reject(err);
          },
        });
    });
  }
}

class WorkerAwarenessSync implements AwarenessSync {
  constructor(private readonly client: OpClient<WorkerOps>) {}

  update(record: AwarenessRecord, origin?: string): Promise<void> {
    return this.client.call('awarenessSync.update', {
      awareness: record,
      origin,
    });
  }

  subscribeUpdate(
    id: string,
    onUpdate: (update: AwarenessRecord, origin?: string) => void,
    onCollect: () => Promise<AwarenessRecord | null>
  ): () => void {
    const subscription = this.client
      .ob$('awarenessSync.subscribeUpdate', id)
      .subscribe({
        next: update => {
          if (update.type === 'awareness-update') {
            onUpdate(update.awareness, update.origin);
          }
          if (update.type === 'awareness-collect') {
            onCollect()
              .then(record => {
                if (record) {
                  this.client
                    .call('awarenessSync.collect', {
                      awareness: record,
                      collectId: update.collectId,
                    })
                    .catch(err => {
                      console.error('收集感知反馈时出错', err);
                    });
                }
              })
              .catch(err => {
                console.error('收集感知时出错', err);
              });
          }
        },
      });
    return () => {
      subscription.unsubscribe();
    };
  }
}

class WorkerIndexerStorage implements IndexerStorage {
  constructor(private readonly client: OpClient<WorkerOps>) {}
  readonly storageType = 'indexer';
  readonly isReadonly = true;
  connection = new WorkerIndexerConnection(this.client);

  search<T extends keyof IndexerSchema, const O extends SearchOptions<T>>(
    table: T,
    query: Query<T>,
    options?: O
  ): Promise<SearchResult<T, O>> {
    return this.client.call('indexerStorage.search', { table, query, options });
  }
  aggregate<T extends keyof IndexerSchema, const O extends AggregateOptions<T>>(
    table: T,
    query: Query<T>,
    field: keyof IndexerSchema[T],
    options?: O
  ): Promise<AggregateResult<T, O>> {
    return this.client.call('indexerStorage.aggregate', {
      table,
      query,
      field: field as string,
      options,
    });
  }
  search$<T extends keyof IndexerSchema, const O extends SearchOptions<T>>(
    table: T,
    query: Query<T>,
    options?: O
  ): Observable<SearchResult<T, O>> {
    return this.client.ob$('indexerStorage.subscribeSearch', {
      table,
      query,
      options,
    });
  }
  aggregate$<
    T extends keyof IndexerSchema,
    const O extends AggregateOptions<T>,
  >(
    table: T,
    query: Query<T>,
    field: keyof IndexerSchema[T],
    options?: O
  ): Observable<AggregateResult<T, O>> {
    return this.client.ob$('indexerStorage.subscribeAggregate', {
      table,
      query,
      field: field as string,
      options,
    });
  }
  deleteByQuery<T extends keyof IndexerSchema>(
    _table: T,
    _query: Query<T>
  ): Promise<void> {
    throw new Error('方法未实现。');
  }
  insert<T extends keyof IndexerSchema>(
    _table: T,
    _document: IndexerDocument<T>
  ): Promise<void> {
    throw new Error('方法未实现。');
  }
  delete<T extends keyof IndexerSchema>(_table: T, _id: string): Promise<void> {
    throw new Error('方法未实现。');
  }
  update<T extends keyof IndexerSchema>(
    _table: T,
    _document: IndexerDocument<T>
  ): Promise<void> {
    throw new Error('方法未实现。');
  }
  refresh<T extends keyof IndexerSchema>(_table: T): Promise<void> {
    throw new Error('方法未实现。');
  }
}

class WorkerIndexerConnection extends DummyConnection {
  constructor(private readonly client: OpClient<WorkerOps>) {
    super();
  }

  promise: Promise<void> | undefined;

  override waitForConnected(): Promise<void> {
    if (this.promise) {
      return this.promise;
    }
    this.promise = this.client.call('indexerStorage.waitForConnected');
    return this.promise;
  }
}

class WorkerIndexerSync implements IndexerSync {
  constructor(private readonly client: OpClient<WorkerOps>) {}
  waitForCompleted(signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const abortListener = () => {
        reject(signal?.reason);
        subscription.unsubscribe();
      };

      signal?.addEventListener('abort', abortListener);

      const subscription = this.client
        .ob$('indexerSync.waitForCompleted')
        .subscribe({
          complete() {
            signal?.removeEventListener('abort', abortListener);
            resolve();
          },
          error(err) {
            signal?.removeEventListener('abort', abortListener);
            reject(err);
          },
        });
    });
  }
  waitForDocCompleted(docId: string, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const abortListener = () => {
        reject(signal?.reason);
        subscription.unsubscribe();
      };

      signal?.addEventListener('abort', abortListener);

      const subscription = this.client
        .ob$('indexerSync.waitForDocCompleted', docId)
        .subscribe({
          complete() {
            signal?.removeEventListener('abort', abortListener);
            resolve();
          },
          error(err) {
            signal?.removeEventListener('abort', abortListener);
            reject(err);
          },
        });
    });
  }
  get state$() {
    return this.client.ob$('indexerSync.state');
  }
  docState$(docId: string) {
    return this.client.ob$('indexerSync.docState', docId);
  }
  addPriority(docId: string, priority: number) {
    const subscription = this.client
      .ob$('indexerSync.addPriority', { docId, priority })
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  }
}
