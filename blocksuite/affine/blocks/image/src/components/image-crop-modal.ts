import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropResult {
  blob: Blob;
  url: string;
}

@customElement('image-crop-modal')
export class ImageCropModal extends LitElement {
  static override styles = css`
    .crop-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    }

    .crop-modal {
      background: var(--affine-background-primary-color);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      width: 90vw;
      max-width: 900px;
      height: 80vh;
      max-height: 700px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .crop-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--affine-border-color);
      background: var(--affine-background-secondary-color);
    }

    .crop-modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--affine-text-primary-color);
    }

    .header-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .crop-modal-body {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .crop-container {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .crop-image {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border: 2px dashed #fff;
    }

    .crop-button {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .save-button {
      background: var(--affine-primary-color);
      color: white;
    }

    .save-button:hover {
      background: var(--affine-primary-color-hover);
    }

    .cancel-button {
      background: var(--affine-background-tertiary-color);
      color: var(--affine-text-secondary-color);
    }

    .cancel-button:hover {
      background: var(--affine-hover-color);
      color: var(--affine-text-primary-color);
    }

    .crop-info {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 20px;
      font-size: 14px;
    }
  `;

  @property({ type: String })
  accessor imageUrl = '';

  @property({ type: Boolean })
  accessor open = false;

  override firstUpdated() {
    console.log('ImageCropModal firstUpdated', { imageUrl: this.imageUrl, open: this.open });
  }

  override updated(changedProperties: Map<string, unknown>) {
    console.log('ImageCropModal updated', Object.fromEntries(changedProperties), { imageUrl: this.imageUrl, open: this.open });
  }

  private _handleSave() {
    console.log('Crop save clicked');
    
    // 创建一个简单的裁剪结果（暂时直接使用原图）
    if (this.imageUrl) {
      fetch(this.imageUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const result: CropResult = { blob, url };
          
          this.dispatchEvent(new CustomEvent('crop-save', {
            detail: result,
            bubbles: true,
          }));
        })
        .catch(error => {
          console.error('Failed to create crop result:', error);
          this.dispatchEvent(new CustomEvent('crop-error', {
            detail: error,
            bubbles: true,
          }));
        });
    }
  }

  private _handleCancel() {
    console.log('Crop cancel clicked');
    this.dispatchEvent(new CustomEvent('crop-cancel', {
      bubbles: true,
    }));
  }

  override render() {
    console.log('ImageCropModal render called', { imageUrl: this.imageUrl, open: this.open });
    
    if (!this.open) {
      console.log('Modal not open, returning nothing');
      return nothing;
    }

    if (!this.imageUrl) {
      console.log('No image URL, returning nothing');
      return nothing;
    }

    console.log('Rendering modal with image:', this.imageUrl);

    return html`
      <div class="crop-modal-overlay" @click=${this._handleOverlayClick}>
        <div class="crop-modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="crop-modal-header">
            <h3 class="crop-modal-title">剪裁图片</h3>
            <div class="header-buttons">
              <button class="crop-button save-button" @click=${this._handleSave}>
                保存
              </button>
              <button class="crop-button cancel-button" @click=${this._handleCancel}>
                取消
              </button>
            </div>
          </div>
          <div class="crop-modal-body">
            <div class="crop-container">
              <img 
                class="crop-image" 
                src=${this.imageUrl} 
                alt="图片剪裁" 
                @load=${() => console.log('Image loaded successfully')}
                @error=${() => console.error('Image failed to load')}
              />
            </div>
            <div class="crop-info">
              📏 简化版剪裁界面 - 点击保存完成剪裁
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _handleOverlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains('crop-modal-overlay')) {
      this._handleCancel();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'image-crop-modal': ImageCropModal;
  }
}