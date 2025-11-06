import {
  CaptionedBlockComponent,
  SelectedStyle,
} from '@blocksuite/yunke-components/caption';
import {
  getAttachmentFileIcon,
  LoadingIcon,
} from '@blocksuite/yunke-components/icons';
import { Peekable } from '@blocksuite/yunke-components/peek';
import {
  type ResolvedStateInfo,
  ResourceController,
} from '@blocksuite/yunke-components/resource';
import { toast } from '@blocksuite/yunke-components/toast';
import {
  type AttachmentBlockModel,
  AttachmentBlockStyles,
} from '@blocksuite/yunke-model';
import {
  DocModeProvider,
  FileSizeLimitProvider,
  TelemetryProvider,
} from '@blocksuite/yunke-shared/services';
import { formatSize } from '@blocksuite/yunke-shared/utils';
import {
  AttachmentIcon,
  ResetIcon,
  UpgradeIcon,
  WarningIcon,
} from '@blocksuite/icons/lit';
import { BlockSelection } from '@blocksuite/std';
import { nanoid, Slice } from '@blocksuite/store';
import { computed, signal } from '@preact/signals-core';
import { html, type TemplateResult } from 'lit';
import { choose } from 'lit/directives/choose.js';
import { type ClassInfo, classMap } from 'lit/directives/class-map.js';
import { guard } from 'lit/directives/guard.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { AttachmentEmbedProvider } from './embed';
import { styles } from './styles';
import {
  downloadAttachmentBlob,
  refreshData,
  getFileType,
  isAttachmentEditable,
} from './utils';
import { dispatchAttachmentTrashEvent } from './trash';
import { openAttachmentEditor } from './editor';
import { openSingleFileWith } from '@blocksuite/yunke-shared/utils';
import { PeekViewProvider } from '@blocksuite/yunke-components/peek';

type AttachmentResolvedStateInfo = ResolvedStateInfo & {
  kind?: TemplateResult;
};

@Peekable({
  enableOn: ({ model }: AttachmentBlockComponent) => {
    return !model.store.readonly && model.props.type.endsWith('pdf');
  },
})
export class AttachmentBlockComponent extends CaptionedBlockComponent<AttachmentBlockModel> {
  static override styles = styles;

  blockDraggable = true;

  resourceController = new ResourceController(
    computed(() => this.model.props.sourceId$.value)
  );

  get blobUrl() {
    return this.resourceController.blobUrl$.value;
  }

  get filetype() {
    const name = this.model.props.name$.value;
    return name.split('.').pop() ?? '';
  }

  protected containerStyleMap = styleMap({
    position: 'relative',
    width: '100%',
    margin: '18px 0px',
  });

  private get _maxFileSize() {
    return this.std.get(FileSizeLimitProvider).maxFileSize;
  }

  get isCitation() {
    return !!this.model.props.footnoteIdentifier;
  }

  convertTo = () => {
    return this.std
      .get(AttachmentEmbedProvider)
      .convertTo(this.model, this._maxFileSize);
  };

  copy = () => {
    const slice = Slice.fromModels(this.store, [this.model]);
    this.std.clipboard.copySlice(slice).catch(console.error);
    toast(this.host, '已复制到剪贴板');
  };

  download = () => {
    downloadAttachmentBlob(this);
  };

  embedded = () => {
    return (
      Boolean(this.blobUrl) &&
      this.std
        .get(AttachmentEmbedProvider)
        .embedded(this.model, this._maxFileSize)
    );
  };

  open = () => {
    const blobUrl = this.blobUrl;
    if (!blobUrl) return;
    window.open(blobUrl, '_blank');
  };

  openPreview = async () => {
    const peekView = this.std.getOptional(PeekViewProvider);
    if (!peekView) {
      console.warn('PeekViewProvider is not available');
      toast(this.host, '预览功能不可用');
      return;
    }
    
    const blobUrl = this.blobUrl;
    if (!blobUrl) {
      console.warn('Cannot open preview: blobUrl is not ready');
      toast(this.host, '文件尚未准备好，请稍后再试');
      return;
    }
    
    await peekView.peek({
      docId: this.model.store.id,
      blockIds: [this.blockId],
      target: this,
    });
  };

