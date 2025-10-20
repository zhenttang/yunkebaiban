import { DNDContext } from '@yunke/component';
import { YunkeOtherPageLayout } from '@yunke/component/yunke-other-page-layout';
import { workbenchRoutes } from '@yunke/core/desktop/workbench-router';
import {
  DefaultServerService,
  ServersService,
} from '@yunke/core/modules/cloud';
import { GlobalDialogService } from '@yunke/core/modules/dialogs';
import { DndService } from '@yunke/core/modules/dnd/services';
import { GlobalContextService } from '@yunke/core/modules/global-context';
import { OpenInAppGuard } from '@yunke/core/modules/open-in-app';
import {
  getYUNKEWorkspaceSchema,
  type Workspace,
  type WorkspaceMetadata,
  WorkspacesService,
} from '@yunke/core/modules/workspace';
import { ZipTransformer } from '@blocksuite/yunke/widgets/linked-doc';
import {
  FrameworkScope,
  LiveData,
  useLiveData,
  useService,
  useServices,
} from '@toeverything/infra';
import type { PropsWithChildren, ReactElement } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  matchPath,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { map } from 'rxjs';
import * as _Y from 'yjs';

import { YunkeErrorBoundary } from '../../../components/yunke/yunke-error-boundary';
import { WorkbenchRoot } from '../../../modules/workbench';
import { cleanupInvalidWorkspaceStorage, getRecommendedWorkspaceId } from '../../../utils/workspace-storage-cleanup';
import { AppContainer } from '../../components/app-container';
import { PageNotFound } from '../404';
import { WorkspaceLayout } from './layouts/workspace-layout';
import { SharePage } from './share/share-page';
import { StandaloneCommunityPage } from './standalone-community';

declare global {
  /**
   * @internal 仅用于调试
   */
  // oxlint-disable-next-line no-var 禁用no-var规则
  var currentWorkspace: Workspace | undefined;
  // oxlint-disable-next-line no-var 禁用no-var规则
  var exportWorkspaceSnapshot: (docs?: string[]) => Promise<void>;
  // oxlint-disable-next-line no-var 禁用no-var规则
  var importWorkspaceSnapshot: () => Promise<void>;
  // oxlint-disable-next-line no-var 禁用no-var规则
  var Y: typeof _Y;
  interface WindowEventMap {
    'yunke:workspace:change': CustomEvent<{ id: string }>;
  }
}

globalThis.Y = _Y;

