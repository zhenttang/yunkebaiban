import { unsafeCSSVarV2 } from '@blocksuite/yunke-shared/theme';
import { LitElement, css, html } from 'lit';
import { property } from 'lit/decorators.js';

export type CalloutColor = 'grey' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple' | 'magenta' | 'teal';

const CALLOUT_COLORS: Array<{ value: CalloutColor; label: string }> = [
  { value: 'grey', label: '灰色' },
  { value: 'blue', label: '蓝色' },
  { value: 'green', label: '绿色' },
  { value: 'yellow', label: '黄色' },
  { value: 'red', label: '红色' },
  { value: 'orange', label: '橙色' },
  { value: 'purple', label: '紫色' },
  { value: 'magenta', label: '品红' },
  { value: 'teal', label: '青绿' },
];

export class CalloutColorPicker extends LitElement {
  static override styles = css`
    :host {
      display: block;
      background: ${unsafeCSSVarV2('layer/background/overlayPanel')};
      border-radius: 8px;
      padding: 8px;
      box-shadow: ${unsafeCSSVarV2('shadow/2')};
      border: 1px solid ${unsafeCSSVarV2('layer/insideBorder/border')};
    }

    .color-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }

    .color-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .color-item:hover {
      background: ${unsafeCSSVarV2('button/grabber/default')};
    }

    .color-item.selected {
      border-color: ${unsafeCSSVarV2('button/primary')};
      background: ${unsafeCSSVarV2('button/grabber/default')};
    }

    .color-preview {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      margin-bottom: 4px;
      border: 1px solid ${unsafeCSSVarV2('layer/insideBorder/border')};
    }

    .color-label {
      font-size: 12px;
      color: ${unsafeCSSVarV2('text/secondary')};
      white-space: nowrap;
    }

    .color-item.selected .color-label {
      color: ${unsafeCSSVarV2('text/primary')};
      font-weight: 500;
    }
  `;

  @property({ type: String })
  accessor selectedColor: CalloutColor = 'grey';

  @property({ attribute: false })
  accessor onColorSelect: ((color: CalloutColor) => void) | null = null;

  private _handleColorClick(color: CalloutColor) {
    this.selectedColor = color;
    this.onColorSelect?.(color);
  }

  override render() {
    return html`
      <div class="color-grid">
        ${CALLOUT_COLORS.map(
          ({ value, label }) => html`
            <div
              class="color-item ${this.selectedColor === value ? 'selected' : ''}"
              @click=${() => this._handleColorClick(value)}
            >
              <div
                class="color-preview"
                style="background-color: var(--yunke-v2-block-callout-background-${value})"
              ></div>
              <div class="color-label">${label}</div>
            </div>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-callout-color-picker': CalloutColorPicker;
  }
}
