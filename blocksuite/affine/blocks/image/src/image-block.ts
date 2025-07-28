import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { whenHover } from '@blocksuite/affine-components/hover';
import { LoadingIcon } from '@blocksuite/affine-components/icons';
import { Peekable } from '@blocksuite/affine-components/peek';
import { ResourceController } from '@blocksuite/affine-components/resource';
import type { ImageBlockModel } from '@blocksuite/affine-model';
import { ImageSelection } from '@blocksuite/affine-shared/selection';
import { ToolbarRegistryIdentifier } from '@blocksuite/affine-shared/services';
import { formatSize } from '@blocksuite/affine-shared/utils';
import { IS_MOBILE } from '@blocksuite/global/env';
import { BrokenImageIcon, ImageIcon } from '@blocksuite/icons/lit';
import { BlockSelection } from '@blocksuite/std';
import { computed } from '@preact/signals-core';
import { cssVarV2 } from '@toeverything/theme/v2';
import { html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import type { ImageBlockPageComponent } from './components/page-image-block';
import type { CropResult } from './components/image-crop-modal.js';
import './components/image-crop-modal.js';
import {
  copyImageBlob,
  downloadImageBlob,
  refreshData,
  turnImageIntoCardView,
} from './utils';

@Peekable({
  enableOn: () => !IS_MOBILE,
})
export class ImageBlockComponent extends CaptionedBlockComponent<ImageBlockModel> {
  resizeable$ = computed(() =>
    this.std.selection.value.some(
      selection =>
        selection.is(ImageSelection) && selection.blockId === this.blockId
    )
  );

  resourceController = new ResourceController(
    computed(() => this.model.props.sourceId$.value),
    'Image'
  );

  @state()
  private accessor _cropModalOpen = false;

  get blobUrl() {
    return this.resourceController.blobUrl$.value;
  }

  convertToCardView = () => {
    turnImageIntoCardView(this).catch(console.error);
  };

  copy = () => {
    copyImageBlob(this).catch(console.error);
  };

  download = () => {
    downloadImageBlob(this).catch(console.error);
  };

  refreshData = () => {
    refreshData(this).catch(console.error);
  };

  openCropModal = () => {
    console.log('openCropModal called', { blobUrl: this.blobUrl, modalOpen: this._cropModalOpen });
    if (!this.blobUrl) {
      console.log('No blobUrl available');
      return;
    }
    console.log('Opening crop modal...');
    this._cropModalOpen = true;
  };

  private _handleCropSave = async (event: CustomEvent<CropResult>) => {
    const { blob, url } = event.detail;
    
    try {
      // 上传剪裁后的图片
      const blobSync = this.std.store.blobSync;
      const sourceId = await blobSync.set(blob);
      
      // 更新模型
      this.std.store.updateBlock(this.model, {
        sourceId,
      });
      
      // 清理临时URL
      URL.revokeObjectURL(url);
      
      this._cropModalOpen = false;
    } catch (error) {
      console.error('Failed to save cropped image:', error);
    }
  };

  private _handleCropCancel = () => {
    this._cropModalOpen = false;
  };

  private _handleCropError = (event: CustomEvent) => {
    console.error('Crop error:', event.detail);
    this._cropModalOpen = false;
  };

  get resizableImg() {
    return this.pageImage?.resizeImg;
  }

  private _handleClick(event: MouseEvent) {
    // the peek view need handle shift + click
    if (event.defaultPrevented) return;

    event.stopPropagation();
    const selectionManager = this.host.selection;
    const blockSelection = selectionManager.create(BlockSelection, {
      blockId: this.blockId,
    });
    selectionManager.setGroup('note', [blockSelection]);
  }

  private _initHover() {
    const { setReference, setFloating, dispose } = whenHover(
      hovered => {
        const message$ = this.std.get(ToolbarRegistryIdentifier).message$;
        if (hovered) {
          message$.value = {
            flavour: this.model.flavour,
            element: this,
            setFloating,
          };
          return;
        }

        // Clears previous bindings
        message$.value = null;
        setFloating();
      },
      { enterDelay: 500 }
    );
    setReference(this.hoverableContainer);
    this._disposables.add(dispose);
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
  }

  override firstUpdated() {
    // lazy bindings
    this.disposables.addFromEvent(this, 'click', this._handleClick);
    this.disposables.addFromEvent(this, 'crop-save', this._handleCropSave);
    this.disposables.addFromEvent(this, 'crop-cancel', this._handleCropCancel);
    this.disposables.addFromEvent(this, 'crop-error', this._handleCropError);
    this._initHover();
  }

  override renderBlock() {
    const blobUrl = this.blobUrl;
    const { size = 0 } = this.model.props;

    const containerStyleMap = styleMap({
      position: 'relative',
      width: '100%',
    });

    const resovledState = this.resourceController.resolveStateWith({
      loadingIcon: LoadingIcon({
        strokeColor: cssVarV2('button/pureWhiteText'),
        ringColor: cssVarV2('loading/imageLoadingLayer', '#ffffff8f'),
      }),
      errorIcon: BrokenImageIcon(),
      icon: ImageIcon(),
      title: 'Image',
      description: formatSize(size),
    });

    return html`
      <div class="affine-image-container" style=${containerStyleMap}>
        ${when(
          blobUrl,
          () =>
            html`<affine-page-image
              .block=${this}
              .state=${resovledState}
            ></affine-page-image>`,
          () =>
            html`<affine-image-fallback-card
              .state=${resovledState}
            ></affine-image-fallback-card>`
        )}
      </div>

      <image-crop-modal
        .imageUrl=${blobUrl || ''}
        .open=${this._cropModalOpen}
      ></image-crop-modal>

      ${Object.values(this.widgets)}
    `;
  }

  override accessor blockContainerStyles = { margin: '18px 0' };

  @query('affine-page-image')
  private accessor pageImage: ImageBlockPageComponent | null = null;

  @query('.affine-image-container')
  accessor hoverableContainer!: HTMLDivElement;

  override accessor useCaptionEditor = true;

  override accessor useZeroWidth = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-image': ImageBlockComponent;
  }
}
