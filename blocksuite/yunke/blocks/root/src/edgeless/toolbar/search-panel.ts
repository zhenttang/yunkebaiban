import {
  ArrowDownSmallIcon,
  ArrowUpSmallIcon,
  CloseIcon,
  SearchIcon,
} from '@blocksuite/icons/lit';
import type { BlockComponent } from '@blocksuite/std';
import { GfxControllerIdentifier, type GfxModel } from '@blocksuite/std/gfx';
import { RANGE_SYNC_EXCLUDE_ATTR } from '@blocksuite/std/inline';
import type { BlockModel, Store, Text } from '@blocksuite/store';
import { HighlightSelection } from '@blocksuite/yunke-shared/selection';
import {
  listenClickAway,
  stopPropagation,
} from '@blocksuite/yunke-shared/utils';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import { baseTheme } from '@toeverything/theme';
import { css, html, LitElement, unsafeCSS } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import debounce from 'lodash-es/debounce';

import { isCanvasElementWithText } from '../utils/query';

type SearchResult = {
  id: string;
  text: string;
  sourceType: 'element' | 'block';
  sourceId?: string;
};

const MAX_RESULTS = 50;
const SNIPPET_PADDING = 20;

/**
 * 全屏搜索弹窗组件 - 挂载到 document.body 以避免焦点问题
 */
