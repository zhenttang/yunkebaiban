import { CaptionedBlockComponent } from '@blocksuite/yunke-components/caption';
import { whenHover } from '@blocksuite/yunke-components/hover';
import { LoadingIcon } from '@blocksuite/yunke-components/icons';
import { Peekable } from '@blocksuite/yunke-components/peek';
import { ResourceController } from '@blocksuite/yunke-components/resource';
import type { ImageBlockModel } from '@blocksuite/yunke-model';
import { ImageSelection } from '@blocksuite/yunke-shared/selection';
import { ToolbarRegistryIdentifier } from '@blocksuite/yunke-shared/services';
import { formatSize } from '@blocksuite/yunke-shared/utils';
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
    
    // 创建全局模态框
    this._createGlobalModal();
    
    // 强制更新组件以确保状态变化被渲染
    this.requestUpdate();
  };

  private _createGlobalModal() {
    // 移除可能存在的旧模态框
    const existingModal = document.querySelector('image-crop-modal[data-global="true"]');
    if (existingModal) {
      existingModal.remove();
    }

    // 检查自定义元素是否已注册，如果没有则使用简单模态框
    if (!customElements.get('image-crop-modal')) {
      console.error('image-crop-modal element is not registered, using simple modal');
      this._createSimpleModal();
      return;
    }

    // 创建新的全局模态框
    const modal = document.createElement('image-crop-modal') as any;
    modal.setAttribute('data-global', 'true');
    modal.imageUrl = this.blobUrl || '';
    modal.open = true;
    
    // 添加事件监听器
    modal.addEventListener('crop-save', this._handleCropSave);
    modal.addEventListener('crop-cancel', this._handleCropCancel);
    modal.addEventListener('crop-error', this._handleCropError);
    
    // 添加到body
    document.body.appendChild(modal);
    
    console.log('Global modal created and added to body');
  }

  private _createSimpleModal() {
    console.log('Creating simple fallback modal');
    
    // 创建简单的HTML模态框
    const overlay = document.createElement('div');
    overlay.id = 'simple-crop-modal';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.8) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      width: 90vw !important;
      max-width: 900px !important;
      height: 80vh !important;
      max-height: 700px !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 16px 20px !important;
      border-bottom: 1px solid #e0e0e0 !important;
      background: #f5f5f5 !important;
    `;

    const title = document.createElement('h3');
    title.textContent = '图片剪裁';
    title.style.cssText = `
      margin: 0 !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      color: #333 !important;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex !important;
      gap: 8px !important;
    `;

    const saveButton = document.createElement('button');
    saveButton.textContent = '保存';
    saveButton.style.cssText = `
      padding: 8px 16px !important;
      background: #007bff !important;
      color: white !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 14px !important;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.style.cssText = `
      padding: 8px 16px !important;
      background: #6c757d !important;
      color: white !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 14px !important;
    `;

    const body = document.createElement('div');
    body.style.cssText = `
      flex: 1 !important;
      background: #000 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
    `;

    const img = document.createElement('img');
    img.src = this.blobUrl || '';
    img.style.cssText = `
      max-width: 90% !important;
      max-height: 90% !important;
      object-fit: contain !important;
      border: 2px dashed #fff !important;
    `;

    const info = document.createElement('div');
    info.textContent = '📏 简化版剪裁界面 - 点击保存完成剪裁';
    info.style.cssText = `
      position: absolute !important;
      bottom: 20px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: rgba(0, 0, 0, 0.8) !important;
      color: white !important;
      padding: 10px 20px !important;
      border-radius: 20px !important;
      font-size: 14px !important;
    `;

    // 事件处理
    const closeModal = () => {
      overlay.remove();
      this._cropModalOpen = false;
    };

    const saveImage = async () => {
      try {
        if (this.blobUrl) {
          const response = await fetch(this.blobUrl);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          const event = new CustomEvent('crop-save', {
            detail: { blob, url },
            bubbles: true,
          });
          
          await this._handleCropSave(event);
          closeModal();
        }
      } catch (error) {
        console.error('Failed to save image:', error);
        closeModal();
      }
    };

    saveButton.addEventListener('click', saveImage);
    cancelButton.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // 组装DOM
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    header.appendChild(title);
    header.appendChild(buttonContainer);
    body.appendChild(img);
    body.appendChild(info);
    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);
    console.log('Simple modal created and added to body');
  }

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
      this._removeGlobalModal();
    } catch (error) {
      console.error('Failed to save cropped image:', error);
    }
  };

  private _handleCropCancel = () => {
    console.log('Crop cancelled, closing modal');
    this._cropModalOpen = false;
    this._removeGlobalModal();
    this.requestUpdate();
  };

  private _handleCropError = (event: CustomEvent) => {
    console.error('Crop error:', event.detail);
    this._cropModalOpen = false;
    this._removeGlobalModal();
    this.requestUpdate();
  };

  private _removeGlobalModal() {
    // 移除自定义元素模态框
    const existingModal = document.querySelector('image-crop-modal[data-global="true"]');
    if (existingModal) {
      existingModal.remove();
      console.log('Global modal removed from body');
    }
    
    // 移除简单模态框
    const simpleModal = document.getElementById('simple-crop-modal');
    if (simpleModal) {
      simpleModal.remove();
      console.log('Simple modal removed from body');
    }
  }

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

  private _handleDoubleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    // 检查是否有deck数据，如果有则打开编辑器
    const customData = this.model.props.customData;
    if (customData && this._isDeckData(customData)) {
      this._openDeckerEditor(customData);
    }
  }

  private _isDeckData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      // 检查是否包含deck数据的特征字段
      return parsed && typeof parsed === 'object' && 
             (parsed.type === 'deck' || parsed.deckData || parsed.deck);
    } catch {
      return false;
    }
  }

  private _openDeckerEditor(customData: string) {
    try {
      const data = JSON.parse(customData);
      const deckData = data.deckData || data.deck;
      
      if (!deckData) {
        console.warn('没有找到deck数据');
        return;
      }

      // 创建Decker编辑器iframe
      this._createDeckerModal(deckData);
    } catch (error) {
      console.error('打开Decker编辑器失败:', error);
    }
  }

  private _createDeckerModal(deckData: string) {
    // 移除可能存在的旧模态框
    const existingModal = document.querySelector('#decker-edit-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 创建模态框容器
    const overlay = document.createElement('div');
    overlay.id = 'decker-edit-modal';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.8) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      width: 95vw !important;
      max-width: 1200px !important;
      height: 90vh !important;
      max-height: 800px !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    `;

    // 头部
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 16px 20px !important;
      border-bottom: 1px solid #e0e0e0 !important;
      background: #f5f5f5 !important;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Decker 编辑器';
    title.style.cssText = `
      margin: 0 !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      color: #333 !important;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex !important;
      gap: 8px !important;
    `;

    const saveButton = document.createElement('button');
    saveButton.textContent = '保存';
    saveButton.style.cssText = `
      padding: 8px 16px !important;
      background: #007bff !important;
      color: white !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 14px !important;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.style.cssText = `
      padding: 8px 16px !important;
      background: #6c757d !important;
      color: white !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 14px !important;
    `;

    // iframe容器
    const iframeContainer = document.createElement('div');
    iframeContainer.style.cssText = `
      flex: 1 !important;
      background: #000 !important;
      position: relative !important;
    `;

    // 创建iframe
    const iframe = document.createElement('iframe');
    const deckerUrl = `file:///mnt/d/Documents/yunkebaiban/Decker-main/Decker-main/decker.html?whiteboard=true&origin=${encodeURIComponent(window.location.origin)}`;
    iframe.src = deckerUrl;
    iframe.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      background: white !important;
    `;

    // 事件处理
    const closeModal = () => {
      overlay.remove();
      window.removeEventListener('message', messageHandler);
    };

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { type, gifData, deckData, metadata } = event.data;

      if (type === 'DECK_EXPORT_COMPLETE') {
        this._handleDeckerSave(gifData, deckData, metadata);
        closeModal();
      } else if (type === 'DECK_READY') {
        // Decker准备就绪，发送deck数据进行加载
        iframe.contentWindow?.postMessage({
          type: 'LOAD_DECK_DATA',
          payload: { deckData, metadata: { timestamp: Date.now() } }
        }, '*');
      }
    };

    const requestSave = () => {
      // 请求Decker导出当前内容
      iframe.contentWindow?.postMessage({
        type: 'EXPORT_GIF_REQUEST'
      }, '*');
    };

    // 绑定事件
    window.addEventListener('message', messageHandler);
    saveButton.addEventListener('click', requestSave);
    cancelButton.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // 组装DOM
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    header.appendChild(title);
    header.appendChild(buttonContainer);
    iframeContainer.appendChild(iframe);
    modal.appendChild(header);
    modal.appendChild(iframeContainer);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);
    console.log('Decker编辑器模态框已创建');
  }

  private async _handleDeckerSave(gifData: number[], deckData: string, metadata: any) {
    try {
      // 将GIF数据转换为Blob
      const gifBlob = new Blob([new Uint8Array(gifData)], { type: 'image/gif' });
      
      // 上传新的GIF
      const blobSync = this.std.store.blobSync;
      const sourceId = await blobSync.set(gifBlob);
      
      // 准备自定义数据
      const customData = JSON.stringify({
        type: 'deck',
        deckData: deckData,
        metadata: {
          ...metadata,
          editedAt: Date.now(),
          editor: 'decker'
        }
      });
      
      // 更新模型
      this.std.store.updateBlock(this.model, {
        sourceId,
        customData,
        size: gifBlob.size
      });
      
      console.log('Decker编辑内容已保存');
    } catch (error) {
      console.error('保存Decker编辑内容失败:', error);
    }
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
    this.disposables.addFromEvent(this, 'dblclick', this._handleDoubleClick);
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
      <div class="yunke-image-container" style=${containerStyleMap}>
        ${when(
          blobUrl,
          () =>
            html`<yunke-page-image
              .block=${this}
              .state=${resovledState}
            ></yunke-page-image>`,
          () =>
            html`<yunke-image-fallback-card
              .state=${resovledState}
            ></yunke-image-fallback-card>`
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

  @query('yunke-page-image')
  private accessor pageImage: ImageBlockPageComponent | null = null;

  @query('.yunke-image-container')
  accessor hoverableContainer!: HTMLDivElement;

  override accessor useCaptionEditor = true;

  override accessor useZeroWidth = true;
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-image': ImageBlockComponent;
  }
}
