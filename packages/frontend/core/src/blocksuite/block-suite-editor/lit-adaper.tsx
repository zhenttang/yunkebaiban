// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import 'katex/dist/katex.min.css';

import '@yunke/core/blocksuite/utils/performance-monitor';
import '@yunke/core/blocksuite/utils/edgeless-performance-monitor';
import { useConfirmModal, useLitPortalFactory } from '@yunke/component';
import {
  type EdgelessEditor,
  LitDocEditor,
  LitDocTitle,
  LitEdgelessEditor,
  type PageEditor,
} from '@yunke/core/blocksuite/editors';
import { getViewManager } from '@yunke/core/blocksuite/manager/view';
import { useEnableAI } from '@yunke/core/components/hooks/yunke/use-enable-ai';
import type { DocCustomPropertyInfo } from '@yunke/core/modules/db';
import type {
  DatabaseRow,
  DatabaseValueCell,
} from '@yunke/core/modules/doc-info/types';
import { EditorSettingService } from '@yunke/core/modules/editor-setting';
import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { JournalService } from '@yunke/core/modules/journal';
import { useInsidePeekView } from '@yunke/core/modules/peek-view';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import track from '@yunke/track';
import type { DocTitle } from '@blocksuite/yunke/fragments/doc-title';
import type { DocMode } from '@blocksuite/yunke/model';
import type { Store } from '@blocksuite/yunke/store';
import {
  useFramework,
  useLiveData,
  useService,
  useServices,
} from '@toeverything/infra';
import type React from 'react';
import {
  forwardRef,
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  type DefaultOpenProperty,
  WorkspacePropertiesTable,
} from '../../components/properties';
import { BiDirectionalLinkPanel } from './bi-directional-link-panel';
import { BlocksuiteEditorJournalDocTitle } from './journal-doc-title';
import { StarterBar } from './starter-bar';
import * as styles from './styles.css';

interface BlocksuiteEditorProps {
  page: Store;
  readonly?: boolean;
  shared?: boolean;
  defaultOpenProperty?: DefaultOpenProperty;
}

const usePatchSpecs = (mode: DocMode) => {
  const [reactToLit, portals] = useLitPortalFactory();
  const { workspaceService, featureFlagService } = useServices({
    WorkspaceService,
    FeatureFlagService,
  });
  const isCloud = workspaceService.workspace.flavour !== 'local';
  const framework = useFramework();

  const confirmModal = useConfirmModal();

  const enableAI = useEnableAI();

  const isInPeekView = useInsidePeekView();

  const enableTurboRenderer = useLiveData(
    featureFlagService.flags.enable_turbo_renderer.$
  );

  const enablePDFEmbedPreview = useLiveData(
    featureFlagService.flags.enable_pdf_embed_preview.$
  );

  const patchedSpecs = useMemo(() => {
    performance.mark('specs-start');
    const manager = getViewManager()
      .config.init()
      .foundation(framework)
      .ai(enableAI, framework)
      .theme(framework)
      .editorConfig(framework)
      .editorView({
        framework,
        reactToLit,
        confirmModal,
      })
      .cloud(framework, isCloud)
      .turboRenderer(enableTurboRenderer)
      .pdf(enablePDFEmbedPreview, reactToLit)
      .edgelessBlockHeader({
        framework,
        isInPeekView,
        reactToLit,
      })
      .database(framework)
      .linkedDoc(framework)
      .paragraph(enableAI)
      .mobile(framework)
      .electron(framework)
      .linkPreview(framework)
      .codeBlockHtmlPreview(framework).value;

    if (BUILD_CONFIG.isMobileEdition) {
      if (mode === 'page') {
        performance.mark('specs-end');
        performance.measure('usePatchSpecs-mobile-page', 'specs-start', 'specs-end');
        return manager.get('mobile-page');
      } else {
        performance.mark('specs-end');
        performance.measure('usePatchSpecs-mobile-edgeless', 'specs-start', 'specs-end');
        return manager.get('mobile-edgeless');
      }
    } else {
      performance.mark('specs-end');
      performance.measure(`usePatchSpecs-${mode}`, 'specs-start', 'specs-end');
      return manager.get(mode);
    }
  }, [
    confirmModal,
    enableAI,
    enablePDFEmbedPreview,
    enableTurboRenderer,
    framework,
    isInPeekView,
    isCloud,
    mode,
    reactToLit,
  ]);

  return [
    patchedSpecs,
    useMemo(
      () => (
        <>
          {portals.map(p => (
            <Fragment key={p.id}>{p.portal}</Fragment>
          ))}
        </>
      ),
      [portals]
    ),
  ] as const;
};

export const BlocksuiteDocEditor = forwardRef<
  PageEditor,
  BlocksuiteEditorProps & {
    onClickBlank?: () => void;
    titleRef?: React.Ref<DocTitle>;
  }
