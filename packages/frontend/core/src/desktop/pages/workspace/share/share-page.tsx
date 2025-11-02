import { Scrollable, uniReactRoot } from '@yunke/component';
import type { YunkeEditorContainer } from '@yunke/core/blocksuite/block-suite-editor';
import { EditorOutlineViewer } from '@yunke/core/blocksuite/outline-viewer';
import { useActiveBlocksuiteEditor } from '@yunke/core/components/hooks/use-block-suite-editor';
import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { PageDetailEditor } from '@yunke/core/components/page-detail-editor';
import { AppContainer } from '@yunke/core/desktop/components/app-container';
import { AuthService } from '@yunke/core/modules/cloud';
import { getBaseUrl, getApiBaseUrl } from '@yunke/config';
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
import { ShareInfoService } from '@yunke/core/modules/share-doc';
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
import clsx from 'clsx';
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
  // 不再需要ServerService，统一使用network-config.ts的配置
  const workspacesService = useService(WorkspacesService);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [page, setPage] = useState<Doc | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [noPermission, setNoPermission] = useState(false);
  const [isReadonly, setIsReadonly] = useState(true);
  const [isAppendOnlyMode, setIsAppendOnlyMode] = useState(false);
  const [hasTemporaryIdentity, setHasTemporaryIdentity] = useState(false);
  const [editorContainer, setActiveBlocksuiteEditor] =
    useActiveBlocksuiteEditor();

  useEffect(() => {
    // create a workspace for share page
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
          doc: {
            name: 'StaticCloudDocStorage',
            opts: {
              id: workspaceId,
              serverBaseUrl: getBaseUrl(),
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

    workspace.engine.doc
      .waitForDocLoaded(workspace.id)
      .then(async () => {
        const { doc } = workspace.scope.get(DocsService).open(docId);
        doc.blockSuiteDoc.load();
        
        // Try to get document mode from server
        try {
          console.log('[AppendOnly Debug] Fetching document mode from server...');
          // 统一使用 network-config.ts 的配置
          const baseUrl = getBaseUrl();
          const apiBaseUrl = getApiBaseUrl();
          console.log('[AppendOnly Debug] Server base URL:', baseUrl);
          console.log('[AppendOnly Debug] API base URL:', apiBaseUrl);
          console.log('[AppendOnly Debug] Workspace ID:', workspaceId);
          console.log('[AppendOnly Debug] Doc ID:', docId);
          
          // Get document headers to determine permission mode
          const response = await fetch(`${apiBaseUrl}/workspaces/${workspaceId}/docs/${docId}`, {
            method: 'HEAD',
          });
          
          const publishMode = response.headers.get('publish-mode');
          const permissionMode = response.headers.get('permission-mode');
          
          console.log('[AppendOnly Debug] Server publish-mode header:', publishMode);
          console.log('[AppendOnly Debug] Server permission-mode header:', permissionMode);
          console.log('[AppendOnly Debug] Response status:', response.status);
          
          // Set readonly state based on permission mode
          const isAppendOnly = permissionMode === 'append-only';
          const readonly = !isAppendOnly;
          
          console.log('[AppendOnly Debug] Is AppendOnly:', isAppendOnly);
          console.log('[AppendOnly Debug] Setting readonly to:', readonly);
          
          setIsAppendOnlyMode(isAppendOnly);
          
          // 如果是AppendOnly模式且还没有临时身份，先保持只读
          // 临时身份创建成功后会更新readonly状态
          if (isAppendOnly && !hasTemporaryIdentity) {
            doc.blockSuiteDoc.readonly = true;
            setIsReadonly(true);
          } else {
            doc.blockSuiteDoc.readonly = readonly;
            setIsReadonly(readonly);
          }
          
        } catch (error) {
          console.error('[仅追加调试] 获取文档模式失败：', error);
                      console.error('[仅追加调试] 错误详情：', error instanceof Error ? error.message : '未知错误');
          // Default to readonly on error
          doc.blockSuiteDoc.readonly = true;
          setIsReadonly(true);
        }

        await workspace.engine.doc.waitForDocLoaded(docId);

        if (!doc.blockSuiteDoc.root) {
          throw new Error('文档为空');
        }

        setPage(doc);

        const editor = doc.scope.get(EditorsService).createEditor();
        editor.setMode(publishMode);

        if (selector) {
          editor.setSelector(selector);
        }

        setEditor(editor);
      })
      .catch(err => {
        console.error(err);
        setNoPermission(true);
      });
  }, [
    docId,
    workspaceId,
    workspacesService,
    publishMode,
    selector,
    hasTemporaryIdentity,
    // 不再需要serverService.server.baseUrl，统一配置会自动处理
  ]);

  const t = useI18n();
  const pageTitle = useLiveData(page?.title$);
  const { jumpToPageBlock, openPage } = useNavigateHelper();

  // 处理临时用户身份变化
  const handleTemporaryIdentityChanged = useCallback((hasIdentity: boolean) => {
    setHasTemporaryIdentity(hasIdentity);
    
    // 如果在AppendOnly模式下获得了临时身份，启用编辑功能
    if (isAppendOnlyMode && hasIdentity && page) {
      console.log('[AppendOnly Debug] Temporary identity acquired, enabling edit mode');
      page.blockSuiteDoc.readonly = false;
      setIsReadonly(false);
    }
  }, [isAppendOnlyMode, page]);

  const handleTemporaryIdentityCreated = useCallback((success: boolean) => {
    if (success) {
      console.log('[AppendOnly Debug] Temporary identity created successfully');
    } else {
              console.log('[仅追加调试] 创建临时身份失败');
    }
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

  if (!workspace || !page || !editor) {
    return null;
  }

  return (
    <FrameworkScope scope={workspace.scope}>
      <CloudStorageProvider>
        <FrameworkScope scope={page.scope}>
          <FrameworkScope scope={editor.scope}>
            <ViewIcon icon={publishMode === 'page' ? 'doc' : 'edgeless'} />
            <ViewTitle title={pageTitle ?? t['unnamed']()} />
            <div className={styles.root}>
              <div className={styles.mainContainer}>
                <ShareHeader
                  pageId={page.id}
                  publishMode={publishMode}
                  isTemplate={isTemplate}
                  templateName={templateName}
                  snapshotUrl={templateSnapshotUrl}
                />
                
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
                    {publishMode === 'page' && !BUILD_CONFIG.isElectron ? (
                      <ShareFooter />
                    ) : null}
                  </Scrollable.Viewport>
                  <Scrollable.Scrollbar />
                </Scrollable.Root>
                <EditorOutlineViewer
                  editor={editorContainer?.host ?? null}
                  show={publishMode === 'page'}
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
  const t = useI18n();
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
