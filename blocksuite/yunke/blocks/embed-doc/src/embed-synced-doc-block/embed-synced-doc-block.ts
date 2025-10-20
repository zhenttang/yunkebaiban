import {
  EmbedBlockComponent,
  isEmptyDoc,
} from '@blocksuite/yunke-block-embed';
import { Peekable } from '@blocksuite/yunke-components/peek';
import { ViewExtensionManagerIdentifier } from '@blocksuite/yunke-ext-loader';
import {
  type DocLinkClickedEvent,
  RefNodeSlotsProvider,
} from '@blocksuite/yunke-inline-reference';
import {
  type AliasInfo,
  type DocMode,
  type EmbedSyncedDocModel,
  NoteDisplayMode,
  type ReferenceInfo,
} from '@blocksuite/yunke-model';
import { REFERENCE_NODE } from '@blocksuite/yunke-shared/consts';
import {
  DocDisplayMetaProvider,
  DocModeProvider,
  EditorSettingExtension,
  EditorSettingProvider,
  GeneralSettingSchema,
  ThemeExtensionIdentifier,
  ThemeProvider,
} from '@blocksuite/yunke-shared/services';
import { cloneReferenceInfo } from '@blocksuite/yunke-shared/utils';
import { Bound, getCommonBound } from '@blocksuite/global/gfx';
import {
  BlockSelection,
  BlockStdScope,
  type EditorHost,
  LifeCycleWatcher,
} from '@blocksuite/std';
import { GfxControllerIdentifier, GfxExtension } from '@blocksuite/std/gfx';
import { type GetStoreOptions, type Query, Text } from '@blocksuite/store';
import { computed, signal } from '@preact/signals-core';
import { html, nothing, type PropertyValues } from 'lit';
import { query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { guard } from 'lit/directives/guard.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';
import * as Y from 'yjs';

import type { EmbedSyncedDocCard } from './components/embed-synced-doc-card.js';
import { blockStyles } from './styles.js';

@Peekable({
  enableOn: ({ store }: EmbedSyncedDocBlockComponent) => !store.readonly,
})
export class EmbedSyncedDocBlockComponent extends EmbedBlockComponent<EmbedSyncedDocModel> {
  static override styles = blockStyles;

  // Caches total bounds, includes all blocks and elements.
  private _cachedBounds: Bound | null = null;

  private readonly _initEdgelessFitEffect = () => {
    const fitToContent = () => {
      if (this.isPageMode) return;

      const controller = this.syncedDocEditorHost?.std.getOptional(
        GfxControllerIdentifier
      );
      if (!controller) return;

      const viewport = controller.viewport;
      if (!viewport) return;

      if (!this._cachedBounds) {
        this._cachedBounds = getCommonBound([
          ...controller.layer.blocks.map(block =>
            Bound.deserialize(block.xywh)
          ),
          ...controller.layer.canvasElements,
        ]);
      }

      viewport.onResize();

      const { centerX, centerY, zoom } = viewport.getFitToScreenData(
        this._cachedBounds
      );
      viewport.setCenter(centerX, centerY);
      viewport.setZoom(zoom);
    };

    const observer = new ResizeObserver(fitToContent);
    const block = this.embedBlock;

    observer.observe(block);

    this._disposables.add(() => {
      observer.disconnect();
    });

    this.syncedDocEditorHost?.updateComplete
      .then(() => fitToContent())
      .catch(() => {});
  };

  private readonly _pageFilter: Query = {
    mode: 'loose',
    match: [
      {
        flavour: 'yunke:note',
        props: {
          displayMode: NoteDisplayMode.EdgelessOnly,
        },
        viewType: 'hidden',
      },
    ],
  };

  protected _buildPreviewSpec = (name: 'preview-page' | 'preview-edgeless') => {
    const nextDepth = this.depth + 1;
    const viewExtensionManager = this.std.get(ViewExtensionManagerIdentifier);
    const previewSpec = viewExtensionManager.get(name);
    const currentDisposables = this.disposables;
    const editorSetting = this.std.getOptional(EditorSettingProvider) ?? {
      setting$: signal(GeneralSettingSchema.parse({})),
    };

    class EmbedSyncedDocWatcher extends LifeCycleWatcher {
      static override key = 'embed-synced-doc-watcher';

      override mounted(): void {
        const { view } = this.std;
        view.viewUpdated.subscribe(payload => {
          if (
            payload.type !== 'block' ||
            payload.view.model.flavour !== 'yunke:embed-synced-doc'
          ) {
            return;
          }
          const nextComponent = payload.view as EmbedSyncedDocBlockComponent;
          if (payload.method === 'add') {
            nextComponent.depth = nextDepth;
            currentDisposables.add(() => {
              nextComponent.depth = 0;
            });
            return;
          }
          if (payload.method === 'delete') {
            nextComponent.depth = 0;
            return;
          }
        });
      }
    }

    class GfxViewportInitializer extends GfxExtension {
      static override key = 'gfx-viewport-initializer';

      override mounted(): void {
        this.gfx.fitToScreen();
      }
    }

    return previewSpec.concat([
      EmbedSyncedDocWatcher,
      GfxViewportInitializer,
      EditorSettingExtension(editorSetting),
    ]);
  };

  protected _renderSyncedView = () => {
    const syncedDoc = this.syncedDoc;
    const editorMode = this.editorMode;
    const isPageMode = this.isPageMode;

    if (!syncedDoc) {
      console.error('未找到同步文档');
      return html`${nothing}`;
    }

    if (isPageMode) {
      this.dataset.pageMode = '';
    }

    const containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
    });

    const themeService = this.std.get(ThemeProvider);
    const themeExtension = this.std.getOptional(ThemeExtensionIdentifier);
    const appTheme = themeService.app$.value;
    let edgelessTheme = themeService.edgeless$.value;
    if (themeExtension?.getEdgelessTheme && this.syncedDoc?.id) {
      edgelessTheme = themeExtension.getEdgelessTheme(this.syncedDoc.id).value;
    }
    const theme = isPageMode ? appTheme : edgelessTheme;

    this.dataset.nestedEditor = '';

    const renderEditor = () => {
      return choose(editorMode, [
        [
          'page',
          () => html`
            <div class="yunke-page-viewport" data-theme=${appTheme}>
              ${new BlockStdScope({
                store: syncedDoc,
                extensions: this._buildPreviewSpec('preview-page'),
              }).render()}
            </div>
          `,
        ],
        [
          'edgeless',
          () => html`
            <div class="yunke-edgeless-viewport" data-theme=${edgelessTheme}>
              ${new BlockStdScope({
                store: syncedDoc,
                extensions: this._buildPreviewSpec('preview-edgeless'),
              }).render()}
            </div>
          `,
        ],
      ]);
    };

    return this.renderEmbed(
      () => html`
        <div
          class=${classMap({
            'yunke-embed-synced-doc-container': true,
            [editorMode]: true,
            [theme]: true,
            surface: false,
            selected: this.selected$.value,
            'show-hover-border': true,
          })}
          @click=${this._handleClick}
          style=${containerStyleMap}
          ?data-scale=${undefined}
        >
          <div class="yunke-embed-synced-doc-editor">
            ${isPageMode && this._isEmptySyncedDoc
              ? html`
                  <div class="yunke-embed-synced-doc-editor-empty">
                    <span>
                      这是一个链接文档，您可以在此处添加内容。
                    </span>
                  </div>
                `
              : guard(
                  [editorMode, syncedDoc, appTheme, edgelessTheme],
                  renderEditor
                )}
          </div>
          <div
            class=${classMap({
              'yunke-embed-synced-doc-header-wrapper': true,
              selected: this.selected$.value,
            })}
          >
            <div class="yunke-embed-synced-doc-header">
              <span class="yunke-embed-synced-doc-icon"
                >${this.icon$.value}</span
              >
              <span class="yunke-embed-synced-doc-title">${this.title$}</span>
            </div>
          </div>
        </div>
      `
    );
  };

  protected cardStyleMap = styleMap({
    position: 'relative',
    display: 'block',
    width: '100%',
  });

  convertToCard = (aliasInfo?: AliasInfo) => {
    const { store } = this.model;
    const { caption } = this.model.props;

    const parent = store.getParent(this.model);
    if (!parent) {
      console.error(
        `尝试将同步文档转换为卡片，但未找到父级。`
      );
      return;
    }
    const index = parent.children.indexOf(this.model);

    const blockId = store.addBlock(
      'yunke:embed-linked-doc',
      { caption, ...this.referenceInfo, ...aliasInfo },
      parent,
      index
    );

    store.deleteBlock(this.model);

    this.std.selection.setGroup('note', [
      this.std.selection.create(BlockSelection, { blockId }),
    ]);
  };

  convertToInline = () => {
    const { store } = this.model;
    const parent = store.getParent(this.model);
    if (!parent) {
      console.error(
        `尝试将同步文档转换为内联，但未找到父级。`
      );
      return;
    }
    const index = parent.children.indexOf(this.model);

    const yText = new Y.Text();
    yText.insert(0, REFERENCE_NODE);
    yText.format(0, REFERENCE_NODE.length, {
      reference: {
        type: 'LinkedPage',
        ...this.referenceInfo,
      },
    });
    const text = new Text(yText);

    store.addBlock(
      'yunke:paragraph',
      {
        text,
      },
      parent,
      index
    );

    store.deleteBlock(this.model);
  };

  protected override embedContainerStyle: StyleInfo = {
    height: 'unset',
  };

  icon$ = computed(() => {
    const { pageId, params } = this.model.props;
    return this.std
      .get(DocDisplayMetaProvider)
      .icon(pageId, { params, referenced: true }).value;
  });

  open = (event?: Partial<DocLinkClickedEvent>) => {
    const pageId = this.model.props.pageId;
    if (pageId === this.store.id) return;

    this.std
      .getOptional(RefNodeSlotsProvider)
      ?.docLinkClicked.next({ ...event, pageId, host: this.host });
  };

  refreshData = () => {
    this._load().catch(e => {
      console.error(e);
      this._error = true;
    });
  };

  title$ = computed(() => {
    const { pageId, params } = this.model.props;
    return this.std
      .get(DocDisplayMetaProvider)
      .title(pageId, { params, referenced: true });
  });

  get blockState() {
    return {
      isLoading: this._loading,
      isError: this._error,
      isDeleted: this._deleted,
      isCycle: this._cycle,
    };
  }

  get docTitle() {
    return this.syncedDoc?.meta?.title || '未命名';
  }

  get docUpdatedAt() {
    return this._docUpdatedAt;
  }

  get editorMode() {
    return this.linkedMode ?? this.syncedDocMode;
  }

  protected get isPageMode() {
    return this.editorMode === 'page';
  }

  get linkedMode() {
    return this.referenceInfo.params?.mode;
  }

  get referenceInfo(): ReferenceInfo {
    return cloneReferenceInfo(this.model.props);
  }

  get syncedDoc() {
    const options: GetStoreOptions = { readonly: true };
    if (this.isPageMode) options.query = this._pageFilter;
    const doc = this.std.workspace.getDoc(this.model.props.pageId);
    return doc?.getStore(options) ?? null;
  }

  private _checkCycle() {
    let editorHost: EditorHost | null = this.host;
    while (editorHost && !this._cycle) {
      this._cycle =
        !!editorHost && editorHost.store.id === this.model.props.pageId;
      editorHost = editorHost.parentElement?.closest('editor-host') ?? null;
    }
  }

  private _isClickAtBorder(
    event: MouseEvent,
    element: HTMLElement,
    tolerance = 8
  ): boolean {
    const { x, y } = event;
    const rect = element.getBoundingClientRect();
    if (!rect) {
      return false;
    }

    return (
      Math.abs(x - rect.left) < tolerance ||
      Math.abs(x - rect.right) < tolerance ||
      Math.abs(y - rect.top) < tolerance ||
      Math.abs(y - rect.bottom) < tolerance
    );
  }

  private async _load() {
    this._loading = true;
    this._error = false;
    this._deleted = false;
    this._cycle = false;

    const syncedDoc = this.syncedDoc;
    if (!syncedDoc) {
      this._deleted = true;
      this._loading = false;
      return;
    }

    this._checkCycle();

    if (!syncedDoc.loaded) {
      try {
        syncedDoc.load();
      } catch (e) {
        console.error(e);
        this._error = true;
      }
    }

    if (!this._error && !syncedDoc.root) {
      await new Promise<void>(resolve => {
        const subscription = syncedDoc.slots.rootAdded.subscribe(() => {
          subscription.unsubscribe();
          resolve();
        });
      });
    }

    this._loading = false;
  }

  private _selectBlock() {
    const selectionManager = this.std.selection;
    const blockSelection = selectionManager.create(BlockSelection, {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _setDocUpdatedAt() {
    const meta = this.store.workspace.meta.getDocMeta(this.model.props.pageId);
    if (meta) {
      const date = meta.updatedDate || meta.createDate;
      this._docUpdatedAt = new Date(date);
    }
  }

  protected _handleClick(_event: MouseEvent) {
    this._selectBlock();
  }

  override connectedCallback() {
    super.connectedCallback();
    this._cardStyle = this.model.props.style;

    this.style.display = 'block';
    this._load().catch(e => {
      console.error(e);
      this._error = true;
    });

    this.contentEditable = 'false';

    this.disposables.add(
      this.model.propsUpdated.subscribe(({ key }) => {
        if (key === 'pageId' || key === 'style') {
          this._load().catch(e => {
            console.error(e);
            this._error = true;
          });
        }
      })
    );

    this._setDocUpdatedAt();
    this.disposables.add(
      this.store.workspace.slots.docListUpdated.subscribe(() => {
        this._setDocUpdatedAt();
      })
    );

    if (!this.linkedMode) {
      const docMode = this.std.get(DocModeProvider);
      this.syncedDocMode = docMode.getPrimaryMode(this.model.props.pageId);
      this._isEmptySyncedDoc = isEmptyDoc(this.syncedDoc, this.editorMode);
      this.disposables.add(
        docMode.onPrimaryModeChange(mode => {
          this.syncedDocMode = mode;
          this._isEmptySyncedDoc = isEmptyDoc(this.syncedDoc, this.editorMode);
        }, this.model.props.pageId)
      );
    }

    this.syncedDoc &&
      this.disposables.add(
        this.syncedDoc.slots.blockUpdated.subscribe(() => {
          this._isEmptySyncedDoc = isEmptyDoc(this.syncedDoc, this.editorMode);
        })
      );
  }

  override firstUpdated() {
    this.disposables.addFromEvent(this, 'click', e => {
      e.stopPropagation();
      if (this._isClickAtBorder(e, this)) {
        e.preventDefault();
        this._selectBlock();
      }
    });

    this._initEdgelessFitEffect();
  }

  override renderBlock() {
    delete this.dataset.nestedEditor;

    const syncedDoc = this.syncedDoc;
    const { isLoading, isError, isDeleted, isCycle } = this.blockState;
    const isCardOnly = this.depth >= 1;

    if (
      isLoading ||
      isError ||
      isDeleted ||
      isCardOnly ||
      isCycle ||
      !syncedDoc
    ) {
      return this.renderEmbed(
        () => html`
          <yunke-embed-synced-doc-card
            style=${this.cardStyleMap}
            .block=${this}
          ></yunke-embed-synced-doc-card>
        `
      );
    }

    return this._renderSyncedView();
  }

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.syncedDocCard?.requestUpdate();
  }

  @state()
  private accessor _cycle = false;

  @state()
  private accessor _deleted = false;

  @state()
  private accessor _docUpdatedAt: Date = new Date();

  @state()
  private accessor _error = false;

  @state()
  protected accessor _isEmptySyncedDoc: boolean = true;

  @state()
  private accessor _loading = false;

  @state()
  accessor depth = 0;

  @query(
    ':scope > .yunke-block-component > .embed-block-container > yunke-embed-synced-doc-card'
  )
  accessor syncedDocCard: EmbedSyncedDocCard | null = null;

  @query(
    ':scope > .yunke-block-component > .embed-block-container > .yunke-embed-synced-doc-container > .yunke-embed-synced-doc-editor > div > editor-host'
  )
  accessor syncedDocEditorHost: EditorHost | null = null;

  @state()
  accessor syncedDocMode: DocMode = 'page';

  override accessor useCaptionEditor = true;
}
