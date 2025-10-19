import { SignalWatcher, WithDisposable } from '@blocksuite/yunke/global/lit';
import { scrollbarStyle } from '@blocksuite/yunke/shared/styles';
import { unsafeCSSVarV2 } from '@blocksuite/yunke/shared/theme';
import { type EditorHost } from '@blocksuite/yunke/std';
import { InformationIcon, ToggleDownIcon } from '@blocksuite/icons/lit';
import { signal } from '@preact/signals-core';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';

import {
  type AIError,
  AIProvider,
  PaymentRequiredError,
  UnauthorizedError,
} from '../provider';

export class AIErrorWrapper extends SignalWatcher(WithDisposable(LitElement)) {
  static override styles = css`
    .error-wrapper {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 8px;
      align-self: stretch;
      border-radius: 4px;
      padding: 8px 8px 12px 8px;
      background-color: ${unsafeCSSVarV2('aI/errorBackground')};
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};

      .content {
        align-items: flex-start;
        display: flex;
        gap: 8px;
        align-self: stretch;
        color: ${unsafeCSSVarV2('aI/errorText')};
        font-feature-settings:
          'clig' off,
          'liga' off;
        /* light/sm */
        font-size: var(--affine-font-sm);
        font-style: normal;
        font-weight: 400;
        line-height: 22px; /* 157.143% */

        .icon svg {
          position: relative;
          top: 3px;
        }
      }

      .text-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .detail-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
      }
      .detail-title {
        display: flex;
        align-items: center;
      }
      .detail-title:hover {
        cursor: pointer;
      }
      .detail-content {
        padding: 8px;
        border-radius: 4px;
        background-color: ${unsafeCSSVarV2('aI/errorDetailBackground')};
        overflow: auto;
      }
      ${scrollbarStyle('.detail-content')}

      .toggle {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .toggle.up svg {
        transform: rotate(180deg);
        transition: all 0.2s ease-in-out;
      }

      .action {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        width: 100%;
      }
      .action-button {
        cursor: pointer;
        color: ${unsafeCSSVarV2('text/primary')};
        background: ${unsafeCSSVarV2('button/secondary')};
        border-radius: 8px;
        border: 1px solid ${unsafeCSSVarV2('button/innerBlackBorder')};
        padding: 4px 12px;
        font-size: var(--affine-font-xs);
        font-style: normal;
        font-weight: 500;
        line-height: 20px;
      }
      .action-button:hover {
        transition: all 0.2s ease-in-out;
        background-image: linear-gradient(
          rgba(0, 0, 0, 0.04),
          rgba(0, 0, 0, 0.04)
        );
      }
    }
  `;

  private readonly _showDetailContent = signal(false);

  protected override render() {
    return html` <div class="error-wrapper">
      <div class="content">
        <div class="icon">${InformationIcon()}</div>
        <div class="text-container">
          <div>${this.text}</div>
          ${this.showDetailPanel
            ? html`<div class="detail-container">
                <div
                  class="detail-title"
                  @click=${() =>
                    (this._showDetailContent.value =
                      !this._showDetailContent.value)}
                >
                  <span>显示详情</span>
                  <span
                    class="toggle ${this._showDetailContent.value
                      ? 'down'
                      : 'up'}"
                  >
                    ${ToggleDownIcon({ width: '16px', height: '16px' })}
                  </span>
                </div>
                ${this._showDetailContent.value
                  ? html`<div class="detail-content">${this.errorMessage}</div>`
                  : nothing}
              </div>`
            : nothing}
        </div>
      </div>
      <div class="action">
        <span
          class="action-button"
          @click=${this.onClick}
          data-testid="ai-error-action-button"
        >
          ${this.actionText}
          ${this.actionTooltip
            ? html`<affine-tooltip tip-position="top"
                >${this.actionTooltip}</affine-tooltip
              >`
            : nothing}
        </span>
      </div>
    </div>`;
  }

  @property({ attribute: false })
  accessor text: string = '';

  @property({ attribute: false })
  accessor onClick: () => void = () => {};

  @property({ attribute: false })
  accessor errorMessage: string = '';

  @property({ attribute: false })
  accessor actionText: string = '联系我们';

  @property({ attribute: false })
  accessor actionTooltip: string = '';

  @property({ attribute: false })
  accessor showDetailPanel: boolean = false;

  @property({ attribute: 'data-testid', reflect: true })
  accessor testId = 'ai-error';
}

const PaymentRequiredErrorRenderer = (host: EditorHost) => html`
  <ai-error-wrapper
    .text=${"您已达到 AFFiNE AI 的当前使用限额。您可以订阅 AFFiNE AI（免费试用7天）以继续AI体验！"}
    .actionText=${'升级'}
    .onClick=${() => AIProvider.slots.requestUpgradePlan.next({ host })}
  ></ai-error-wrapper>
`;

const LoginRequiredErrorRenderer = (host: EditorHost) => html`
  <ai-error-wrapper
    .text=${'您需要登录 AFFiNE 云端才能继续使用 AFFiNE AI。'}
    .actionText=${'登录'}
    .onClick=${() => AIProvider.slots.requestLogin.next({ host })}
  ></ai-error-wrapper>
`;

type ErrorProps = {
  text?: string;
  errorMessage?: string;
  actionText?: string;
  actionTooltip?: string;
};

const generalErrorText =
  '发生了错误，如果此问题持续存在，请告诉我们。';

const GeneralErrorRenderer = (props: ErrorProps = {}) => {
  const onClick = () => {
    window.open('mailto:support@toeverything.info', '_blank');
  };

  return html`<ai-error-wrapper
    .text=${props.text ?? generalErrorText}
    .errorMessage=${props.errorMessage ?? ''}
    .showDetailPanel=${!!props.errorMessage}
    .actionText=${props.actionText ?? '联系我们'}
    .actionTooltip=${props.actionTooltip ?? 'support@toeverything.info'}
    .onClick=${onClick}
  ></ai-error-wrapper>`;
};

export function AIChatErrorRenderer(host: EditorHost, error: AIError) {
  if (error instanceof PaymentRequiredError) {
    return PaymentRequiredErrorRenderer(host);
  } else if (error instanceof UnauthorizedError) {
    return LoginRequiredErrorRenderer(host);
  } else {
    return GeneralErrorRenderer({
      errorMessage: error.message,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-error-wrapper': AIErrorWrapper;
  }
}
