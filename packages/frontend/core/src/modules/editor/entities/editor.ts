import type { YunkeEditorContainer } from '@yunke/core/blocksuite/block-suite-editor';
import type { DefaultOpenProperty } from '@yunke/core/components/properties';
import { Bound } from '@blocksuite/yunke/global/gfx';
import { PresentTool } from '@blocksuite/yunke/blocks/frame';
import { DefaultTool } from '@blocksuite/yunke/blocks/surface';
import type { DocTitle } from '@blocksuite/yunke/fragments/doc-title';
import type { DocMode, ReferenceParams } from '@blocksuite/yunke/model';
import { HighlightSelection } from '@blocksuite/yunke/shared/selection';
import { DocModeProvider } from '@blocksuite/yunke/shared/services';
import { GfxControllerIdentifier } from '@blocksuite/yunke/std/gfx';
import type { InlineEditor } from '@blocksuite/std/inline';
import { effect } from '@preact/signals-core';
import { Entity, LiveData } from '@toeverything/infra';
import { defaults, isEqual, omit } from 'lodash-es';
import { skip } from 'rxjs';

import type { Doc, DocService } from '../../doc';
import { paramsParseOptions, preprocessParams } from '../../navigation/utils';
import type { WorkbenchView } from '../../workbench';
import type { WorkspaceService } from '../../workspace';
import { EditorScope } from '../scopes/editor';
import type { EditorSelector } from '../types';

export class Editor extends Entity {
  readonly scope = this.framework.createScope(EditorScope, {
    editor: this as Editor,
  });

  readonly mode$ = new LiveData<DocMode>('page');
  readonly selector$ = new LiveData<EditorSelector | undefined>(undefined);
  // ✅ 使用 getter 延迟访问 doc，确保 DocScope 已经初始化
  // 如果 DocScope 未初始化，返回 null 而不是抛出错误
  get doc(): Doc | null {
    try {
      return this.docService.doc;
    } catch (error) {
      // DocScope 未初始化，返回 null
      // 调用者应该检查 doc 是否为 null
      if (error instanceof Error && error.message.includes('DocScope')) {
        return null; // 返回 null，等待 DocScope 初始化
      }
      throw error; // 其他错误继续抛出
    }
  }
  readonly isSharedMode =
    this.workspaceService.workspace.openOptions.isSharedMode;
  readonly editorContainer$ = new LiveData<YunkeEditorContainer | null>(null);
  readonly defaultOpenProperty$ = new LiveData<DefaultOpenProperty | undefined>(
    undefined
  );
  workbenchView: WorkbenchView | null = null;
  scrollPosition: {
    page: number | null;
    edgeless: {
      centerX: number;
      centerY: number;
      zoom: number;
    } | null;
  } = {
    page: null,
    edgeless: null,
  };

  private readonly focusAt$ = LiveData.computed(get => {
    const selector = get(this.selector$);
    const mode = get(this.mode$);
    let id = selector?.blockIds?.[0];
    let key = 'blockIds';

    if (mode === 'edgeless') {
      const elementId = selector?.elementIds?.[0];
      if (elementId) {
        id = elementId;
        key = 'elementIds';
      }
    }

    if (!id) return null;

    return { id, key, mode, refreshKey: selector?.refreshKey };
  });

  isPresenting$ = new LiveData<boolean>(false);

  togglePresentation() {
    const gfx = this.editorContainer$.value?.host?.std.get(
      GfxControllerIdentifier
    );
    if (!gfx) return;
    if (!this.isPresenting$.value) {
      gfx.tool.setTool(PresentTool);
    } else {
      gfx.tool.setTool(DefaultTool);
    }
  }

  setSelector(selector: EditorSelector | undefined) {
    this.selector$.next(selector);
  }

  toggleMode() {
    this.mode$.next(this.mode$.value === 'edgeless' ? 'page' : 'edgeless');
  }

  setMode(mode: DocMode) {
    this.mode$.next(mode);
  }

