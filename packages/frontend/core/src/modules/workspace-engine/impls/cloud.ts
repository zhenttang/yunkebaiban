import { FeatureFlagService } from '@affine/core/modules/feature-flag';
import { DebugLogger } from '@affine/debug';
//import {
//   createWorkspaceMutation,
//   deleteWorkspaceMutation,
//   getWorkspaceInfoQuery,
//   getWorkspacesQuery,
//   Permission,
//} from '@affine/graphql';
import { ServerDeploymentType } from '../../cloud/types';
import type {
  BlobStorage,
  DocStorage,
  ListedBlobRecord,
} from '@affine/nbstore';
import { CloudBlobStorage, StaticCloudDocStorage } from '@affine/nbstore/cloud';
import {
  IndexedDBBlobStorage,
  IndexedDBBlobSyncStorage,
  IndexedDBDocStorage,
  IndexedDBDocSyncStorage,
} from '@affine/nbstore/idb';
import {
  IndexedDBV1BlobStorage,
  IndexedDBV1DocStorage,
} from '@affine/nbstore/idb/v1';
import {
  SqliteBlobStorage,
  SqliteBlobSyncStorage,
  SqliteDocStorage,
  SqliteDocSyncStorage,
} from '@affine/nbstore/sqlite';
import {
  SqliteV1BlobStorage,
  SqliteV1DocStorage,
} from '@affine/nbstore/sqlite/v1';
import type { WorkerInitOptions } from '@affine/nbstore/worker/client';
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
  GraphQLService,
  WorkspaceServerService,
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
  if (serverId === 'affine-cloud') {
    return 'cloud-workspace:'; // FOR BACKWARD COMPATIBILITY
  }
  return `selfhosted-workspace-${serverId}:`;
};

