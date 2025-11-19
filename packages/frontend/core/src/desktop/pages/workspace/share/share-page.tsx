import { Scrollable, uniReactRoot } from '@yunke/component';
import type { YunkeEditorContainer } from '@yunke/core/blocksuite/block-suite-editor';
import { EditorOutlineViewer } from '@yunke/core/blocksuite/outline-viewer';
import { useActiveBlocksuiteEditor } from '@yunke/core/components/hooks/use-block-suite-editor';
import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { PageDetailEditor } from '@yunke/core/components/page-detail-editor';
import { AppContainer } from '@yunke/core/desktop/components/app-container';
import { AuthService, ServerService, WorkspaceServerService } from '@yunke/core/modules/cloud';
import { getBaseUrl } from '@yunke/config';
import { CloudStorageProvider } from '@yunke/core/modules/cloud-storage';
import { type Doc, DocsService } from '@yunke/core/modules/doc';
import { GlobalDialogService } from '@yunke/core/modules/dialogs';
import {
  type Editor,
  type EditorSelector,
  EditorService,
  EditorsService,
} from '@yunke/core/modules/editor';
import { PeekViewManagerModal } from '@yunke/core/modules/peek-view';
import { AnonymousUserIdentity } from '@yunke/core/modules/temporary-user';
import { ViewIcon, ViewTitle } from '@yunke/core/modules/workbench';
import {
  type Workspace,
  WorkspacesService,
} from '@yunke/core/modules/workspace';
// import { PublicDocMode } from '@yunke/graphql';
import { useI18n } from '@yunke/i18n';
import { DisposableGroup } from '@blocksuite/yunke/global/disposable';
import { RefNodeSlotsProvider } from '@blocksuite/yunke/inlines/reference';
import { type DocMode, DocModes } from '@blocksuite/yunke/model';
import { Logo1Icon } from '@blocksuite/icons/rc';
import { FrameworkScope, useLiveData, useService } from '@toeverything/infra';
import type { Subscription } from 'rxjs';
import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { PageNotFound } from '../../404';
import { ShareFooter } from './share-footer';
import { ShareHeader } from './share-header';
import * as styles from './share-page.css';

export const SharePage = ({
  workspaceId,
  docId,
}: {
  workspaceId: string;
  docId: string;
}) => {
  const location = useLocation();

  const { mode, selector, isTemplate, templateName, templateSnapshotUrl } =
    useMemo(() => {
      const searchParams = new URLSearchParams(location.search);
      const queryStringMode = searchParams.get('mode') as DocMode | null;
      const blockIds = searchParams
        .get('blockIds')
        ?.split(',')
        .filter(v => v.length);
      const elementIds = searchParams
        .get('elementIds')
        ?.split(',')
        .filter(v => v.length);

      return {
        mode:
          queryStringMode && DocModes.includes(queryStringMode)
            ? queryStringMode
            : null,
        selector: {
          blockIds,
          elementIds,
          refreshKey: searchParams.get('refreshKey') || undefined,
        },
        isTemplate: searchParams.has('isTemplate'),
        templateName: searchParams.get('templateName') || '',
        templateSnapshotUrl: searchParams.get('snapshotUrl') || '',
      };
    }, [location.search]);

  return (
    <AppContainer>
      <SharePageInner
        workspaceId={workspaceId}
        docId={docId}
        key={workspaceId + ':' + docId}
        publishMode={mode ?? undefined}
        selector={selector}
        isTemplate={isTemplate}
        templateName={templateName}
        templateSnapshotUrl={templateSnapshotUrl}
      />
    </AppContainer>
  );
};