  setDefaultOpenProperty(defaultOpenProperty: DefaultOpenProperty | undefined) {
    this.defaultOpenProperty$.next(defaultOpenProperty);
  }

  /**
   * sync editor params with view query string
   *
   * this function will be called when editor is initialized with in a workbench view
   *
   * this won't be called in shared page.
   */
  bindWorkbenchView(view: WorkbenchView) {
    if (this.workbenchView) {
      console.warn('[Editor] bindWorkbenchView: 已绑定，返回空的清理函数');
      return () => {}; // 返回空的清理函数
    }
    this.workbenchView = view;
    const savedScrollPosition = view.getScrollPosition() ?? null;
    if (typeof savedScrollPosition === 'number') {
      this.scrollPosition.page = savedScrollPosition;
    } else if (typeof savedScrollPosition === 'object') {
      this.scrollPosition.edgeless = savedScrollPosition;
    }

    const stablePrimaryMode = this.doc?.getPrimaryMode() || null;

    const viewParams$ = view
      .queryString$<ReferenceParams & { refreshKey?: string }>(
        paramsParseOptions
      )
      .map(preprocessParams)
      .map(params =>
        defaults(params, {
          mode: stablePrimaryMode || ('page' as DocMode),
        })
      );

    const editorParams$ = LiveData.computed(get => {
      return {
        mode: get(this.mode$),
        ...get(this.selector$),
      };
    });

    // prevent infinite loop
    let updating = false;

    const unsubscribeViewParams = viewParams$.subscribe(params => {
      if (updating) return;
      updating = true;
      // when view params changed, sync to editor
      try {
        const editorParams = editorParams$.value;
        if (params.mode !== editorParams.mode) {
          this.setMode(params.mode);
        }

        const selector = omit(params, ['mode']);
        if (!isEqual(selector, omit(editorParams, ['mode']))) {
          this.setSelector(selector);
        }
      } finally {
        updating = false;
      }
    });

    const unsubscribeEditorParams = editorParams$.subscribe(params => {
      if (updating) return;
      updating = true;
      try {
        // when editor params changed, sync to view
        if (!isEqual(params, viewParams$.value)) {
          const newQueryString: Record<string, string> = {};

          Object.entries(params).forEach(([k, v]) => {
            newQueryString[k] = Array.isArray(v) ? v.join(',') : v;
          });

          view.updateQueryString(newQueryString, { replace: true });
        }
      } finally {
        updating = false;
      }
    });

    return () => {
      this.workbenchView = null;
      unsubscribeEditorParams.unsubscribe();
      unsubscribeViewParams.unsubscribe();
    };
  }

