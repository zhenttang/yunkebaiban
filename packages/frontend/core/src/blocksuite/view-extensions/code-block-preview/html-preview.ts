import track from '@yunke/track';
import { CodeBlockPreviewExtension } from '@blocksuite/yunke/blocks/code';
import { SignalWatcher, WithDisposable } from '@blocksuite/yunke/global/lit';
import type { CodeBlockModel } from '@blocksuite/yunke/model';
import { unsafeCSSVarV2 } from '@blocksuite/yunke/shared/theme';
import { css, html, LitElement, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { styleMap } from 'lit/directives/style-map.js';

import { linkWebContainer } from './web-container';

export const CodeBlockHtmlPreview = CodeBlockPreviewExtension(
  'html',
  model => html`<html-preview .model=${model}></html-preview>`
);

export class HTMLPreview extends SignalWatcher(WithDisposable(LitElement)) {
  static override styles = css`
    .html-preview-loading {
      color: ${unsafeCSSVarV2('text/placeholder')};
      font-feature-settings:
        'liga' off,
        'clig' off;

      /* light/code/base */
      font-family: 'IBM Plex Mono';
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
    }

    .html-preview-error,
    .html-preview-fallback {
      color: ${unsafeCSSVarV2('button/error')};
      font-feature-settings:
        'liga' off,
        'clig' off;

      /* light/code/base */
      font-family: 'IBM Plex Mono';
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
    }

    .html-preview-iframe {
      width: 100%;
      height: 544px;
      border: none;
    }
  `;

  @property({ attribute: false })
  accessor model!: CodeBlockModel;

  @state()
  accessor state: 'loading' | 'error' | 'finish' | 'fallback' = 'loading';

  @query('iframe')
  accessor iframe!: HTMLIFrameElement;

  override firstUpdated(_changedProperties: PropertyValues): void {
    const result = super.firstUpdated(_changedProperties);

    if (!window.crossOriginIsolated) {
      this.state = 'fallback';
      return;
    }

    this._link();

    this.disposables.add(
      this.model.props.text$.subscribe(() => {
        this._link();
      })
    );

    return result;
  }

  private _link() {
    this.state = 'loading';
    linkWebContainer(this.iframe, this.model)
      .then(() => {
        this.state = 'finish';
      })
      .catch(error => {
        const errorMessage = `链接 WebContainer 失败: ${error}`;

        console.error(errorMessage);
        track.doc.editor.codeBlock.htmlBlockPreviewFailed({
          type: errorMessage,
        });

        this.state = 'error';
      });
  }

  override render() {
    return html`
      <div class="html-preview-container">
        ${choose(this.state, [
          [
            'loading',
            () =>
              html`<div class="html-preview-loading">
                正在渲染代码...
              </div>`,
          ],
          [
            'error',
            () =>
              html`<div class="html-preview-error">
                渲染预览失败。请检查您的 HTML 代码是否有错误。
              </div>`,
          ],
          [
            'fallback',
            () =>
              html`<div class="html-preview-fallback">
                您的浏览器不支持此功能。请下载 YUNKE 桌面应用程序以使用它。
              </div>`,
          ],
        ])}
        <iframe
          class="html-preview-iframe"
          title="HTML预览"
          style=${styleMap({
            display: this.state === 'finish' ? undefined : 'none',
          })}
        ></iframe>
      </div>
    `;
  }
}

export function effects() {
  customElements.define('html-preview', HTMLPreview);
}

declare global {
  interface HTMLElementTagNameMap {
    'html-preview': HTMLPreview;
  }
}