>(function BlocksuiteDocEditor(
  {
    page,
    shared,
    onClickBlank,
    titleRef: externalTitleRef,
    defaultOpenProperty,
    readonly,
  },
  ref
) {
  const titleRef = useRef<DocTitle | null>(null);
  const docRef = useRef<PageEditor | null>(null);
  const journalService = useService(JournalService);
  const isJournal = !!useLiveData(journalService.journalDate$(page.id));

  const editorSettingService = useService(EditorSettingService);

  const onDocRef = useCallback(
    (el: PageEditor) => {
      docRef.current = el;
      if (ref) {
        if (typeof ref === 'function') {
          ref(el);
        } else {
          ref.current = el;
        }
      }
    },
    [ref]
  );

  const onTitleRef = useCallback(
    (el: DocTitle) => {
      titleRef.current = el;
      if (externalTitleRef) {
        if (typeof externalTitleRef === 'function') {
          externalTitleRef(el);
        } else {
          externalTitleRef.current = el;
        }
      }
    },
    [externalTitleRef]
  );

  const [specs, portals] = usePatchSpecs('page');

  const displayBiDirectionalLink = useLiveData(
    editorSettingService.editorSetting.settings$.selector(
      s => s.displayBiDirectionalLink
    )
  );

  const displayDocInfo = useLiveData(
    editorSettingService.editorSetting.settings$.selector(s => s.displayDocInfo)
  );

  const onPropertyChange = useCallback((property: DocCustomPropertyInfo) => {
    track.doc.inlineDocInfo.property.editProperty({
      type: property.type,
    });
  }, []);

  const onPropertyAdded = useCallback((property: DocCustomPropertyInfo) => {
    track.doc.inlineDocInfo.property.addProperty({
      type: property.type,
      control: 'at menu',
    });
  }, []);

  const onDatabasePropertyChange = useCallback(
    (_row: DatabaseRow, cell: DatabaseValueCell) => {
      track.doc.inlineDocInfo.databaseProperty.editProperty({
        type: cell.property.type$.value,
      });
    },
    []
  );

  const onPropertyInfoChange = useCallback(
    (property: DocCustomPropertyInfo, field: string) => {
      track.doc.inlineDocInfo.property.editPropertyMeta({
        type: property.type,
        field,
      });
    },
    []
  );

  return (
    <>
      <div className={styles.yunkeDocViewport}>
        {!isJournal ? (
          <LitDocTitle doc={page} ref={onTitleRef} />
        ) : (
          <BlocksuiteEditorJournalDocTitle page={page} />
        )}
        {!shared && displayDocInfo ? (
          <div className={styles.docPropertiesTableContainer}>
            <WorkspacePropertiesTable
              className={styles.docPropertiesTable}
              onDatabasePropertyChange={onDatabasePropertyChange}
              onPropertyChange={onPropertyChange}
              onPropertyAdded={onPropertyAdded}
              onPropertyInfoChange={onPropertyInfoChange}
              defaultOpenProperty={defaultOpenProperty}
            />
          </div>
        ) : null}
        <LitDocEditor
          className={styles.docContainer}
          ref={onDocRef}
          doc={page}
          specs={specs}
        />
        <div
          className={styles.docEditorGap}
          data-testid="page-editor-blank"
          onClick={onClickBlank}
        ></div>
        {!readonly && !BUILD_CONFIG.isMobileEdition && (
          <StarterBar doc={page} />
        )}
        {!shared && displayBiDirectionalLink ? (
          <BiDirectionalLinkPanel />
        ) : null}
      </div>
      {portals}
    </>
  );
});
const BlocksuiteEdgelessEditorComponent = forwardRef<
  EdgelessEditor,
  BlocksuiteEditorProps
>(function BlocksuiteEdgelessEditor({ page }, ref) {
  const [specs, portals] = usePatchSpecs('edgeless');
  const editorRef = useRef<EdgelessEditor | null>(null);
  const renderCountRef = useRef(0);
  const [isReady, setIsReady] = useState(false);

  // 🔧 确保文档有 surface block，否则 edgeless 模式无法工作
  useEffect(() => {
    const ensureSurfaceBlock = () => {
      try {
        const surfaces = page.getBlocksByFlavour('yunke:surface');
        if (surfaces.length === 0) {
          console.warn('[Edgeless] 文档缺少 surface block，正在创建...');
          // 找到根块
          const rootBlock = page.root;
          if (rootBlock) {
            // 使用事务来添加 surface block
            page.transact(() => {
              page.addBlock('yunke:surface', {}, rootBlock.id);
            });
            console.log('[Edgeless] surface block 创建成功');
          } else {
            console.error('[Edgeless] 无法创建 surface block：找不到根块');
          }
        }
        // 延迟一帧确保 DOM 更新
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      } catch (error) {
        console.error('[Edgeless] 确保 surface block 时出错:', error);
        setIsReady(true); // 仍然尝试渲染
      }
    };

    ensureSurfaceBlock();
  }, [page]);

  useEffect(() => {
    renderCountRef.current++;
    if (renderCountRef.current > 1) {
      console.warn(`⚠️ [Performance] BlocksuiteEdgelessEditor 重新渲染次数: ${renderCountRef.current}`);
    }
  });

  const onDocRef = useCallback(
    (el: EdgelessEditor) => {
      editorRef.current = el;
      if (ref) {
        if (typeof ref === 'function') {
          ref(el);
        } else {
          ref.current = el;
        }
      }
    },
    [ref]
  );

  useEffect(() => {
    if (editorRef.current) {
      performance.mark('edgeless-focus-start');
      editorRef.current.updateComplete
        .then(() => {
          const root = editorRef.current?.querySelector<HTMLElement>('yunke-edgeless-root');
          if (root) {
            root.focus();
            performance.mark('edgeless-focus-end');
            performance.measure('edgeless-focus-init', 'edgeless-focus-start', 'edgeless-focus-end');
          }
        })
        .catch(console.error);
    }
  }, []);

  // 等待 surface block 准备就绪
  if (!isReady) {
    return (
      <div className={styles.yunkeEdgelessDocViewport}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          正在初始化画板...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.yunkeEdgelessDocViewport}>
      <LitEdgelessEditor ref={onDocRef} doc={page} specs={specs} />
      {portals}
    </div>
  );
});

export const BlocksuiteEdgelessEditor = memo(
  BlocksuiteEdgelessEditorComponent,
  (prevProps, nextProps) => {
    return prevProps.page === nextProps.page;
  }
);
