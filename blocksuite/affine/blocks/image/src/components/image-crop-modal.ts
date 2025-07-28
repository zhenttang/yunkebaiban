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
    :host {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 999999 !important;
      pointer-events: none;
    }
    
    :host([open]) {
      pointer-events: auto !important;
    }
    
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
      width: 100vw;
      height: 100vh;
    }

    .crop-modal {
      background: white;
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
      border-bottom: 1px solid #e0e0e0;
      background: #f5f5f5;
    }

    .crop-modal-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
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
      background: #007bff;
      color: white;
    }

    .save-button:hover {
      background: #0056b3;
    }

    .cancel-button {
      background: #6c757d;
      color: white;
    }

    .cancel-button:hover {
      background: #545b62;
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
    
    // 更新主机元素的属性以反映open状态
    if (changedProperties.has('open')) {
      if (this.open) {
        this.setAttribute('open', '');
        console.log('Modal should be opening now!');
      } else {
        this.removeAttribute('open');
        console.log('Modal should be closing now!');
      }
      // 强制重新渲染
      this.requestUpdate();
    }
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
    
    // 总是渲染模态框，但通过CSS控制显示
    if (!this.imageUrl && this.open) {
      console.log('No image URL but modal is open');
      return html`
        <div class="crop-modal-overlay">
          <div class="crop-modal">
            <div class="crop-modal-header">
              <h3 class="crop-modal-title">剪裁图片</h3>
              <div class="header-buttons">
                <button class="crop-button cancel-button" @click=${this._handleCancel}>
                  取消
                </button>
              </div>
            </div>
            <div class="crop-modal-body">
              <div style="color: white; font-size: 16px;">
                图片加载中...
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    if (!this.open) {
      console.log('Modal not open, returning empty template but keeping in DOM');
      return html``;
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