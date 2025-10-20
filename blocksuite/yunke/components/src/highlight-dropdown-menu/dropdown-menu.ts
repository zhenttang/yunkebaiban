import type { YunkeTextAttributes } from '@blocksuite/yunke-shared/types';
import { PropTypes, requiredProperties } from '@blocksuite/std';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat.js';

import { EditorChevronDown } from '../toolbar';

const colors = [
  'default',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'grey',
] as const;

type HighlightType = 'color' | 'background';

// TODO(@fundon): these recent settings should be added to the dropdown menu
// tests/blocksutie/e2e/format-bar.spec.ts#253
//
// let latestHighlightColor: string | null = null;
// let latestHighlightType: HighlightType = 'background';

@requiredProperties({
  updateHighlight: PropTypes.instanceOf(Function),
})
export class HighlightDropdownMenu extends LitElement {
  @property({ attribute: false })
  accessor updateHighlight!: (styles: YunkeTextAttributes) => void;

  private readonly _update = (value: string | null, type: HighlightType) => {
    // latestHighlightColor = value;
    // latestHighlightType = type;

    this.updateHighlight({ [`${type}`]: value });
  };

  override render() {
    const prefix = '--yunke-text-highlight';

    return html`
      <editor-menu-button
        .contentPadding="${'8px'}"
        .button=${html`
          <editor-icon-button aria-label="高亮" .tooltip="${'高亮'}">
            <yunke-highlight-duotone-icon
              style=${styleMap({
                '--color':
                  // latestHighlightColor ?? 'var(--yunke-text-primary-color)',
                  'var(--yunke-text-primary-color)',
              })}
            ></yunke-highlight-duotone-icon>
            ${EditorChevronDown}
          </editor-icon-button>
        `}
      >
        <div data-size="large" data-orientation="vertical">
          <div class="highlight-heading">颜色</div>
          ${repeat(colors, color => {
            const isDefault = color === 'default';
            const value = isDefault
              ? null
              : `var(${prefix}-foreground-${color})`;
            return html`
              <editor-menu-action
                data-testid="foreground-${color}"
                @click=${() => this._update(value, 'color')}
              >
                <yunke-text-duotone-icon
                  style=${styleMap({
                    '--color': value ?? 'var(--yunke-text-primary-color)',
                  })}
                ></yunke-text-duotone-icon>
                <span class="label capitalize"
                  >${isDefault ? `${color === 'default' ? '默认' : color} 颜色` : color}</span
                >
              </editor-menu-action>
            `;
          })}

          <div class="highlight-heading">背景</div>
          ${repeat(colors, color => {
            const isDefault = color === 'default';
            const value = isDefault ? null : `var(${prefix}-${color})`;
            return html`
              <editor-menu-action
                data-testid="background-${color}"
                @click=${() => this._update(value, 'background')}
              >
                <yunke-text-duotone-icon
                  style=${styleMap({
                    '--color': 'var(--yunke-text-primary-color)',
                    '--background': value ?? 'transparent',
                  })}
                ></yunke-text-duotone-icon>

                <span class="label capitalize"
                  >${isDefault ? `${color === 'default' ? '默认' : color} 背景` : color}</span
                >
              </editor-menu-action>
            `;
          })}
        </div>
      </editor-menu-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-highlight-dropdown-menu': HighlightDropdownMenu;
  }
}
