import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { DebugLogger } from '@yunke/debug';
//import {
//   createWorkspaceMutation,
//   deleteWorkspaceMutation,
//   getWorkspaceInfoQuery,
//   getWorkspacesQuery,
//   Permission,
//} from '@yunke/graphql';
import { ServerDeploymentType } from '../../cloud/types';
import type {
  BlobStorage,
  DocStorage,
  ListedBlobRecord,
} from '@yunke/nbstore';
import { CloudBlobStorage, StaticCloudDocStorage } from '@yunke/nbstore/cloud';
import {
  IndexedDBBlobStorage,
  IndexedDBBlobSyncStorage,
  IndexedDBDocStorage,
  IndexedDBDocSyncStorage,
} from '@yunke/nbstore/idb';
import {
  IndexedDBV1BlobStorage,
  IndexedDBV1DocStorage,
} from '@yunke/nbstore/idb/v1';
import {
  SqliteBlobStorage,
  SqliteBlobSyncStorage,
  SqliteDocStorage,
  SqliteDocSyncStorage,
} from '@yunke/nbstore/sqlite';
import {
  SqliteV1BlobStorage,
  SqliteV1DocStorage,
} from '@yunke/nbstore/sqlite/v1';
import type { WorkerInitOptions } from '@yunke/nbstore/worker/client';
import {
  catchErrorInto,
  effect,
  exhaustMapSwitchUntilChanged,
  fromPromise,
  LiveData,
  ObjectPool,
  onComplete,
  onStart,
  Service,
} from '@toeverything/infra';
import { isEqual } from 'lodash-es';
import { map, Observable, switchMap, tap } from 'rxjs';
import {
  applyUpdate,
  type Array as YArray,
  Doc as YDoc,
  encodeStateAsUpdate,
  type Map as YMap,
} from 'yjs';

import type { Server, ServersService } from '../../cloud';
import {
  AccountChanged,
  AuthService,
  WorkspaceServerService,
  FetchService,
} from '../../cloud';
import type { GlobalState } from '../../storage';
import type {
  Workspace,
  WorkspaceFlavourProvider,
  WorkspaceFlavoursProvider,
  WorkspaceMetadata,
  WorkspaceProfileInfo,
} from '../../workspace';
import { WorkspaceImpl } from '../../workspace/impls/workspace';
import { getWorkspaceProfileWorker } from './out-worker';

const getCloudWorkspaceCacheKey = (serverId: string) => {
  if (serverId === 'yunke-cloud') {
    return 'cloud-workspace:'; // FOR BACKWARD COMPATIBILITY
  }
  return `selfhosted-workspace-${serverId}:`;
};

const logger = new DebugLogger('yunke:cloud-workspace-flavour-provider');

class CloudWorkspaceFlavourProvider implements WorkspaceFlavourProvider {
  private readonly authService: AuthService;
  // private readonly graphqlService: GraphQLService;
  private readonly featureFlagService: FeatureFlagService;
  private readonly fetchService: any; // FetchService
  private readonly unsubscribeAccountChanged: () => void;

  constructor(
    private readonly globalState: GlobalState,
    private readonly server: Server
  ) {
    this.authService = server.scope.get(AuthService);
    // this.graphqlService = server.scope.get(GraphQLService);
    
    // 🔧 修复Android WebView环境下FeatureFlagService初始化失败问题
    try {
      this.featureFlagService = server.scope.get(FeatureFlagService);
    } catch (e) {
      // 如果无法获取FeatureFlagService，设置为null，后续使用默认值
      this.featureFlagService = null;
      console.warn('Unable to get FeatureFlagService, using defaults:', e);
    }
    
    // 获取FetchService实例（使用类作为标识符，而不是字符串）
    try {
      this.fetchService = server.scope.get(FetchService);
    } catch (e) {
      // 如果无法获取FetchService，设置为null，后续使用原生fetch
      this.fetchService = null;
      console.warn('Unable to get FetchService:', e);
    }
    
    // 🔧 Android环境下验证存储类型加载
    if ((window as any).BUILD_CONFIG?.isAndroid) {
      console.log('🤖 [CloudWorkspaceFlavourProvider] Android环境初始化检查');
      console.log('存储类型加载状态:');
      console.log('  - DocStorageType:', !!this.DocStorageType);
      console.log('  - BlobStorageType:', !!this.BlobStorageType);
      console.log('  - DocSyncStorageType:', !!this.DocSyncStorageType);
      console.log('  - BlobSyncStorageType:', !!this.BlobSyncStorageType);
      
      // 确保存储类型有identifier属性
      const ensureIdentifier = (storageType: any, name: string, fallback: string) => {
        if (storageType && !storageType.identifier) {
          console.warn(`⚠️ ${name}缺少identifier属性，添加默认值: ${fallback}`);
          storageType.identifier = fallback;
        }
      };
      
      ensureIdentifier(this.DocStorageType, 'DocStorageType', 'IndexedDBDocStorage');
      ensureIdentifier(this.BlobStorageType, 'BlobStorageType', 'IndexedDBBlobStorage');
      ensureIdentifier(this.DocSyncStorageType, 'DocSyncStorageType', 'IndexedDBDocSyncStorage');
      ensureIdentifier(this.BlobSyncStorageType, 'BlobSyncStorageType', 'IndexedDBBlobSyncStorage');
    }
    
    this.unsubscribeAccountChanged = this.server.scope.eventBus.on(
      AccountChanged,
      () => {
        this.revalidate();
      }
    );
  }

  readonly flavour = this.server.id;

