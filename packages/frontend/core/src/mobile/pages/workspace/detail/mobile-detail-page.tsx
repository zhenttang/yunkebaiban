import { useThemeColorV2 } from '@yunke/component';
import { PageDetailLoading } from '@yunke/component/page-detail-skeleton';
import type { AffineEditorContainer } from '@yunke/core/blocksuite/block-suite-editor';
import { AffineErrorBoundary } from '@yunke/core/components/affine/affine-error-boundary';
import { useGuard } from '@yunke/core/components/guard';
import { useActiveBlocksuiteEditor } from '@yunke/core/components/hooks/use-block-suite-editor';
import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { PageDetailEditor } from '@yunke/core/components/page-detail-editor';
import { DetailPageWrapper } from '@yunke/core/desktop/pages/workspace/detail-page/detail-page-wrapper';
import { PageHeader, StylusIndicator } from '@yunke/core/mobile/components';
import { useGlobalEvent } from '@yunke/core/mobile/hooks/use-global-events';
import { useStylusPalmRejection } from '@yunke/core/mobile/hooks/use-stylus-palm-rejection';
import { AIButtonService } from '@yunke/core/modules/ai-button';
import { ServerService } from '@yunke/core/modules/cloud';
import { DocService } from '@yunke/core/modules/doc';
import { DocDisplayMetaService } from '@yunke/core/modules/doc-display-meta';
import { EditorService } from '@yunke/core/modules/editor';
import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { GlobalContextService } from '@yunke/core/modules/global-context';
import { JournalService } from '@yunke/core/modules/journal';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { ViewService } from '@yunke/core/modules/workbench/services/view';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { i18nTime } from '@yunke/i18n';
import { DisposableGroup } from '@blocksuite/yunke/global/disposable';
import { RefNodeSlotsProvider } from '@blocksuite/yunke/inlines/reference';
import {
  customImageProxyMiddleware,
  ImageProxyService,
} from '@blocksuite/yunke/shared/adapters';
import {
  FrameworkScope,
  useLiveData,
  useService,
  useServices,
} from '@toeverything/infra';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { JournalConflictBlock } from './journal-conflict-block';
import { JournalDatePicker } from './journal-date-picker';
import * as styles from './mobile-detail-page.css';
import { PageHeaderMenuButton } from './page-header-more-button';
import { PageHeaderShareButton } from './page-header-share-button';

const DetailPageImpl = () => {
  const {
    editorService,
    docService,
    workspaceService,
    globalContextService,
    featureFlagService,
    aIButtonService,
  } = useServices({
    WorkbenchService,
    ViewService,
    EditorService,
    DocService,
    WorkspaceService,
    GlobalContextService,
    FeatureFlagService,
    AIButtonService,
  });
  const editor = editorService.editor;
  const workspace = workspaceService.workspace;
  const docCollection = workspace.docCollection;
  const globalContext = globalContextService.globalContext;
  
  // 防御性检查：确保doc存在
  let doc;
  try {
    doc = docService.doc;
  } catch (error) {
    console.error('❌ [MobileDetailPage] 无法获取文档:', error);
    // 如果无法获取doc，显示错误页面或加载状态
    return <PageDetailLoading />;
  }

  const mode = useLiveData(editor.mode$);

  const isInTrash = useLiveData(doc.meta$.map(meta => meta?.trash ?? false));
  const { openPage, jumpToPageBlock } = useNavigateHelper();
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  // 启用触控笔防误触（只在白板模式下）
  const isEdgelessMode = mode === 'edgeless';
  const palmRejectionState = useStylusPalmRejection({
    enabled: isEdgelessMode && !isInTrash,
    timeout: 2000, // 2秒超时（更快响应）
    forceExitTouchCount: 3, // 连续3次手指触摸强制退出
    debug: BUILD_CONFIG.debug, // 生产环境关闭调试
    onStylusDetected: (isStylus) => {
      if (BUILD_CONFIG.debug) {
        console.log('✍️ [Whiteboard] 触控笔检测:', isStylus);
      }
    },
    onTouchRejected: () => {
      if (BUILD_CONFIG.debug) {
        console.log('🚫 [Whiteboard] 拦截手指误触');
      }
    },
  });

  const editorContainer = useLiveData(editor.editorContainer$);

  const enableKeyboardToolbar =
    featureFlagService?.flags?.enable_mobile_keyboard_toolbar?.value || false;
  const enableEdgelessEditing =
    featureFlagService?.flags?.enable_mobile_edgeless_editing?.value || false;
  const enableAIButton = useLiveData(
    featureFlagService?.flags?.enable_mobile_ai_button?.$ || null
  );

  // TODO(@eyhn): remove jotai here
  const [_, setActiveBlockSuiteEditor] = useActiveBlocksuiteEditor();

  useEffect(() => {
    setActiveBlockSuiteEditor(editorContainer);
  }, [editorContainer, setActiveBlockSuiteEditor]);

  useEffect(() => {
    globalContext.docId.set(doc.id);
    globalContext.isDoc.set(true);

    return () => {
      globalContext.docId.set(null);
      globalContext.isDoc.set(false);
    };
  }, [doc, globalContext]);

  useEffect(() => {
    globalContext.docMode.set(mode);

    return () => {
      globalContext.docMode.set(null);
    };
  }, [doc, globalContext, mode]);

  useEffect(() => {
    if (!enableAIButton) return;
    aIButtonService.presentAIButton(true);

    return () => {
      aIButtonService.presentAIButton(false);
    };
  }, [aIButtonService, enableAIButton]);

  useEffect(() => {
    globalContext.isTrashDoc.set(!!isInTrash);

    return () => {
      globalContext.isTrashDoc.set(null);
    };
  }, [globalContext, isInTrash]);

  const server = useService(ServerService).server;

  const onLoad = useCallback(
    (editorContainer: AffineEditorContainer) => {
      // provide image proxy endpoint to blocksuite
      const imageProxyUrl = new URL(
        BUILD_CONFIG.imageProxyUrl,
        server.baseUrl
      ).toString();

      editorContainer.std.clipboard.use(
        customImageProxyMiddleware(imageProxyUrl)
      );
      editorContainer.doc
        .get(ImageProxyService)
        .setImageProxyURL(imageProxyUrl);

      // provide page mode and updated date to blocksuite
      const refNodeService =
        editorContainer.std.getOptional(RefNodeSlotsProvider);
      const disposable = new DisposableGroup();
      if (refNodeService) {
        disposable.add(
          refNodeService.docLinkClicked.subscribe(({ pageId, params }) => {
            if (params) {
              const { mode, blockIds, elementIds } = params;
              return jumpToPageBlock(
                docCollection.id,
                pageId,
                mode,
                blockIds,
                elementIds
              );
            }

            return openPage(docCollection.id, pageId);
          })
        );
      }

      editor.bindEditorContainer(
        editorContainer,
        (editorContainer as any).docTitle, // set from proxy
        scrollViewportRef.current
      );

      return () => {
        disposable.dispose();
      };
    },
    [docCollection.id, editor, jumpToPageBlock, openPage, server]
  );

  const canEdit = useGuard('Doc_Update', doc.id);

  const readonly =
    !canEdit ||
    isInTrash ||
    !enableKeyboardToolbar ||
    (mode === 'edgeless' && !enableEdgelessEditing);

  return (
    <FrameworkScope scope={editor.scope}>
      <div className={styles.mainContainer}>
        <div
          data-mode={mode}
          ref={scrollViewportRef}
          className={clsx(
            'affine-page-viewport',
            styles.affineDocViewport,
            styles.editorContainer
          )}
        >
          {/* Add a key to force rerender when page changed, to avoid error boundary persisting. */}
          <AffineErrorBoundary key={doc.id} className={styles.errorBoundary}>
            <PageDetailEditor onLoad={onLoad} readonly={readonly} />
          </AffineErrorBoundary>
        </div>
        
        {/* 触控笔状态指示器 - 仅在白板模式下显示 */}
        {isEdgelessMode && !isInTrash && (
          <StylusIndicator 
            enabled={true}
            position="bottom-right"
            showDetails={false}
          />
        )}
      </div>
    </FrameworkScope>
  );
};

