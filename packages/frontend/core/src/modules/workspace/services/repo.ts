import { DebugLogger } from '@yunke/debug';
import type { WorkerInitOptions } from '@yunke/nbstore/worker/client';
import { ObjectPool, Service } from '@toeverything/infra';
import { getBaseUrl } from '@yunke/config';

import type { Workspace } from '../entities/workspace';
import { WorkspaceInitialized } from '../events';
import type { WorkspaceOpenOptions } from '../open-options';
import { WorkspaceScope } from '../scopes/workspace';
import type { WorkspaceFlavoursService } from './flavours';
import type { WorkspaceListService } from './list';
import type { WorkspaceProfileService } from './profile';
import { WorkspaceService } from './workspace';

const logger = new DebugLogger('affine:workspace-repository');

export class WorkspaceRepositoryService extends Service {
  constructor(
    private readonly flavoursService: WorkspaceFlavoursService,
    private readonly profileRepo: WorkspaceProfileService,
    private readonly workspacesListService: WorkspaceListService
  ) {
    super();
  }
  pool = new ObjectPool<string, Workspace>({
    onDelete(workspace) {
      workspace.scope.dispose();
    },
    onDangling(workspace) {
      return workspace.canGracefulStop;
    },
  });

  /**
   * open workspace reference by metadata.
   *
   * You basically don't need to call this function directly, use the react hook `useWorkspace(metadata)` instead.
   *
   * @returns the workspace reference and a release function, don't forget to call release function when you don't
   * need the workspace anymore.
   */
  open = (
    options: WorkspaceOpenOptions,
    customEngineWorkerInitOptions?: WorkerInitOptions
  ): {
    workspace: Workspace;
    dispose: () => void;
  } => {
    if (options.isSharedMode) {
      const workspace = this.instantiate(
        options,
        customEngineWorkerInitOptions
      );
      return {
        workspace,
        dispose: () => {
          workspace.scope.dispose();
        },
      };
    }

    const exist = this.pool.get(options.metadata.id);
    if (exist) {
      return {
        workspace: exist.obj,
        dispose: exist.release,
      };
    }

    const workspace = this.instantiate(options, customEngineWorkerInitOptions);

    const ref = this.pool.put(workspace.meta.id, workspace);

    return {
      workspace: ref.obj,
      dispose: ref.release,
    };
  };

  openByWorkspaceId = (workspaceId: string) => {
    const workspaceMetadata =
      this.workspacesListService.list.workspace$(workspaceId).value;
    return workspaceMetadata && this.open({ metadata: workspaceMetadata });
  };

  instantiate(
    openOptions: WorkspaceOpenOptions,
    customEngineWorkerInitOptions?: WorkerInitOptions
  ) {
    logger.info(
      `open workspace [${openOptions.metadata.flavour}] ${openOptions.metadata.id} `
    );
    
    // Android环境下的特殊处理
    const isAndroid = typeof window !== 'undefined' && 
                     window.Capacitor && 
                     window.Capacitor.getPlatform && 
                     window.Capacitor.getPlatform() === 'android';
    
    if (isAndroid) {
      logger.info('检测到Android环境，正在初始化工作区...');
    }
    
    const flavourProvider = this.flavoursService.flavours$.value.find(
      p => p.flavour === openOptions.metadata.flavour
    );
    
    if (!flavourProvider) {
      logger.error(`找不到工作区类型提供者: ${openOptions.metadata.flavour}`);
      logger.error('可用的工作区类型:', this.flavoursService.flavours$.value.map(p => p.flavour));
      throw new Error(
        `找不到工作区类型提供者：${openOptions.metadata.flavour}`
      );
    }
    
    const engineWorkerInitOptions =
      customEngineWorkerInitOptions ??
      (() => {
        try {
          
          if (!flavourProvider) {
            throw new Error('flavourProvider不存在');
          }
          
          if (!flavourProvider.getEngineWorkerInitOptions) {
            throw new Error('flavourProvider.getEngineWorkerInitOptions方法不存在');
          }
          
          return flavourProvider.getEngineWorkerInitOptions(openOptions.metadata.id);
        } catch (error) {
          console.error('❌ [WorkspaceRepositoryService] 获取engineWorkerInitOptions失败:', error);
          
          // Android环境下提供备用配置
          if (isAndroid) {
            console.warn('🤖 [WorkspaceRepositoryService] Android环境下使用备用engineWorkerInitOptions');
            return {
              local: {
                doc: { name: 'IndexedDBDocStorage', opts: { flavour: openOptions.metadata.flavour, type: 'workspace', id: openOptions.metadata.id } },
                blob: { name: 'IndexedDBBlobStorage', opts: { flavour: openOptions.metadata.flavour, type: 'workspace', id: openOptions.metadata.id } },
                docSync: { name: 'IndexedDBDocSyncStorage', opts: { flavour: openOptions.metadata.flavour, type: 'workspace', id: openOptions.metadata.id } },
                blobSync: { name: 'IndexedDBBlobSyncStorage', opts: { flavour: openOptions.metadata.flavour, type: 'workspace', id: openOptions.metadata.id } },
                awareness: { name: 'BroadcastChannelAwarenessStorage', opts: { id: `${openOptions.metadata.flavour}:${openOptions.metadata.id}` } },
                indexer: { name: 'IndexedDBIndexerStorage', opts: { flavour: openOptions.metadata.flavour, type: 'workspace', id: openOptions.metadata.id } },
                indexerSync: { name: 'IndexedDBIndexerSyncStorage', opts: { flavour: openOptions.metadata.flavour, type: 'workspace', id: openOptions.metadata.id } }
              },
              remotes: {
                [`cloud:${openOptions.metadata.flavour}`]: {
                  doc: { name: 'CloudDocStorage', opts: { type: 'workspace', id: openOptions.metadata.id, serverBaseUrl: getBaseUrl(), isSelfHosted: true } },
                  blob: { name: 'CloudBlobStorage', opts: { id: openOptions.metadata.id, serverBaseUrl: getBaseUrl() } },
                  awareness: { name: 'CloudAwarenessStorage', opts: { type: 'workspace', id: openOptions.metadata.id, serverBaseUrl: getBaseUrl(), isSelfHosted: true } }
                }
              }
            };
          }
          
          throw error;
        }
      })();
    
    if (!engineWorkerInitOptions) {
      logger.error('无法获取引擎初始化选项');
      throw new Error(
        `无法获取工作区引擎初始化选项：${openOptions.metadata.flavour}`
      );
    }

    const workspaceScope = this.framework.createScope(WorkspaceScope, {
      openOptions,
      engineWorkerInitOptions,
    });

    const workspace = workspaceScope.get(WorkspaceService).workspace;

    // Android环境下安全启动引擎
    try {
      
      if (!workspace) {
        throw new Error('workspace不存在');
      }
      
      if (!workspace.engine) {
        throw new Error('workspace.engine不存在');
      }
      
      workspace.engine.start();
    } catch (error) {
      console.error('❌ [WorkspaceRepositoryService] 工作空间引擎启动失败:', error);
      throw error;
    }

    workspaceScope.emitEvent(WorkspaceInitialized, workspace);

    flavourProvider?.onWorkspaceInitialized?.(workspace);

    this.profileRepo
      .getProfile(openOptions.metadata)
      .syncWithWorkspace(workspace);

    return workspace;
  }
}
