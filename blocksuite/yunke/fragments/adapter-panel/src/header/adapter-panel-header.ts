import { createLitPortal } from '@blocksuite/yunke-components/portal';
import { SignalWatcher } from '@blocksuite/global/lit';
import { ArrowDownSmallIcon, FlipDirectionIcon } from '@blocksuite/icons/lit';
import { flip, offset } from '@floating-ui/dom';
import { consume } from '@lit/context';
import { css, html, LitElement } from 'lit';
import { property, query } from 'lit/decorators.js';

import { type AdapterPanelContext, adapterPanelContext } from '../config';

export const YUNKE_ADAPTER_PANEL_HEADER = 'yunke-adapter-panel-header';

export class AdapterPanelHeader extends SignalWatcher(LitElement) {
  static override styles = css`
    .adapter-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--yunke-background-primary-color);
    }
    .adapter-selector {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100px;
      cursor: pointer;
      border-radius: 4px;
      border: 1px solid var(--yunke-border-color);
      padding: 4px 8px;
    }
    .adapter-selector:hover {
      background: var(--yunke-hover-color);
    }
    .adapter-selector-label {
      display: flex;
      align-items: center;
      color: var(--yunke-text-primary-color);
      font-size: var(--yunke-font-xs);
    }
    .update-button {
      height: 20px;
      width: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      cursor: pointer;
      color: var(--yunke-icon-color);
    }
    .update-button:hover {
      background-color: var(--yunke-hover-color);
    }
  `;

  get activeAdapter() {
    return this._context.activeAdapter$.value;
  }

  private _adapterMenuAbortController: AbortController | null = null;
  private readonly _toggleAdapterMenu = () => {
    if (this._adapterMenuAbortController) {
      this._adapterMenuAbortController.abort();
    }
    this._adapterMenuAbortController = new AbortController();

    createLitPortal({
      template: html`<yunke-adapter-menu
        .abortController=${this._adapterMenuAbortController}
      ></yunke-adapter-menu>`,
      portalStyles: {
        zIndex: 'var(--yunke-z-index-popover)',
      },
      container: this._adapterPanelHeader,
      computePosition: {
        referenceElement: this._adapterSelector,
        placement: 'bottom-start',
        middleware: [flip(), offset(4)],
        autoUpdate: { animationFrame: true },
      },
      abortController: this._adapterMenuAbortController,
      closeOnClickAway: true,
    });
  };

  override render() {
    return html`
      <div class="adapter-panel-header">
        <div class="adapter-selector" @click="${this._toggleAdapterMenu}">
          <span class="adapter-selector-label">
            ${this.activeAdapter.label}
          </span>
          ${ArrowDownSmallIcon({ width: '16px', height: '16px' })}
        </div>
        <div class="update-button" @click="${this.updateActiveContent}">
          ${FlipDirectionIcon({ width: '16px', height: '16px' })}
        </div>
      </div>
    `;
  }

  @query('.adapter-panel-header')
  private accessor _adapterPanelHeader!: HTMLDivElement;

  @query('.adapter-selector')
  private accessor _adapterSelector!: HTMLDivElement;

  @property({ attribute: false })
  accessor updateActiveContent: () => void = () => {};

  @consume({ context: adapterPanelContext })
  private accessor _context!: AdapterPanelContext;
}

declare global {
  interface HTMLElementTagNameMap {
    [YUNKE_ADAPTER_PANEL_HEADER]: AdapterPanelHeader;
  }
}
