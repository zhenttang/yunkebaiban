import { EdgelessToolbarToolMixin } from '@blocksuite/yunke-widget-edgeless-toolbar';
import { css, html, LitElement } from 'lit';

export class EdgelessDeckerButton extends EdgelessToolbarToolMixin(LitElement) {
  static override styles = css`
    :host {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .decker-button {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: all 0.2s ease;
      font-size: 20px;
    }

    .decker-button:hover {
      background: var(--affine-hover-color);
    }

    .decker-button:active {
      background: var(--affine-pressed-color);
    }

    .decker-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  private _openDeckerModal() {
    // 发送消息到父窗口，通知打开Decker模态框
    window.dispatchEvent(new CustomEvent('open-decker-modal', {
      detail: { source: 'edgeless-toolbar' }
    }));
  }

  override render() {
    return html`
      <button
        class="decker-button"
        @click=${this._openDeckerModal}
        title="打开 Decker 绘画工具"
      >
        <span class="decker-icon">🎨</span>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-decker-button': EdgelessDeckerButton;
  }
}