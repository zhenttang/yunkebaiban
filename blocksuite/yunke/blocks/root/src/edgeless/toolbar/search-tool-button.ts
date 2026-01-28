import { SearchIcon } from '@blocksuite/icons/lit';
import { QuickToolMixin } from '@blocksuite/yunke-widget-edgeless-toolbar';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';

import {
  type EdgelessSearchModal,
  openEdgelessSearchModal,
} from './search-panel';

export class EdgelessSearchToolButton extends QuickToolMixin(LitElement) {
  static override styles = css`
    .search-icon,
    .search-icon > svg {
      width: 22px;
      height: 22px;
    }
  `;

  @state()
  private accessor _isModalOpen = false;

  private _modal: EdgelessSearchModal | null = null;

  override firstUpdated() {
    if (!this.edgeless) {
      return;
    }
    this.edgeless.bindHotKey(
      {
        '$mod+shift+f': () => {
          this._toggleModal();
        },
      },
      { global: true }
    );
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._closeModal();
  }

  private _openModal() {
    if (this._isModalOpen) {
      return;
    }

    this._modal = openEdgelessSearchModal(this.edgeless, () => {
      this._isModalOpen = false;
      this._modal = null;
    });
    this._isModalOpen = true;
  }

  private _closeModal() {
    if (this._modal) {
      this._modal.remove();
      this._modal = null;
    }
    this._isModalOpen = false;
  }

  private _toggleModal() {
    if (this._isModalOpen) {
      this._closeModal();
    } else {
      this._openModal();
    }
  }

  override render() {
    return html`<edgeless-tool-icon-button
      .iconContainerPadding=${6}
      .tooltip=${html`<yunke-tooltip-content-with-shortcut
        data-tip="${'搜索画布'}"
      ></yunke-tooltip-content-with-shortcut>`}
      .tooltipOffset=${17}
      ?active=${this._isModalOpen}
      @click=${this._toggleModal}
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