const SharePageInner = ({
  workspaceId,
  docId,
  publishMode = 'page',
  selector,
  isTemplate,
  templateName,
  templateSnapshotUrl,
}: {
  workspaceId: string;
  docId: string;
  publishMode?: DocMode;
  selector?: EditorSelector;
  isTemplate?: boolean;
  templateName?: string;
  templateSnapshotUrl?: string;
}) => {
  const workspacesService = useService(WorkspacesService);
  const serverService = useService(ServerService);
  // const editorService = useService(EditorService); // ✅ 移除未使用的变量
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [page, setPage] = useState<Doc | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [noPermission, setNoPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isReadonly, setIsReadonly] = useState(true);
  const [isAppendOnlyMode, setIsAppendOnlyMode] = useState(false);
  const [hasTemporaryIdentity, setHasTemporaryIdentity] = useState(false);
  const [editorContainer, setActiveBlocksuiteEditor] =
    useActiveBlocksuiteEditor();
  
  // 从URL参数获取模式，如果没有则使用默认模式
  // 支持在分享页面中切换模式
  const [currentMode, setCurrentMode] = useState<DocMode>(publishMode || 'page');
  
  // 初始化/URL参数模式同步，仅在 publishMode 或 editor 变化时运行，避免与 mode$ 订阅形成循环
  useEffect(() => {
    const newMode = publishMode || 'page';

    if (!editor) {
      if (currentMode !== newMode) {
        setCurrentMode(newMode);
      }
      return;
    }

    if (currentMode !== newMode) {
      editor.setMode(newMode);
      setCurrentMode(newMode);
    }
  }, [publishMode, editor]);

  useEffect(() => {
    // create a workspace for share page
    const abortController = new AbortController();

    const { workspace } = workspacesService.open(
      {
        metadata: {
          id: workspaceId,
          flavour: 'yunke-cloud',
        },
        isSharedMode: true,
      },
      {
        local: {
          // ✅ 移除 StaticCloudDocStorage，统一使用 CloudDocStorage (Socket.IO)
          // 这样可以避免重复请求（HTTP GET + Socket.IO）
          // 只保留 awareness 用于浏览器标签页间通信
          awareness: {
            name: 'BroadcastChannelAwarenessStorage',
            opts: {
              id: `yunke-cloud:${workspaceId}`,
            },
          },
        },
        remotes: {
          'cloud:yunke-cloud': {
            doc: {
              name: 'CloudDocStorage',
              opts: {
                type: 'workspace',
                id: workspaceId,
                serverBaseUrl: getBaseUrl(),
                isSelfHosted: false,
              },
            },
            blob: {
              name: 'CloudBlobStorage',
              opts: {
                id: workspaceId,
                serverBaseUrl: getBaseUrl(),
              },
            },
            awareness: {
              name: 'CloudAwarenessStorage',
              opts: {
                type: 'workspace',
                id: workspaceId,
                serverBaseUrl: getBaseUrl(),
                isSelfHosted: false,
              },
            },
          },
        },
      }
    );

    setWorkspace(workspace);
    
    let disposeModeChange: Subscription | null = null;

    workspace.engine.doc
      .waitForDocLoaded(workspace.id)
      .then(async () => {
        const { doc } = workspace.scope.get(DocsService).open(docId);
        doc.blockSuiteDoc.load();

          // ✅ 获取文档权限信息
          // 使用 /permissions API 获取用户对文档的有效权限
          try {
            // 从 workspace.scope 中获取 WorkspaceServerService
            const workspaceServerService = workspace.scope.get(WorkspaceServerService);
            const server = workspaceServerService.server || serverService.server;

            if (server) {
              const response = await server.fetch(
                `/api/workspaces/${workspaceId}/docs/${docId}/permissions`,
                {
                  method: 'GET',
                  headers: { 'Accept': 'application/json' },
                  signal: abortController.signal,
                }
              );

              // 检查响应状态
              if (response.status === 404) {
                console.error('[SharePage] 文档不存在');
                throw new Error('文档不存在');
              } else if (response.status === 403) {
                console.error('[SharePage] 无权访问文档');
                throw new Error('无权访问文档');
              } else if (response.status !== 200) {
                console.error('[SharePage] 获取权限信息失败，状态码:', response.status);
                throw new Error(`获取权限信息失败: ${response.status}`);
              }

              // 解析 JSON 响应
              const data = await response.json();

              // 从响应数据中提取 effectiveMask 和 permissions
              const effectiveMask = data?.data?.effectiveMask || 0;
              const permissions = data?.data?.permissions || {};

              console.log('[SharePage] ✅ 权限信息获取成功:', {
                effectiveMask,
                permissions,
                fullData: data,
              });

              // 根据 effectiveMask 判断权限
              // Read=1, Comment=2, Add=4, Modify=8, Delete=16, Export=32...
              const canRead = (effectiveMask & 1) !== 0;
              const canAdd = (effectiveMask & 4) !== 0;
              const canModify = (effectiveMask & 8) !== 0;

              const isAppendOnly = canAdd && !canModify;
              const canWrite = canModify || canAdd;

              // 默认为只读
              let readonly = true;

              if (canWrite) {
                readonly = false;
              } else if (canRead) {
                readonly = true;
              } else {
                setNoPermission(true);
                setPermissionError('当前链接无权访问此文档');
                doc.blockSuiteDoc.readonly = true;
                return;
              }

              setIsAppendOnlyMode(isAppendOnly);
              setIsReadonly(readonly);

              // Append-only：如仅有追加权限且无修改权限，允许界面编辑追加；否则按只读/可写处理
              doc.blockSuiteDoc.readonly = isAppendOnly
                ? false
                : readonly;
            }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          console.error('[SharePage] 获取文档权限信息失败：', error);
          console.error('[SharePage] 错误详情：', error instanceof Error ? error.message : '未知错误');
          setPermissionError('无法获取文档权限，请稍后重试');
          // 出错时默认只读
          doc.blockSuiteDoc.readonly = true;
          setIsReadonly(true);
          setIsAppendOnlyMode(false);
        }

        await workspace.engine.doc.waitForDocLoaded(docId);

        if (!doc.blockSuiteDoc.root) {
          throw new Error('文档为空');
        }

        setPage(doc);

        const editor = doc.scope.get(EditorsService).createEditor();
        // 使用currentMode（已经从URL参数或默认值初始化）
        // 这样可以确保使用最新的模式状态
        const initialMode = currentMode || publishMode || 'page';
        editor.setMode(initialMode);
        setCurrentMode(initialMode);

        if (selector) {
          editor.setSelector(selector);
        }

        setEditor(editor);
        
        // 监听编辑器模式变化，更新URL和状态
        disposeModeChange = editor.mode$.subscribe(mode => {
          setCurrentMode(prevMode => {
            if (mode !== prevMode) {
              // 更新URL参数但不刷新页面
              const newUrl = new URL(window.location.href);
              const urlMode = new URLSearchParams(window.location.search).get('mode');
              // 只有当URL中的mode参数与当前模式不一致时才更新URL
              // 避免循环更新
              if (mode === 'page' && urlMode !== null) {
                // page模式：删除mode参数
                newUrl.searchParams.delete('mode');
                window.history.replaceState({}, '', newUrl.toString());
              } else if (mode === 'edgeless' && urlMode !== 'edgeless') {
                // edgeless模式：设置mode参数
                newUrl.searchParams.set('mode', mode);
                window.history.replaceState({}, '', newUrl.toString());
              }
              return mode;
            }
            return prevMode;
          });
        });
      })
      .catch(err => {
        console.error(err);
        setNoPermission(true);
      });
    
    // 清理函数
    return () => {
      abortController.abort();
      if (disposeModeChange) {
        disposeModeChange.unsubscribe();
      }
    };
  }, [
    docId,
    workspaceId,
    workspacesService,
    serverService,
    selector,
    hasTemporaryIdentity,
    // 注意：不包含publishMode，避免重复初始化workspace
    // publishMode的变化通过单独的useEffect处理
  ]);

  const t = useI18n();
  const pageTitle = useLiveData(page?.title$);
  const { jumpToPageBlock, openPage } = useNavigateHelper();

  // 处理临时用户身份变化
  const handleTemporaryIdentityChanged = useCallback((hasIdentity: boolean) => {
    setHasTemporaryIdentity(hasIdentity);
    
    // 只有在AppendOnly模式下才允许编辑
    if (isAppendOnlyMode && hasIdentity && page) {
      page.blockSuiteDoc.readonly = false;
      setIsReadonly(false);
    } else if (isAppendOnlyMode && !hasIdentity && page) {
      // AppendOnly模式但身份丢失：恢复只读
      page.blockSuiteDoc.readonly = true;
      setIsReadonly(true);
    }
    // ReadOnly模式：不做任何处理，始终保持只读
  }, [isAppendOnlyMode, page]);

  const handleTemporaryIdentityCreated = useCallback(() => {
    // 临时身份创建回调
    // success 参数暂时不需要，但保留回调接口以便将来扩展
  }, []);

  const onEditorLoad = useCallback(
    (editorContainer: YunkeEditorContainer) => {
      setActiveBlocksuiteEditor(editorContainer);
      if (!editor) {
        return;
      }
      const unbind = editor.bindEditorContainer(editorContainer);

      const disposable = new DisposableGroup();
      const refNodeSlots =
        editorContainer.host?.std.getOptional(RefNodeSlotsProvider);
      if (refNodeSlots) {
        disposable.add(
          refNodeSlots.docLinkClicked.subscribe(({ pageId, params }) => {
            if (params) {
              const { mode, blockIds, elementIds } = params;
              jumpToPageBlock(workspaceId, pageId, mode, blockIds, elementIds);
              return;
            }

            if (editor.doc.id === pageId) {
              return;
            }

            return openPage(workspaceId, pageId);
          })
        );
      }

      return () => {
        unbind();
      };
    },
    [editor, setActiveBlocksuiteEditor, jumpToPageBlock, openPage, workspaceId]
  );

  if (noPermission) {
    return <PageNotFound noPermission />;
  }

  if (permissionError) {
    return (
      <AppContainer>
        <div
          style={{
            color: '#fff',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: 16,
            margin: 24,
          }}
        >
          {permissionError}
        </div>
      </AppContainer>
    );
  }

  if (!workspace || !page || !editor) {
    return null;
  }

  return (
    <FrameworkScope scope={workspace.scope}>
      <CloudStorageProvider>
        <FrameworkScope scope={page.scope}>
          <FrameworkScope scope={editor.scope}>
            <ViewIcon icon={currentMode === 'page' ? 'doc' : 'edgeless'} />
            <ViewTitle title={pageTitle ?? t['unnamed']()} />
            <div className={styles.root}>
              <div className={styles.mainContainer}>
                <ShareHeader
                  pageId={page.id}
                  publishMode={currentMode}
                  isTemplate={isTemplate}
                  templateName={templateName}
                  snapshotUrl={templateSnapshotUrl}
                  workspaceId={workspaceId}
                  docId={docId}
                />

                {(isAppendOnlyMode || isReadonly) && (
                  <div
                    style={{
                      margin: '12px 0',
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#e6ebff',
                      fontSize: 13,
                    }}
                  >
                    {isAppendOnlyMode
                      ? '追加模式：可追加内容，需临时身份；缺失身份将暂时只读'
                      : '只读模式：当前链接无写入权限'}
                  </div>
                )}
                
                {/* 匿名用户身份管理组件 */}
                <AnonymousUserIdentity
                  workspaceId={workspaceId}
                  docId={docId}
                  mode={isAppendOnlyMode ? 'appendonly' : 'readonly'}
                  autoCreate={true}
                  onIdentityCreated={handleTemporaryIdentityCreated}
                  onIdentityChanged={handleTemporaryIdentityChanged}
                />
                
                <Scrollable.Root>
                  <Scrollable.Viewport
                    className={clsx(
                      'yunke-page-viewport',
                      styles.editorContainer
                    )}
                  >
                    <PageDetailEditor onLoad={onEditorLoad} readonly={isReadonly} />
                    {currentMode === 'page' && !BUILD_CONFIG.isElectron ? (
                      <ShareFooter />
                    ) : null}
                  </Scrollable.Viewport>
                  <Scrollable.Scrollbar />
                </Scrollable.Root>
                <EditorOutlineViewer
                  editor={editorContainer?.host ?? null}
                  show={currentMode === 'page'}
                />
                {!BUILD_CONFIG.isElectron && <SharePageFooter />}
              </div>
            </div>
            <PeekViewManagerModal />
            <uniReactRoot.Root />
          </FrameworkScope>
        </FrameworkScope>
      </CloudStorageProvider>
    </FrameworkScope>
  );
};

const SharePageFooter = () => {
  // const t = useI18n(); // ✅ 暂时未使用，但保留以便将来扩展
  const editorService = useService(EditorService);
  const isPresent = useLiveData(editorService.editor.isPresenting$);
  const authService = useService(AuthService);
  const loginStatus = useLiveData(authService.session.status$);
  const globalDialogService = useService(GlobalDialogService);

  const handleContactClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    globalDialogService.open('contact-us', {});
  }, [globalDialogService]);

  if (isPresent || loginStatus === 'authenticated') {
    return null;
  }
  return (
    <a
      href="#"
      onClick={handleContactClick}
      className={styles.link}
    >
      <span className={styles.linkText}>
        联系我们
      </span>
      <Logo1Icon fontSize={20} />
    </a>
  );
};