const logger = new DebugLogger('affine:cloud-workspace-flavour-provider');

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
    
    // 获取FetchService实例
    try {
      this.fetchService = server.scope.get('FetchService');
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
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    if (this.fetchService) {
      // 使用FetchService发送请求，确保包含JWT token
      return await this.fetchService.fetch(url, options);
    } else {
      // 回退方案：手动添加JWT token
      const headers = {
        ...options.headers,
      } as Record<string, string>;
      
      // 尝试从localStorage获取JWT token
      const token = localStorage.getItem('affine-admin-token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // 确保使用完整的URL，特别是在桌面端
      const fullUrl = url.startsWith('http') ? url : `http://localhost:8080${url}`;
      
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
      console.log(`[调试] 删除工作空间: ${id}`);
      const response = await this.fetchWithAuth(`/api/workspaces/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`删除工作空间失败: ${response.status}`);
      }
      
      console.log(`[调试] 工作空间删除成功: ${id}`);
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
    
    // 构造请求数据
    const requestData = {
      name: 'New Workspace', // 默认名称
      isPublic: false, // 默认私有
      enableAi: true,
      enableUrlPreview: false,
      enableDocEmbedding: true
    };
    
    console.log('准备发送创建工作空间请求', {
      url: '/api/workspaces',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cookies: document.cookie,
      requestBody: requestData,
      currentUser: this.authService.session.account$.value
    });
    
    try {
      let response: Response;
      
      if (this.fetchService) {
        // 使用FetchService发送请求，确保包含JWT token
        console.log('使用FetchService发送创建工作空间请求');
        response = await this.fetchService.fetch('/api/workspaces', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
      } else {
        // 回退方案：手动添加JWT token
        console.log('使用原生fetch发送创建工作空间请求，手动添加JWT token');
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // 尝试从localStorage获取JWT token
        const token = localStorage.getItem('affine-admin-token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('添加JWT token到请求头');
        } else {
          console.warn('未找到JWT token');
        }
        
        response = await fetch('/api/workspaces', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData),
          credentials: 'include',
        });
      }
      
      console.log('创建工作空间响应状态', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        cookies: document.cookie
      });
      
      // 克隆响应以便可以多次读取body
      const responseClone = response.clone();
      
      // 记录原始响应内容
      responseClone.text().then(text => {
        console.log('创建工作空间响应原始内容:', text);
        try {
          const jsonData = JSON.parse(text);
          console.log('创建工作空间响应JSON数据:', jsonData);
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
      console.log('创建工作空间成功，解析响应数据:', data);
      
      if (!data.success || !data.workspace) {
        console.error('创建工作区失败: 响应格式不正确', data);
        throw new Error(data.error || '创建工作区失败');
      }

      const workspaceId = data.workspace.id;
      console.log('工作区创建成功，ID:', workspaceId);

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
        await initial(docCollection, blobStorage, docStorage);

        // save workspace to local storage, should be vary fast
        for (const subdocs of docList) {
          await docStorage.pushDocUpdate({
            docId: subdocs.guid,
            bin: encodeStateAsUpdate(subdocs),
          });
        }

        const accountId = this.authService.session.account$.value?.id;
        await this.writeInitialDocProperties(
          workspaceId,
          docStorage,
          accountId ?? ''
        );

        docStorage.connection.disconnect();
        blobStorage.connection.disconnect();

        this.revalidate();
        await this.waitForLoaded();
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
            const response = await this.fetchWithAuth('/api/workspaces', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal,
            });
            
            if (!response.ok) {
              throw new Error(`获取工作区列表失败: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('获取工作区列表响应:', data);
            
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
            console.error('获取工作区列表失败', error);
            return {
              accountId,
              workspaces: [],
            };
          }
        }).pipe(
          tap(data => {
            if (data) {
              const { accountId, workspaces } = data;
              console.log('排序前的工作空间:', workspaces);
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
        console.log(`[调试] 从URL获取工作空间ID: ${workspaceId}`);
        return workspaceId;
      }
      
      // 2. 尝试从当前工作空间列表中获取第一个工作空间ID
      const workspaces = this.workspaces$.value;
      if (workspaces && workspaces.length > 0) {
        // 过滤掉可能无效的工作空间ID
        const validWorkspaces = workspaces.filter(ws => ws.id && ws.id.length > 0);
        if (validWorkspaces.length > 0) {
          const workspaceId = validWorkspaces[0].id;
          console.log(`[调试] 从工作空间列表获取第一个工作空间ID: ${workspaceId}`);
          return workspaceId;
        }
      }
      
      // 3. 尝试从localStorage或其他缓存中获取最后访问的工作空间ID
      try {
        const lastWorkspaceId = localStorage.getItem('lastWorkspaceId');
        if (lastWorkspaceId && lastWorkspaceId.length > 0) {
          console.log(`[调试] 从localStorage获取最后访问的工作空间ID: ${lastWorkspaceId}`);
          return lastWorkspaceId;
        }
      } catch (storageError) {
        console.warn('[调试] 无法访问localStorage:', storageError);
      }
      
      // 4. 如果都没有，尝试创建一个默认工作空间ID
      // 注意：这里不直接创建工作空间，只是生成一个临时ID用于fallback
      const defaultWorkspaceId = `default-workspace-${Date.now()}`;
      console.log(`[调试] 生成默认工作空间ID: ${defaultWorkspaceId}`);
      
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
    console.log(`[调试] getWorkspaceProfile 被调用，ID: ${id}`);
    
    try {
      let workspaceId = id;
      
      // 检查是否是UUID格式（可能是文档ID）
      const isUUID = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUUID) {
        console.log(`[调试] 检测到UUID格式ID，可能是文档ID: ${id}`);
        
        // 先检查缓存
        if (this.docWorkspaceMapping.has(id)) {
          workspaceId = this.docWorkspaceMapping.get(id)!;
          console.log(`[调试] 从缓存获取文档 ${id} 对应的工作空间ID: ${workspaceId}`);
        } else {
          // 尝试从当前工作空间上下文获取工作空间ID
          const currentWorkspaceId = this.getCurrentWorkspaceId();
          if (currentWorkspaceId && currentWorkspaceId !== id) {
            console.log(`[调试] 从当前工作空间上下文获取工作空间ID: ${currentWorkspaceId}`);
            workspaceId = currentWorkspaceId;
            // 保存到缓存，避免后续重复查询
            this.docWorkspaceMapping.set(id, workspaceId);
          } else {
            // 如果无法从上下文获取，或者上下文返回的也是同一个ID，尝试API查询
            try {
              console.log(`[调试] 尝试从API获取文档 ${id} 对应的工作空间ID`);
              workspaceId = await this.getWorkspaceIdFromDoc(id, signal);
              console.log(`[调试] API返回工作空间ID: ${workspaceId}`);
            } catch (apiError) {
              console.warn(`[调试] API获取工作空间ID失败，使用默认配置:`, apiError);
              return this.getDefaultWorkspaceProfile();
            }
          }
        }
      } else {
        console.log(`[调试] 直接使用提供的工作空间ID: ${id}`);
      }
      
      // 确保我们有有效的工作空间ID
      if (!workspaceId || workspaceId === id && isUUID) {
        console.warn(`[调试] 无法解析有效的工作空间ID，使用默认配置`);
        return this.getDefaultWorkspaceProfile();
      }
      
      // 使用确定的工作空间ID获取工作空间信息
      console.log(`[调试] 获取工作空间信息, ID: ${workspaceId}`);
      const workspace = await this.getWorkspaceInfo(workspaceId, signal);
      
      if (!workspace) {
        console.warn(`[调试] 无法获取工作空间信息: ${workspaceId}`);
        return this.getDefaultWorkspaceProfile();
      }
      
      const profile: WorkspaceProfileInfo = {
        name: workspace.name || 'Untitled Workspace',
        avatar: undefined,
        isOwner: workspace.role === 'owner',
        isAdmin: workspace.role === 'admin',
        isTeam: Boolean(workspace.team),
      };
      
      console.log('[调试] 工作空间资料:', profile);
      return profile;
      
    } catch (error) {
      console.error('获取工作空间信息失败:', error);
      return this.getDefaultWorkspaceProfile();
    }
  }

  private async getWorkspaceIdFromDoc(docId: string, signal?: AbortSignal): Promise<string> {
    const maxRetries = 3;
    const retryDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[调试] 尝试第 ${attempt} 次获取文档 ${docId} 对应的工作空间ID`);
        
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
            console.log(`[调试] API返回文档 ${docId} 对应的工作空间ID: ${data.workspaceId}`);
            return data.workspaceId;
          }
        }
        
        // 如果是404错误，尝试使用当前工作空间ID
        if (response.status === 404) {
          console.warn(`[调试] 文档 ${docId} 在数据库中不存在，尝试使用当前工作空间ID`);
          const currentWorkspaceId = this.getCurrentWorkspaceId();
          if (currentWorkspaceId) {
            console.log(`[调试] 使用当前工作空间ID: ${currentWorkspaceId}`);
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
            console.log(`[调试] 使用当前工作空间ID作为fallback: ${currentWorkspaceId}`);
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
      name: 'AFFiNE Workspace',
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
    // bind the workspace to the affine cloud server
    workspace.scope.get(WorkspaceServerService).bindServer(this.server);
  }

  private async getWorkspaceInfo(workspaceId: string, signal?: AbortSignal) {
    const maxRetries = 3;
    const retryDelay = 1000;
    
    // 如果是默认工作空间ID，直接返回默认信息，不发送API请求
    if (workspaceId.startsWith('default-workspace-')) {
      console.log(`[调试] 检测到默认工作空间ID，返回默认信息: ${workspaceId}`);
      return {
        id: workspaceId,
        name: 'Default Workspace',
        role: 'owner',
        team: false,
      };
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[调试] 尝试第 ${attempt} 次获取工作空间信息: ${workspaceId}`);
        
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
        
        console.log(`[调试] 工作空间信息响应状态: ${response.status}, 尝试: ${attempt}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success || data.workspace || data.id) {
            const workspace = data.workspace || data;
            console.log(`[调试] 成功获取工作空间信息:`, workspace);
            return {
              id: workspace.id || workspaceId,
              name: workspace.name || 'Default Workspace',
              role: workspace.role || 'viewer',
              team: Boolean(workspace.team),
            };
          }
        }
        
        if (response.status === 404) {
          console.warn(`[调试] 工作空间不存在: ${workspaceId}`);
          // 如果是UUID格式的工作空间ID且不存在，尝试作为默认工作空间处理
          if (workspaceId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            console.log(`[调试] UUID格式的工作空间不存在，返回默认信息: ${workspaceId}`);
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
    // 🔧 Android WebView专用：添加全面的安全检查
    console.log('🔧 [CloudWorkspaceFlavourProvider] getEngineWorkerInitOptions 被调用');
    console.log('  - workspaceId:', workspaceId);
    console.log('  - this.flavour:', this.flavour);
    console.log('  - this.server:', !!this.server);
    console.log('  - this.server.serverMetadata:', !!this.server?.serverMetadata);
    console.log('  - this.server.config$:', !!this.server?.config$);
    
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
    
    // 检查每个存储类型
    for (const [name, type] of Object.entries(storageTypes)) {
      if (type) {
        console.log(`  - ${name}:`, {
          exists: !!type,
          hasIdentifier: !!type.identifier,
          identifier: type.identifier || 'undefined',
          typeString: type.toString ? type.toString() : 'no toString'
        });
      } else {
        console.log(`  - ${name}: null/undefined`);
      }
    }
    
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
        
        console.log('✅ [CloudWorkspaceFlavourProvider] 成功获取服务器配置:', configValue);
        return configValue;
      } catch (error) {
        console.error('❌ [CloudWorkspaceFlavourProvider] 获取服务器配置时发生未预期错误:', error);
        console.error('错误堆栈:', error.stack);
        return { type: ServerDeploymentType.Selfhosted };
      }
    };
    
    const serverConfig = getServerConfig();
    const serverBaseUrl = this.server.serverMetadata?.baseUrl || 'http://localhost:8080';
    
    // Android环境下的特殊处理
    if ((window as any).BUILD_CONFIG?.isAndroid) {
      console.log('🤖 [CloudWorkspaceFlavourProvider] Android环境检测到，使用备用配置');
      
      // 如果存储类没有identifier属性，使用备用值
      const getIdentifier = (type: any, fallback: string) => {
        if (!type || !type.identifier) {
          console.warn(`⚠️ [CloudWorkspaceFlavourProvider] ${fallback} 类型缺少identifier属性，使用备用值`);
          return fallback;
        }
        return type.identifier;
      };
      
      return {
        local: {
          doc: {
            name: getIdentifier(this.DocStorageType, 'IndexedDBDocStorage'),
            opts: {
              flavour: this.flavour,
              type: 'workspace',
              id: workspaceId,
            },
          },
          blob: {
            name: getIdentifier(this.BlobStorageType, 'IndexedDBBlobStorage'),
            opts: {
              flavour: this.flavour,
              type: 'workspace',
              id: workspaceId,
            },
          },
          docSync: {
            name: getIdentifier(this.DocSyncStorageType, 'IndexedDBDocSyncStorage'),
            opts: {
              flavour: this.flavour,
              type: 'workspace',
              id: workspaceId,
            },
          },
          blobSync: {
            name: getIdentifier(this.BlobSyncStorageType, 'IndexedDBBlobSyncStorage'),
            opts: {
              flavour: this.flavour,
              type: 'workspace',
              id: workspaceId,
            },
          },
          awareness: {
            name: 'BroadcastChannelAwarenessStorage',
            opts: {
              id: `${this.flavour}:${workspaceId}`,
            },
          },
          indexer: {
            name: 'IndexedDBIndexerStorage',
            opts: {
              flavour: this.flavour,
              type: 'workspace',
              id: workspaceId,
            },
          },
          indexerSync: {
            name: 'IndexedDBIndexerSyncStorage',
            opts: {
              flavour: this.flavour,
              type: 'workspace',
              id: workspaceId,
            },
          },
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
          v1: {}, // Android环境下禁用v1存储
        },
      };
    }
    
    // 非Android环境，使用原有逻辑但增加安全检查
    const getStorageIdentifier = (type: any, fallback: string) => {
      if (!type) {
        console.warn(`⚠️ [CloudWorkspaceFlavourProvider] 存储类型为空，使用备用值: ${fallback}`);
        return fallback;
      }
      if (!type.identifier) {
        console.warn(`⚠️ [CloudWorkspaceFlavourProvider] 存储类型缺少identifier，使用备用值: ${fallback}`);
        return fallback;
      }
      return type.identifier;
    };
    
    return {
      local: {
        doc: {
          name: getStorageIdentifier(this.DocStorageType, 'IndexedDBDocStorage'),
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
        blob: {
          name: getStorageIdentifier(this.BlobStorageType, 'IndexedDBBlobStorage'),
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
        docSync: {
          name: getStorageIdentifier(this.DocSyncStorageType, 'IndexedDBDocSyncStorage'),
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
        blobSync: {
          name: getStorageIdentifier(this.BlobSyncStorageType, 'IndexedDBBlobSyncStorage'),
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
        awareness: {
          name: 'BroadcastChannelAwarenessStorage',
          opts: {
            id: `${this.flavour}:${workspaceId}`,
          },
        },
        indexer: (this.featureFlagService && this.featureFlagService.flags?.enable_cloud_indexer?.value)
          ? {
              name: 'CloudIndexerStorage',
              opts: {
                flavour: this.flavour,
                type: 'workspace',
                id: workspaceId,
                serverBaseUrl: serverBaseUrl,
              },
            }
          : {
              name: 'IndexedDBIndexerStorage',
              opts: {
                flavour: this.flavour,
                type: 'workspace',
                id: workspaceId,
              },
            },
        indexerSync: {
          name: 'IndexedDBIndexerSyncStorage',
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
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
        v1: {
          doc: this.DocStorageV1Type
            ? {
                name: getStorageIdentifier(this.DocStorageV1Type, 'IndexedDBV1DocStorage'),
                opts: {
                  id: workspaceId,
                  type: 'workspace',
                },
              }
            : undefined,
          blob: this.BlobStorageV1Type
            ? {
                name: getStorageIdentifier(this.BlobStorageV1Type, 'IndexedDBV1BlobStorage'),
                opts: {
                  id: workspaceId,
                  type: 'workspace',
                },
              }
            : undefined,
        },
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
