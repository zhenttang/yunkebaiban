// import type { CopilotSessionType } from '@affine/graphql';
import { createLitPortal } from '@blocksuite/affine/components/portal';
import { WithDisposable } from '@blocksuite/affine/global/lit';
import { unsafeCSSVar, unsafeCSSVarV2 } from '@blocksuite/affine/shared/theme';
import { ShadowlessElement } from '@blocksuite/affine/std';
import { flip, offset } from '@floating-ui/dom';
import { css, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

export class AIChatModels extends WithDisposable(ShadowlessElement) {
  @property()
  accessor modelId: string | undefined = undefined;

  @property({ attribute: false })
  accessor onModelChange: ((modelId: string) => void) | undefined;

  @property({ attribute: false })
  accessor session!: CopilotSessionType | undefined;

  @query('.ai-chat-models')
  accessor modelsButton!: HTMLDivElement;

  private _abortController: AbortController | null = null;

  static override styles = css`
    ai-chat-models {
      font-size: 13px;
      cursor: pointer;
    }
  `;

  private readonly _onItemClick = (modelId: string) => {
    this.onModelChange?.(modelId);
    this._abortController?.abort();
    this._abortController = null;
  };

  private readonly _toggleSwitchModelMenu = () => {
    if (this._abortController) {
      this._abortController.abort();
      return;
    }

    this._abortController = new AbortController();
    this._abortController.signal.addEventListener('abort', () => {
      this._abortController = null;
    });

    createLitPortal({
      template: html` <style>
          .ai-model-list {
            border: 0.5px solid ${unsafeCSSVarV2('layer/insideBorder/border')};
            border-radius: 4px;
            background: ${unsafeCSSVarV2('layer/background/overlayPanel')};
            box-shadow: ${unsafeCSSVar('overlayPanelShadow')};
            padding: 8px;
          }
          .ai-model-item {
            font-size: 13px;
            padding: 4px;
            cursor: pointer;
          }
          .ai-model-item:hover {
            background: var(--affine-hover-color);
          }
        </style>
        <div class="ai-model-list">
          ${repeat(
            this.session?.optionalModels ?? [],
            modelId => modelId,
            modelId => {
              return html`<div
                class="ai-model-item"
                @click=${() => this._onItemClick(modelId)}
              >
                ${modelId}
              </div>`;
            }
          )}
        </div>`,
      portalStyles: {
        zIndex: 'var(--affine-z-index-popover)',
      },
      container: document.body,
      computePosition: {
        referenceElement: this.modelsButton,
        placement: 'top-start',
        middleware: [offset({ crossAxis: -30, mainAxis: 8 }), flip()],
        autoUpdate: { animationFrame: true },
      },
      abortController: this._abortController,
      closeOnClickAway: true,
    });
  };

  override render() {
    if (!this.session) {
      return nothing;
    }

    return html`
      <div
        class="ai-chat-models"
        @click=${this._toggleSwitchModelMenu}
        data-testid="ai-chat-models"
      >
        ${this.modelId || this.session.model}
      </div>
    `;
  }
}
