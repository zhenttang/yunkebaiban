import type { BlockCaptionEditor } from '@blocksuite/yunke-components/caption';
import { LoadingIcon } from '@blocksuite/yunke-components/icons';
import { Peekable } from '@blocksuite/yunke-components/peek';
import { ResourceController } from '@blocksuite/yunke-components/resource';
import {
  type ImageBlockModel,
  ImageBlockSchema,
} from '@blocksuite/yunke-model';
import { cssVarV2, unsafeCSSVarV2 } from '@blocksuite/yunke-shared/theme';
import { formatSize } from '@blocksuite/yunke-shared/utils';
import { BrokenImageIcon, ImageIcon } from '@blocksuite/icons/lit';
import { GfxBlockComponent } from '@blocksuite/std';
import { GfxViewInteractionExtension } from '@blocksuite/std/gfx';
import { computed } from '@preact/signals-core';
import { css, html, nothing } from 'lit';
import { query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import type { CropResult } from './components/image-crop-modal.js';
import './components/image-crop-modal.js';
import {
  copyImageBlob,
  downloadImageBlob,
  refreshData,
  turnImageIntoCardView,
} from './utils';

@Peekable()
export class ImageEdgelessBlockComponent extends GfxBlockComponent<ImageBlockModel> {
  static override styles = css`
    yunke-edgeless-image {
      position: relative;
    }

    yunke-edgeless-image .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 4px;
      right: 4px;
      width: 36px;
      height: 36px;
      padding: 5px;
      border-radius: 8px;
      background: ${unsafeCSSVarV2(
        'loading/imageLoadingBackground',
        '#92929238'
      )};

      & > svg {
        font-size: 25.71px;
      }
    }

    yunke-edgeless-image .yunke-image-status {
      position: absolute;
      left: 18px;
      bottom: 18px;
    }

    yunke-edgeless-image .resizable-img,
    yunke-edgeless-image .resizable-img img {
      width: 100%;
      height: 100%;
      pointer-events: none; /* 禁用图片的所有鼠标事件 */
      user-select: none; /* 禁止选择 */
      -webkit-user-drag: none; /* 禁止拖拽 */
    }

    yunke-edgeless-image .resizable-img img.pixelated {
      image-rendering: pixelated;
      image-rendering: -moz-crisp-edges;
      image-rendering: crisp-edges;
    }

    yunke-edgeless-image.crop-mode .resizable-img,
    yunke-edgeless-image.crop-mode .resizable-img img {
      pointer-events: none !important; /* 在剪裁模式下强制禁用 */
    }

    yunke-edgeless-image .crop-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }

    yunke-edgeless-image.crop-mode .crop-overlay {
      pointer-events: all; /* 在剪裁模式下启用覆盖层事件 */
    }

    yunke-edgeless-image .crop-mask {
      position: absolute;
      background: rgba(0, 0, 0, 0.5);
      pointer-events: none;
    }

    yunke-edgeless-image .crop-mask.top {
      top: 0;
      left: 0;
      right: 0;
    }

    yunke-edgeless-image .crop-mask.bottom {
      left: 0;
      right: 0;
      bottom: 0;
    }

    yunke-edgeless-image .crop-mask.left {
      left: 0;
    }

    yunke-edgeless-image .crop-mask.right {
      right: 0;
    }

    yunke-edgeless-image .crop-area {
      position: absolute;
      border: 2px dashed #00a6fb;
      background: transparent;
      pointer-events: all;
      cursor: move;
    }

    yunke-edgeless-image .crop-area::before {
      content: none; /* 移除之前的虚线边框 */
    }

    yunke-edgeless-image .crop-handle {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #00a6fb;
      border: 2px solid #ffffff;
      border-radius: 50%;
      pointer-events: all;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    yunke-edgeless-image .crop-handle.nw {
      top: -7px;
      left: -7px;
      cursor: nw-resize;
    }

    yunke-edgeless-image .crop-handle.ne {
      top: -7px;
      right: -7px;
      cursor: ne-resize;
    }

    yunke-edgeless-image .crop-handle.sw {
      bottom: -7px;
      left: -7px;
      cursor: sw-resize;
    }

    yunke-edgeless-image .crop-handle.se {
      bottom: -7px;
      right: -7px;
      cursor: se-resize;
    }

    yunke-edgeless-image .crop-handle.n {
      top: -7px;
      left: 50%;
      transform: translateX(-50%);
      cursor: n-resize;
    }

    yunke-edgeless-image .crop-handle.s {
      bottom: -7px;
      left: 50%;
      transform: translateX(-50%);
      cursor: s-resize;
    }

    yunke-edgeless-image .crop-handle.w {
      top: 50%;
      left: -7px;
      transform: translateY(-50%);
      cursor: w-resize;
    }

    yunke-edgeless-image .crop-handle.e {
      top: 50%;
      right: -7px;
      transform: translateY(-50%);
      cursor: e-resize;
    }

    yunke-edgeless-image .crop-controls {
      position: absolute;
      top: -50px;
      right: 0;
      display: flex;
      gap: 12px;
      background: rgba(255, 255, 255, 0.95);
      padding: 8px 16px;
      border-radius: 20px;
      pointer-events: all;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    yunke-edgeless-image .crop-button {
      padding: 6px 16px;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
      white-space: nowrap;
    }

    yunke-edgeless-image .crop-save {
      background: #00a6fb;
      color: white;
    }

    yunke-edgeless-image .crop-save:hover {
      background: #0090e3;
    }

    yunke-edgeless-image .crop-cancel {
      background: transparent;
      color: #666;
      border: 1px solid #ddd;
    }

    yunke-edgeless-image .crop-cancel:hover {
      background: #f5f5f5;
    }

    yunke-edgeless-image.crop-mode {
      cursor: crosshair;
    }

    yunke-edgeless-image.crop-mode .resizable-img,
    yunke-edgeless-image.crop-mode .resizable-img img {
      pointer-events: none !important; /* 在剪裁模式下强制禁用 */
      position: relative; /* 确保图片位置固定 */
      transform: none !important; /* 禁止任何变换 */
    }

    /* 在剪裁模式下禁用所有可能的交互 */
    yunke-edgeless-image.crop-mode,
    yunke-edgeless-image.crop-mode *:not(.crop-overlay):not(.crop-overlay *) {
      pointer-events: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      -webkit-user-drag: none !important;
      -moz-user-drag: none !important;
      user-drag: none !important;
      touch-action: none !important;
    }

    /* 强制禁用拖拽相关样式 */
    yunke-edgeless-image.crop-mode .yunke-image-container,
    yunke-edgeless-image.crop-mode .resizable-img,
    yunke-edgeless-image.crop-mode img {
      cursor: default !important;
      pointer-events: none !important;
      transform: none !important;
      position: relative !important;
    }

    /* 确保剪裁覆盖层在最顶层并可交互 */
    yunke-edgeless-image.crop-mode .crop-overlay {
      pointer-events: all !important;
      z-index: 999999 !important;
    }
  `;

  resourceController = new ResourceController(
    computed(() => this.model.props.sourceId$.value),
    'Image'
  );

  @state()
  private accessor _cropModalOpen = false;

  @state()
  private accessor _cropMode = false;

  @state()
  private accessor _cropArea = { x: 0, y: 0, width: 0, height: 0 };

  @state()
  private accessor _isDragging = false;

  private _cropModeEventHandlers: Array<{ event: string; handler: EventListener }> | null = null;

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
    console.log('openCropModal called (edgeless)', { blobUrl: this.blobUrl, cropMode: this._cropMode });
    if (!this.blobUrl) {
      console.log('No blobUrl available');
      return;
    }
    console.log('Entering crop mode...');
    this._cropMode = true;
    
    // 禁用组件的所有交互
    this._disableBlockInteractions();
    
    // 初始化剪裁区域为图片的中心部分
    setTimeout(() => {
      this._initializeCropArea();
    }, 100);
    
    // 强制更新组件以确保状态变化被渲染
    this.requestUpdate();
  };

  private _disableBlockInteractions() {
    // 彻底阻止所有可能的拖拽和交互事件
    const preventAllHandler = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // 只允许剪裁覆盖层及其子元素的事件
      if (target.closest('.crop-overlay')) {
        return; // 允许剪裁相关事件
      }
      
      // 阻止所有其他事件
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    // 添加所有可能的事件监听器
    const events = [
      'mousedown', 'mousemove', 'mouseup',
      'dragstart', 'drag', 'dragend', 'dragover', 'drop',
      'touchstart', 'touchmove', 'touchend',
      'pointerdown', 'pointermove', 'pointerup',
      'click', 'dblclick'
    ];

    events.forEach(eventType => {
      this.addEventListener(eventType, preventAllHandler, { 
        capture: true, 
        passive: false 
      });
    });
    
    // 保存引用以便后续移除
    this._cropModeEventHandlers = events.map(event => ({
      event,
      handler: preventAllHandler
    }));
  }

  private _enableBlockInteractions() {
    // 移除所有事件监听器
    if (this._cropModeEventHandlers) {
      this._cropModeEventHandlers.forEach(({ event, handler }) => {
        this.removeEventListener(event, handler, { capture: true });
      });
      this._cropModeEventHandlers = null;
    }
  }

  private _initializeCropArea() {
    const imgElement = this.querySelector('img') || this.querySelector('.yunke-image-container img');
    if (imgElement) {
      const containerRect = this.getBoundingClientRect();
      const imgRect = imgElement.getBoundingClientRect();
      
      // 计算图片相对于容器的位置
      const imgOffsetX = imgRect.left - containerRect.left;
      const imgOffsetY = imgRect.top - containerRect.top;
      
      // 设置初始剪裁区域为图片中心的70%，确保在图片范围内
      const cropRatio = 0.7;
      const cropWidth = imgRect.width * cropRatio;
      const cropHeight = imgRect.height * cropRatio;
      const cropX = imgOffsetX + (imgRect.width - cropWidth) / 2;
      const cropY = imgOffsetY + (imgRect.height - cropHeight) / 2;
      
      this._cropArea = {
        x: Math.max(imgOffsetX, cropX),
        y: Math.max(imgOffsetY, cropY),
        width: Math.min(cropWidth, imgRect.width),
        height: Math.min(cropHeight, imgRect.height)
      };
      
      console.log('Initialized crop area:', {
        cropArea: this._cropArea,
        containerRect,
        imgRect,
        imgOffset: { x: imgOffsetX, y: imgOffsetY }
      });
      
      this.requestUpdate();
    }
  }

  exitCropMode = () => {
    console.log('Exiting crop mode');
    this._cropMode = false;
    this._cropArea = { x: 0, y: 0, width: 0, height: 0 };
    
    // 恢复组件交互
    this._enableBlockInteractions();
    
    this.requestUpdate();
  };

  saveCrop = async () => {
    console.log('Saving crop with area:', this._cropArea);
    
    try {
      if (this.blobUrl && this._cropArea.width > 0 && this._cropArea.height > 0) {
        // 创建canvas进行图片剪裁
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = async () => {
          // 获取图片元素和容器元素
          const imgElement = this.querySelector('img') || this.querySelector('.yunke-image-container img');
          if (!imgElement || !ctx) return;
          
          const containerRect = this.getBoundingClientRect();
          const imgRect = imgElement.getBoundingClientRect();
          
          // 计算图片在容器中的实际显示区域
          const imgDisplayWidth = imgRect.width;
          const imgDisplayHeight = imgRect.height;
          const imgOffsetX = imgRect.left - containerRect.left;
          const imgOffsetY = imgRect.top - containerRect.top;
          
          // 计算剪裁区域相对于图片的位置
          const cropRelativeX = Math.max(0, this._cropArea.x - imgOffsetX);
          const cropRelativeY = Math.max(0, this._cropArea.y - imgOffsetY);
          const cropRelativeWidth = Math.min(this._cropArea.width, imgDisplayWidth - cropRelativeX);
          const cropRelativeHeight = Math.min(this._cropArea.height, imgDisplayHeight - cropRelativeY);
          
          // 计算缩放比例（原图尺寸 vs 显示尺寸）
          const scaleX = img.naturalWidth / imgDisplayWidth;
          const scaleY = img.naturalHeight / imgDisplayHeight;
          
          // 计算在原图中的剪裁区域
          const sourceX = cropRelativeX * scaleX;
          const sourceY = cropRelativeY * scaleY;
          const sourceWidth = cropRelativeWidth * scaleX;
          const sourceHeight = cropRelativeHeight * scaleY;
          
          // 设置canvas大小为剪裁区域大小
          canvas.width = sourceWidth;
          canvas.height = sourceHeight;
          
          console.log('Crop calculation:', {
            cropArea: this._cropArea,
            imgDisplay: { width: imgDisplayWidth, height: imgDisplayHeight },
            imgNatural: { width: img.naturalWidth, height: img.naturalHeight },
            source: { x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight },
            scale: { x: scaleX, y: scaleY }
          });
          
          // 绘制剪裁后的图片
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, sourceWidth, sourceHeight
          );
          
          // 转换为blob
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                // 为了避免"Blob已存在"错误，我们给blob添加一个时间戳标识
                const timestamp = Date.now();
                const modifiedBlob = new Blob([blob], { 
                  type: blob.type 
                });
                
                // 添加自定义属性来区分不同的剪裁操作
                Object.defineProperty(modifiedBlob, 'cropTimestamp', {
                  value: timestamp,
                  writable: false
                });
                
                const blobSync = this.std.store.blobSync;
                const sourceId = await blobSync.set(modifiedBlob);
                
                // 更新模型
                this.std.store.updateBlock(this.model, {
                  sourceId,
                });
                
                console.log('Crop saved successfully with sourceId:', sourceId);
                
                // 恢复组件交互
                this._enableBlockInteractions();
                
                this.exitCropMode();
              } catch (error) {
                console.error('Failed to save cropped image:', error);
                if (error.message && error.message.includes('Blob 已存在')) {
                  // 如果是重复blob错误，尝试使用原始blob但仍然退出剪裁模式
                  console.log('Blob already exists, using original image');
                  this._enableBlockInteractions();
                  this.exitCropMode();
                } else {
                  this._enableBlockInteractions();
                  throw error;
                }
              }
            }
          }, 'image/png');
        };
        
        img.crossOrigin = 'anonymous';
        img.src = this.blobUrl;
      }
    } catch (error) {
      console.error('Failed to save cropped image:', error);
      this._enableBlockInteractions();
      this.exitCropMode();
    }
  };

  private _createGlobalModal() {
    // 移除可能存在的旧模态框
    const existingModal = document.querySelector('image-crop-modal[data-global="true"]');
    if (existingModal) {
      existingModal.remove();
    }

    // 检查自定义元素是否已注册
    if (!customElements.get('image-crop-modal')) {
      console.error('image-crop-modal element is not registered');
      // 创建一个简单的原生模态框作为备选
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
    
    // 检查模态框是否正确添加到DOM
    setTimeout(() => {
      const addedModal = document.querySelector('image-crop-modal[data-global="true"]');
      console.log('Modal in DOM after creation:', addedModal);
      if (addedModal) {
        console.log('Modal computed style:', getComputedStyle(addedModal as Element));
      }
    }, 100);
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

  private _handleCropAreaMouseDown = (e: MouseEvent) => {
    // 只有在剪裁区域内但不在控制点上的地方才处理移动
    if ((e.target as HTMLElement).classList.contains('crop-handle')) {
      return; // 让控制点处理它们自己的事件
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const containerRect = this.getBoundingClientRect();
    const startX = e.clientX - containerRect.left;
    const startY = e.clientY - containerRect.top;
    
    // 获取图片边界
    const imgElement = this.querySelector('img') || this.querySelector('.yunke-image-container img');
    if (!imgElement) return;
    
    const imgRect = imgElement.getBoundingClientRect();
    const imgOffsetX = imgRect.left - containerRect.left;
    const imgOffsetY = imgRect.top - containerRect.top;
    const imgMaxX = imgOffsetX + imgRect.width;
    const imgMaxY = imgOffsetY + imgRect.height;
    
    // 计算鼠标相对于剪裁框的偏移
    const offsetX = startX - this._cropArea.x;
    const offsetY = startY - this._cropArea.y;
    
    this._isDragging = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = this.getBoundingClientRect();
      const newX = e.clientX - containerRect.left - offsetX;
      const newY = e.clientY - containerRect.top - offsetY;
      
      // 确保剪裁框在图片范围内
      const boundedX = Math.max(imgOffsetX, Math.min(newX, imgMaxX - this._cropArea.width));
      const boundedY = Math.max(imgOffsetY, Math.min(newY, imgMaxY - this._cropArea.height));
      
      this._cropArea = {
        ...this._cropArea,
        x: boundedX,
        y: boundedY
      };
      this.requestUpdate();
    };
    
    const handleMouseUp = () => {
      this._isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      this.requestUpdate();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  private _handleResizeMouseDown = (e: MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const containerRect = this.getBoundingClientRect();
    const startX = e.clientX - containerRect.left;
    const startY = e.clientY - containerRect.top;
    
    // 获取图片边界
    const imgElement = this.querySelector('img') || this.querySelector('.yunke-image-container img');
    if (!imgElement) return;
    
    const imgRect = imgElement.getBoundingClientRect();
    const imgOffsetX = imgRect.left - containerRect.left;
    const imgOffsetY = imgRect.top - containerRect.top;
    const imgMaxX = imgOffsetX + imgRect.width;
    const imgMaxY = imgOffsetY + imgRect.height;
    
    // 记录初始剪裁区域
    const initialCropArea = { ...this._cropArea };
    
    this._isDragging = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = this.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left;
      const currentY = e.clientY - containerRect.top;
      
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      
      let newCropArea = { ...initialCropArea };
      
      // 根据拖拽方向调整剪裁区域
      switch (direction) {
        case 'nw':
          newCropArea.x = Math.max(imgOffsetX, Math.min(initialCropArea.x + deltaX, initialCropArea.x + initialCropArea.width - 20));
          newCropArea.y = Math.max(imgOffsetY, Math.min(initialCropArea.y + deltaY, initialCropArea.y + initialCropArea.height - 20));
          newCropArea.width = initialCropArea.width - (newCropArea.x - initialCropArea.x);
          newCropArea.height = initialCropArea.height - (newCropArea.y - initialCropArea.y);
          break;
        case 'ne':
          newCropArea.y = Math.max(imgOffsetY, Math.min(initialCropArea.y + deltaY, initialCropArea.y + initialCropArea.height - 20));
          newCropArea.width = Math.max(20, Math.min(initialCropArea.width + deltaX, imgMaxX - initialCropArea.x));
          newCropArea.height = initialCropArea.height - (newCropArea.y - initialCropArea.y);
          break;
        case 'sw':
          newCropArea.x = Math.max(imgOffsetX, Math.min(initialCropArea.x + deltaX, initialCropArea.x + initialCropArea.width - 20));
          newCropArea.width = initialCropArea.width - (newCropArea.x - initialCropArea.x);
          newCropArea.height = Math.max(20, Math.min(initialCropArea.height + deltaY, imgMaxY - initialCropArea.y));
          break;
        case 'se':
          newCropArea.width = Math.max(20, Math.min(initialCropArea.width + deltaX, imgMaxX - initialCropArea.x));
          newCropArea.height = Math.max(20, Math.min(initialCropArea.height + deltaY, imgMaxY - initialCropArea.y));
          break;
        case 'n':
          newCropArea.y = Math.max(imgOffsetY, Math.min(initialCropArea.y + deltaY, initialCropArea.y + initialCropArea.height - 20));
          newCropArea.height = initialCropArea.height - (newCropArea.y - initialCropArea.y);
          break;
        case 's':
          newCropArea.height = Math.max(20, Math.min(initialCropArea.height + deltaY, imgMaxY - initialCropArea.y));
          break;
        case 'w':
          newCropArea.x = Math.max(imgOffsetX, Math.min(initialCropArea.x + deltaX, initialCropArea.x + initialCropArea.width - 20));
          newCropArea.width = initialCropArea.width - (newCropArea.x - initialCropArea.x);
          break;
        case 'e':
          newCropArea.width = Math.max(20, Math.min(initialCropArea.width + deltaX, imgMaxX - initialCropArea.x));
          break;
      }
      
      this._cropArea = newCropArea;
      this.requestUpdate();
    };
    
    const handleMouseUp = () => {
      this._isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      this.requestUpdate();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  private _handleContainerMouseDown = (e: MouseEvent) => {
    if (!this._cropMode) return;
    
    // 如果点击在剪裁区域或控制点上，不处理
    const target = e.target as HTMLElement;
    if (target.closest('.crop-area') || target.classList.contains('crop-handle')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const containerRect = this.getBoundingClientRect();
    const startX = e.clientX - containerRect.left;
    const startY = e.clientY - containerRect.top;
    
    // 获取图片的实际边界
    const imgElement = this.querySelector('img') || this.querySelector('.yunke-image-container img');
    if (!imgElement) return;
    
    const imgRect = imgElement.getBoundingClientRect();
    const imgOffsetX = imgRect.left - containerRect.left;
    const imgOffsetY = imgRect.top - containerRect.top;
    const imgMaxX = imgOffsetX + imgRect.width;
    const imgMaxY = imgOffsetY + imgRect.height;
    
    // 只有在图片区域内才能创建新的剪裁框
    if (startX >= imgOffsetX && startX <= imgMaxX && startY >= imgOffsetY && startY <= imgMaxY) {
      // 创建新的剪裁框
      this._isDragging = true;
      this._cropArea = {
        x: startX,
        y: startY,
        width: 0,
        height: 0
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        const containerRect = this.getBoundingClientRect();
        const currentX = e.clientX - containerRect.left;
        const currentY = e.clientY - containerRect.top;
        
        // 确保剪裁框在图片范围内
        const boundedCurrentX = Math.max(imgOffsetX, Math.min(currentX, imgMaxX));
        const boundedCurrentY = Math.max(imgOffsetY, Math.min(currentY, imgMaxY));
        const boundedStartX = Math.max(imgOffsetX, Math.min(startX, imgMaxX));
        const boundedStartY = Math.max(imgOffsetY, Math.min(startY, imgMaxY));
        
        this._cropArea = {
          x: Math.min(boundedStartX, boundedCurrentX),
          y: Math.min(boundedStartY, boundedCurrentY),
          width: Math.abs(boundedCurrentX - boundedStartX),
          height: Math.abs(boundedCurrentY - boundedStartY)
        };
        this.requestUpdate();
      };
      
      const handleMouseUp = () => {
        this._isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        this.requestUpdate();
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
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
      this._removeGlobalModal();
    } catch (error) {
      console.error('Failed to save cropped image:', error);
    }
  };

  private _handleCropCancel = () => {
    console.log('Crop cancelled, closing modal (edgeless)');
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

  private _renderCropOverlay() {
    if (!this._cropMode) {
      return nothing;
    }

    const cropAreaStyle = styleMap({
      left: `${this._cropArea.x}px`,
      top: `${this._cropArea.y}px`,
      width: `${this._cropArea.width}px`,
      height: `${this._cropArea.height}px`,
    });

    // 计算图片区域
    const imgElement = this.querySelector('img') || this.querySelector('.yunke-image-container img');
    let imgBounds = { x: 0, y: 0, width: 0, height: 0 };
    
    if (imgElement) {
      const containerRect = this.getBoundingClientRect();
      const imgRect = imgElement.getBoundingClientRect();
      imgBounds = {
        x: imgRect.left - containerRect.left,
        y: imgRect.top - containerRect.top,
        width: imgRect.width,
        height: imgRect.height
      };
    }

    // 计算遮罩区域
    const topMaskStyle = styleMap({
      top: `${imgBounds.y}px`,
      left: `${imgBounds.x}px`,
      width: `${imgBounds.width}px`,
      height: `${Math.max(0, this._cropArea.y - imgBounds.y)}px`,
    });

    const bottomMaskStyle = styleMap({
      top: `${this._cropArea.y + this._cropArea.height}px`,
      left: `${imgBounds.x}px`,
      width: `${imgBounds.width}px`,
      height: `${Math.max(0, imgBounds.y + imgBounds.height - (this._cropArea.y + this._cropArea.height))}px`,
    });

    const leftMaskStyle = styleMap({
      top: `${this._cropArea.y}px`,
      left: `${imgBounds.x}px`,
      width: `${Math.max(0, this._cropArea.x - imgBounds.x)}px`,
      height: `${this._cropArea.height}px`,
    });

    const rightMaskStyle = styleMap({
      top: `${this._cropArea.y}px`,
      left: `${this._cropArea.x + this._cropArea.width}px`,
      width: `${Math.max(0, imgBounds.x + imgBounds.width - (this._cropArea.x + this._cropArea.width))}px`,
      height: `${this._cropArea.height}px`,
    });

    return html`
      <div class="crop-overlay" @mousedown=${this._handleContainerMouseDown}>
        <!-- 四个遮罩区域 -->
        ${this._cropArea.width > 0 && this._cropArea.height > 0 
          ? html`
              <div class="crop-mask top" style=${topMaskStyle}></div>
              <div class="crop-mask bottom" style=${bottomMaskStyle}></div>
              <div class="crop-mask left" style=${leftMaskStyle}></div>
              <div class="crop-mask right" style=${rightMaskStyle}></div>
            `
          : html`
              <!-- 全屏遮罩当没有剪裁区域时 -->
              <div class="crop-mask" style="top: ${imgBounds.y}px; left: ${imgBounds.x}px; width: ${imgBounds.width}px; height: ${imgBounds.height}px;"></div>
            `
        }
        
        <!-- 剪裁区域 -->
        ${this._cropArea.width > 0 && this._cropArea.height > 0 
          ? html`
              <div class="crop-area" style=${cropAreaStyle} @mousedown=${this._handleCropAreaMouseDown}>
                <!-- 八个调整大小的控制点 -->
                <div class="crop-handle nw" @mousedown=${(e: MouseEvent) => this._handleResizeMouseDown(e, 'nw')}></div>
                <div class="crop-handle n" @mousedown=${(e: MouseEvent) => this._handleResizeMouseDown(e, 'n')}></div>
                <div class="crop-handle ne" @mousedown=${(e: MouseEvent) => this._handleResizeMouseDown(e, 'ne')}></div>
                <div class="crop-handle w" @mousedown=${(e: MouseEvent) => this._handleResizeMouseDown(e, 'w')}></div>
                <div class="crop-handle e" @mousedown=${(e: MouseEvent) => this._handleResizeMouseDown(e, 'e')}></div>
                <div class="crop-handle sw" @mousedown=${(e: MouseEvent) => this._handleResizeMouseDown(e, 'sw')}></div>
                <div class="crop-handle s" @mousedown=${(e: MouseEvent) => this._handleResizeMouseDown(e, 's')}></div>
                <div class="crop-handle se" @mousedown=${(e: MouseEvent) => this._handleResizeMouseDown(e, 'se')}></div>
                
                <div class="crop-controls">
                  <button class="crop-button crop-cancel" @click=${this.exitCropMode}>
                    取消剪裁
                  </button>
                  <button class="crop-button crop-save" @click=${this.saveCrop}>
                    完成
                  </button>
                </div>
              </div>
            `
          : nothing
        }
      </div>
    `;
  }

  private _handleError() {
    this.resourceController.updateState({
      errorMessage: 'Failed to download image!',
    });
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

    // 添加剪裁事件监听器
    this.disposables.addFromEvent(this, 'crop-save', this._handleCropSave);
    this.disposables.addFromEvent(this, 'crop-cancel', this._handleCropCancel);
    this.disposables.addFromEvent(this, 'crop-error', this._handleCropError);
  }

  override renderGfxBlock() {
    const blobUrl = this.blobUrl;
    const { rotate = 0, size = 0, caption = 'Image' } = this.model.props;
    const imageRendering = this.model.props.imageRendering$.value ?? 'auto';

    const containerStyleMap = styleMap({
      display: 'flex',
      position: 'relative',
      width: '100%',
      height: '100%',
      transform: `rotate(${rotate}deg)`,
      transformOrigin: 'center',
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

    const { loading, icon, description, error, needUpload } = resovledState;

    return html`
      <div
        class="yunke-image-container ${this._cropMode ? 'crop-mode' : ''}"
        style=${containerStyleMap}
      >
        ${when(
          blobUrl,
          () => html`
            <div class="resizable-img">
              <img
                class=${classMap({
                  'drag-target': true,
                  pixelated: imageRendering === 'pixelated',
                })}
                draggable="false"
                loading="lazy"
                src=${blobUrl}
                alt=${caption}
                @error=${this._handleError}
              />
            </div>
            ${when(loading, () => html`<div class="loading">${icon}</div>`)}
            ${when(
              Boolean(error && description),
              () =>
                html`<yunke-resource-status
                  class="yunke-image-status"
                  .message=${description}
                  .needUpload=${needUpload}
                  .action=${() =>
                    needUpload
                      ? this.resourceController.upload()
                      : this.refreshData()}
                ></yunke-resource-status>`
            )}
            ${this._renderCropOverlay()}
          `,
          () =>
            html`<yunke-image-fallback-card
              .state=${resovledState}
            ></yunke-image-fallback-card>`
        )}
        <yunke-block-selection .block=${this}></yunke-block-selection>
      </div>
      <block-caption-editor></block-caption-editor>

      <image-crop-modal
        .imageUrl=${blobUrl || ''}
        .open=${this._cropModalOpen}
      ></image-crop-modal>

      ${Object.values(this.widgets)}
    `;
  }

  @query('block-caption-editor')
  accessor captionEditor!: BlockCaptionEditor | null;

  @query('.resizable-img')
  accessor resizableImg!: HTMLDivElement;
}

export const ImageEdgelessBlockInteraction = GfxViewInteractionExtension(
  ImageBlockSchema.model.flavour,
  {
    resizeConstraint: {
      lockRatio: true,
    },
  }
);

declare global {
  interface HTMLElementTagNameMap {
    'yunke-edgeless-image': ImageEdgelessBlockComponent;
  }
}
