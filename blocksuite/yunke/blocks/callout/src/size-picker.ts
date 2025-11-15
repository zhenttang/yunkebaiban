import { unsafeCSSVarV2 } from '@blocksuite/yunke-shared/theme';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

export type EmojiSize = 'small' | 'medium' | 'large';

const EMOJI_SIZES: Array<{ value: EmojiSize; label: string; preview: string }> = [
  { value: 'small', label: '小', preview: '1.0x' },
  { value: 'medium', label: '中', preview: '1.2x' },
  { value: 'large', label: '大', preview: '1.5x' },
];

export class CalloutSizePicker extends LitElement {
  static override styles = css`
    :host {
      display: block;
      background: ${unsafeCSSVarV2('layer/background/overlayPanel')};
      border-radius: 8px;
      padding: 8px;
      box-shadow: ${unsafeCSSVarV2('shadow/2')};
      border: 1px solid ${unsafeCSSVarV2('layer/insideBorder/border')};
    }

    .size-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 120px;
    }

    .size-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .size-item:hover {
      background: ${unsafeCSSVarV2('button/grabber/default')};
    }

    .size-item.selected {
      border-color: ${unsafeCSSVarV2('button/primary')};
      background: ${unsafeCSSVarV2('button/grabber/default')};
    }

    .size-label {
      font-size: 14px;
      color: ${unsafeCSSVarV2('text/secondary')};
    }

    .size-item.selected .size-label {
      color: ${unsafeCSSVarV2('text/primary')};
      font-weight: 500;
    }

    .size-preview {
      font-size: 12px;
      color: ${unsafeCSSVarV2('text/tertiary')};
      font-family: monospace;
    }

    .size-emoji {
      font-size: 14px;
      margin-left: 8px;
    }

    .size-item.selected .size-emoji {
      filter: brightness(1.2);
    }
  `;

  @property({ type: String })
  accessor selectedSize: EmojiSize = 'medium';

  @property({ attribute: false })
  accessor onSizeSelect: ((size: EmojiSize) => void) | null = null;

  private _handleSizeClick(size: EmojiSize) {
    this.selectedSize = size;
    this.onSizeSelect?.(size);
  }

  override render() {
    return html`
      <div class="size-list">
        ${EMOJI_SIZES.map(
          ({ value, label, preview }) => html`
            <div
              class="size-item ${this.selectedSize === value ? 'selected' : ''}"
              @click=${() => this._handleSizeClick(value)}
            >
              <span class="size-label">${label}</span>
              <div style="display: flex; align-items: center;">
                <span class="size-preview">${preview}</span>
                <span class="size-emoji" style="font-size: ${value === 'small' ? '14px' : value === 'medium' ? '16px' : '20px'}">😀</span>
              </div>
            </div>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-callout-size-picker': CalloutSizePicker;
  }
}