export const Component = (): ReactElement => {
  const {
    workspacesService,
    globalDialogService,
    serversService,
    defaultServerService,
    globalContextService,
  } = useServices({
    WorkspacesService,
    GlobalDialogService,
    ServersService,
    DefaultServerService,
    GlobalContextService,
  });

  const params = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 首先检查我们是否在社区路由中，如果是，直接渲染社区页面
  const communityRoute = useMemo(() => {
    
    const communityMatch = matchPath(
      '/workspace/:workspaceId/community/:docId',
      location.pathname
    );
    if (
      communityMatch &&
      communityMatch.params.docId &&
      communityMatch.params.workspaceId
    ) {
      return {
        docId: communityMatch.params.docId,
        workspaceId: communityMatch.params.workspaceId,
      };
    }
    
    const communityListMatch = matchPath(
      '/workspace/:workspaceId/community',
      location.pathname
    );
    if (
      communityListMatch &&
      communityListMatch.params.workspaceId
    ) {
      return {
        workspaceId: communityListMatch.params.workspaceId,
        isList: true,
      };
    }
    
    return null;
  }, [location.pathname]);

  // 检查我们是否在文档详情路由中，如果是，可能渲染分享页面
  const detailDocRoute = useMemo(() => {
    // 如果已经匹配到社区路由，则不再检查文档详情路由
    if (communityRoute) {
      return null;
    }
    
    const match = matchPath(
      '/workspace/:workspaceId/:docId',
      location.pathname
    );
    if (
      match &&
      match.params.docId &&
      match.params.workspaceId &&
      // TODO(eyhn): 需要更好的方式来检查是否为docId
      workbenchRoutes.find(route =>
        matchPath(route.path, '/' + match.params.docId)
      )?.path === '/:pageId'
    ) {
      return {
        docId: match.params.docId,
        workspaceId: match.params.workspaceId,
      };
    } else {
      return null;
    }
  }, [location.pathname, communityRoute]);

  const [workspaceNotFound, setWorkspaceNotFound] = useState(false);
  const listLoading = useLiveData(workspacesService.list.isRevalidating$);
  const workspaces = useLiveData(workspacesService.list.workspaces$);
  const meta = useMemo(() => {
    return workspaces.find(({ id }) => id === params.workspaceId);
  }, [workspaces, params.workspaceId]);

  // 对于社区路由，创建一个虚拟的工作空间元数据
  const effectiveMeta = useMemo(() => {
    if (communityRoute && !meta) {
      // 创建虚拟工作空间元数据，仅用于社区功能
      return {
        id: params.workspaceId || 'community-virtual',
        flavour: 'local',
        initialized: true,
      } as WorkspaceMetadata;
    }
    return meta;
  }, [communityRoute, meta, params.workspaceId]);

  // 如果 listLoading 为 false，我们可以显示 404 页面，否则应该显示加载页面。
  useEffect(() => {
    // 对于社区路由，不设置 workspaceNotFound
    if (communityRoute) {
      setWorkspaceNotFound(false);
      return;
    }
    
    if (listLoading === false && meta === undefined) {
      setWorkspaceNotFound(true);
    }
    if (meta) {
      setWorkspaceNotFound(false);
    }
  }, [listLoading, meta, workspacesService, communityRoute]);

  // 如果工作区未找到，我们应该重试
  const retryTimesRef = useRef(3);
  useEffect(() => {
    if (params.workspaceId) {
      retryTimesRef.current = 3; // 重置重试次数
      workspacesService.list.revalidate();
    }
  }, [params.workspaceId, workspacesService]);
  useEffect(() => {
    if (listLoading === false && meta === undefined) {
      const timer = setTimeout(() => {
        if (retryTimesRef.current > 0) {
          workspacesService.list.revalidate();
          retryTimesRef.current--;
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
    return;
  }, [listLoading, meta, workspaceNotFound, workspacesService]);

  // 来自搜索参数的服务器
  const serverFromSearchParams = useLiveData(
    searchParams.has('server')
      ? serversService.serverByBaseUrl$(searchParams.get('server') as string)
      : undefined
  );
  // 来自工作区的服务器
  const serverFromWorkspace = useLiveData(
    meta?.flavour && meta.flavour !== 'local'
      ? serversService.server$(meta?.flavour)
      : undefined
  );
  const server = serverFromWorkspace ?? serverFromSearchParams;

  useEffect(() => {
    if (server) {
      globalContextService.globalContext.serverId.set(server.id);
      return () => {
        globalContextService.globalContext.serverId.set(
          defaultServerService.server.id
        );
      };
    }
    return;
  }, [
    defaultServerService.server.id,
    globalContextService.globalContext.serverId,
    server,
  ]);

  // 如果未找到服务器，且搜索参数中有服务器，我们应该显示添加自托管对话框
  const needAddSelfhosted = server === undefined && searchParams.has('server');
  // 使用ref避免useEffect触发两次
  const addSelfhostedDialogOpened = useRef<boolean>(false);

  useEffect(() => {
    if (addSelfhostedDialogOpened.current) {
      return;
    }
    addSelfhostedDialogOpened.current = true;
    if (BUILD_CONFIG.isElectron && needAddSelfhosted) {
      globalDialogService.open('sign-in', {
        server: searchParams.get('server') as string,
      });
    }
    return;
  }, [
    globalDialogService,
    needAddSelfhosted,
    searchParams,
    serverFromSearchParams,
  ]);

  // 添加工作空间ID验证和自动纠正逻辑
  useEffect(() => {
    if (params.workspaceId && workspaces.length > 0 && !listLoading) {
      const requestedWorkspaceId = params.workspaceId;
      const isWorkspaceExists = workspaces.some(ws => ws.id === requestedWorkspaceId);
      
      // 1. 清理无效的存储数据
      const validWorkspaceData = workspaces.map(ws => ({ id: ws.id, flavour: ws.flavour }));
      cleanupInvalidWorkspaceStorage(validWorkspaceData);
      
      if (!isWorkspaceExists) {
        console.warn(`🚫 工作空间ID不存在: ${requestedWorkspaceId}`);
        console.log(`📋 可用的工作空间:`, workspaces.map(ws => ({ id: ws.id, flavour: ws.flavour })));
        
        // 2. 获取推荐的工作空间ID
        const recommendedId = getRecommendedWorkspaceId(validWorkspaceData);
        
        if (recommendedId && recommendedId !== requestedWorkspaceId) {
          console.log(`🔄 重定向到推荐工作空间: ${recommendedId}`);
          
          // 构建新的URL路径
          const currentPath = location.pathname;
          const newPath = currentPath.replace(
            `/workspace/${requestedWorkspaceId}`,
            `/workspace/${recommendedId}`
          );
          
          // 使用replace避免在历史记录中留下无效的URL
          window.location.replace(newPath + location.search + location.hash);
          return;
        } else {
          console.error('🚫 没有可用的有效工作空间');
        }
      } else {
        // 工作空间存在，更新localStorage
        localStorage.setItem('last_workspace_id', requestedWorkspaceId);
        console.log(`✅ 工作空间ID有效: ${requestedWorkspaceId}`);
      }
    }
  }, [params.workspaceId, workspaces, listLoading, location]);

  // 工作空间列表加载完成后执行清理
  useEffect(() => {
    if (!listLoading && workspaces.length > 0) {
      const validWorkspaceData = workspaces.map(ws => ({ id: ws.id, flavour: ws.flavour }));
      console.log('🧹 执行工作空间存储数据清理');
      cleanupInvalidWorkspaceStorage(validWorkspaceData);
    }
  }, [listLoading, workspaces]);

  if (workspaceNotFound) {
    // Handle community routes first, even when workspace is not found
    if (communityRoute) {
      return (
        <FrameworkScope scope={server?.scope}>
          <StandaloneCommunityPage />
        </FrameworkScope>
      );
    }
    
    if (detailDocRoute) {
      return (
        <FrameworkScope scope={server?.scope}>
          <SharePage
            docId={detailDocRoute.docId}
            workspaceId={detailDocRoute.workspaceId}
          />
        </FrameworkScope>
      );
    }
    
    return (
      <FrameworkScope scope={server?.scope}>
        <YunkeOtherPageLayout>
          <PageNotFound noPermission />
        </YunkeOtherPageLayout>
      </FrameworkScope>
    );
  }
  if (!effectiveMeta) {
    return <AppContainer fallback />;
  }

  return (
    <FrameworkScope scope={server?.scope}>
      <WorkspacePage meta={effectiveMeta} />
    </FrameworkScope>
  );
};

const DNDContextProvider = ({ children }: PropsWithChildren) => {
  const dndService = useService(DndService);
  const contextValue = useMemo(() => {
    return {
      fromExternalData: dndService.fromExternalData,
      toExternalData: dndService.toExternalData,
    };
  }, [dndService.fromExternalData, dndService.toExternalData]);
  return (
    <DNDContext.Provider value={contextValue}>{children}</DNDContext.Provider>
  );
};

const WorkspacePage = ({ meta }: { meta: WorkspaceMetadata }) => {
  const { workspacesService, globalContextService } = useServices({
    WorkspacesService,
    GlobalContextService,
  });

  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  console.log('🏗️ [WorkspacePage] 开始渲染，meta:', meta);

  useLayoutEffect(() => {
    console.log('🏗️ [WorkspacePage] useLayoutEffect 开始，打开工作空间:', meta.id);
    console.log('🔍 [WorkspacePage] 工作空间元数据:', {
      id: meta.id,
      flavour: meta.flavour,
      initialized: meta.initialized
    });
    
    try {
      const ref = workspacesService.open({ metadata: meta });
      console.log('🏗️ [WorkspacePage] 工作空间引用创建成功:', ref);
      
      if (ref.workspace) {
        console.log('✅ [WorkspacePage] 工作空间对象已就绪:', {
          id: ref.workspace.id,
          flavour: ref.workspace.flavour,
          initialized: ref.workspace.meta?.initialized,
          engine: !!ref.workspace.engine,
          docCollection: !!ref.workspace.docCollection
        });
        
        // 添加根文档状态监听
        const docStateSub = ref.workspace.engine.doc
          .docState$(ref.workspace.id)
          .subscribe((state) => {
            console.log('📄 [WorkspacePage] 根文档状态监听器:', {
              workspaceId: ref.workspace.id,
              ready: state.ready,
              syncing: state.syncing
            });
          });
        
        setWorkspace(ref.workspace);
        
        return () => {
          console.log('🧹 [WorkspacePage] 清理工作空间引用');
          docStateSub.unsubscribe();
          ref.dispose();
        };
      } else {
        console.error('❌ [WorkspacePage] 工作空间对象为空');
      }
    } catch (error) {
      console.error('💥 [WorkspacePage] 打开工作空间失败:', error);
      setWorkspace(null);
    }
    return undefined;
  }, [meta, workspacesService]);

  const isRootDocReady =
    useLiveData(
      useMemo(
        () => {
          if (!workspace) {
            console.warn('⚠️ [WorkspacePage] workspace为空，无法检查根文档状态');
            return null;
          }
          
          console.log('📄 [WorkspacePage] 检查根文档状态，工作空间ID:', workspace.id);
          
          return LiveData.from(
            workspace.engine.doc
              .docState$(workspace.id)
              .pipe(map(v => {
                console.log('📄 [WorkspacePage] 根文档状态更新:', { ready: v.ready, workspaceId: workspace.id });
                return v.ready;
              })),
            false
          );
        },
        [workspace]
      )
    ) ?? false;

  console.log('🏗️ [WorkspacePage] 渲染状态:', {
    hasWorkspace: !!workspace,
    workspaceId: workspace?.id,
    isRootDocReady,
    meta: meta
  });

  useEffect(() => {
    if (workspace) {
      // for debug purpose
      window.currentWorkspace = workspace ?? undefined;
      window.dispatchEvent(
        new CustomEvent('yunke:workspace:change', {
          detail: {
            id: workspace.id,
          },
        })
      );
      window.exportWorkspaceSnapshot = async (docs?: string[]) => {
        await ZipTransformer.exportDocs(
          workspace.docCollection,
          getYUNKEWorkspaceSchema(),
          Array.from(workspace.docCollection.docs.values())
            .filter(doc => (docs ? docs.includes(doc.id) : true))
            .map(doc => doc.getStore())
        );
      };
      window.importWorkspaceSnapshot = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = async () => {
          if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const blob = new Blob([file], { type: 'application/zip' });
            const newDocs = await ZipTransformer.importDocs(
              workspace.docCollection,
              getYUNKEWorkspaceSchema(),
              blob
            );
            console.log(
              '已导入文档',
              newDocs
                .filter(doc => !!doc)
                .map(doc => ({
                  id: doc.id,
                  title: doc.meta?.title,
                }))
            );
          }
        };
        input.click();
      };
      localStorage.setItem('last_workspace_id', workspace.id);
      globalContextService.globalContext.workspaceId.set(workspace.id);
      globalContextService.globalContext.workspaceFlavour.set(
        workspace.flavour
      );
      return () => {
        window.currentWorkspace = undefined;
        globalContextService.globalContext.workspaceId.set(null);
        globalContextService.globalContext.workspaceFlavour.set(null);
      };
    }
    return;
  }, [globalContextService, workspace]);

  if (!workspace) {
    return null; // skip this, workspace will be set in layout effect
  }

  if (!isRootDocReady) {
    return (
      <FrameworkScope scope={workspace.scope}>
        <DNDContextProvider>
          <OpenInAppGuard>
            <AppContainer fallback />
          </OpenInAppGuard>
        </DNDContextProvider>
      </FrameworkScope>
    );
  }

  return (
    <FrameworkScope scope={workspace.scope}>
      <DNDContextProvider>
        <OpenInAppGuard>
          <YunkeErrorBoundary height="100vh">
            <WorkspaceLayout>
              <WorkbenchRoot />
            </WorkspaceLayout>
          </YunkeErrorBoundary>
        </OpenInAppGuard>
      </DNDContextProvider>
    </FrameworkScope>
  );
};