  /**
   * 发送带JWT token的HTTP请求
   * 统一使用FetchService（如果可用），享受重试、超时、JWT token等功能
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    // 统一使用FetchService，享受重试、超时、JWT token等功能
    // FetchService会自动处理URL构建（使用network-config.ts的统一配置）
    if (this.fetchService) {
      // 如果URL已经是完整URL，直接使用；否则使用相对路径，FetchService会自动构建
      return await this.fetchService.fetch(url, options);
    } else {
      // 回退方案：手动添加JWT token并使用统一配置
      const headers = {
        ...options.headers,
      } as Record<string, string>;
      
      // 尝试从localStorage获取JWT token
      const token = localStorage.getItem('yunke-admin-token') || 
                   localStorage.getItem('yunke-access-token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // 使用统一配置构建URL
      const { getBaseUrl } = await import('@yunke/config');
      const baseOrigin = getBaseUrl();
      const fullUrl = url.startsWith('http') ? url : `${baseOrigin}${url}`;
      
      return await fetch(fullUrl, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  // 修复Android环境下存储类型的动态加载问题
  DocStorageType = (() => {
    // Android Capacitor应用强制使用IndexedDB
    if (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) {
      console.log('🤖 [CloudWorkspaceFlavourProvider] Android Capacitor环境，使用IndexedDB');
      return IndexedDBDocStorage;
    }
    if (BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS) {
      return SqliteDocStorage;
    }
    // Android非Capacitor环境也使用IndexedDB
    if (BUILD_CONFIG.isAndroid) {
      console.log('🤖 [CloudWorkspaceFlavourProvider] Android环境，使用IndexedDB');
      return IndexedDBDocStorage;
    }
    return IndexedDBDocStorage;
  })();
  
  DocStorageV1Type = BUILD_CONFIG.isElectron
    ? SqliteV1DocStorage
    : BUILD_CONFIG.isWeb || BUILD_CONFIG.isMobileWeb || BUILD_CONFIG.isAndroid
      ? IndexedDBV1DocStorage
      : undefined;
      
  BlobStorageType = (() => {
    // Android Capacitor应用强制使用IndexedDB
    if (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) {
      console.log('🤖 [CloudWorkspaceFlavourProvider] Android Capacitor环境，使用IndexedDB');
      return IndexedDBBlobStorage;
    }
    if (BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS) {
      return SqliteBlobStorage;
    }
    // Android非Capacitor环境也使用IndexedDB
    if (BUILD_CONFIG.isAndroid) {
      console.log('🤖 [CloudWorkspaceFlavourProvider] Android环境，使用IndexedDB');
      return IndexedDBBlobStorage;
    }
    return IndexedDBBlobStorage;
  })();
  
  BlobStorageV1Type = BUILD_CONFIG.isElectron
    ? SqliteV1BlobStorage
    : BUILD_CONFIG.isWeb || BUILD_CONFIG.isMobileWeb || BUILD_CONFIG.isAndroid
      ? IndexedDBV1BlobStorage
      : undefined;
      
  DocSyncStorageType = (() => {
    // Android Capacitor应用强制使用IndexedDB
    if (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) {
      return IndexedDBDocSyncStorage;
    }
    if (BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS) {
      return SqliteDocSyncStorage;
    }
    // Android非Capacitor环境也使用IndexedDB
    if (BUILD_CONFIG.isAndroid) {
      return IndexedDBDocSyncStorage;
    }
    return IndexedDBDocSyncStorage;
  })();
  
  BlobSyncStorageType = (() => {
    // Android Capacitor应用强制使用IndexedDB
    if (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) {
      return IndexedDBBlobSyncStorage;
    }
    if (BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS) {
      return SqliteBlobSyncStorage;
    }
    // Android非Capacitor环境也使用IndexedDB
    if (BUILD_CONFIG.isAndroid) {
      return IndexedDBBlobSyncStorage;
    }
    return IndexedDBBlobSyncStorage;
  })();

  async deleteWorkspace(id: string): Promise<void> {
    // 使用REST API替代GraphQL删除工作空间
    
    try {
      const response = await this.fetchWithAuth(`/api/workspaces/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`删除工作空间失败: ${response.status}`);
      }
      
    } catch (error) {
      console.error('删除工作空间失败:', error);
      throw error;
    }
  }

  async createWorkspace(
    initial: (
      docCollection: WorkspaceImpl,
      blobStorage: BlobStorage,
      docStorage: DocStorage
    ) => Promise<void>
  ): Promise<WorkspaceMetadata> {
    console.log('=== 前端 CloudWorkspaceFlavourProvider.createWorkspace 开始 ===');
    console.log('当前认证状态:', this.authService.session.account$.value);
    console.log('当前服务器信息:', this.server.id, this.server.serverMetadata.baseUrl);
    
    // 创建临时工作空间来获取用户设置的名称
    const tempWorkspaceId = `temp-${Date.now()}`;
    const tempBlobStorage = new this.BlobStorageType({
      id: tempWorkspaceId,
      flavour: this.flavour,
      type: 'workspace',
    });
    const tempDocStorage = new this.DocStorageType({
      id: tempWorkspaceId,
      flavour: this.flavour,
      type: 'workspace',
    });
    
    const tempDocCollection = new WorkspaceImpl({
      id: tempWorkspaceId,
      rootDoc: new YDoc({ guid: tempWorkspaceId }),
      blobSource: {
        get: async () => null,
        delete: async () => {},
        list: async () => [],
        set: async () => '',
        name: 'temp-blob',
        readonly: false,
      },
      onLoadDoc: () => {},
    });
    
    // 执行初始化回调以获取用户设置的工作空间名称
    await initial(tempDocCollection, tempBlobStorage, tempDocStorage);
    
    // 从临时工作空间文档中获取用户设置的名称
    const workspaceName = tempDocCollection.doc.getMap('meta').get('name') as string || 'New Workspace';
    console.log('💡 [CloudWorkspaceFlavourProvider] 用户设置的工作空间名称:', workspaceName);
    
    // 清理临时对象
    tempDocCollection.dispose();
    
    // 构造请求数据，使用用户设置的名称
    const requestData = {
      name: workspaceName, // 使用用户设置的名称
      isPublic: false, // 默认私有
      enableAi: true,
      enableUrlPreview: false,
      enableDocEmbedding: true
    };
    
    try {
      let response: Response;
      
      // 统一使用fetchWithAuth方法，享受FetchService的所有功能
      response = await this.fetchWithAuth('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      // 克隆响应以便可以多次读取body
      const responseClone = response.clone();
      
      // 记录原始响应内容
      responseClone.text().then(text => {
        try {
          const jsonData = JSON.parse(text);
        } catch (e) {
          console.error('响应内容不是有效JSON:', e);
        }
      }).catch(err => {
        console.error('读取响应内容失败:', err);
      });

      if (!response.ok) {
        console.error(`创建工作区失败: HTTP ${response.status} - ${response.statusText}`);
        throw new Error(`创建工作区失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.workspace) {
        console.error('创建工作区失败: 响应格式不正确', data);
        throw new Error(data.error || '创建工作区失败');
      }

      const workspaceId = data.workspace.id;
      console.log('🆔 [CreateWorkspace] 新建工作空间ID:', workspaceId);

      // 保存初始状态到本地存储，然后同步到云端
      const blobStorage = new this.BlobStorageType({
        id: workspaceId,
        flavour: this.flavour,
        type: 'workspace',
      });
      blobStorage.connection.connect();
      await blobStorage.connection.waitForConnected();
      const docStorage = new this.DocStorageType({
        id: workspaceId,
        flavour: this.flavour,
        type: 'workspace',
      });
      
      console.log('🏭 [CloudWorkspaceFlavourProvider] 文档存储实例化:', {
        workspaceId: workspaceId,
        storageClass: this.DocStorageType.name,
        storageIdentifier: this.DocStorageType.identifier,
        flavour: this.flavour,
        type: 'workspace'
      });
      
      docStorage.connection.connect();
      await docStorage.connection.waitForConnected();

      const docList = new Set<YDoc>();

      const docCollection = new WorkspaceImpl({
        id: workspaceId,
        rootDoc: new YDoc({ guid: workspaceId }),
        blobSource: {
          get: async key => {
            const record = await blobStorage.get(key);
            return record ? new Blob([record.data], { type: record.mime }) : null;
          },
          delete: async () => {
            return;
          },
          list: async () => {
            return [];
          },
          set: async (id, blob) => {
            await blobStorage.set({
              key: id,
              data: new Uint8Array(await blob.arrayBuffer()),
              mime: blob.type,
            });
            return id;
          },
          name: 'blob',
          readonly: false,
        },
        onLoadDoc: doc => {
          docList.add(doc);
        },
      });

      try {
        // apply initial state
        console.log('🧩 [CreateWorkspace] 执行 initial 回调开始');
        await initial(docCollection, blobStorage, docStorage);
        console.log('🧩 [CreateWorkspace] 执行 initial 回调完成');

        // save workspace to local storage, should be vary fast
        console.log('💾 [CreateWorkspace] 保存初始数据到本地存储...', {
          count: docList.size,
        });
        // 分批并发写入，降低长时间串行写入造成的“卡住”体验
        const docsArray = Array.from(docList);
        const concurrency = 8;
        let idx = 0;
        while (idx < docsArray.length) {
          const batch = docsArray.slice(idx, idx + concurrency);
          await Promise.all(
            batch.map(subdoc =>
              docStorage.pushDocUpdate({
                docId: subdoc.guid,
                bin: encodeStateAsUpdate(subdoc),
              })
            )
          );
          console.log('💾 [CreateWorkspace] 本地保存进度:', {
            saved: Math.min(idx + concurrency, docsArray.length),
            total: docsArray.length,
          });
          idx += concurrency;
          // 让出事件循环，避免页面无响应
          await new Promise(r => setTimeout(r, 0));
        }
        console.log('💾 [CreateWorkspace] 本地保存完成');

        // 🔥 新增：立即同步到云端
        console.log('🌐 [CreateWorkspace] 开始同步初始数据到云端...', {
          count: docList.size,
        });
        await this.syncInitialDataToCloud(workspaceId, docList, blobStorage, docStorage);
        console.log('🌐 [CreateWorkspace] 云端同步完成');

        const accountId = this.authService.session.account$.value?.id;
        console.log('🧾 [CreateWorkspace] 写入初始文档属性开始');
        await this.writeInitialDocProperties(
          workspaceId,
          docStorage,
          accountId ?? ''
        );
        console.log('🧾 [CreateWorkspace] 写入初始文档属性完成');

        docStorage.connection.disconnect();
        blobStorage.connection.disconnect();

        this.revalidate();
        await this.waitForLoaded();
        
        console.log('✅ [CreateWorkspace] 工作空间创建和同步完成');
      } finally {
        docCollection.dispose();
      }

      return {
        id: workspaceId,
        flavour: this.server.id,
      };
    } catch (error) {
      console.error('创建工作区失败', error);
      throw error;
    }
  }
  
  /**
   * 🔥 核心方法：同步初始数据到云端
   */
  private async syncInitialDataToCloud(
    workspaceId: string,
    docList: Set<YDoc>,
    blobStorage: BlobStorage,
    localDocStorage?: DocStorage
  ): Promise<void> {
    console.log('🌐 [SyncToCloud] 开始同步，文档数量:', docList.size);
    
    // 创建云端存储实例
    const cloudDocStorage = new (await import('@yunke/nbstore/cloud')).CloudDocStorage({
      id: workspaceId,
      flavour: this.flavour,
      type: 'workspace' as any,
      serverBaseUrl: this.server.serverMetadata.baseUrl,
      isSelfHosted: true, // 根据实际情况调整
    });

    try {
      // 连接到云端存储
      await cloudDocStorage.connection.connect();
      await cloudDocStorage.connection.waitForConnected();
      
      console.log('🔗 [SyncToCloud] 云端连接建立成功');

      // 并发同步每个文档
      const docsArray = Array.from(docList);
      const concurrency = 4;
      let syncedCount = 0;
      for (let i = 0; i < docsArray.length; i += concurrency) {
        const batch = docsArray.slice(i, i + concurrency);
        await Promise.all(
          batch.map(async doc => {
            try {
              console.log(`📄 [SyncToCloud] 同步文档: ${doc.guid}`);
              await cloudDocStorage.pushDocUpdate({
                docId: doc.guid,
                bin: encodeStateAsUpdate(doc),
                timestamp: new Date(),
              });
              syncedCount++;
              console.log(`✅ [SyncToCloud] 文档同步成功: ${doc.guid}`);
            } catch (docError) {
              console.error(`❌ [SyncToCloud] 文档同步失败: ${doc.guid}`, docError);
            }
          })
        );
        await new Promise(r => setTimeout(r, 0));
      }
      
      console.log(`🎉 [SyncToCloud] 同步完成: ${syncedCount}/${docList.size} 个文档`);

      // 继续同步 DB 元数据（db$* 与 userdata$*）
      try {
        if (localDocStorage) {
          console.log('🗄️ [SyncToCloud] 开始同步 DB 元数据');
          const clocks = await localDocStorage.getDocTimestamps();
          const allKeys = Object.keys(clocks || {});
          const dbKeys = allKeys.filter(
            k => k.startsWith('db$') || k.startsWith('userdata$')
          );

          console.log('🗄️ [SyncToCloud] DB 文档数:', dbKeys.length);
          const batchSize = 4;
          for (let i = 0; i < dbKeys.length; i += batchSize) {
            const batch = dbKeys.slice(i, i + batchSize);
            await Promise.all(
              batch.map(async key => {
                try {
                  const rec = await localDocStorage.getDoc(key);
                  if (!rec) return;
                  await cloudDocStorage.pushDocUpdate({
                    docId: key,
                    bin: rec.bin,
                    timestamp: rec.timestamp,
                  });
                } catch (e) {
                  console.warn('⚠️ [SyncToCloud] DB 文档同步失败:', key, e);
                }
              })
            );
            await new Promise(r => setTimeout(r, 0));
          }
          console.log('🗄️ [SyncToCloud] DB 元数据同步完成');
        } else {
          console.log('🗄️ [SyncToCloud] 跳过 DB 元数据同步：localDocStorage 未提供');
        }
      } catch (dbSyncError) {
        console.error('❌ [SyncToCloud] DB 元数据同步阶段失败:', dbSyncError);
      }
      
    } catch (error) {
      console.error('❌ [SyncToCloud] 云端同步失败:', error);
      // 不抛出错误，允许工作空间创建完成，只是同步失败
      console.warn('⚠️ [SyncToCloud] 初始同步失败，但工作空间仍可正常使用，稍后可手动同步');
    } finally {
      try {
        await cloudDocStorage.connection.disconnect();
        console.log('🔌 [SyncToCloud] 云端连接已断开');
      } catch (disconnectError) {
        console.warn('⚠️ [SyncToCloud] 断开连接时出错:', disconnectError);
      }
    }
  }