export class EdgelessSearchModal extends SignalWatcher(
  WithDisposable(LitElement)
) {
  static override styles = css`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      display: flex;
      justify-content: center;
      padding-top: 120px;
      font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
      animation: yunke-modal-fade-in 0.15s ease;
    }

    @keyframes yunke-modal-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
    }

    .modal {
      position: relative;
      width: 560px;
      max-width: 90vw;
      max-height: 70vh;
      background: var(--yunke-background-overlay-panel-color, #fff);
      border: 1px solid var(--yunke-border-color, #e0e0e0);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      border-bottom: 1px solid var(--yunke-border-color, #e0e0e0);
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      padding: 8px 12px;
      background: var(--yunke-hover-color, #f5f5f5);
      border-radius: 8px;
    }

    .search-icon {
      display: inline-flex;
      width: 20px;
      height: 20px;
      color: var(--yunke-text-secondary-color, #666);
    }

    .input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 16px;
      color: var(--yunke-text-primary-color, #333);
    }

    .input::placeholder {
      color: var(--yunke-placeholder-color, #999);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .action-button {
      border: none;
      background: transparent;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      color: var(--yunke-text-secondary-color, #666);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-button[disabled] {
      cursor: not-allowed;
      color: var(--yunke-text-disable-color, #ccc);
    }

    .action-button:not([disabled]):hover {
      background: var(--yunke-hover-color, #f0f0f0);
    }

    .counter {
      min-width: 50px;
      text-align: right;
      font-size: 13px;
      color: var(--yunke-text-secondary-color, #666);
    }

    .results {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .result-item {
      padding: 10px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      color: var(--yunke-text-primary-color, #333);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .result-item:hover {
      background: var(--yunke-hover-color, #f5f5f5);
    }

    .result-item.active {
      background: var(--yunke-hover-color-filled, #e8f4ff);
    }

    .result-text {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .result-meta {
      font-size: 12px;
      color: var(--yunke-text-secondary-color, #999);
      padding: 2px 6px;
      background: var(--yunke-hover-color, #f0f0f0);
      border-radius: 4px;
    }

    mark {
      background: transparent;
      color: var(--yunke-primary-color, #1890ff);
      font-weight: 600;
    }

    .empty {
      padding: 40px;
      text-align: center;
      color: var(--yunke-text-secondary-color, #999);
      font-size: 14px;
    }

    .shortcut-hint {
      padding: 12px 16px;
      border-top: 1px solid var(--yunke-border-color, #e0e0e0);
      font-size: 12px;
      color: var(--yunke-text-secondary-color, #999);
      display: flex;
      gap: 16px;
    }

    .shortcut-hint kbd {
      display: inline-block;
      padding: 2px 6px;
      background: var(--yunke-hover-color, #f0f0f0);
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
    }
  `;

  @property({ attribute: false })
  accessor edgeless!: BlockComponent;

  @state()
  private accessor _query = '';

  @state()
  private accessor _results: SearchResult[] = [];

  @state()
  private accessor _activeIndex = -1;

  @query('.input')
  private accessor _inputElement!: HTMLInputElement;

  private readonly _debouncedSearch = debounce((value: string) => {
    this._performSearch(value);
  }, 150);

  private _hide = () => {
    this._clearHighlight();
    this.remove();
    this.onClose?.();
  };

  @property({ attribute: false })
  accessor onClose: (() => void) | undefined = undefined;

  override connectedCallback() {
    super.connectedCallback();
    this.setAttribute(RANGE_SYNC_EXCLUDE_ATTR, 'true');
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._debouncedSearch.cancel();
  }

  override firstUpdated() {
    // 聚焦输入框
    requestAnimationFrame(() => {
      this._inputElement?.focus();
    });

    // 点击外部关闭
    this.disposables.add(
      listenClickAway(this.shadowRoot!.querySelector('.modal')!, this._hide)
    );

    // 阻止事件传播
    this.disposables.addFromEvent(this, 'keydown', this._onGlobalKeyDown);
    this.disposables.addFromEvent(this, 'pointerdown', stopPropagation);
    this.disposables.addFromEvent(this, 'mousedown', stopPropagation);
    this.disposables.addFromEvent(this, 'click', stopPropagation);
  }

  private _onGlobalKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      this._hide();
    }
  };

  private _performSearch(value: string) {
    const query = value.trim();
    if (!query || !this.edgeless) {
      this._results = [];
      this._activeIndex = -1;
      this._clearHighlight();
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    results.push(
      ...this._collectElementMatches(normalizedQuery, MAX_RESULTS)
    );

    if (results.length < MAX_RESULTS) {
      results.push(
        ...this._collectBlockMatches(
          normalizedQuery,
          MAX_RESULTS - results.length
        )
      );
    }

    this._results = results;
    this._activeIndex = results.length ? 0 : -1;

    // 自动高亮第一个结果
    if (this._activeIndex >= 0) {
      this._highlight(results[0]);
    }
  }

  private _collectElementMatches(query: string, limit: number) {
    const gfx = this.edgeless.std.get(GfxControllerIdentifier);
    const matches: SearchResult[] = [];

    for (const element of gfx.gfxElements) {
      if (!isCanvasElementWithText(element)) {
        continue;
      }
      const content = this._getElementText(element);
      if (!content) {
        continue;
      }
      if (!content.toLowerCase().includes(query)) {
        continue;
      }
      matches.push({
        id: element.id,
        text: this._buildSnippet(content, query),
        sourceType: 'element',
      });
      if (matches.length >= limit) {
        break;
      }
    }

    return matches;
  }

  private _collectBlockMatches(query: string, limit: number) {
    const store = this.edgeless.store;
    const flavours = ['yunke:paragraph', 'yunke:list', 'yunke:code'];
    const matches: SearchResult[] = [];

    for (const model of store.getModelsByFlavour(flavours)) {
      const content = this._getBlockText(model);
      if (!content) {
        continue;
      }
      if (!content.toLowerCase().includes(query)) {
        continue;
      }
      const anchor = this._findSearchAnchor(store, model);
      if (!anchor) {
        continue;
      }
      matches.push({
        id: anchor.id,
        text: this._buildSnippet(content, query),
        sourceType: 'block',
        sourceId: model.id,
      });
      if (matches.length >= limit) {
        break;
      }
    }

    return matches;
  }

  private _getElementText(element: GfxModel) {
    if (!isCanvasElementWithText(element)) {
      return '';
    }
    const text = element.text;
    return typeof text?.toString === 'function' ? text.toString() : '';
  }

  private _getBlockText(model: BlockModel) {
    const props = model.props as { text?: Text };
    const text = props?.text;
    return typeof text?.toString === 'function' ? text.toString() : '';
  }

  private _findSearchAnchor(store: Store, model: BlockModel) {
    let current: BlockModel | null = model;
    while (current) {
      if (
        current.flavour === 'yunke:edgeless-text' ||
        current.flavour === 'yunke:note'
      ) {
        return current;
      }
      current = store.getParent(current);
    }
    return null;
  }

  private _buildSnippet(text: string, query: string) {
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(query);
    if (index === -1) {
      return text.slice(0, 60);
    }
    const start = Math.max(0, index - SNIPPET_PADDING);
    const end = Math.min(text.length, index + query.length + SNIPPET_PADDING);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    return `${prefix}${text.slice(start, end)}${suffix}`;
  }

  private _renderHighlighted(text: string) {
    if (!this._query) {
      return text;
    }
    const lowerText = text.toLowerCase();
    const lowerQuery = this._query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) {
      return text;
    }
    return html`${text.slice(0, index)}<mark>${text.slice(
      index,
      index + this._query.length
    )}</mark>${text.slice(index + this._query.length)}`;
  }

  private _onInput = (event: Event) => {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    this._query = input.value;
    this._debouncedSearch(input.value);
  };

  private _onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();

    if (event.key === 'Enter') {
      event.preventDefault();
      this._jumpToActive();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._jumpTo(this._activeIndex + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._jumpTo(this._activeIndex - 1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this._hide();
    }
  };

  private _jumpToActive() {
    if (!this._results.length || this._activeIndex < 0) {
      return;
    }
    this._jumpTo(this._activeIndex);
  }

  private _jumpTo(index: number) {
    if (!this._results.length) {
      return;
    }
    const nextIndex =
      index < 0 ? this._results.length - 1 : index % this._results.length;
    this._activeIndex = nextIndex;
    const result = this._results[nextIndex];
    if (!result) {
      return;
    }
    this._highlight(result);
  }

  private _highlight(result: SearchResult) {
    if (!this.edgeless) {
      return;
    }
    const selection = this.edgeless.std.selection;
    selection.clear(['highlight']);
    selection.setGroup('scene', [
      selection.create(HighlightSelection, {
        mode: 'edgeless',
        elementIds: [result.id],
        blockIds: [result.id],
      }),
    ]);
  }

  private _clearHighlight() {
    this.edgeless?.std.selection.clear(['highlight']);
  }

  override render() {
    const hasResults = this._results.length > 0;
    const counter = hasResults
      ? `${this._activeIndex + 1}/${this._results.length}`
      : '0/0';

    return html`
      <div class="backdrop" @click=${this._hide}></div>
      <div class="modal">
        <div class="header">
          <div class="input-wrapper">
            <span class="search-icon">${SearchIcon()}</span>
            <input
              class="input"
              type="text"
              placeholder="搜索画布内容..."
              .value=${this._query}
              @input=${this._onInput}
              @keydown=${this._onKeyDown}
            />
          </div>
          <div class="actions">
            <button
              class="action-button"
              ?disabled=${!hasResults}
              @click=${() => this._jumpTo(this._activeIndex - 1)}
              title="上一个"
            >
              ${ArrowUpSmallIcon({ width: '18px', height: '18px' })}
            </button>
            <button
              class="action-button"
              ?disabled=${!hasResults}
              @click=${() => this._jumpTo(this._activeIndex + 1)}
              title="下一个"
            >
              ${ArrowDownSmallIcon({ width: '18px', height: '18px' })}
            </button>
            <button class="action-button" @click=${this._hide} title="关闭">
              ${CloseIcon({ width: '18px', height: '18px' })}
            </button>
          </div>
          <div class="counter">${counter}</div>
        </div>
        <div class="results">
          ${this._results.length
            ? repeat(
                this._results,
                item => item.sourceId ?? item.id,
                (item, index) => html`
                  <div
                    class="result-item ${index === this._activeIndex
                      ? 'active'
                      : ''}"
                    @click=${() => this._jumpTo(index)}
                  >
                    <div class="result-text">
                      ${this._renderHighlighted(item.text)}
                    </div>
                    <div class="result-meta">
                      ${item.sourceType === 'element' ? '图形' : '文本'}
                    </div>
                  </div>
                `
              )
            : html`<div class="empty">
                ${this._query ? '没有找到匹配的内容' : '输入关键词开始搜索'}
              </div>`}
        </div>
        <div class="shortcut-hint">
          <span><kbd>↑</kbd><kbd>↓</kbd> 切换结果</span>
          <span><kbd>Enter</kbd> 定位</span>
          <span><kbd>Esc</kbd> 关闭</span>
        </div>
      </div>
    `;
  }
}

// 保留旧的类名以兼容现有代码
export class EdgelessSearchPanel extends EdgelessSearchModal {}

/**
 * 打开搜索弹窗
 */
export function openEdgelessSearchModal(
  edgeless: BlockComponent,
  onClose?: () => void
) {
  // 移除已存在的弹窗
  document.body.querySelector('edgeless-search-modal')?.remove();

  const modal = new EdgelessSearchModal();
  modal.edgeless = edgeless;
  modal.onClose = onClose;
  document.body.appendChild(modal);

  return modal;
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-search-panel': EdgelessSearchPanel;
    'edgeless-search-modal': EdgelessSearchModal;
  }
}
