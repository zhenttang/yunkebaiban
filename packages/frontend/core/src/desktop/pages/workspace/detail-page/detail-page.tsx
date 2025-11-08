import { Scrollable } from '@yunke/component';
import { PageDetailLoading } from '@yunke/component/page-detail-skeleton';
import type { ChatPanel } from '@yunke/core/blocksuite/ai';
import { AIProvider } from '@yunke/core/blocksuite/ai';
import type { YunkeEditorContainer } from '@yunke/core/blocksuite/block-suite-editor';
import { EditorOutlineViewer } from '@yunke/core/blocksuite/outline-viewer';
import { YunkeErrorBoundary } from '@yunke/core/components/yunke/yunke-error-boundary';
// import { PageAIOnboarding } from '@yunke/core/components/yunke/ai-onboarding';
import { BlockCommandsSidebar } from '@yunke/core/components/block-commands-sidebar';
import { GlobalPageHistoryModal } from '@yunke/core/components/yunke/page-history-modal';
import { useGuard } from '@yunke/core/components/guard';
import { useAppSettingHelper } from '@yunke/core/components/hooks/yunke/use-app-setting-helper';
import { useEnableAI } from '@yunke/core/components/hooks/yunke/use-enable-ai';
import { useRegisterBlocksuiteEditorCommands } from '@yunke/core/components/hooks/yunke/use-register-blocksuite-editor-commands';
import { useActiveBlocksuiteEditor } from '@yunke/core/components/hooks/use-block-suite-editor';
import { PageDetailEditor } from '@yunke/core/components/page-detail-editor';
import { WorkspacePropertySidebar } from '@yunke/core/components/properties/sidebar';
import { TrashPageFooter } from '@yunke/core/components/pure/trash-page-footer';
import { TopTip } from '@yunke/core/components/top-tip';
import { type Doc, DocService } from '@yunke/core/modules/doc';
import { EditorService } from '@yunke/core/modules/editor';
import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { GlobalContextService } from '@yunke/core/modules/global-context';
import { PeekViewService } from '@yunke/core/modules/peek-view';
import { RecentDocsService } from '@yunke/core/modules/quicksearch';
import {
  useIsActiveView,
  ViewBody,
  ViewHeader,
  ViewService,
  ViewSidebarTab,
  WorkbenchService,
} from '@yunke/core/modules/workbench';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { isNewTabTrigger } from '@yunke/core/utils';
import track from '@yunke/track';
import { DisposableGroup } from '@blocksuite/yunke/global/disposable';
import { RefNodeSlotsProvider } from '@blocksuite/yunke/inlines/reference';
import {
  AiIcon,
  ExportIcon,
  FrameIcon,
  PropertyIcon,
  TocIcon,
  TodayIcon,
} from '@blocksuite/icons/rc';
import {
  FrameworkScope,
  useLiveData,
  useService,
  useServices,
} from '@toeverything/infra';
import clsx from 'clsx';
import { nanoid } from 'nanoid';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Subscription } from 'rxjs';
import { SaveStatusIndicator } from '../../../../../../apps/web/src/components/save-status-indicator';

import { PageNotFound } from '../../404';
import * as styles from './detail-page.css';
import { DetailPageHeader } from './detail-page-header';
import { DetailPageWrapper } from './detail-page-wrapper';
import { EditorAdapterPanel } from './tabs/adapter';
import { EditorChatPanel } from './tabs/chat';
import { EditorFramePanel } from './tabs/frame';
import { EditorJournalPanel } from './tabs/journal';
import { EditorOutlinePanel } from './tabs/outline';