  edit = async () => {
    try {
      const module = await import('./editor.js');
      if (module?.openAttachmentEditor) {
        await module.openAttachmentEditor(this);
      } else {
        console.error('Attachment editor module not available');
        toast(this.host, '编辑器不可用');
      }
    } catch (error) {
      console.error('Failed to open attachment editor:', error);
      toast(this.host, '打开编辑器失败');
    }
  };

  openExternal = async () => {
    // Check if Electron API is available for opening temp files
    // This method doesn't require blobUrl, so it works even if blobUrl is not ready
    if ((window as any).__apis?.file?.openTempFile) {
      try {
        console.log('[Attachment] openExternal: Using Electron API');
        const blob = await this.resourceController.blob();
        if (blob) {
          const buffer = new Uint8Array(await blob.arrayBuffer());
          await (window as any).__apis.file.openTempFile(
            Array.from(buffer),
            this.model.props.name$.value
          );
          return;
        } else {
          console.warn('[Attachment] openExternal: blob is null, trying to refresh');
          this.refreshData();
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryBlob = await this.resourceController.blob();
          if (retryBlob) {
            const buffer = new Uint8Array(await retryBlob.arrayBuffer());
            await (window as any).__apis.file.openTempFile(
              Array.from(buffer),
              this.model.props.name$.value
            );
            return;
          }
        }
      } catch (err) {
        console.error('[Attachment] Failed to open file via Electron API:', err);
        // Fall through to try blobUrl method
      }
    }

    // Fallback to opening blob URL (for web browsers)
    const blobUrl = this.blobUrl;
    if (!blobUrl) {
      console.warn('[Attachment] openExternal: blobUrl not ready, refreshing...');
      this.refreshData();
      // Wait for blobUrl to be ready (with timeout)
      return new Promise<void>((resolve) => {
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds max wait
        const checkInterval = setInterval(() => {
          attempts++;
          const currentBlobUrl = this.blobUrl;
          if (currentBlobUrl || attempts >= maxAttempts) {
            clearInterval(checkInterval);
            if (currentBlobUrl) {
              console.log('[Attachment] openExternal: blobUrl ready, opening');
              window.open(currentBlobUrl, '_blank');
            } else {
              console.error('[Attachment] openExternal: Failed to get blobUrl after waiting');
            }
            resolve();
          }
        }, 100);
      });
    }

    console.log('[Attachment] openExternal: Opening blobUrl');
    window.open(blobUrl, '_blank');
  };

  replace = async () => {
    const state = this.resourceController.state$.peek();
    if (state.uploading) return;

    const file = await openSingleFileWith();
    if (!file) return;

    const sourceId = await this.std.store.blobSync.set(file);
    const type = await getFileType(file);
    const { name, size } = file;

    let embed = this.model.props.embed$.value ?? false;

    this.std.store.captureSync();
    this.std.store.transact(() => {
      this.std.store.updateBlock(this.blockId, {
        name,
        size,
        type,
        sourceId,
        embed: false,
      });

      const provider = this.std.get(AttachmentEmbedProvider);
      embed &&= provider.embedded(this.model);

      if (embed) {
        provider.convertTo(this.model);
      }

      // Reloads
      this.reload();
    });
  };

  // Refreshes data.
  refreshData = () => {
    refreshData(this).catch(console.error);
  };

  private readonly _refreshKey$ = signal<string | null>(null);

  // Refreshes the embed component.
  reload = () => {
    if (this.model.props.embed) {
      this._refreshKey$.value = nanoid();
      return;
    }

    this.refreshData();
  };

