import { createReactComponentFromLit } from '@yunke/component';
import { getStoreManager } from '@yunke/core/blocksuite/manager/store';
import { getViewManager } from '@yunke/core/blocksuite/manager/view';
import type { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { PeekViewProvider } from '@blocksuite/yunke/components/peek';
import { Container, type ServiceProvider } from '@blocksuite/yunke/global/di';
import { WithDisposable } from '@blocksuite/yunke/global/lit';
import { RefNodeSlotsProvider } from '@blocksuite/yunke/inlines/reference';
import {
  codeBlockWrapMiddleware,
  defaultImageProxyMiddleware,
  ImageProxyService,
} from '@blocksuite/yunke/shared/adapters';
import { ThemeProvider } from '@blocksuite/yunke/shared/services';
import { unsafeCSSVarV2 } from '@blocksuite/yunke/shared/theme';
import {
  BlockStdScope,
  BlockViewIdentifier,
  type EditorHost,
  ShadowlessElement,
} from '@blocksuite/yunke/std';
import type {
  ExtensionType,
  Query,
  Schema,
  Store,
  TransformerMiddleware,
} from '@blocksuite/yunke/store';
import {
  darkCssVariablesV2,
  lightCssVariablesV2,
} from '@toeverything/theme/v2';
import { css, html, nothing, type PropertyValues, unsafeCSS } from 'lit';
import { property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { literal } from 'lit/static-html.js';
import React from 'react';
import { filter } from 'rxjs/operators';

import { markDownToDoc } from '../../utils';
import type {
  YunkeAIPanelState,
  YunkeAIPanelWidgetConfig,
} from '../widgets/ai-panel/type';

export const getCustomPageEditorBlockSpecs: () => ExtensionType[] = () => {
  const manager = getViewManager().config.init().value;
  return [
    ...manager.get('page'),
    {
      setup: di => {
        di.override(
          BlockViewIdentifier('yunke:page'),
          () => literal`yunke-page-root`
        );
      },
    },
  ];
};

const customHeadingStyles = css`
  .custom-heading {
    .h1 {
      font-size: calc(var(--yunke-font-h-1) - 2px);
      code {
        font-size: calc(var(--yunke-font-base) + 6px);
      }
    }
    .h2 {
      font-size: calc(var(--yunke-font-h-2) - 2px);
      code {
        font-size: calc(var(--yunke-font-base) + 4px);
      }
    }
    .h3 {
      font-size: calc(var(--yunke-font-h-3) - 2px);
      code {
        font-size: calc(var(--yunke-font-base) + 2px);
      }
    }
    .h4 {
      font-size: calc(var(--yunke-font-h-4) - 2px);
      code {
        font-size: var(--yunke-font-base);
      }
    }
    .h5 {
      font-size: calc(var(--yunke-font-h-5) - 2px);
      code {
        font-size: calc(var(--yunke-font-base) - 2px);
      }
    }
    .h6 {
      font-size: calc(var(--yunke-font-h-6) - 2px);
      code {
        font-size: calc(var(--yunke-font-base) - 4px);
      }
    }
  }
`;

export type TextRendererOptions = {
  customHeading?: boolean;
  extensions?: ExtensionType[];
  additionalMiddlewares?: TransformerMiddleware[];
  testId?: string;
  yunkeFeatureFlagService?: FeatureFlagService;
};

// todo: refactor it for more general purpose usage instead of AI only?
export class TextRenderer extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .ai-answer-text-editor.yunke-page-viewport {
      background: transparent;
      font-family: var(--yunke-font-family);
      margin-top: 0;
      margin-bottom: 0;
    }

    .ai-answer-text-editor .yunke-page-root-block-container {
      padding: 0;
      margin: 0;
      line-height: var(--yunke-line-height);
      color: ${unsafeCSSVarV2('text/primary')};
      font-weight: 400;
      min-height: auto;
      overflow: visible;
    }

    .ai-answer-text-editor {
      counter-reset: list-counter; /* 重置列表计数器 */
      
      .yunke-note-block-container {
        > .yunke-block-children-container {
          > :first-child:not(yunke-callout),
          > :first-child:not(yunke-callout) * {
            margin-top: 0 !important;
          }
          > :last-child,
          > :last-child * {
            margin-bottom: 0 !important;
          }
        }
      }

      .yunke-paragraph-block-container {
        line-height: 1.6;
        margin: 6px 0;
        padding: 0;
        
        /* 改善标题样式 */
        &[data-type="h1"] {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 16px 0 12px 0;
          line-height: 1.2;
          border-bottom: 2px solid var(--yunke-border-color);
          padding-bottom: 8px;
        }
        
        &[data-type="h2"] {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 14px 0 10px 0;
          line-height: 1.3;
        }
        
        &[data-type="h3"] {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 12px 0 8px 0;
          line-height: 1.4;
        }
        
        &[data-type="h4"] {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 10px 0 6px 0;
          line-height: 1.4;
        }
        
        &[data-type="h5"] {
          font-size: 1rem;
          font-weight: 600;
          margin: 8px 0 4px 0;
          line-height: 1.5;
        }
        
        &[data-type="h6"] {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 6px 0 4px 0;
          line-height: 1.5;
          color: var(--yunke-text-secondary-color);
        }

        .h6 {
          padding-left: 16px;
          color: ${unsafeCSSVarV2('text/link')};
          font-size: var(--yunke-font-base);

          .toggle-icon {
            transform: translateX(0);
            svg {
              color: ${unsafeCSSVarV2('text/link')}
            }
          }
        }
      }
      
      /* 改善代码块显示 */
      .yunke-code-block-container {
        margin: 12px 0;
        border-radius: 6px;
        background: var(--yunke-background-secondary-color);
        padding: 12px;
        font-family: var(--yunke-font-code-family);
        
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
        }
      }
      
      /* 改善列表显示 */
      .yunke-list-block-container {
        margin: 6px 0;
        line-height: 1.6;
        
        &[data-type="bulleted"] {
          padding-left: 24px;
          position: relative;
          
          &::before {
            content: "•";
            position: absolute;
            left: 8px;
            color: var(--yunke-text-primary-color);
          }
        }
        
        &[data-type="numbered"] {
          padding-left: 24px;
          counter-increment: list-counter;
          position: relative;
          
          &::before {
            content: counter(list-counter) ".";
            position: absolute;
            left: 8px;
            color: var(--yunke-text-primary-color);
          }
        }
      }
      
      /* 改善分割线显示 */
      .yunke-divider-block-container {
        margin: 16px 0;
        border-top: 1px solid var(--yunke-border-color);
        height: 1px;
      }
      
      /* 改善换行和文字显示 */
      rich-text {
        white-space: pre-wrap;
        word-break: break-word;
        
        v-text, v-element {
          white-space: pre-wrap;
        }
      }
    }

    /* 简化的流式输出动画效果 */
    .text-renderer-container[data-state="generating"] {
      .ai-answer-text-editor {
        /* 只保留最后一个元素的光标效果 */
        .yunke-note-block-container > .yunke-block-children-container > :last-child {
          position: relative;
          
          &::after {
            content: '';
            display: inline-block;
            width: 1px;
            height: 1em;
            background-color: var(--yunke-primary-color);
            margin-left: 2px;
            animation: simpleBlink 1s infinite;
            vertical-align: baseline;
          }
        }
      }
    }

    /* 简化的光标闪烁动画 */
    @keyframes simpleBlink {
      0%, 50% {
        opacity: 1;
      }
      51%, 100% {
        opacity: 0;
      }
    }

    /* 流式输出完成时移除光标 */
    .text-renderer-container[data-state="finished"] {
      .ai-answer-text-editor .yunke-note-block-container > .yunke-block-children-container > :last-child::after {
        display: none;
      }
    }

    /* 移除所有可能造成卡顿的复杂动画 */
    .text-renderer-container * {
      /* 禁用可能引起重排的属性动画 */
      animation: none !important;
      transition: none !important;
    }

    /* 只保留光标动画 */
    .text-renderer-container[data-state="generating"] .ai-answer-text-editor .yunke-note-block-container > .yunke-block-children-container > :last-child::after {
      animation: simpleBlink 1s infinite !important;
    }

    .text-renderer-container {
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0;
      overscroll-behavior-y: none;
      min-height: fit-content;
      height: auto;
      /* 优化滚动条显示 */
      scrollbar-width: thin;
      scrollbar-color: var(--yunke-border-color) transparent;
    }
    .text-renderer-container.show-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 100px;
    }
    .text-renderer-container.show-scrollbar::-webkit-scrollbar-thumb {
      border-radius: 20px;
    }
    .text-renderer-container.show-scrollbar:hover::-webkit-scrollbar-thumb {
      background-color: var(--yunke-black-30);
    }
    .text-renderer-container.show-scrollbar::-webkit-scrollbar-corner {
      display: none;
    }

    .text-renderer-container {
      rich-text .nowrap-lines v-text span,
      rich-text .nowrap-lines v-element span {
        white-space: pre-wrap;
      }
      editor-host:focus-visible {
        outline: none;
      }
      editor-host * {
        box-sizing: border-box;
      }
      editor-host {
        isolation: isolate;
      }
    }

    .text-renderer-container[data-app-theme='dark'] {
      .ai-answer-text-editor .yunke-page-root-block-container {
        color: ${unsafeCSS(darkCssVariablesV2['--yunke-v2-text-primary'])};
      }
    }

    .text-renderer-container[data-app-theme='light'] {
      .ai-answer-text-editor .yunke-page-root-block-container {
        color: ${unsafeCSS(lightCssVariablesV2['--yunke-v2-text-primary'])};
      }
    }

    ${customHeadingStyles}
  `;

  private _answers: string[] = [];

  private _maxContainerHeight = 0;

  private readonly _clearTimer = () => {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  };

  private _doc: Store | null = null;

  private readonly _query: Query = {
    mode: 'strict',
    match: [
      'yunke:page',
      'yunke:note',
      'yunke:table',
      'yunke:surface',
      'yunke:paragraph', // 段落支持标题格式
      'yunke:callout',
      'yunke:code',
      'yunke:list',
      'yunke:divider',
      'yunke:latex',
      'yunke:bookmark',
      'yunke:attachment',
      'yunke:embed-linked-doc',
    ].map(flavour => ({ flavour, viewType: 'display' })),
  };

  private _timer?: ReturnType<typeof setInterval> | null = null;

  private readonly _subscribeDocLinkClicked = () => {
    const refNodeSlots = this.host?.std.getOptional(RefNodeSlotsProvider);
    if (!refNodeSlots) return;
    this.disposables.add(
      refNodeSlots.docLinkClicked
        .pipe(
          filter(
            options => !!this._previewHost && options.host === this._previewHost
          )
        )
        .subscribe(options => {
          // Open the doc in center peek
          this.host?.std
            .getOptional(PeekViewProvider)
            ?.peek({
              docId: options.pageId,
            })
            .catch(console.error);
        })
    );
  };

  private readonly _updateDoc = () => {
    if (this._answers.length > 0) {
      const latestAnswer = this._answers.pop();
      this._answers = [];
      
      const schema = this.schema ?? this.host?.std.store.schema;
      let provider: ServiceProvider;
      if (this.host) {
        provider = this.host.std.store.provider;
      } else {
        const container = new Container();
        getStoreManager()
          .config.init()
          .value.get('store')
          .forEach(ext => {
            ext.setup(container);
          });

        provider = container.provider();
      }
      if (latestAnswer && schema) {
        // 预处理markdown内容，确保换行符正确处理
        const processedAnswer = latestAnswer
          .replace(/\r\n/g, '\n') // 统一换行符
          .replace(/\r/g, '\n')   // 统一换行符
          .trim(); // 移除首尾空白
        
        const middlewares = [
          defaultImageProxyMiddleware,
          codeBlockWrapMiddleware(true),
          ...(this.options.additionalMiddlewares ?? []),
        ];
        const yunkeFeatureFlagService = this.options.yunkeFeatureFlagService;
        
        // 异步更新，避免阻塞UI
        markDownToDoc(
          provider,
          schema,
          processedAnswer,
          middlewares,
          yunkeFeatureFlagService
        )
          .then(doc => {
            // 使用requestAnimationFrame确保DOM更新在下一帧
            requestAnimationFrame(() => {
              const oldDoc = this._doc;
              this._doc = doc.doc.getStore({
                query: this._query,
              });
              this.disposables.add(() => {
                doc.doc.removeStore({ query: this._query });
              });
              this._doc.readonly = true;
              
              // 先更新再清理旧的，减少空白时间
              this.requestUpdate();
              
              if (oldDoc) {
                oldDoc.dispose();
                oldDoc.workspace.dispose();
              }
              
              if (this.state !== 'generating') {
                this._doc.load();
                const imageProxyService =
                  this.host?.std.store.get(ImageProxyService);
                if (imageProxyService) {
                  this._doc
                    ?.get(ImageProxyService)
                    .setImageProxyURL(imageProxyService.imageProxyURL);
                }
                this._clearTimer();
              }
            });
          })
          .catch(console.error);
      }
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this._answers.push(this.answer);
    this._updateDoc();
    if (this.state === 'generating') {
      // 增加更新间隔，减少卡顿，从300ms增加到500ms
      this._timer = setInterval(this._updateDoc, 500);
    }
  }

  override firstUpdated() {
    this._subscribeDocLinkClicked();
  }

  private disposeDoc() {
    if (this._doc) {
      try {
        this._doc.dispose();
        this._doc.workspace.dispose();
      } catch (error) {
        // 忽略清理时的错误，避免影响性能
        console.warn('Error disposing doc:', error);
      }
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearTimer();
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
    }
    this.disposeDoc();
  }

  override render() {
    if (!this._doc) {
      return nothing;
    }

    const { customHeading, testId } = this.options;
    const classes = classMap({
      'text-renderer-container': true,
      'custom-heading': !!customHeading,
    });
    const theme = this.host?.std.get(ThemeProvider).app$.value;
    
    return html`
      <div 
        class=${classes} 
        data-testid=${testId} 
        data-app-theme=${theme}
        data-state=${this.state}
      >
        ${keyed(
          this._doc,
          html`<div class="ai-answer-text-editor yunke-page-viewport">
            ${new BlockStdScope({
              store: this._doc,
              extensions:
                this.options.extensions ?? getCustomPageEditorBlockSpecs(),
            }).render()}
          </div>`
        )}
      </div>
    `;
  }

  override shouldUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('answer')) {
      // 只有当内容真正改变时才更新
      const oldAnswer = changedProperties.get('answer');
      if (oldAnswer !== this.answer) {
        this._answers.push(this.answer);
        // 使用防抖，避免过于频繁的更新
        clearTimeout(this._updateTimer);
        this._updateTimer = setTimeout(this._updateDoc, 100);
      }
    }
    return true;
  }

  private _updateTimer?: ReturnType<typeof setTimeout>;

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    requestAnimationFrame(() => {
      if (!this._container) return;
      // Track max height during generation
      if (this.state === 'generating') {
        this._maxContainerHeight = Math.max(
          this._maxContainerHeight,
          this._container.scrollHeight
        );
        // Apply min-height to prevent shrinking during streaming
        this._container.style.minHeight = `${this._maxContainerHeight}px`;
      } else {
        // 适当延迟清除最小高度
        setTimeout(() => {
          this._maxContainerHeight = 0;
          this._container.style.minHeight = '';
        }, 500);
      }
    });
  }

  @query('.text-renderer-container')
  private accessor _container!: HTMLDivElement;

  @query('.text-renderer-container editor-host')
  private accessor _previewHost: EditorHost | null = null;

  @property({ attribute: false })
  accessor answer!: string;

  @property({ attribute: false })
  accessor host: EditorHost | null = null;

  @property({ attribute: false })
  accessor schema: Schema | null = null;

  @property({ attribute: false })
  accessor options!: TextRendererOptions;

  @property({ attribute: false })
  accessor state: YunkeAIPanelState | undefined = undefined;
}

export const createTextRenderer: (
  host: EditorHost,
  options: TextRendererOptions
) => YunkeAIPanelWidgetConfig['answerRenderer'] = (host, options) => {
  return (answer, state) => {
    return html`<text-renderer
      contenteditable="false"
      .host=${host}
      .answer=${answer}
      .state=${state}
      .options=${options}
    ></text-renderer>`;
  };
};

export const LitTextRenderer = createReactComponentFromLit({
  react: React,
  elementClass: TextRenderer,
});

declare global {
  interface HTMLElementTagNameMap {
    'text-renderer': TextRenderer;
  }
}