const DetailPageImpl = memo(function DetailPageImpl() {
  const {
    workbenchService,
    viewService,
    editorService,
    docService,
    workspaceService,
    globalContextService,
  } = useServices({
    WorkbenchService,
    ViewService,
    EditorService,
    DocService,
    WorkspaceService,
    GlobalContextService,
  });
  const workbench = workbenchService.workbench;
  const editor = editorService.editor;
  const view = viewService.view;
  const workspace = workspaceService.workspace;
  const globalContext = globalContextService.globalContext;
  
  // ✅ 安全地获取 doc：DocScope 可能还未初始化
  // 使用 try-catch 和可选链，如果 DocScope 未初始化则返回 null
  let doc: Doc | null = null;
  try {
    doc = docService.doc;
  } catch (error) {
    // DocScope 未初始化，doc 保持为 null
    // 组件会在 DocScope 初始化后重新渲染
  }
  
  // ✅ 如果 doc 未初始化，返回加载状态
  if (!doc) {
    return null; // 等待 DocScope 初始化
  }

  const mode = useLiveData(editor.mode$);
  const activeSidebarTab = useLiveData(view.activeSidebarTab$);

  const isInTrash = useLiveData(doc.meta$.map(meta => meta.trash));
  const editorContainer = useLiveData(editor.editorContainer$);

  const isSideBarOpen = useLiveData(workbench.sidebarOpen$);
  const { appSettings } = useAppSettingHelper();
  const chatPanelRef = useRef<ChatPanel | null>(null);

  const peekView = useService(PeekViewService).peekView;

  const isActiveView = useIsActiveView();
  // TODO(@eyhn): 在这里移除 jotai
  const [_, setActiveBlockSuiteEditor] = useActiveBlocksuiteEditor();

  const enableAI = useEnableAI();

  const featureFlagService = useService(FeatureFlagService);
  const enableAdapterPanel = useLiveData(
    featureFlagService.flags.enable_adapter_panel.$
  );

  useEffect(() => {
    if (isActiveView) {
      setActiveBlockSuiteEditor(editorContainer);
    }
  }, [editorContainer, isActiveView, setActiveBlockSuiteEditor]);

  useEffect(() => {
    const disposables: Subscription[] = [];
    const openHandler = () => {
      workbench.openSidebar();
      view.activeSidebarTab('chat');
    };
    disposables.push(
      AIProvider.slots.requestOpenWithChat.subscribe(openHandler)
    );
    disposables.push(
      AIProvider.slots.requestSendWithChat.subscribe(openHandler)
    );
    return () => disposables.forEach(d => d.unsubscribe());
  }, [activeSidebarTab, view, workbench]);

  useEffect(() => {
    if (isActiveView) {
      globalContext.docId.set(doc.id);
      globalContext.isDoc.set(true);

      return () => {
        globalContext.docId.set(null);
        globalContext.isDoc.set(false);
      };
    }
    return;
  }, [doc, globalContext, isActiveView]);

  useEffect(() => {
    if (isActiveView) {
      globalContext.docMode.set(mode);

      return () => {
        globalContext.docMode.set(null);
      };
    }
    return;
  }, [doc, globalContext, isActiveView, mode]);

  useEffect(() => {
    if (isActiveView) {
      globalContext.isTrashDoc.set(!!isInTrash);

      return () => {
        globalContext.isTrashDoc.set(null);
      };
    }
    return;
  }, [globalContext, isActiveView, isInTrash]);

  useRegisterBlocksuiteEditorCommands(editor, isActiveView);

  const onLoad = useCallback(
    (editorContainer: YunkeEditorContainer) => {
      const std = editorContainer.std;
      const disposable = new DisposableGroup();
      if (std) {
        const refNodeSlots = std.getOptional(RefNodeSlotsProvider);
        if (refNodeSlots) {
          disposable.add(
            // 该事件不应由 YunkeReference 发出
            refNodeSlots.docLinkClicked.subscribe(
              ({ pageId, params, openMode, event, host }) => {
                if (host !== editorContainer.host) {
                  return;
                }
                openMode ??=
                  event && isNewTabTrigger(event)
                    ? 'open-in-new-tab'
                    : 'open-in-active-view';

                if (openMode === 'open-in-new-view') {
                  track.doc.editor.toolbar.openInSplitView();
                } else if (openMode === 'open-in-center-peek') {
                  track.doc.editor.toolbar.openInPeekView();
                } else if (openMode === 'open-in-new-tab') {
                  track.doc.editor.toolbar.openInNewTab();
                }

                if (openMode !== 'open-in-center-peek') {
                  const at = (() => {
                    if (openMode === 'open-in-active-view') {
                      return 'active';
                    }
                    // 分屏视图仅在 electron 中支持
                    if (openMode === 'open-in-new-view') {
                      return BUILD_CONFIG.isElectron ? 'tail' : 'new-tab';
                    }
                    if (openMode === 'open-in-new-tab') {
                      return 'new-tab';
                    }
                    return 'active';
                  })();
                  workbench.openDoc(
                    {
                      docId: pageId,
                      mode: params?.mode,
                      blockIds: params?.blockIds,
                      elementIds: params?.elementIds,
                      refreshKey: nanoid(),
                    },
                    {
                      at: at,
                      show: true,
                    }
                  );
                } else {
                  peekView
                    .open({
                      docRef: {
                        docId: pageId,
                      },
                      ...params,
                    })
                    .catch(console.error);
                }
              }
            )
          );
        }
      }

      const unbind = editor.bindEditorContainer(
        editorContainer,
        (editorContainer as any).docTitle, // 从代理设置
        scrollViewportRef.current
      );

      return () => {
        unbind();
        disposable.dispose();
      };
    },
    [editor, workbench, peekView]
  );

  const [hasScrollTop, setHasScrollTop] = useState(false);

  const openOutlinePanel = useCallback(() => {
    workbench.openSidebar();
    view.activeSidebarTab('outline');
  }, [workbench, view]);

  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;

    const hasScrollTop = scrollTop > 0;
    setHasScrollTop(hasScrollTop);
  }, []);

  const [dragging, setDragging] = useState(false);

  const canEdit = useGuard('Doc_Update', doc.id);

  const readonly = !canEdit || isInTrash;

  return (
    <FrameworkScope scope={editor.scope}>
      <ViewHeader>
        <DetailPageHeader
          page={doc.blockSuiteDoc}
          workspace={workspace}
          onDragging={setDragging}
        />
      </ViewHeader>
      <ViewBody>
        <div
          className={styles.mainContainer}
          data-dynamic-top-border={BUILD_CONFIG.isElectron}
          data-has-scroll-top={hasScrollTop}
        >
          {/* Add a key to force rerender when page changed, to avoid error boundary persisting. */}
          <YunkeErrorBoundary key={doc.id}>
            <TopTip pageId={doc.id} workspace={workspace} />
            {/* 云存储状态指示器 - 只在文档编辑页面显示 */}
            <SaveStatusIndicator />
            <Scrollable.Root>
              <Scrollable.Viewport
                onScroll={handleScroll}
                ref={scrollViewportRef}
                data-dragging={dragging}
                className={clsx(
                  'yunke-page-viewport',
                  styles.yunkeDocViewport,
                  styles.editorContainer
                )}
              >
                <PageDetailEditor onLoad={onLoad} readonly={readonly} />
              </Scrollable.Viewport>
              <Scrollable.Scrollbar
                className={clsx({
                  [styles.scrollbar]: !appSettings.clientBorder,
                })}
              />
            </Scrollable.Root>
            <EditorOutlineViewer
              editor={editorContainer?.host ?? null}
              show={mode === 'page'}
              openOutlinePanel={openOutlinePanel}
            />
            {mode === 'page' && <BlockCommandsSidebar />}
          </YunkeErrorBoundary>
          {isInTrash ? <TrashPageFooter /> : null}
        </div>
      </ViewBody>

      {enableAI && (
        <ViewSidebarTab
          tabId="chat"
          icon={<AiIcon />}
          unmountOnInactive={false}
        >
          <EditorChatPanel editor={editorContainer} ref={chatPanelRef} />
        </ViewSidebarTab>
      )}

      <ViewSidebarTab tabId="properties" icon={<PropertyIcon />}>
        <Scrollable.Root className={styles.sidebarScrollArea}>
          <Scrollable.Viewport>
            <WorkspacePropertySidebar />
          </Scrollable.Viewport>
          <Scrollable.Scrollbar />
        </Scrollable.Root>
      </ViewSidebarTab>

      <ViewSidebarTab tabId="journal" icon={<TodayIcon />}>
        <Scrollable.Root className={styles.sidebarScrollArea}>
          <Scrollable.Viewport>
            <EditorJournalPanel />
          </Scrollable.Viewport>
          <Scrollable.Scrollbar />
        </Scrollable.Root>
      </ViewSidebarTab>

      <ViewSidebarTab tabId="outline" icon={<TocIcon />}>
        <Scrollable.Root className={styles.sidebarScrollArea}>
          <Scrollable.Viewport>
            <EditorOutlinePanel editor={editorContainer?.host ?? null} />
          </Scrollable.Viewport>
          <Scrollable.Scrollbar />
        </Scrollable.Root>
      </ViewSidebarTab>

      <ViewSidebarTab tabId="frame" icon={<FrameIcon />}>
        <Scrollable.Root className={styles.sidebarScrollArea}>
          <Scrollable.Viewport>
            <EditorFramePanel editor={editorContainer?.host ?? null} />
          </Scrollable.Viewport>
          <Scrollable.Scrollbar />
        </Scrollable.Root>
      </ViewSidebarTab>

      {enableAdapterPanel && (
        <ViewSidebarTab tabId="adapter" icon={<ExportIcon />}>
          <Scrollable.Root className={styles.sidebarScrollArea}>
            <Scrollable.Viewport>
              <EditorAdapterPanel host={editorContainer?.host ?? null} />
            </Scrollable.Viewport>
          </Scrollable.Root>
        </ViewSidebarTab>
      )}

      <GlobalPageHistoryModal />
      {/* FIXME: wait for better ai, <PageAIOnboarding /> */}
    </FrameworkScope>
  );
});

export const Component = () => {
  const params = useParams();
  const recentPages = useService(RecentDocsService);

  useEffect(() => {
    if (params.pageId) {
      const pageId = params.pageId;
      localStorage.setItem('last_page_id', pageId);
      recentPages.addRecentDoc(pageId);
    }
  }, [params, recentPages]);

  const pageId = params.pageId;
  const canAccess = useGuard('Doc_Read', pageId ?? '');

  return pageId ? (
    <DetailPageWrapper
      pageId={pageId}
      canAccess={canAccess}
      skeleton={<PageDetailLoading />}
      notFound={<PageNotFound noPermission />}
    >
      <DetailPageImpl />
    </DetailPageWrapper>
  ) : null;
};