  private _selectBlock() {
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create(BlockSelection, {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  override connectedCallback() {
    super.connectedCallback();

    this.contentEditable = 'false';

    this.resourceController.setEngine(this.std.store.blobSync);

    this.disposables.add(this.resourceController.subscribe());
    this.disposables.add(this.resourceController);

    this.disposables.add(
      this.model.props.sourceId$.subscribe(() => {
        this.refreshData();
      })
    );

    if (!this.model.props.style && !this.store.readonly) {
      this.store.withoutTransact(() => {
        this.store.updateBlock(this.model, {
          style: AttachmentBlockStyles[1],
        });
      });
    }
  }

  override firstUpdated() {
    // lazy bindings
    this.disposables.addFromEvent(this, 'click', this.onClick);
    this.disposables.addFromEvent(this, 'dblclick', this._handleDoubleClick);
  }

  protected onClick(event: MouseEvent) {
    // the peek view need handle shift + click
    if (event.defaultPrevented) return;

    event.stopPropagation();

    if (!this.selected$.peek()) {
      this._selectBlock();
    }
  }

  private readonly _handleDoubleClick = (event: MouseEvent) => {
    event.stopPropagation();

    // Check if the edit dialog is open - if so, don't open preview
    const editDialogOpen = document.querySelector(
      'yunke-attachment-editor-dialog'
    );
    if (editDialogOpen) {
      return;
    }

    this.openPreview().catch(console.error);
  };

  protected renderUpgradeButton = () => {
    if (this.std.store.readonly) return null;

    const onOverFileSize = this.std.get(FileSizeLimitProvider).onOverFileSize;

    return when(
      onOverFileSize,
      () => html`
        <button
          class="yunke-attachment-content-button"
          @click=${(event: MouseEvent) => {
            event.stopPropagation();
            onOverFileSize?.();

            {
              const mode =
                this.std.get(DocModeProvider).getEditorMode() ?? 'page';
              const segment = mode === 'page' ? 'doc' : 'whiteboard';
              this.std
                .getOptional(TelemetryProvider)
                ?.track('AttachmentUpgradedEvent', {
                  segment,
                  page: `${segment} editor`,
                  module: 'attachment',
                  control: 'upgrade',
                  category: 'card',
                  type: this.model.props.name.split('.').pop() ?? '',
                });
            }
          }}
        >
          ${UpgradeIcon()} Upgrade
        </button>
      `
    );
  };

  protected renderNormalButton = (needUpload: boolean) => {
    const label = needUpload ? 'retry' : 'reload';
    const run = async () => {
      if (needUpload) {
        await this.resourceController.upload();
        return;
      }

      this.refreshData();
    };

    return html`
      <button
        class="yunke-attachment-content-button"
        @click=${(event: MouseEvent) => {
          event.stopPropagation();
          run().catch(console.error);

          {
            const mode =
              this.std.get(DocModeProvider).getEditorMode() ?? 'page';
            const segment = mode === 'page' ? 'doc' : 'whiteboard';
            this.std
              .getOptional(TelemetryProvider)
              ?.track('AttachmentReloadedEvent', {
                segment,
                page: `${segment} editor`,
                module: 'attachment',
                control: label,
                category: 'card',
                type: this.filetype,
              });
          }
        }}
      >
        ${ResetIcon()} ${label}
      </button>
    `;
  };

  protected renderWithHorizontal(
    classInfo: ClassInfo,
    {
      icon,
      title,
      description,
      kind,
      state,
      needUpload,
    }: AttachmentResolvedStateInfo
  ) {
    return html`
      <div class=${classMap(classInfo)}>
        <div class="yunke-attachment-content">
          <div class="yunke-attachment-content-title">
            <div class="yunke-attachment-content-title-icon">${icon}</div>
            <div class="yunke-attachment-content-title-text truncate">
              ${title}
            </div>
          </div>

          <div class="yunke-attachment-content-description">
            <div class="yunke-attachment-content-info truncate">
              ${description}
            </div>
            ${choose(state, [
              ['error', () => this.renderNormalButton(needUpload)],
              ['error:oversize', this.renderUpgradeButton],
            ])}
          </div>
        </div>

        <div class="yunke-attachment-banner">${kind}</div>
      </div>
    `;
  }

  protected renderWithVertical(
    classInfo: ClassInfo,
    {
      icon,
      title,
      description,
      kind,
      state,
      needUpload,
    }: AttachmentResolvedStateInfo
  ) {
    return html`
      <div class=${classMap(classInfo)}>
        <div class="yunke-attachment-content">
          <div class="yunke-attachment-content-title">
            <div class="yunke-attachment-content-title-icon">${icon}</div>
            <div class="yunke-attachment-content-title-text truncate">
              ${title}
            </div>
          </div>

          <div class="yunke-attachment-content-info truncate">
            ${description}
          </div>
        </div>

        <div class="yunke-attachment-banner">
          ${kind}
          ${choose(state, [
            ['error', () => this.renderNormalButton(needUpload)],
            ['error:oversize', this.renderUpgradeButton],
          ])}
        </div>
      </div>
    `;
  }

  protected resolvedState$ = computed<AttachmentResolvedStateInfo>(() => {
    const size = this.model.props.size;
    const name = this.model.props.name$.value;
    const kind = getAttachmentFileIcon(this.filetype);

    const resolvedState = this.resourceController.resolveStateWith({
      loadingIcon: LoadingIcon(),
      errorIcon: WarningIcon(),
      icon: AttachmentIcon(),
      title: name,
      description: formatSize(size),
    });

    return { ...resolvedState, kind };
  });

  protected renderCardView = () => {
    const resolvedState = this.resolvedState$.value;
    const cardStyle = this.model.props.style$.value ?? AttachmentBlockStyles[1];

    const classInfo = {
      'yunke-attachment-card': true,
      [cardStyle]: true,
      loading: resolvedState.loading,
      error: resolvedState.error,
    };

    return when(
      cardStyle === 'cubeThick',
      () => this.renderWithVertical(classInfo, resolvedState),
      () => this.renderWithHorizontal(classInfo, resolvedState)
    );
  };

  protected renderEmbedView = () => {
    const { model, blobUrl } = this;
    if (!model.props.embed || !blobUrl) return null;

    const { std, _maxFileSize } = this;
    const provider = std.get(AttachmentEmbedProvider);

    const render = provider.getRender(model, _maxFileSize);
    if (!render) return null;

    const enabled = provider.shouldShowStatus(model);

    return html`
      <div class="yunke-attachment-embed-container">
        ${guard([this._refreshKey$.value], () => render(model, blobUrl))}
      </div>
      ${when(enabled, () => {
        const resolvedState = this.resolvedState$.value;
        if (resolvedState.state !== 'error') return null;
        // It should be an error messge.
        const message = resolvedState.description;
        if (!message) return null;

        const needUpload = resolvedState.needUpload;
        const action = () =>
          needUpload ? this.resourceController.upload() : this.reload();

        return html`
          <yunke-resource-status
            class="yunke-attachment-embed-status"
            .message=${message}
            .needUpload=${needUpload}
            .action=${action}
          ></yunke-resource-status>
        `;
      })}
    `;
  };

  private readonly _renderCitation = () => {
    const { name, footnoteIdentifier } = this.model.props;
    const icon = getAttachmentFileIcon(this.filetype);

    return html`<yunke-citation-card
      .icon=${icon}
      .citationTitle=${name}
      .citationIdentifier=${footnoteIdentifier}
      .active=${this.selected$.value}
    ></yunke-citation-card>`;
  };

  override renderBlock() {
    return html`
      <div
        class=${classMap({
          'yunke-attachment-container': true,
          focused: this.selected$.value,
        })}
        style=${this.containerStyleMap}
      >
        ${when(
          this.isCitation,
          () => this._renderCitation(),
          () => this.renderEmbedView() ?? this.renderCardView()
        )}
      </div>
    `;
  }

  override accessor selectedStyle = SelectedStyle.Border;

  override accessor useCaptionEditor = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-attachment': AttachmentBlockComponent;
  }
}