const getSkeleton = (back: boolean) => (
  <>
    <PageHeader back={back} className={styles.header} />
    <PageDetailLoading />
  </>
);
const getNotFound = (back: boolean) => (
  <>
    <PageHeader back={back} className={styles.header} />
    Page Not Found (TODO)
  </>
);
const skeleton = getSkeleton(false);
const skeletonWithBack = getSkeleton(true);
const notFound = getNotFound(false);
const notFoundWithBack = getNotFound(true);

const checkShowTitle = () => window.scrollY >= 158;

const MobileDetailPage = ({
  pageId,
  date,
}: {
  pageId: string;
  date?: string;
}) => {
  const docDisplayMetaService = useService(DocDisplayMetaService);
  const journalService = useService(JournalService);
  const workbench = useService(WorkbenchService).workbench;
  const [showTitle, setShowTitle] = useState(checkShowTitle);
  const title = useLiveData(docDisplayMetaService.title$(pageId));

  const canAccess = useGuard('Doc_Read', pageId);

  const allJournalDates = useLiveData(journalService.allJournalDates$);

  const location = useLiveData(workbench.location$);
  const fromTab = location.search.includes('fromTab');

  const handleDateChange = useCallback(
    (date: string) => {
      const docId = journalService.ensureJournalByDate(date).id;
      workbench.openDoc(
        { docId, fromTab: fromTab ? 'true' : undefined },
        { replaceHistory: true }
      );
    },
    [fromTab, journalService, workbench]
  );

  useGlobalEvent(
    'scroll',
    useCallback(() => setShowTitle(checkShowTitle()), [])
  );

  return (
    <div className={styles.root}>
      <DetailPageWrapper
        skeleton={date ? skeleton : skeletonWithBack}
        notFound={date ? notFound : notFoundWithBack}
        pageId={pageId}
        canAccess={canAccess}
      >
        <PageHeader
          back={!fromTab}
          className={styles.header}
          contentClassName={styles.headerContent}
          suffix={
            <>
              <PageHeaderShareButton />
              <PageHeaderMenuButton />
            </>
          }
          bottom={
            date ? (
              <JournalDatePicker
                date={date}
                onChange={handleDateChange}
                withDotDates={allJournalDates}
                className={styles.journalDatePicker}
              />
            ) : null
          }
          bottomSpacer={94}
        >
          <span data-show={!!date || showTitle} className={styles.headerTitle}>
            {date
              ? i18nTime(dayjs(date), { absolute: { accuracy: 'month' } })
              : title}
          </span>
        </PageHeader>
        <JournalConflictBlock date={date} />
        <DetailPageImpl />
        {/* Tabs moved to workspace layout to avoid remount flicker */}
      </DetailPageWrapper>
    </div>
  );
};

export const Component = () => {
  useThemeColorV2('layer/background/primary');
  const journalService = useService(JournalService);
  const params = useParams();
  const pageId = params.pageId;
  const journalDate = useLiveData(journalService.journalDate$(pageId ?? ''));

  if (!pageId) {
    return null;
  }

  return <MobileDetailPage pageId={pageId} date={journalDate} />;
};
