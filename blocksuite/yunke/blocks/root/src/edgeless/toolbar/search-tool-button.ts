import { SearchIcon } from '@blocksuite/icons/lit';
import { QuickToolMixin } from '@blocksuite/yunke-widget-edgeless-toolbar';
import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import type { EdgelessSearchPanel } from './search-panel';

export class EdgelessSearchToolButton extends QuickToolMixin(LitElement) {
  static override styles = css`
    .search-icon,
    .search-icon > svg {
      width: 22px;
      height: 22px;
    }
  `;

  @property({ attribute: false })
  accessor panel: EdgelessSearchPanel | null = null;

  override firstUpdated() {
    if (!this.edgeless) {
      return;
    }
    this.edgeless.bindHotKey(
      {
        '$mod+shift+f': () => {
          this._togglePanel();
        },
      },
      { global: true }
    );
  }

  private readonly _handlePanelClose = () => {
    this._closePanel();
  };

  private _openPanel() {
    const popper = this.createPopper('edgeless-search-panel', this, {
      setProps: panel => {
        panel.edgeless = this.edgeless;
        panel.addEventListener('closepanel', this._handlePanelClose);
        this.panel = panel;
      },
      onDispose: () => {
        if (this.panel) {
          this.panel.removeEventListener('closepanel', this._handlePanelClose);
        }
        this.panel = null;
        this.requestUpdate();
      },
    });
    popper.element.edgeless = this.edgeless;
    this.requestUpdate();
  }

  private _closePanel() {
    if (this.popper) {
      this.popper.dispose();
    }
  }

  private _togglePanel() {
    if (this.popper) {
      this._closePanel();
      return;
    }
    this._openPanel();
  }

  override render() {
    const active = !!this.popper;

    return html`<edgeless-tool-icon-button
      .iconContainerPadding=${6}
      .tooltip=${html`<yunke-tooltip-content-with-shortcut
        data-tip="${'Canvas search'}"
      ></yunke-tooltip-content-with-shortcut>`}
      .tooltipOffset=${17}
      ?active=${active}
      @click=${this._togglePanel}
    >
      <span class="search-icon">${SearchIcon()}</span>
    </edgeless-tool-icon-button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-search-tool-button': EdgelessSearchToolButton;
  }
}
