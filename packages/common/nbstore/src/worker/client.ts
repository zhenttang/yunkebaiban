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
  type DocClock,
  type DocClocks,
  type DocRecord,
  type DocStorage,
  type DocSyncStorage,
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
import { DocSyncImpl } from '../sync/doc';
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

    // 创建云端 DocStorage（延迟初始化，不阻塞）
    let cloudDocStorage: any = undefined;
    console.log('🔍 [StoreManagerClient] 开始初始化云端存储，检查配置:', {
      hasOptions: !!options,
      hasRemotes: !!(options && options.remotes),
      remotesCount: options?.remotes ? Object.keys(options.remotes).length : 0,
      remotesKeys: options?.remotes ? Object.keys(options.remotes) : []
    });
    
    const cloudDocStoragePromise = (async () => {
      try {
        const remotes = options.remotes || {};
        console.log('🔍 [StoreManagerClient] 遍历 remotes 配置:', {
          remotesEntries: Object.entries(remotes).map(([key, val]) => ({
            key,
            hasDoc: !!(val as any).doc,
            docName: (val as any).doc?.name
          }))
        });
        
        for (const [peerId, peerOptions] of Object.entries(remotes)) {
          console.log('🔍 [StoreManagerClient] 检查 peer:', {
            peerId,
            docName: peerOptions.doc?.name,
            isCloudDocStorage: peerOptions.doc?.name === 'CloudDocStorage'
          });
          
          if (peerOptions.doc?.name === 'CloudDocStorage') {
            console.log('🌐 [StoreManagerClient] 检测到云端存储配置，创建CloudDocStorage实例');
            const { CloudDocStorage } = await import('@yunke/nbstore/cloud');
            cloudDocStorage = new CloudDocStorage(peerOptions.doc.opts as any);
            console.log('🌐 [StoreManagerClient] CloudDocStorage 实例已创建，开始连接...');
            await cloudDocStorage.connection.connect();
            console.log('🌐 [StoreManagerClient] 连接已启动，等待连接完成...');
            await cloudDocStorage.connection.waitForConnected();
            console.log('✅ [StoreManagerClient] CloudDocStorage初始化成功');
            break;
          }
        }
        
        if (!cloudDocStorage) {
          console.warn('⚠️ [StoreManagerClient] 未找到CloudDocStorage配置，云端存储将不可用');
        }
      } catch (error) {
        console.error('❌ [StoreManagerClient] 创建CloudDocStorage失败:', error);
      }
      
      console.log('🌐 [StoreManagerClient] cloudDocStoragePromise 完成:', {
        hasCloudStorage: !!cloudDocStorage,
        cloudStorageType: cloudDocStorage?.constructor?.name
      });
      
      return cloudDocStorage;
    })();

    const connection = {
      store: new StoreClient(client, cloudDocStoragePromise),
      dispose: () => {
        this.client.call('close', closeKey).catch(err => {
          console.error('error closing', err);
        });
        this.connections.delete(closeKey);
        // 清理云端存储连接
        cloudDocStoragePromise.then(storage => {
          if (storage) {
            storage.connection.disconnect();
          }
        });
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
  constructor(
    private readonly client: OpClient<WorkerOps>,
    private readonly cloudDocStoragePromise?: Promise<any>
  ) {
    this.docStorage = new WorkerDocStorage(this.client, cloudDocStoragePromise);
    this.blobStorage = new WorkerBlobStorage(this.client);

    console.log('🔧 [StoreClient] 初始化 DocSync');

    if (cloudDocStoragePromise) {
      console.log('🌐 [StoreClient] 检测到云端存储，创建主线程 DocSync');
      const workerDocSyncStorage = new WorkerDocSyncStorage(this.client);
      this.docSync = new DocSyncImpl(
        {
          local: this.docStorage,
          remotes: {},
        },
        workerDocSyncStorage
      );
      this.isMainThreadSync = true;

      this.initializeCloudSync(cloudDocStoragePromise, this.docSync as DocSyncImpl, workerDocSyncStorage);
    } else {
      console.log('📦 [StoreClient] 使用 Worker DocSync');
      this.docSync = new WorkerDocSync(this.client);
      this.isMainThreadSync = false;
    }

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

  private isMainThreadSync = false;

  private async initializeCloudSync(
    cloudDocStoragePromise: Promise<any>,
    docSync: DocSyncImpl,
    workerDocSyncStorage: WorkerDocSyncStorage
  ): Promise<void> {
    console.log('🌐 [StoreClient] 开始初始化云端同步...');
    try {
      const cloudDocStorage = await cloudDocStoragePromise;
      console.log('🌐 [StoreClient] 云端存储Promise resolved:', {
        hasStorage: !!cloudDocStorage,
        storageType: cloudDocStorage?.constructor?.name
      });
      
      if (cloudDocStorage) {
        console.log('✅ [StoreClient] 云端存储已就绪，添加远程同步 Peer');
        const { DocSyncPeer } = await import('../sync/doc/peer');
        (docSync as any).peers.push(
          new DocSyncPeer(
            'cloud:main-thread',
            this.docStorage,
            workerDocSyncStorage,
            cloudDocStorage
          )
        );
        console.log('🚀 [StoreClient] 启动云端同步 Peer');
        docSync.start();
      } else {
        console.warn('⚠️ [StoreClient] 云端存储Promise resolved但值为空');
      }
    } catch (error) {
      console.error('❌ [StoreClient] 云端存储初始化失败:', error);
    }
  }

  private readonly docStorage: WorkerDocStorage;
  private readonly blobStorage: WorkerBlobStorage;
  private readonly docSync: DocSync;
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
  constructor(
    private readonly client: OpClient<WorkerOps>,
    private cloudStoragePromise?: Promise<any>
  ) {}
  spaceId = '';

  readonly storageType = 'doc';
  readonly isReadonly = false;

  private async getCloudStorage() {
    if (!this.cloudStoragePromise) {
      throw new Error('❌ 云端存储未配置，无法读取文档');
    }
    const cloudStorage = await this.cloudStoragePromise;
    if (!cloudStorage) {
      throw new Error('❌ 云端存储初始化失败');
    }
    return cloudStorage;
  }

  async getDoc(docId: string) {
    console.log('🌐 [WorkerDocStorage] 直接从云端获取文档（跳过IndexedDB）:', { docId });
    
    try {
      const cloudStorage = await this.getCloudStorage();
      const cloudResult = await cloudStorage.getDoc(docId);
      
      if (cloudResult) {
        console.log('✅ [WorkerDocStorage] 云端获取成功:', {
          docId,
          binSize: cloudResult.bin?.length || 0,
          timestamp: cloudResult.timestamp
        });
        return cloudResult;
      } else {
        console.log('ℹ️ [WorkerDocStorage] 云端文档不存在:', { docId });
        return null;
      }
    } catch (error) {
      console.error('❌ [WorkerDocStorage] 云端获取失败:', {
        docId,
        error: error instanceof Error ? error.message : String(error)
      });
      // 不再fallback到IndexedDB，直接返回null
      return null;
    }
  }

  async getDocDiff(docId: string, state?: Uint8Array) {
    console.log('🌐 [WorkerDocStorage] 直接从云端获取文档差异:', { docId });
    try {
      const cloudStorage = await this.getCloudStorage();
      return await cloudStorage.getDocDiff(docId, state);
    } catch (error) {
      console.error('❌ [WorkerDocStorage] 云端获取差异失败:', error);
      return null;
    }
  }

  async pushDocUpdate(update: DocUpdate, origin?: string) {
    console.log('🌐 [WorkerDocStorage] 直接推送到云端（跳过IndexedDB）:', {
      docId: update.docId,
      binSize: update.bin.length,
      origin
    });
    
    try {
      const cloudStorage = await this.getCloudStorage();
      const result = await cloudStorage.pushDocUpdate(update, origin);
      
      console.log('✅ [WorkerDocStorage] 云端保存成功:', {
        docId: update.docId,
        timestamp: result
      });
      
      return result;
    } catch (error) {
      console.error('❌ [WorkerDocStorage] 云端保存失败:', {
        docId: update.docId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async getDocTimestamp(docId: string) {
    console.log('🌐 [WorkerDocStorage] 从云端获取文档时间戳:', { docId });
    try {
      const cloudStorage = await this.getCloudStorage();
      return await cloudStorage.getDocTimestamp(docId);
    } catch (error) {
      console.error('❌ [WorkerDocStorage] 获取时间戳失败:', error);
      return null;
    }
  }

  async getDocTimestamps(after?: Date) {
    console.log('🌐 [WorkerDocStorage] 从云端获取文档时间戳列表');
    try {
      const cloudStorage = await this.getCloudStorage();
      return await cloudStorage.getDocTimestamps(after);
    } catch (error) {
      console.error('❌ [WorkerDocStorage] 获取时间戳列表失败:', error);
      return {};
    }
  }

  async deleteDoc(docId: string) {
    console.log('🌐 [WorkerDocStorage] 从云端删除文档:', { docId });
    try {
      const cloudStorage = await this.getCloudStorage();
      return await cloudStorage.deleteDoc(docId);
    } catch (error) {
      console.error('❌ [WorkerDocStorage] 删除文档失败:', error);
      throw error;
    }
  }

  subscribeDocUpdate(callback: (update: DocRecord, origin?: string) => void) {
    console.log('🔔 [WorkerDocStorage] 订阅云端文档更新');
    
    // 直接订阅云端存储的更新
    let unsubscribe: (() => void) | null = null;
    let isUnsubscribed = false;
    
    this.getCloudStorage()
      .then(async cloudStorage => {
        if (isUnsubscribed) {
          console.log('⚠️ [WorkerDocStorage] 订阅已取消，跳过');
          return;
        }
        
        // 确保连接完成
        await cloudStorage.connection.waitForConnected();
        
        if (isUnsubscribed) {
          console.log('⚠️ [WorkerDocStorage] 订阅已取消，跳过');
          return;
        }
        
        console.log('✅ [WorkerDocStorage] 已连接到云端存储订阅');
        unsubscribe = cloudStorage.subscribeDocUpdate(callback);
      })
      .catch(error => {
        console.error('❌ [WorkerDocStorage] 订阅云端更新失败:', error);
      });
    
    return () => {
      isUnsubscribed = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }

  connection = new CloudDocConnection(this.cloudStoragePromise);
}

class CloudDocConnection extends DummyConnection {
  constructor(private readonly cloudStoragePromise?: Promise<any>) {
    super();
  }

  promise: Promise<void> | undefined;

  override async waitForConnected(): Promise<void> {
    if (this.promise) {
      return this.promise;
    }
    
    console.log('🔌 [CloudDocConnection] 等待云端存储连接...');
    
    this.promise = (async () => {
      if (!this.cloudStoragePromise) {
        throw new Error('❌ 云端存储未配置');
      }
      
      const cloudStorage = await this.cloudStoragePromise;
      if (!cloudStorage) {
        throw new Error('❌ 云端存储初始化失败');
      }
      
      // 等待云端存储连接
      await cloudStorage.connection.waitForConnected();
      console.log('✅ [CloudDocConnection] 云端存储已连接');
    })();
    
    return this.promise;
  }
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

class WorkerDocSyncStorage implements DocSyncStorage {
  readonly storageType = 'docSync';
  readonly connection = new DummyConnection();

  constructor(private readonly client: OpClient<WorkerOps>) {}

  async getPeerRemoteClock(peer: string, docId: string): Promise<DocClock | null> {
    return this.client.call('docSyncStorage.getPeerRemoteClock', { peer, docId });
  }

  async getPeerRemoteClocks(peer: string): Promise<DocClocks> {
    return this.client.call('docSyncStorage.getPeerRemoteClocks', peer);
  }

  async setPeerRemoteClock(peer: string, clock: DocClock): Promise<void> {
    return this.client.call('docSyncStorage.setPeerRemoteClock', { peer, clock });
  }

  async getPeerPulledRemoteClock(peer: string, docId: string): Promise<DocClock | null> {
    return this.client.call('docSyncStorage.getPeerPulledRemoteClock', { peer, docId });
  }

  async getPeerPulledRemoteClocks(peer: string): Promise<DocClocks> {
    return this.client.call('docSyncStorage.getPeerPulledRemoteClocks', peer);
  }

  async setPeerPulledRemoteClock(peer: string, clock: DocClock): Promise<void> {
    return this.client.call('docSyncStorage.setPeerPulledRemoteClock', { peer, clock });
  }

  async getPeerPushedClock(peer: string, docId: string): Promise<DocClock | null> {
    return this.client.call('docSyncStorage.getPeerPushedClock', { peer, docId });
  }

  async getPeerPushedClocks(peer: string): Promise<DocClocks> {
    return this.client.call('docSyncStorage.getPeerPushedClocks', peer);
  }

  async setPeerPushedClock(peer: string, clock: DocClock): Promise<void> {
    return this.client.call('docSyncStorage.setPeerPushedClock', { peer, clock });
  }

  async clearClocks(): Promise<void> {
    return this.client.call('docSyncStorage.clearClocks');
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