  revalidate = effect(
    map(() => {
      return { accountId: this.authService.session.account$.value?.id };
    }),
    exhaustMapSwitchUntilChanged(
      (a, b) => a.accountId === b.accountId,
      ({ accountId }) => {
        return fromPromise(async signal => {
          if (!accountId) {
            return null; // no cloud workspace if no account
          }

          // 使用带认证的REST API替代GraphQL查询
          try {
            // console.log('☁️ [CloudWorkspace] 开始获取云端工作区列表:', {
            //   accountId,
            //   serverId: this.server.id
            // });
            
            const response = await this.fetchWithAuth('/api/workspaces', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal,
            });
            
            // console.log('☁️ [CloudWorkspace] API响应状态:', {
            //   ok: response.ok,
            //   status: response.status
            // });
            
            if (!response.ok) {
              throw new Error(`获取工作区列表失败: ${response.status}`);
            }
            
            const data = await response.json();
            
            // console.log('☁️ [CloudWorkspace] API响应数据:', {
            //   hasWorkspaces: !!data.workspaces,
            //   workspacesCount: data.workspaces?.length || 0,
            //   workspaceIds: data.workspaces?.map((item: any) => (item.workspace || item).id) || []
            // });
            
            if (!data.workspaces) {
              return {
                accountId,
                workspaces: [],
              };
            }
            
            // 处理新的后端响应结构，每个工作空间现在是 { workspace: {...}, role: '...', ... } 格式
            const workspaces = data.workspaces.map((item: any) => {
              // 检查是否是新结构 (有workspace字段) 或旧结构 (直接是workspace对象)
              const workspace = item.workspace || item;
              return {
                id: workspace.id,
                flavour: this.server.id,
                initialized: true,
                // 保存其他可能需要的字段
                role: item.role,
                status: item.status
              };
            });
            
            return {
              accountId,
              workspaces,
            };
          } catch (error) {
            console.error('❌ [CloudWorkspace] 获取工作区列表失败:', error);
            return {
              accountId,
              workspaces: [],
            };
          }
        }).pipe(
          tap(data => {
            if (data) {
              const { accountId, workspaces } = data;
              const sorted = workspaces.sort((a: any, b: any) => {
                // 安全地访问id属性，添加空值检查
                if (!a || !a.id) return 1;
                if (!b || !b.id) return -1;
                return a.id.localeCompare(b.id);
              });
              
              this.globalState.set(
                getCloudWorkspaceCacheKey(this.server.id) + accountId,
                sorted
              );
              if (!isEqual(this.workspaces$.value, sorted)) {
                this.workspaces$.next(sorted);
              }
            } else {
              this.workspaces$.next([]);
            }
          }),
          catchErrorInto(this.error$, err => {
            logger.error('重新验证云工作区时出错', err);
          }),
          onStart(() => this.isRevalidating$.next(true)),
          onComplete(() => this.isRevalidating$.next(false))
        );
      },
      ({ accountId }) => {
        if (accountId) {
          this.workspaces$.next(
            this.globalState.get(
              getCloudWorkspaceCacheKey(this.server.id) + accountId
            ) ?? []
          );
        } else {
          this.workspaces$.next([]);
        }
      }
    )
  );

  error$ = new LiveData<any>(null);
  isRevalidating$ = new LiveData(false);
  workspaces$ = new LiveData<WorkspaceMetadata[]>([]);

  private docWorkspaceMapping: Map<string, string> = new Map();
  
  private getCurrentWorkspaceId(): string | null {
    try {
      // 1. 优先从当前URL获取工作空间ID
      const currentUrl = window.location.pathname;
      const workspaceMatch = currentUrl.match(/^\/workspace\/([^\/]+)/);
      if (workspaceMatch) {
        const workspaceId = workspaceMatch[1];
        return workspaceId;
      }
      
      // 2. 尝试从当前工作空间列表中获取第一个工作空间ID
      const workspaces = this.workspaces$.value;
      if (workspaces && workspaces.length > 0) {
        // 过滤掉可能无效的工作空间ID
        const validWorkspaces = workspaces.filter(ws => ws.id && ws.id.length > 0);
        if (validWorkspaces.length > 0) {
          const workspaceId = validWorkspaces[0].id;
          return workspaceId;
        }
      }
      
      // 3. 尝试从localStorage或其他缓存中获取最后访问的工作空间ID
      try {
        const lastWorkspaceId = localStorage.getItem('lastWorkspaceId');
        if (lastWorkspaceId && lastWorkspaceId.length > 0) {
          return lastWorkspaceId;
        }
      } catch (storageError) {
        console.warn('[调试] 无法访问localStorage:', storageError);
      }
      
      // 4. 如果都没有，尝试创建一个默认工作空间ID
      // 注意：这里不直接创建工作空间，只是生成一个临时ID用于fallback
      const defaultWorkspaceId = `default-workspace-${Date.now()}`;
      
      // 保存到localStorage以便后续使用
      try {
        localStorage.setItem('lastWorkspaceId', defaultWorkspaceId);
      } catch (storageError) {
        console.warn('[调试] 无法保存到localStorage:', storageError);
      }
      
      return defaultWorkspaceId;
      
    } catch (error) {
      console.error('[调试] 获取当前工作空间ID出错:', error);
      return null;
    }
  }

  async getWorkspaceProfile(
    id: string,
    signal?: AbortSignal
  ): Promise<WorkspaceProfileInfo | undefined> {
    try {
      let workspaceId = id;
      
      // 1. ID验证 - 检查是否是合理的工作空间ID
      if (!workspaceId || workspaceId.trim().length === 0) {
        return this.getDefaultWorkspaceProfile();
      }
      
      const trimmedId = workspaceId.trim();
      
      // 2. 格式验证 - 如果ID格式明显不正确，尝试从当前有效工作空间列表获取
      if (trimmedId.length < 10 || trimmedId.length > 50) {
        // 尝试从当前工作空间列表中找到有效的工作空间ID
        // 修复 Bug #1: 添加空值安全检查
        const workspaces = this.workspaces$.value ?? [];
        if (workspaces.length > 0) {
          const validWorkspace = workspaces[0];
          workspaceId = validWorkspace.id;
        } else {
          return this.getDefaultWorkspaceProfile();
        }
      }
      
      // 3. 清理错误的文档-工作空间映射缓存
      const isUUID = workspaceId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      if (isUUID) {
        // 检查缓存中的映射是否正确
        if (this.docWorkspaceMapping.has(workspaceId)) {
          const cachedWorkspaceId = this.docWorkspaceMapping.get(workspaceId)!;

          // 验证缓存的工作空间ID是否在有效列表中
          // 修复 Bug #1: 添加空值安全检查，防止 workspaces 为 undefined 导致崩溃
          const workspaces = this.workspaces$.value ?? [];
          const isCachedIdValid = workspaces.some(ws => ws.id === cachedWorkspaceId);

          if (!isCachedIdValid) {
            this.docWorkspaceMapping.delete(workspaceId);

            // 使用原始ID作为工作空间ID
            if (workspaces.some(ws => ws.id === workspaceId)) {
              // workspaceId 保持不变
            } else {
              // 使用第一个有效的工作空间ID
              if (workspaces.length > 0) {
                workspaceId = workspaces[0].id;
              } else {
                // 如果没有可用的工作空间，返回默认配置
                return this.getDefaultWorkspaceProfile();
              }
            }
          } else {
            workspaceId = cachedWorkspaceId;
          }
        } else {
          // 🔧 修复 Bug #6: 文档-工作区映射缓存误用
          // 检查原始ID是否就是有效的工作空间ID
          // 修复 Bug #1: 添加空值安全检查
          const workspaces = this.workspaces$.value ?? [];
          if (!workspaces.some(ws => ws.id === workspaceId)) {
            // 如果没有可用的工作空间，直接返回默认配置
            if (workspaces.length === 0) {
              return this.getDefaultWorkspaceProfile();
            }

            // 🔧 修复 Bug #6: 不在工作空间列表中的UUID可能是文档ID
            // 通过API验证并获取正确的工作空间ID,而不是直接假设
            try {
              console.log(`[🔍 Bug #6] 传入的 ID ${workspaceId} 不在工作空间列表中,尝试作为文档ID查询...`);
              const actualWorkspaceId = await this.getWorkspaceIdFromDoc(workspaceId, signal);
              console.log(`[✅ Bug #6] 文档 ${workspaceId} 对应的工作空间ID: ${actualWorkspaceId}`);
              workspaceId = actualWorkspaceId;
              // 映射已在 getWorkspaceIdFromDoc 中保存,无需重复保存
            } catch (error) {
              // API 查询失败,使用 fallback 逻辑
              console.warn(`[⚠️ Bug #6] 无法通过API查询文档 ${workspaceId} 的工作空间,使用 fallback`, error);

              // Fallback 1: 尝试使用当前工作空间上下文
              const currentWorkspaceId = this.getCurrentWorkspaceId();
              if (currentWorkspaceId && workspaces.some(ws => ws.id === currentWorkspaceId)) {
                console.log(`[📌 Bug #6] 使用当前工作空间上下文: ${currentWorkspaceId}`);
                workspaceId = currentWorkspaceId;
                // ⚠️ 注意: 这里不保存到 docWorkspaceMapping,因为无法确认是正确的映射
              } else {
                // Fallback 2: 使用第一个有效工作空间
                console.log(`[📌 Bug #6] 使用第一个有效工作空间: ${workspaces[0].id}`);
                workspaceId = workspaces[0].id;
                // ⚠️ 注意: 这里不保存到 docWorkspaceMapping,因为无法确认是正确的映射
              }
            }
          }
        }
      }
      
      // 4. 使用确定的工作空间ID获取工作空间信息
      const workspace = await this.getWorkspaceInfo(workspaceId, signal);
      
      if (!workspace) {
        // 如果获取失败，尝试从工作空间列表中获取第一个有效工作空间
        const workspaces = this.workspaces$.value;
        if (workspaces && workspaces.length > 0) {
          const validWorkspace = workspaces.find(ws => ws.id && ws.id !== workspaceId);
          if (validWorkspace) {
            const retryWorkspace = await this.getWorkspaceInfo(validWorkspace.id, signal);
            if (retryWorkspace) {
              const profile: WorkspaceProfileInfo = {
                name: retryWorkspace.name || '未命名工作空间',
                avatar: undefined,
                isOwner: retryWorkspace.role === 'owner',
                isAdmin: retryWorkspace.role === 'admin',
                isTeam: Boolean(retryWorkspace.team),
              };
              
              return profile;
            }
          }
        }
        
        return this.getDefaultWorkspaceProfile();
      }
      
      // 🔧 [CRITICAL-FIX] 修复角色比较 - 后端返回大写枚举值，前端需要处理大小写不敏感比较
      const role = (workspace.role || '').toUpperCase();
      const profile: WorkspaceProfileInfo = {
        name: workspace.name || '未命名工作空间',
        avatar: undefined,
        isOwner: role === 'OWNER',
        isAdmin: role === 'OWNER' || role === 'ADMIN',
        isTeam: Boolean(workspace.team),
      };
      
      return profile;
      
    } catch (error) {
      logger.error('💥 [CloudWorkspaceFlavourProvider] 获取工作空间信息失败:', error);
      return this.getDefaultWorkspaceProfile();
    }
  }

  private async getWorkspaceIdFromDoc(docId: string, signal?: AbortSignal): Promise<string> {
    const maxRetries = 3;
    const retryDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const finalSignal = signal || controller.signal;
        
        const response = await this.fetchWithAuth(`/api/docs/${docId}/workspace`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: finalSignal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.workspaceId) {
            // 保存到缓存
            this.docWorkspaceMapping.set(docId, data.workspaceId);
            return data.workspaceId;
          }
        }
        
        // 如果是404错误，尝试使用当前工作空间ID
        if (response.status === 404) {
          console.warn(`[调试] 文档 ${docId} 在数据库中不存在，尝试使用当前工作空间ID`);
          const currentWorkspaceId = this.getCurrentWorkspaceId();
          if (currentWorkspaceId) {
            // 保存到缓存
            this.docWorkspaceMapping.set(docId, currentWorkspaceId);
            return currentWorkspaceId;
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        console.error(`[调试] 第 ${attempt} 次获取工作空间ID失败:`, error);
        
        if (attempt === maxRetries) {
          console.warn(`[调试] 所有重试均失败，尝试使用当前工作空间ID`);
          const currentWorkspaceId = this.getCurrentWorkspaceId();
          if (currentWorkspaceId) {
            // 保存到缓存
            this.docWorkspaceMapping.set(docId, currentWorkspaceId);
            return currentWorkspaceId;
          } else {
            console.warn(`[调试] 无法获取当前工作空间ID，抛出错误而不是使用文档ID`);
            throw new Error(`无法解析文档 ${docId} 对应的工作空间ID`);
          }
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    // 永远不会到达这里，但为了类型安全，尝试使用当前工作空间ID
    const currentWorkspaceId = this.getCurrentWorkspaceId();
    if (currentWorkspaceId) {
      return currentWorkspaceId;
    } else {
      throw new Error(`无法解析文档 ${docId} 对应的工作空间ID，所有fallback方法均失败`);
    }
  }

  private getDefaultWorkspaceProfile(): WorkspaceProfileInfo {
    return {
      name: 'YUNKE Workspace',
      avatar: undefined,
      isOwner: false,
      isAdmin: false,
      isTeam: false,
    };
  }
  async getWorkspaceBlob(id: string, blob: string): Promise<Blob | null> {
    const storage = new this.BlobStorageType({
      id: id,
      flavour: this.flavour,
      type: 'workspace',
    });
    storage.connection.connect();
    await storage.connection.waitForConnected();
    const localBlob = await storage.get(blob);

    storage.connection.disconnect();

    if (localBlob) {
      return new Blob([localBlob.data], { type: localBlob.mime });
    }

    const cloudBlob = await new CloudBlobStorage({
      id,
      serverBaseUrl: this.server.serverMetadata.baseUrl,
    }).get(blob);
    if (!cloudBlob) {
      return null;
    }
    return new Blob([cloudBlob.data], { type: cloudBlob.mime });
  }

  async listBlobs(id: string): Promise<ListedBlobRecord[]> {
    const cloudStorage = new CloudBlobStorage({
      id,
      serverBaseUrl: this.server.serverMetadata.baseUrl,
    });
    return cloudStorage.list();
  }

  async deleteBlob(
    id: string,
    blob: string,
    permanent: boolean
  ): Promise<void> {
    const cloudStorage = new CloudBlobStorage({
      id,
      serverBaseUrl: this.server.serverMetadata.baseUrl,
    });
    await cloudStorage.delete(blob, permanent);

    // should also delete from local storage
    const storage = new this.BlobStorageType({
      id: id,
      flavour: this.flavour,
      type: 'workspace',
    });
    storage.connection.connect();
    await storage.connection.waitForConnected();
    await storage.delete(blob, permanent);
    storage.connection.disconnect();
  }

  onWorkspaceInitialized(workspace: Workspace): void {
    // bind the workspace to the yunke cloud server
    workspace.scope.get(WorkspaceServerService).bindServer(this.server);
  }

  private async getWorkspaceInfo(workspaceId: string, signal?: AbortSignal) {
    const maxRetries = 3;
    const retryDelay = 1000;
    
    // 如果是默认工作空间ID，直接返回默认信息，不发送API请求
    if (workspaceId.startsWith('default-workspace-')) {
      return {
        id: workspaceId,
        name: 'Default Workspace',
        role: 'owner',
        team: false,
      };
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时
        
        const finalSignal = signal || controller.signal;
        
        const response = await this.fetchWithAuth(`/api/workspaces/${workspaceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: finalSignal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success || data.workspace || data.id) {
            const workspace = data.workspace || data;
            
            // 🔧 [CRITICAL-FIX] 修复角色获取 - 从正确的位置获取role信息
            // 后端返回结构: { success: true, workspace: {...}, role: "OWNER", isOwner: true, isAdmin: true }
            const role = data.role || workspace.role || 'viewer';
            
            return {
              id: workspace.id || workspaceId,
              name: workspace.name || 'Default Workspace',
              role: role,
              team: Boolean(workspace.team),
            };
          }
        }
        
        if (response.status === 404) {
          // 如果是UUID格式的工作空间ID且不存在，尝试作为默认工作空间处理
          if (workspaceId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return {
              id: workspaceId,
              name: 'Default Workspace',
              role: 'owner',
              team: false,
            };
          }
          return null;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        console.error(`[调试] 第 ${attempt} 次获取工作空间信息失败:`, error);
        
        if (attempt === maxRetries) {
          console.warn(`[调试] 所有重试均失败，返回默认工作空间信息: ${workspaceId}`);
          return {
            id: workspaceId,
            name: 'Default Workspace',
            role: 'owner',
            team: false,
          };
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
    
    // 应该永远不会到达这里
    return {
      id: workspaceId,
      name: 'Default Workspace',
      role: 'owner',
      team: false,
    };
  }

  getEngineWorkerInitOptions(workspaceId: string): WorkerInitOptions {
    // 🛡️ 防御性检查：确保所有必需的属性都存在
    if (!this.server) {
      console.error('❌ [CloudWorkspaceFlavourProvider] server 未定义');
      throw new Error('Server not initialized');
    }
    
    if (!this.server.serverMetadata) {
      console.error('❌ [CloudWorkspaceFlavourProvider] server.serverMetadata 未定义');
      throw new Error('Server metadata not initialized');
    }
    
    if (!this.server.config$) {
      console.error('❌ [CloudWorkspaceFlavourProvider] server.config$ 未定义');
      throw new Error('Server config not initialized');
    }
    
    // 验证存储类型是否正确加载
    const storageTypes = {
      'DocStorageType': this.DocStorageType,
      'BlobStorageType': this.BlobStorageType,
      'DocSyncStorageType': this.DocSyncStorageType,
      'BlobSyncStorageType': this.BlobSyncStorageType,
      'DocStorageV1Type': this.DocStorageV1Type,
      'BlobStorageV1Type': this.BlobStorageV1Type
    };
    
    // 🛡️ 防御性获取服务器配置 - 修复Android WebView环境下的undefined访问
    const getServerConfig = () => {
      try {
        // 深度检查每一层属性以避免 "Cannot read properties of undefined (reading 'get')" 错误
        if (!this.server) {
          console.warn('⚠️ [CloudWorkspaceFlavourProvider] server未定义，使用默认配置');
          return { type: ServerDeploymentType.Selfhosted };
        }
        
        if (!this.server.config$) {
          console.warn('⚠️ [CloudWorkspaceFlavourProvider] server.config$未定义，使用默认配置');
          return { type: ServerDeploymentType.Selfhosted };
        }
        
        // 安全访问config$.value，这里可能是导致错误的地方
        let configValue;
        try {
          configValue = this.server.config$.value;
        } catch (valueAccessError) {
          console.error('❌ [CloudWorkspaceFlavourProvider] 访问config$.value时出错:', valueAccessError);
          return { type: ServerDeploymentType.Selfhosted };
        }
        
        if (!configValue) {
          console.warn('⚠️ [CloudWorkspaceFlavourProvider] config$.value为空，使用默认配置');
          return { type: ServerDeploymentType.Selfhosted };
        }
        
        return configValue;
      } catch (error) {
        console.error('❌ [CloudWorkspaceFlavourProvider] 获取服务器配置时发生未预期错误:', error);
        console.error('错误堆栈:', error.stack);
        return { type: ServerDeploymentType.Selfhosted };
      }
    };
    
    const serverConfig = getServerConfig();

    // 获取服务器baseUrl，如果未配置则抛出错误
    const serverBaseUrl = this.server.serverMetadata?.baseUrl;
    if (!serverBaseUrl) {
      const errorMsg = '❌ 服务器配置缺失：serverMetadata.baseUrl 未设置，请确保在 .env 文件中配置 VITE_API_BASE_URL';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // 🌐 [纯云存储模式] Android环境配置
    if ((window as any).BUILD_CONFIG?.isAndroid) {
      console.log('🤖 [CloudWorkspaceFlavourProvider] Android环境 - 使用纯云存储配置（禁用IndexedDB）');
      
      return {
        local: {
          // ✅ 只保留浏览器内存通信，不依赖 IndexedDB
          awareness: {
            name: 'BroadcastChannelAwarenessStorage',
            opts: {
              id: `${this.flavour}:${workspaceId}`,
            },
          },
          // ❌ 完全移除所有 IndexedDB 相关存储：
          // - doc, blob, docSync, blobSync (改为由主线程直接访问云存储)
          // - indexer, indexerSync (搜索索引也走云端)
        },
        remotes: {
          [`cloud:${this.flavour}`]: {
            doc: {
              name: 'CloudDocStorage',
              opts: {
                type: 'workspace',
                id: workspaceId,
                serverBaseUrl: serverBaseUrl,
                isSelfHosted: serverConfig.type === ServerDeploymentType.Selfhosted,
              },
            },
            blob: {
              name: 'CloudBlobStorage',
              opts: {
                id: workspaceId,
                serverBaseUrl: serverBaseUrl,
              },
            },
            awareness: {
              name: 'CloudAwarenessStorage',
              opts: {
                type: 'workspace',
                id: workspaceId,
                serverBaseUrl: serverBaseUrl,
                isSelfHosted: serverConfig.type === ServerDeploymentType.Selfhosted,
              },
            },
          },
          // ❌ 移除 v1 存储，不需要迁移旧数据
        },
      };
    }
    
    // 🌐 [纯云存储模式] 标准浏览器环境配置
    
    return {
      local: {
        // ✅ 只保留浏览器内存通信，不依赖 IndexedDB
        awareness: {
          name: 'BroadcastChannelAwarenessStorage',
          opts: {
            id: `${this.flavour}:${workspaceId}`,
          },
        },
        // ❌ 完全移除所有 IndexedDB 相关存储：
        // - doc, blob (文档和文件数据直接从云端读写)
        // - docSync, blobSync (同步存储不再需要)
        // - indexer, indexerSync (搜索索引走云端或内存)
        // 
        // 💡 说明：
        // 1. Worker 不会创建任何 IDB 存储实例
        // 2. 不会尝试连接 IndexedDB
        // 3. 所有数据操作通过主线程的 WorkerDocStorage 直接访问云存储
        // 4. 避免 "连接 IDBConnection 尚未建立" 错误
      },
      remotes: {
        [`cloud:${this.flavour}`]: {
          doc: {
            name: 'CloudDocStorage',
            opts: {
              type: 'workspace',
              id: workspaceId,
              serverBaseUrl: serverBaseUrl,
              isSelfHosted: serverConfig.type === ServerDeploymentType.Selfhosted,
            },
          },
          blob: {
            name: 'CloudBlobStorage',
            opts: {
              id: workspaceId,
              serverBaseUrl: serverBaseUrl,
            },
          },
          awareness: {
            name: 'CloudAwarenessStorage',
            opts: {
              type: 'workspace',
              id: workspaceId,
              serverBaseUrl: serverBaseUrl,
              isSelfHosted: serverConfig.type === ServerDeploymentType.Selfhosted,
            },
          },
        },
        // ❌ 移除 v1 存储配置，不需要从旧版本迁移数据
      },
    };
  }

  async writeInitialDocProperties(
    workspaceId: string,
    docStorage: DocStorage,
    creatorId: string
  ) {
    try {
      const rootDocBuffer = await docStorage.getDoc(workspaceId);
      const rootDoc = new YDoc({ guid: workspaceId });
      if (rootDocBuffer) {
        applyUpdate(rootDoc, rootDocBuffer.bin);
      }

      const docIds = (
        rootDoc.getMap('meta').get('pages') as YArray<YMap<string>>
      )
        ?.map(page => page.get('id'))
        .filter(Boolean) as string[];

      const propertiesDBBuffer = await docStorage.getDoc('db$docProperties');
      const propertiesDB = new YDoc({ guid: 'db$docProperties' });
      if (propertiesDBBuffer) {
        applyUpdate(propertiesDB, propertiesDBBuffer.bin);
      }

      for (const docId of docIds) {
        const docProperties = propertiesDB.getMap(docId);
        docProperties.set('id', docId);
        docProperties.set('createdBy', creatorId);
      }

      await docStorage.pushDocUpdate({
        docId: 'db$docProperties',
        bin: encodeStateAsUpdate(propertiesDB),
      });
    } catch (error) {
      logger.error('写入初始文档属性时出错', error);
    }
  }

  private waitForLoaded() {
    return this.isRevalidating$.waitFor(loading => !loading);
  }

  dispose() {
    // 在真正释放前，等待关键网络请求完成（如 /api/workspaces）
    try {
      if ((this as any).fetchService?.waitForCriticalRequests) {
        // 最多等待5秒，避免卡住退出流程
        (this as any).fetchService.waitForCriticalRequests({ timeoutMs: 5000 }).catch(() => {});
      }
    } catch {}
    this.revalidate.unsubscribe();
    this.unsubscribeAccountChanged();
  }
}

export class CloudWorkspaceFlavoursProvider
  extends Service
  implements WorkspaceFlavoursProvider
{
  constructor(
    private readonly globalState: GlobalState,
    private readonly serversService: ServersService
  ) {
    super();
  }

  workspaceFlavours$ = LiveData.from<WorkspaceFlavourProvider[]>(
    this.serversService.servers$.pipe(
      switchMap(servers => {
        const refs = servers.map(server => {
          const exists = this.pool.get(server.id);
          if (exists) {
            return exists;
          }
          const provider = new CloudWorkspaceFlavourProvider(
            this.globalState,
            server
          );
          provider.revalidate();
          const ref = this.pool.put(server.id, provider);
          return ref;
        });

        return new Observable<WorkspaceFlavourProvider[]>(subscribe => {
          subscribe.next(refs.map(ref => ref.obj));
          return () => {
            refs.forEach(ref => {
              ref.release();
            });
          };
        });
      })
    ),
    [] as any
  );

  private readonly pool = new ObjectPool<string, CloudWorkspaceFlavourProvider>(
    {
      onDelete(obj) {
        obj.dispose();
      },
    }
  );
}