  bindEditorContainer(
    editorContainer: YunkeEditorContainer,
    docTitle?: DocTitle | null,
    scrollViewport?: HTMLElement | null
  ) {
    if (this.editorContainer$.value) {
      console.warn('[Editor] bindEditorContainer: 已绑定，清理之前的绑定后重新绑定');
      // 清理之前的绑定
      this.editorContainer$.next(null);
    }

    this.editorContainer$.next(editorContainer);
    const unsubs: (() => void)[] = [];

    const gfx = editorContainer.host?.std.get(GfxControllerIdentifier);

    // ----- Scroll Position and Selection -----
    // if we have default scroll position, we should restore it
    if (this.mode$.value === 'page' && this.scrollPosition.page !== null) {
      scrollViewport?.scrollTo(0, this.scrollPosition.page);
    } else if (
      this.mode$.value === 'edgeless' &&
      this.scrollPosition.edgeless &&
      gfx
    ) {
      gfx.viewport.setViewport(this.scrollPosition.edgeless.zoom, [
        this.scrollPosition.edgeless.centerX,
        this.scrollPosition.edgeless.centerY,
      ]);
    } else {
      // if we don't have default scroll position, we should focus on the title
      const initialFocusAt = this.focusAt$.value;

      if (initialFocusAt === null) {
        const title = docTitle?.querySelector<
          HTMLElement & { inlineEditor: InlineEditor | null }
        >('rich-text');
        // Only focus on the title when it's empty on mobile edition.
        if (BUILD_CONFIG.isMobileEdition) {
          const titleText = this.doc?.title$.value;
          if (!titleText?.length) {
            title?.inlineEditor?.focusEnd();
          }
        } else {
          title?.inlineEditor?.focusEnd();
        }
      } else {
        const selection = editorContainer.host?.std.selection;

        const { id, key, mode } = initialFocusAt;

        if (mode === this.mode$.value) {
          selection?.setGroup('scene', [
            selection?.create(HighlightSelection, {
              mode,
              [key]: [id],
            }),
          ]);
        }
      }
    }

    // update scroll position when scrollViewport scroll
    const saveScrollPosition = () => {
      if (this.mode$.value === 'page' && scrollViewport) {
        this.scrollPosition.page = scrollViewport.scrollTop;
        this.workbenchView?.setScrollPosition(scrollViewport.scrollTop);
      } else if (this.mode$.value === 'edgeless' && gfx) {
        const pos = {
          centerX: gfx.viewport.centerX,
          centerY: gfx.viewport.centerY,
          zoom: gfx.viewport.zoom,
        };
        this.scrollPosition.edgeless = pos;
        this.workbenchView?.setScrollPosition(pos);
      }
    };
    scrollViewport?.addEventListener('scroll', saveScrollPosition, { passive: true });
    unsubs.push(() => {
      scrollViewport?.removeEventListener('scroll', saveScrollPosition);
    });
    if (gfx) {
      const subscription =
        gfx.viewport.viewportUpdated.subscribe(saveScrollPosition);
      unsubs.push(subscription.unsubscribe.bind(subscription));
    }

    // update selection when focusAt$ changed
    const subscription = this.focusAt$
      .distinctUntilChanged(
        (a, b) =>
          a?.id === b?.id &&
          a?.key === b?.key &&
          a?.refreshKey === b?.refreshKey
      )
      .pipe(skip(1))
      .subscribe(anchor => {
        if (!anchor) return;

        const selection = editorContainer.host?.std.selection;
        if (!selection) return;

        const { id, key, mode } = anchor;

        selection.setGroup('scene', [
          selection.create(HighlightSelection, {
            mode,
            [key]: [id],
          }),
        ]);

        // 在 Edgeless 模式下，需要额外移动 viewport 到选中的块
        if (mode === 'edgeless' && gfx) {
          // 等待一帧，确保选择已经生效
          requestAnimationFrame(() => {
            try {
              // 获取被选中的块
              const doc = editorContainer.host?.doc;
              const block = doc?.getBlock?.(id);
              
              if (block?.model?.xywh) {
                const bound = Bound.deserialize(block.model.xywh);
                
                // 使用 surface 的 fitToViewport 方法，这是 YUNKE 的标准方式
                const surface = editorContainer.host?.querySelector('yunke-surface');
                if (surface && typeof surface.fitToViewport === 'function') {
                  surface.fitToViewport(bound);
                } else {
                  // 如果没有 surface，直接使用 viewport API
                  gfx.viewport.setViewportByBound(bound, [50, 50, 50, 50], true);
                }
              }
            } catch (error) {
              console.error('[Editor] Error moving viewport:', error);
            }
          });
        }
      });
    unsubs.push(subscription.unsubscribe.bind(subscription));

    // ----- Presenting -----
    const std = editorContainer.host?.std;
    const editorMode = std?.get(DocModeProvider)?.getEditorMode();
    if (!editorMode || editorMode !== 'edgeless' || !gfx) {
      this.isPresenting$.next(false);
    } else {
      this.isPresenting$.next(
        gfx.tool.currentToolName$.peek() === 'frameNavigator'
      );

      const disposable = effect(() => {
        this.isPresenting$.next(
          gfx.tool.currentToolName$.value === 'frameNavigator'
        );
      });
      unsubs.push(disposable);
    }

    return () => {
      this.editorContainer$.next(null);
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }

  constructor(
    private readonly docService: DocService,
    private readonly workspaceService: WorkspaceService
  ) {
    super();
  }
}
