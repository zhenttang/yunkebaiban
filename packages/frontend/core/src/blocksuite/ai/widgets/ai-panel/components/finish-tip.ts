import {
  AIDoneIcon,
  CopyIcon,
  WarningIcon,
} from '@blocksuite/yunke/components/icons';
import { WithDisposable } from '@blocksuite/yunke/global/lit';
import { NotificationProvider } from '@blocksuite/yunke/shared/services';
import type { EditorHost } from '@blocksuite/yunke/std';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { CopyConfig } from '../type.js';

export class AIFinishTip extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    }
    .finish-tip {
      display: flex;
      box-sizing: border-box;
      width: 100%;
      height: 22px;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      gap: 4px;

      color: var(--yunke-text-secondary-color);

      .text {
        display: flex;
        align-items: flex-start;
        flex: 1 0 0;

        /* light/xs */
        font-size: var(--yunke-font-xs);
        font-style: normal;
        font-weight: 400;
        line-height: 20px; /* 166.667% */
      }

      .right {
        display: flex;
        align-items: center;

        .copy,
        .copied {
          display: flex;
          width: 20px;
          height: 20px;
          justify-content: center;
          align-items: center;
          border-radius: 8px;
          user-select: none;
        }
        .copy:hover {
          color: var(--yunke-icon-color);
          background: var(--yunke-hover-color);
          cursor: pointer;
        }
        .copied {
          color: var(--yunke-brand-color);
        }
      }
    }
  `;

  override render() {
    return html`<div class="finish-tip">
      ${WarningIcon}
      <div class="text">AI 输出可能具有误导性或错误</div>
      ${this.copy?.allowed
        ? html`<div class="right">
            ${this.copied
              ? html`<div class="copied" data-testid="answer-copied">
                  ${AIDoneIcon}
                </div>`
              : html`<div
                  class="copy"
                  data-testid="answer-copy-button"
                  @click=${async () => {
                    this.copied = !!(await this.copy?.onCopy());
                    if (this.copied) {
                      this.host.std
                        .getOptional(NotificationProvider)
                        ?.toast('已复制到剪贴板');
                    }
                  }}
                >
                  ${CopyIcon}
                  <yunke-tooltip>复制</yunke-tooltip>
                </div>`}
          </div>`
        : nothing}
    </div>`;
  }

  @state()
  accessor copied = false;

  @property({ attribute: false })
  accessor copy: CopyConfig | undefined = undefined;

  @property({ attribute: false })
  accessor host!: EditorHost;
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-finish-tip': AIFinishTip;
  }
}
