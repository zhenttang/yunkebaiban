import { WithDisposable } from '@blocksuite/global/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ParagraphBlockModel } from '@blocksuite/yunke-model';
import type { BlockModel } from '@blocksuite/store';

export interface CollapseState {
  isCollapsed: boolean;
  collapseLevel: number;
  hiddenBlocks: string[];
  previewText?: string;
  animationDuration: number;
}

export interface CollapseSettings {
  enablePreview: boolean;
  previewLength: number;
  animationDuration: number;
  collapseIcon: string;
  expandIcon: string;
  showChildCount: boolean;
  preserveFormatting: boolean;
}

/**
 * 高级折叠功能组件
 * 支持动画、预览、智能折叠等功能
 */
export class AdvancedCollapse extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .collapse-container {
      position: relative;
      margin: 4px 0;
    }

    .collapse-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      border: 1px solid transparent;
    }

    .collapse-header:hover {
      background: var(--yunke-hover-color);
      border-color: var(--yunke-border-color);
    }

    .collapse-header.active {
      background: rgba(91, 156, 255, 0.08);
      border-color: #5B9CFF;
    }

    .collapse-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      font-size: 12px;
      transition: transform 0.2s ease;
      color: var(--yunke-icon-color);
    }

    .collapse-icon.expanded {
      transform: rotate(90deg);
    }

    .collapse-info {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .collapse-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--yunke-text-primary-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .collapse-count {
      font-size: 10px;
      color: var(--yunke-text-secondary-color);
      background: var(--yunke-background-secondary-color);
      padding: 2px 6px;
      border-radius: 10px;
      white-space: nowrap;
    }

    .collapse-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .collapse-header:hover .collapse-actions {
      opacity: 1;
    }

    .collapse-btn {
      padding: 2px 4px;
      background: transparent;
      border: 1px solid var(--yunke-border-color);
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
      transition: all 0.2s ease;
      color: var(--yunke-text-secondary-color);
    }

    .collapse-btn:hover {
      background: var(--yunke-hover-color);
      color: var(--yunke-text-primary-color);
    }

    .collapse-content {
      overflow: hidden;
      transition: all var(--animation-duration, 0.3s) ease;
      border-left: 2px solid var(--yunke-border-color);
      margin-left: 8px;
      padding-left: 8px;
    }

    .collapse-content.collapsed {
      max-height: 0;
      opacity: 0;
      padding-top: 0;
      padding-bottom: 0;
      margin-top: 0;
      margin-bottom: 0;
    }

    .collapse-content.expanded {
      max-height: 10000px;
      opacity: 1;
      padding-top: 8px;
      padding-bottom: 8px;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .collapse-preview {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      margin: 2px 0;
      background: var(--yunke-background-secondary-color);
      border-radius: 4px;
      font-size: 11px;
      color: var(--yunke-text-secondary-color);
      border-left: 2px solid var(--yunke-border-color);
      margin-left: 8px;
    }

    .preview-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.4;
    }

    .preview-more {
      font-size: 10px;
      color: var(--yunke-text-tertiary-color);
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 2px;
      transition: all 0.2s ease;
    }

    .preview-more:hover {
      background: var(--yunke-hover-color);
      color: var(--yunke-text-secondary-color);
    }

    .collapse-placeholder {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px;
      margin: 4px 0;
      background: var(--yunke-background-secondary-color);
      border: 1px dashed var(--yunke-border-color);
      border-radius: 4px;
      font-size: 11px;
      color: var(--yunke-text-secondary-color);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .collapse-placeholder:hover {
      background: var(--yunke-hover-color);
      border-color: var(--yunke-primary-color);
      color: var(--yunke-text-primary-color);
    }

    .collapse-indicator {
      position: absolute;
      left: -12px;
      top: 50%;
      transform: translateY(-50%);
      width: 8px;
      height: 8px;
      background: var(--yunke-primary-color);
      border-radius: 50%;
      transition: all 0.2s ease;
      opacity: 0;
    }

    .collapse-container:hover .collapse-indicator {
      opacity: 1;
    }

    .collapse-level-1 { margin-left: 0; }
    .collapse-level-2 { margin-left: 16px; }
    .collapse-level-3 { margin-left: 32px; }
    .collapse-level-4 { margin-left: 48px; }
    .collapse-level-5 { margin-left: 64px; }
    .collapse-level-6 { margin-left: 80px; }

    .fade-in {
      animation: fadeIn 0.3s ease;
    }

    .fade-out {
      animation: fadeOut 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }

    .smart-collapse {
      position: relative;
    }

    .smart-collapse::before {
      content: '';
      position: absolute;
      left: -4px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, var(--yunke-primary-color), transparent);
      opacity: 0.3;
    }

    .collapse-shortcuts {
      display: flex;
      gap: 4px;
      margin-top: 4px;
    }

    .shortcut-btn {
      padding: 2px 6px;
      background: var(--yunke-background-secondary-color);
      border: 1px solid var(--yunke-border-color);
      border-radius: 3px;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--yunke-text-secondary-color);
    }

    .shortcut-btn:hover {
      background: var(--yunke-primary-color);
      color: white;
      border-color: var(--yunke-primary-color);
    }
  `;

  @property({ attribute: false })
  declare model: ParagraphBlockModel;

  @property({ attribute: false })
  declare settings: CollapseSettings;

  constructor() {
    super();
    this.settings = {
      enablePreview: true,
      previewLength: 150,
      animationDuration: 300,
      collapseIcon: '▶',
      expandIcon: '▼',
      showChildCount: true,
      preserveFormatting: true,
    };
  }

  @state()
  private _state: CollapseState = {
    isCollapsed: false,
    collapseLevel: 1,
    hiddenBlocks: [],
    animationDuration: 300,
  };

  @state()
  private _childBlocks: BlockModel[] = [];

  @state()
  private _previewText = '';

  @state()
  private _isAnimating = false;

  override connectedCallback() {
    super.connectedCallback();
    this._updateChildBlocks();
    this._generatePreviewText();
    this._setupModelObserver();
  }

  private _setupModelObserver() {
    this.disposables.add(
      this.model.propsUpdated.on(() => {
        this._updateChildBlocks();
        this._generatePreviewText();
      })
    );

    this.disposables.add(
      this.model.childrenUpdated.on(() => {
        this._updateChildBlocks();
        this._generatePreviewText();
      })
    );
  }

  private _updateChildBlocks() {
    const headingLevel = this._getHeadingLevel(this.model);
    if (headingLevel === 0) {
      this._childBlocks = [];
      return;
    }

    const allBlocks = this._getAllSiblingBlocks();
    const currentIndex = allBlocks.indexOf(this.model);
    const childBlocks: BlockModel[] = [];

    for (let i = currentIndex + 1; i < allBlocks.length; i++) {
      const block = allBlocks[i];
      const blockLevel = this._getHeadingLevel(block);
      
      if (blockLevel > 0 && blockLevel <= headingLevel) {
        break; // 遇到同级或更高级标题，停止
      }
      
      childBlocks.push(block);
    }

    this._childBlocks = childBlocks;
  }

  private _getAllSiblingBlocks(): BlockModel[] {
    const parent = this.model.parent;
    if (!parent) return [];
    
    const allBlocks: BlockModel[] = [];
    
    const traverse = (block: BlockModel) => {
      allBlocks.push(block);
      block.children.forEach(traverse);
    };
    
    parent.children.forEach(traverse);
    return allBlocks;
  }

  private _getHeadingLevel(block: BlockModel): number {
    if (block.flavour !== 'yunke:paragraph') return 0;
    
    const type = (block as any).type;
    const match = type?.match(/h(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private _generatePreviewText() {
    if (!this.settings.enablePreview || this._childBlocks.length === 0) {
      this._previewText = '';
      return;
    }

    let text = '';
    let length = 0;
    
    for (const block of this._childBlocks) {
      const blockText = this._getBlockText(block);
      if (blockText) {
        if (length + blockText.length > this.settings.previewLength) {
          text += blockText.substring(0, this.settings.previewLength - length) + '...';
          break;
        }
        text += blockText + ' ';
        length += blockText.length + 1;
      }
    }

    this._previewText = text.trim();
  }

  private _getBlockText(block: BlockModel): string {
    if (block.flavour === 'yunke:paragraph' || block.flavour === 'yunke:list') {
      return (block as any).text?.toString() || '';
    }
    return '';
  }

  private _toggleCollapse() {
    if (this._isAnimating) return;
    
    this._isAnimating = true;
    this._state.isCollapsed = !this._state.isCollapsed;
    
    if (this._state.isCollapsed) {
      this._collapseContent();
    } else {
      this._expandContent();
    }
    
    setTimeout(() => {
      this._isAnimating = false;
      this.requestUpdate();
    }, this.settings.animationDuration);
    
    this.requestUpdate();
  }

  private _collapseContent() {
    this._state.hiddenBlocks = this._childBlocks.map(block => block.id);
    
    // 隐藏子块
    this._childBlocks.forEach(block => {
      const element = this._getBlockElement(block.id);
      if (element) {
        element.style.display = 'none';
      }
    });
    
    this._dispatchCollapseEvent('collapsed');
  }

  private _expandContent() {
    this._state.hiddenBlocks = [];
    
    // 显示子块
    this._childBlocks.forEach(block => {
      const element = this._getBlockElement(block.id);
      if (element) {
        element.style.display = '';
      }
    });
    
    this._dispatchCollapseEvent('expanded');
  }

  private _getBlockElement(blockId: string): HTMLElement | null {
    return document.querySelector(`[data-block-id="${blockId}"]`);
  }

  private _dispatchCollapseEvent(type: 'collapsed' | 'expanded') {
    this.dispatchEvent(new CustomEvent(`content-${type}`, {
      detail: {
        blockId: this.model.id,
        hiddenBlocks: this._state.hiddenBlocks,
        childCount: this._childBlocks.length
      }
    }));
  }

  private _collapseAll() {
    // 折叠所有同级标题
    const allHeadings = this._getAllHeadings();
    const currentLevel = this._getHeadingLevel(this.model);
    
    allHeadings.forEach(heading => {
      if (this._getHeadingLevel(heading) === currentLevel) {
        this._collapseHeading(heading);
      }
    });
  }

  private _expandAll() {
    // 展开所有同级标题
    const allHeadings = this._getAllHeadings();
    const currentLevel = this._getHeadingLevel(this.model);
    
    allHeadings.forEach(heading => {
      if (this._getHeadingLevel(heading) === currentLevel) {
        this._expandHeading(heading);
      }
    });
  }

  private _getAllHeadings(): ParagraphBlockModel[] {
    const root = this.model.doc.root;
    if (!root) return [];
    
    const headings: ParagraphBlockModel[] = [];
    
    const traverse = (block: BlockModel) => {
      if (this._getHeadingLevel(block) > 0) {
        headings.push(block as ParagraphBlockModel);
      }
      block.children.forEach(traverse);
    };
    
    traverse(root);
    return headings;
  }

  private _collapseHeading(heading: ParagraphBlockModel) {
    // 发送折叠事件到其他折叠组件
    const event = new CustomEvent('heading-collapse', {
      detail: { blockId: heading.id, action: 'collapse' }
    });
    document.dispatchEvent(event);
  }

  private _expandHeading(heading: ParagraphBlockModel) {
    // 发送展开事件到其他折叠组件
    const event = new CustomEvent('heading-collapse', {
      detail: { blockId: heading.id, action: 'expand' }
    });
    document.dispatchEvent(event);
  }

  private _showPreview() {
    if (!this._previewText) return;
    
    this._state.isCollapsed = false;
    this._expandContent();
  }

  private _renderHeader() {
    if (this._childBlocks.length === 0) return nothing;
    
    const headingLevel = this._getHeadingLevel(this.model);
    const headingText = this._getBlockText(this.model);
    
    return html`
      <div class=${classMap({
        'collapse-header': true,
        'active': this._state.isCollapsed,
        [`collapse-level-${headingLevel}`]: true
      })}>
        <div class="collapse-indicator"></div>
        
        <div 
          class=${classMap({
            'collapse-icon': true,
            'expanded': !this._state.isCollapsed
          })}
          @click=${this._toggleCollapse}
        >
          ${this._state.isCollapsed ? this.settings.collapseIcon : this.settings.expandIcon}
        </div>
        
        <div class="collapse-info" @click=${this._toggleCollapse}>
          <div class="collapse-title">${headingText}</div>
          ${this.settings.showChildCount ? html`
            <div class="collapse-count">
              ${this._childBlocks.length} 项
            </div>
          ` : nothing}
        </div>
        
        <div class="collapse-actions">
          <button 
            class="collapse-btn"
            @click=${this._collapseAll}
            title="折叠所有同级"
          >
            折叠所有
          </button>
          <button 
            class="collapse-btn"
            @click=${this._expandAll}
            title="展开所有同级"
          >
            展开所有
          </button>
        </div>
      </div>
    `;
  }

  private _renderPreview() {
    if (!this._state.isCollapsed || !this._previewText) return nothing;
    
    return html`
      <div class="collapse-preview">
        <div class="preview-text">${this._previewText}</div>
        <div class="preview-more" @click=${this._showPreview}>
          展开查看
        </div>
      </div>
    `;
  }

  private _renderShortcuts() {
    if (this._childBlocks.length === 0) return nothing;
    
    return html`
      <div class="collapse-shortcuts">
        <button 
          class="shortcut-btn"
          @click=${this._toggleCollapse}
          title="快捷键: Ctrl+."
        >
          ${this._state.isCollapsed ? '展开' : '折叠'}
        </button>
        <button 
          class="shortcut-btn"
          @click=${() => this._collapseToLevel(2)}
          title="折叠到二级标题"
        >
          到H2
        </button>
        <button 
          class="shortcut-btn"
          @click=${() => this._collapseToLevel(3)}
          title="折叠到三级标题"
        >
          到H3
        </button>
      </div>
    `;
  }

  private _collapseToLevel(level: number) {
    const allHeadings = this._getAllHeadings();
    
    allHeadings.forEach(heading => {
      const headingLevel = this._getHeadingLevel(heading);
      if (headingLevel > level) {
        this._collapseHeading(heading);
      } else {
        this._expandHeading(heading);
      }
    });
  }

  override render() {
    if (this._getHeadingLevel(this.model) === 0) {
      return nothing;
    }
    
    return html`
      <div class=${classMap({
        'collapse-container': true,
        'smart-collapse': true,
        'fade-in': !this._isAnimating
      })}
      style=${styleMap({
        '--animation-duration': `${this.settings.animationDuration}ms`
      })}>
        ${this._renderHeader()}
        ${this._renderPreview()}
        ${this._renderShortcuts()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'advanced-collapse': AdvancedCollapse;
  }
}