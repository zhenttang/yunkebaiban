import { OpClient, transfer } from '@toeverything/infra/op';
import type { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { getSocketIOUrl } from '@yunke/config';
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

  /**
   * ✅ 等待连接就绪，记录详细的失败原因分析
   * @param cloudDocStorage 云端存储实例
   * @param timeout 超时时间（毫秒），默认15秒
   */
  private async waitForConnectionWithDiagnostics(
    cloudDocStorage: any,
    timeout: number = 15000
  ): Promise<void> {
    const startTime = Date.now();
    const connection = cloudDocStorage.connection;
    const opts = cloudDocStorage.options;
    
    // ✅ 获取 Socket.IO URL（用于诊断）
    let socketIOUrl: string = '未配置';
    try {
      socketIOUrl = getSocketIOUrl();
    } catch {
      socketIOUrl = '无法获取';
    }
    
    // ✅ 记录连接初始状态
    console.log('🔍 [StoreManagerClient] 开始等待连接:', {
      endpoint: opts?.serverBaseUrl,
      socketIOUrl: socketIOUrl,
      initialStatus: connection?.status,
      spaceType: opts?.type,
      spaceId: opts?.id,
      timestamp: new Date().toISOString()
    });
    
    try {
      const waitPromise = connection.waitForConnected();
      const waitTimeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => {
          const elapsed = Date.now() - startTime;
          reject(new Error(`连接超时（${elapsed}ms）`));
        }, timeout)
      );
      
      await Promise.race([waitPromise, waitTimeoutPromise]);
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ [StoreManagerClient] 连接成功:`, {
        elapsed: `${elapsed}ms`,
        finalStatus: connection?.status,
        clientId: cloudDocStorage?.connection?.clientId || '未获取',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const elapsed = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // ✅ 收集详细的诊断信息
      const diagnostics = {
        // 基本信息
        error: errorObj.message,
        errorStack: errorObj.stack,
        elapsed: `${elapsed}ms`,
        timeout: `${timeout}ms`,
        timestamp: new Date().toISOString(),
        
        // 连接状态信息
        connectionStatus: connection?.status,
        connectionError: connection?.error ? {
          message: connection.error.message,
          stack: connection.error.stack,
          name: connection.error.name
        } : null,
        
        // 配置信息
        config: {
          serverBaseUrl: opts?.serverBaseUrl,
          socketIOUrl: (() => {
            try {
              return getSocketIOUrl();
            } catch {
              return '无法获取';
            }
          })(),
          spaceType: opts?.type,
          spaceId: opts?.id,
          isSelfHosted: opts?.isSelfHosted
        },
        
        // Socket.IO 连接信息（如果可用）
        socketInfo: connection?.inner?.socket ? {
          id: connection.inner.socket.id || '未连接',
          connected: connection.inner.socket.connected,
          disconnected: connection.inner.socket.disconnected,
          transport: connection.inner.socket.io?.engine?.transport?.name || '未知'
        } : null,
        
        // 可能的失败原因分析
        possibleCauses: this.analyzeFailureCauses(connection, errorObj, elapsed, timeout)
      };
      
      // ✅ 输出详细的失败诊断报告
      console.error('❌ [StoreManagerClient] 连接失败 - 详细诊断报告:', diagnostics);
      
      // ✅ 输出用户友好的错误摘要
      console.error('📋 [StoreManagerClient] 失败摘要:', {
        错误信息: errorObj.message,
        连接状态: connection?.status,
        耗时: `${elapsed}ms`,
        可能原因: diagnostics.possibleCauses.join('; ')
      });
      
      throw errorObj;
    }
  }
  
  /**
   * ✅ 分析连接失败的可能原因
   */
  private analyzeFailureCauses(
    connection: any,
    error: Error,
    elapsed: number,
    timeout: number
  ): string[] {
    const causes: string[] = [];
    
    // 1. 超时分析
    if (elapsed >= timeout) {
      causes.push(`连接超时（${elapsed}ms >= ${timeout}ms）`);
      
      if (connection?.status === 'connecting') {
        causes.push('Socket.IO 连接一直处于 connecting 状态，可能原因：');
        causes.push('  - 服务器未响应或不可达');
        causes.push('  - 网络防火墙阻止了 WebSocket 连接');
        causes.push('  - Socket.IO 服务器未启动或端口错误');
      }
    }
    
    // 2. 连接状态分析
    if (connection?.status === 'error') {
      causes.push(`连接状态为 error`);
      
      if (connection.error) {
        const errMsg = connection.error.message?.toLowerCase() || '';
        if (errMsg.includes('timeout')) {
          causes.push('  - Socket.IO 连接超时');
        } else if (errMsg.includes('network') || errMsg.includes('fetch')) {
          causes.push('  - 网络连接问题');
        } else if (errMsg.includes('401') || errMsg.includes('unauthorized')) {
          causes.push('  - 认证失败，请检查 JWT token');
        } else if (errMsg.includes('403') || errMsg.includes('forbidden')) {
          causes.push('  - 权限不足，请检查用户权限');
        } else if (errMsg.includes('404') || errMsg.includes('not found')) {
          causes.push('  - Socket.IO 端点不存在');
        }
      }
    }
    
    // 3. Socket.IO 特定错误
    if (error.message.includes('space:join')) {
      causes.push('space:join 事件失败，可能原因：');
      causes.push('  - 工作区不存在或无权访问');
      causes.push('  - 服务器端处理 space:join 时出错');
    }
    
    // 4. 网络配置问题
    if (connection?.inner?.socket?.io?.engine?.transport?.name === 'polling') {
      causes.push('使用 polling 传输，可能影响连接速度');
    }
    
    // 5. 通用建议
    if (causes.length === 0) {
      causes.push('未知错误，建议检查：');
      causes.push('  - 浏览器控制台的网络请求');
      causes.push('  - 服务器日志');
      causes.push('  - Socket.IO 服务器状态');
    }
    
    return causes;
  }

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
    
    // 检查是否有 CloudDocStorage 配置
    const remotes = options.remotes || {};
    let hasCloudDocStorageConfig = false;
    
    for (const [, peerOptions] of Object.entries(remotes)) {
      if (peerOptions.doc?.name === 'CloudDocStorage') {
        hasCloudDocStorageConfig = true;
        break;
      }
    }
    
    // 只有当真正有 CloudDocStorage 配置时才创建 Promise
    const cloudDocStoragePromise = hasCloudDocStorageConfig ? (async () => {
      try {
        let cloudDocStorageError: Error | null = null;
        
        for (const [peerId, peerOptions] of Object.entries(remotes)) {
          if (peerOptions.doc?.name === 'CloudDocStorage') {
            try {
              const { CloudDocStorage } = await import('@yunke/nbstore/cloud');
              
              cloudDocStorage = new CloudDocStorage(peerOptions.doc.opts as any);
              
              // 启动连接（connect() 返回 void，只是启动连接过程）
              cloudDocStorage.connection.connect();
              
              // ✅ 等待连接就绪，记录详细的失败原因
              await this.waitForConnectionWithDiagnostics(cloudDocStorage, 15000);
              
              break;
            } catch (error) {
              cloudDocStorageError = error instanceof Error ? error : new Error(String(error));
              console.error('❌ [StoreManagerClient] CloudDocStorage 初始化失败:', {
                peerId,
                error: cloudDocStorageError.message,
                stack: cloudDocStorageError.stack,
                opts: peerOptions.doc.opts,
                connectionStatus: cloudDocStorage?.connection?.status,
                connectionError: cloudDocStorage?.connection?.error
              });
              // 继续尝试其他配置，或者抛出错误
              cloudDocStorage = undefined;
            }
          }
        }
        
        // 如果配置了但初始化失败，抛出错误
        if (!cloudDocStorage && cloudDocStorageError) {
          const errorMsg = `❌ 云端存储初始化失败: ${cloudDocStorageError.message}`;
          console.error(errorMsg, {
            error: cloudDocStorageError,
            stack: cloudDocStorageError.stack
          });
          throw cloudDocStorageError;
        }
        
        return cloudDocStorage;
      } catch (error) {
        console.error('❌ [StoreManagerClient] 创建CloudDocStorage失败:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        // 重新抛出错误，不要静默失败
        throw error;
      }
    })() : undefined;
    
    // 如果没有 CloudDocStorage 配置，记录警告但不报错（可能是本地存储模式）
    if (!hasCloudDocStorageConfig) {
      // 静默处理，不输出日志
    }

    const connection = {
      store: new StoreClient(client, cloudDocStoragePromise),
      dispose: () => {
        this.client.call('close', closeKey).catch(err => {
          console.error('error closing', err);
        });
        this.connections.delete(closeKey);
        // 清理云端存储连接
        if (cloudDocStoragePromise) {
          cloudDocStoragePromise.then(storage => {
            if (storage) {
              storage.connection.disconnect();
            }
          });
        }
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


    if (cloudDocStoragePromise) {
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
    try {
      const cloudDocStorage = await cloudDocStoragePromise;
      
      if (cloudDocStorage) {
        const { DocSyncPeer } = await import('../sync/doc/peer');
        (docSync as any).peers.push(
          new DocSyncPeer(
            'cloud:main-thread',
            this.docStorage,
            workerDocSyncStorage,
            cloudDocStorage
          )
        );
        docSync.start();
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
      // 云端存储未配置，返回 null（使用 Worker 端本地存储）
      return null;
    }
    try {
      const cloudStorage = await this.cloudStoragePromise;
      if (!cloudStorage) {
        // 云端存储配置了但初始化失败，抛出错误（不允许回退）
        throw new Error('❌ 云端存储初始化失败，无法使用');
      }
      return cloudStorage;
    } catch (error) {
      console.error('❌ [WorkerDocStorage] 获取云端存储失败:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // 配置了云端存储但失败，抛出错误（不允许回退）
      throw error;
    }
  }

  async getDoc(docId: string) {
    // 如果配置了云端存储，必须使用云端存储
    if (this.cloudStoragePromise) {
      const cloudStorage = await this.getCloudStorage();
      if (!cloudStorage) {
        throw new Error('❌ 云端存储未初始化，无法读取文档');
      }
      return await cloudStorage.getDoc(docId);
    }
    // 未配置云端存储，使用 Worker 端本地存储
    return await this.client.call('docStorage.getDoc', docId);
  }

  async getDocDiff(docId: string, state?: Uint8Array) {
    // 如果配置了云端存储，必须使用云端存储
    if (this.cloudStoragePromise) {
      const cloudStorage = await this.getCloudStorage();
      if (!cloudStorage) {
        throw new Error('❌ 云端存储未初始化，无法获取文档差异');
      }
      return await cloudStorage.getDocDiff(docId, state);
    }
    // 未配置云端存储，使用 Worker 端本地存储
    return await this.client.call('docStorage.getDocDiff', { docId, state });
  }

  async pushDocUpdate(update: DocUpdate, origin?: string) {
    // 如果配置了云端存储，必须使用云端存储
    if (this.cloudStoragePromise) {
      const cloudStorage = await this.getCloudStorage();
      if (!cloudStorage) {
        throw new Error('❌ 云端存储未初始化，无法保存文档');
      }
      return await cloudStorage.pushDocUpdate(update, origin);
    }
    // 未配置云端存储，使用 Worker 端本地存储
    return await this.client.call('docStorage.pushDocUpdate', { update, origin });
  }

  async getDocTimestamp(docId: string) {
    // 如果配置了云端存储，必须使用云端存储
    if (this.cloudStoragePromise) {
      const cloudStorage = await this.getCloudStorage();
      if (!cloudStorage) {
        throw new Error('❌ 云端存储未初始化，无法获取文档时间戳');
      }
      return await cloudStorage.getDocTimestamp(docId);
    }
    // 未配置云端存储，使用 Worker 端本地存储
    return await this.client.call('docStorage.getDocTimestamp', docId);
  }

  async getDocTimestamps(after?: Date) {
    // 如果配置了云端存储，必须使用云端存储
    if (this.cloudStoragePromise) {
      const cloudStorage = await this.getCloudStorage();
      if (!cloudStorage) {
        throw new Error('❌ 云端存储未初始化，无法获取文档时间戳列表');
      }
      return await cloudStorage.getDocTimestamps(after);
    }
    // 未配置云端存储，使用 Worker 端本地存储
    return await this.client.call('docStorage.getDocTimestamps', after ?? null);
  }

  async deleteDoc(docId: string) {
    // 如果配置了云端存储，必须使用云端存储
    if (this.cloudStoragePromise) {
      const cloudStorage = await this.getCloudStorage();
      if (!cloudStorage) {
        throw new Error('❌ 云端存储未初始化，无法删除文档');
      }
      return await cloudStorage.deleteDoc(docId);
    }
    // 未配置云端存储，使用 Worker 端本地存储
    return await this.client.call('docStorage.deleteDoc', docId);
  }

  subscribeDocUpdate(callback: (update: DocRecord, origin?: string) => void) {
    // 如果配置了云端存储，必须使用云端存储订阅
    if (this.cloudStoragePromise) {
      let unsubscribe: (() => void) | null = null;
      let isUnsubscribed = false;
      
      // 立即尝试获取云端存储，如果失败则抛出错误
      this.getCloudStorage()
        .then(async cloudStorage => {
          if (isUnsubscribed) {
            return;
          }
          
          if (!cloudStorage) {
            throw new Error('❌ 云端存储未初始化，无法订阅更新');
          }
          
          // 使用云端存储订阅
          await cloudStorage.connection.waitForConnected();
          
          if (isUnsubscribed) {
            return;
          }
          
          unsubscribe = cloudStorage.subscribeDocUpdate(callback);
        })
        .catch(error => {
          console.error('❌ [WorkerDocStorage] 订阅云端更新失败:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          // 配置了云端存储但失败，这里无法抛出错误（因为这是异步回调）
          // 错误会在 getCloudStorage() 时抛出
        });
      
      return () => {
        isUnsubscribed = true;
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
    
    // 未配置云端存储，使用 Worker 端本地存储订阅
    const subscription = this.client.ob$('docStorage.subscribeDocUpdate').subscribe({
      next: (value: { update: DocRecord; origin?: string }) => {
        callback(value.update, value.origin);
      },
      error: (error: any) => {
        console.error('❌ [WorkerDocStorage] 订阅更新失败:', error);
      }
    });
    
    return () => subscription.unsubscribe();
  }

  connection = this.cloudStoragePromise 
    ? new CloudDocConnection(this.cloudStoragePromise)
    : new WorkerDocConnection(this.client);
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
    
    
    this.promise = (async () => {
      if (!this.cloudStoragePromise) {
        // 云端存储未配置，抛出错误
        const error = new Error('❌ 云端存储未配置，无法等待连接');
        console.error(error.message);
        throw error;
      }
      
      try {
        const cloudStorage = await this.cloudStoragePromise;
        if (!cloudStorage) {
          // 云端存储初始化失败，抛出错误
          const error = new Error('❌ 云端存储初始化失败，无法等待连接');
          console.error(error.message);
          throw error;
        }
        
        // 等待云端存储连接
        await cloudStorage.connection.waitForConnected();
      } catch (error) {
        // 连接失败，抛出错误
        console.error('❌ [WorkerDocConnection] 等待云端存储连接失败:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
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
