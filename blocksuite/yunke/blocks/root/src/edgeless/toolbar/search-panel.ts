import {
  ArrowDownSmallIcon,
  ArrowUpSmallIcon,
  CloseIcon,
  SearchIcon,
} from '@blocksuite/icons/lit';
import type { BlockComponent } from '@blocksuite/std';
import { GfxControllerIdentifier, type GfxModel } from '@blocksuite/std/gfx';
import type { BlockModel, Store, Text } from '@blocksuite/store';
import { HighlightSelection } from '@blocksuite/yunke-shared/selection';
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

const styles = css`
  :host {
    display: block;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    background: var(--yunke-background-overlay-panel-color);
    border: 1px solid var(--yunke-border-color);
    border-radius: 12px;
    padding: 10px;
    box-shadow: var(--yunke-shadow-2);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    padding: 6px 8px;
    background: var(--yunke-hover-color);
    border-radius: 8px;
  }

  .search-icon {
    display: inline-flex;
    width: 18px;
    height: 18px;
  }

  .input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: var(--yunke-font-sm);
    color: var(--yunke-text-primary-color);
  }

  .input::placeholder {
    color: var(--yunke-placeholder-color);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .action-button {
    border: none;
    background: transparent;
    padding: 4px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--yunke-text-secondary-color);
  }

  .action-button[disabled] {
    cursor: not-allowed;
    color: var(--yunke-text-disable-color);
  }

  .action-button:not([disabled]):hover {
    background: var(--yunke-hover-color);
  }

  .counter {
    min-width: 44px;
    text-align: right;
    font-size: var(--yunke-font-xs);
    color: var(--yunke-text-secondary-color);
  }

  .results {
    margin-top: 8px;
    max-height: 240px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .result-item {
    padding: 6px 8px;
    border-radius: 8px;
    cursor: pointer;
    font-size: var(--yunke-font-sm);
    color: var(--yunke-text-primary-color);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .result-item:hover {
    background: var(--yunke-hover-color);
  }

  .result-item.active {
    background: var(--yunke-hover-color);
  }

  .result-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-meta {
    font-size: var(--yunke-font-xs);
    color: var(--yunke-text-secondary-color);
  }

  mark {
    background: transparent;
    color: var(--yunke-primary-color);
    font-weight: 600;
  }

  .empty {
    padding: 12px;
    text-align: center;
    color: var(--yunke-text-secondary-color);
    font-size: var(--yunke-font-xs);
  }
`;

export class EdgelessSearchPanel extends LitElement {
  static override styles = styles;

  @property({ attribute: false })
  accessor edgeless!: BlockComponent;

  @state()
  private accessor query = '';

  @state()
  private accessor results: SearchResult[] = [];

  @state()
  private accessor activeIndex = -1;

  @query('input')
  private accessor inputElement!: HTMLInputElement;

  private readonly _debouncedSearch = debounce((value: string) => {
    this._performSearch(value);
  }, 200);

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._debouncedSearch.cancel();
    this._clearHighlight();
  }

  override firstUpdated() {
    // 延迟聚焦确保输入框已经渲染完成
    requestAnimationFrame(() => {
      this.inputElement?.focus();
    });
  }

  private _performSearch(value: string) {
    const query = value.trim();
    if (!query || !this.edgeless) {
      this.results = [];
      this.activeIndex = -1;
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

    this.results = results;
    this.activeIndex = results.length ? 0 : -1;
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
    if (!this.query) {
      return text;
    }
    const lowerText = text.toLowerCase();
    const lowerQuery = this.query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) {
      return text;
    }
    return html`${text.slice(0, index)}<mark>${text.slice(
      index,
      index + this.query.length
    )}</mark>${text.slice(index + this.query.length)}`;
  }

  private _onInput(event: InputEvent) {
    const value = (event.target as HTMLInputElement).value;
    this.query = value;
    this._debouncedSearch(value);
  }

  private _stopEvent(event: Event) {
    // 只阻止传播，不阻止默认行为，以便输入框正常工作
    event.stopPropagation();
  }

  private _stopPropagationOnly(event: Event) {
    // 只阻止传播到父组件，保持输入框交互正常
    event.stopPropagation();
  }

  private _onKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      this._jumpToActive();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._jumpTo(this.activeIndex + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._jumpTo(this.activeIndex - 1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this._closePanel();
    }
  }

  private _jumpToActive() {
    if (!this.results.length || this.activeIndex < 0) {
      return;
    }
    this._jumpTo(this.activeIndex);
  }

  private _jumpTo(index: number) {
    if (!this.results.length) {
      return;
    }
    const nextIndex =
      index < 0 ? this.results.length - 1 : index % this.results.length;
    this.activeIndex = nextIndex;
    const result = this.results[nextIndex];
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

  private _closePanel() {
    this._clearHighlight();
    this.dispatchEvent(
      new CustomEvent('closepanel', { bubbles: true, composed: true })
    );
  }

  override render() {
    const hasResults = this.results.length > 0;
    const counter = hasResults
      ? `${this.activeIndex + 1}/${this.results.length}`
      : '0/0';

    return html`
      <div
        class="panel"
        @click=${this._stopPropagationOnly}
        @wheel=${this._stopPropagationOnly}
      >
        <div class="header">
        <div class="input-wrapper">
          <span class="search-icon">${SearchIcon()}</span>
          <input
            class="input"
            placeholder="搜索画布"
            .value=${this.query}
            @input=${this._onInput}
            @keydown=${this._onKeyDown}
            @keyup=${this._stopPropagationOnly}
            @pointerdown=${this._stopPropagationOnly}
            @mousedown=${this._stopPropagationOnly}
          />
        </div>
        <div class="actions">
          <button
            class="action-button"
            ?disabled=${!hasResults}
            @click=${() => this._jumpTo(this.activeIndex - 1)}
          >
            ${ArrowUpSmallIcon({ width: '16px', height: '16px' })}
          </button>
          <button
            class="action-button"
            ?disabled=${!hasResults}
            @click=${() => this._jumpTo(this.activeIndex + 1)}
          >
            ${ArrowDownSmallIcon({ width: '16px', height: '16px' })}
          </button>
          <button class="action-button" @click=${this._closePanel}>
            ${CloseIcon({ width: '16px', height: '16px' })}
          </button>
        </div>
        <div class="counter">${counter}</div>
      </div>
      <div class="results">
        ${this.results.length
          ? repeat(
              this.results,
              item => item.sourceId ?? item.id,
              (item, index) => html`
                <div
                  class="result-item ${index === this.activeIndex ? 'active' : ''}"
                  @click=${() => this._jumpTo(index)}
                >
                  <div class="result-text">
                    ${this._renderHighlighted(item.text)}
                  </div>
                  <div class="result-meta">
                    ${item.sourceType === 'element' ? 'Element' : 'Text'}
                  </div>
                </div>
              `
            )
          : html`<div class="empty">No matches</div>`}
      </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-search-panel': EdgelessSearchPanel;
  }
}
