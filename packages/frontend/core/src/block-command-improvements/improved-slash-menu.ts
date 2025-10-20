/**
 * 改进后的 Slash Menu 组件
 * 与 YUNKE 系统设计语言保持一致
 */

import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';
import { YUNKE_DESIGN_TOKENS } from './design-tokens.js';

interface SlashMenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  group: string;
  shortcut?: string;
  action: () => void;
}

interface SlashMenuGroup {
  name: string;
  title: string;
  items: SlashMenuItem[];
}

@customElement('improved-slash-menu')
export class ImprovedSlashMenu extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      z-index: 999;
      user-select: none;
    }
    
    .slash-menu {
      /* 现代化容器设计 */
      width: 320px;
      max-height: 420px;
      padding: 12px;
      
      /* 现代化背景和边框 */
      background: white;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
      
      /* 现代化阴影 */
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      
      /* 字体系统 */
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: 14px;
      
      /* 过渡效果 */
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      
      /* 滚动条样式 */
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #E5E7EB transparent;
    }
    
    .slash-menu::-webkit-scrollbar {
      width: 6px;
    }
    
    .slash-menu::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .slash-menu::-webkit-scrollbar-thumb {
      background: #E5E7EB;
      border-radius: 3px;
    }
    
    /* 分组标题样式 */
    .group-title {
      font-size: 11px;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 12px 0 8px 0;
      padding: 0 4px;
    }
    
    .group-title:first-child {
      margin-top: 0;
    }
    
    /* 菜单项样式 */
    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 8px;
      margin-bottom: 4px;
      
      /* 现代化卡片样式 */
      background: white;
      border: 1px solid transparent;
      border-radius: 6px;
      
      /* 过渡效果 */
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      
      /* 文字不可选择 */
      user-select: none;
    }
    
    /* 菜单项悬停状态 */
    .menu-item:hover {
      background: #F1F3F5;
      border-color: #E5E7EB;
      transform: translateY(-1px);
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    
    /* 菜单项激活状态 */
    .menu-item:active {
      transform: translateY(0);
      box-shadow: none;
    }
    
    /* 菜单项选中状态 */
    .menu-item.selected {
      background: rgba(91, 156, 255, 0.08);
      border-color: #5B9CFF;
      color: #5B9CFF;
    }
    
    /* 图标容器 */
    .item-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      
      /* 现代化背景 */
      background: #F8F9FB;
      border: 1px solid #F3F4F6;
      border-radius: 6px;
      
      /* 过渡效果 */
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .menu-item:hover .item-icon {
      background: white;
      border-color: #E5E7EB;
    }
    
    .menu-item.selected .item-icon {
      background: rgba(91, 156, 255, 0.1);
      border-color: #5B9CFF;
      color: #5B9CFF;
    }
    
    /* 图标样式 */
    .item-icon .icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
      line-height: 1;
    }
    
    /* 文字内容区域 */
    .item-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    
    /* 主标题样式 */
    .item-title {
      font-size: 14px;
      font-weight: 500;
      color: #1A1B1E;
      line-height: 1.4;
      margin: 0;
    }
    
    .menu-item:hover .item-title {
      color: #1A1B1E;
    }
    
    .menu-item.selected .item-title {
      color: #5B9CFF;
    }
    
    /* 描述文字样式 */
    .item-description {
      font-size: 12px;
      color: #6B7280;
      line-height: 1.3;
      margin: 0;
      
      /* 文字截断 */
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .menu-item:hover .item-description {
      color: #6B7280;
    }
    
    .menu-item.selected .item-description {
      color: rgba(91, 156, 255, 0.7);
    }
    
    /* 键盘快捷键 */
    .item-shortcut {
      font-size: 11px;
      color: #9CA3AF;
      background: #F1F3F5;
      padding: 2px 4px;
      border-radius: 4px;
      font-family: ui-monospace, 'SF Mono', 'Monaco', monospace;
    }
    
    /* 空状态 */
    .empty-state {
      padding: 24px;
      text-align: center;
      color: #6B7280;
      font-size: 12px;
    }
    
    .empty-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 12px;
      opacity: 0.3;
      font-size: 48px;
    }
    
    /* 加载状态 */
    .loading-state {
      padding: 16px;
      text-align: center;
      color: #6B7280;
    }
    
    .loading-spinner {
      width: 20px;
      height: 20px;
      margin: 0 auto 8px;
      border: 2px solid #E5E7EB;
      border-top-color: #5B9CFF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    /* 暗色主题支持 */
    @media (prefers-color-scheme: dark) {
      .slash-menu {
        background: #1F2937;
        border-color: #374151;
      }
      
      .menu-item {
        background: #1F2937;
      }
      
      .menu-item:hover {
        background: #374151;
        border-color: #4B5563;
      }
      
      .item-icon {
        background: #374151;
        border-color: #4B5563;
      }
      
      .item-title {
        color: #F9FAFB;
      }
      
      .item-description {
        color: #D1D5DB;
      }
      
      .group-title {
        color: #9CA3AF;
      }
    }
    
    /* 响应式设计 */
    @media (max-width: 768px) {
      .slash-menu {
        width: 300px;
        max-height: 360px;
        padding: 8px;
      }
      
      .menu-item {
        padding: 8px;
        gap: 8px;
      }
      
      .item-icon {
        width: 32px;
        height: 32px;
      }
      
      .item-icon .icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }
    }
    
    /* 高对比度模式 */
    @media (prefers-contrast: high) {
      .menu-item {
        border-color: #E5E7EB;
      }
      
      .menu-item:hover {
        border-color: #1A1B1E;
      }
      
      .menu-item.selected {
        border-color: #5B9CFF;
        background: rgba(91, 156, 255, 0.15);
      }
    }
    
    /* 减少动画模式 */
    @media (prefers-reduced-motion: reduce) {
      .menu-item {
        transition: none;
      }
      
      .menu-item:hover {
        transform: none;
      }
      
      .loading-spinner {
        animation: none;
      }
    }
  `;

  @property({ type: Array })
  groups: SlashMenuGroup[] = [];

  @property({ type: String })
  query = '';

  @state()
  private _selectedIndex = 0;

  @state()
  private _filteredItems: SlashMenuItem[] = [];

  @property({ type: Boolean })
  loading = false;

  override connectedCallback() {
    super.connectedCallback();
    this._updateFilteredItems();
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
  }

  override updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('query') || changedProperties.has('groups')) {
      this._updateFilteredItems();
      this._selectedIndex = 0;
    }
  }

  private _updateFilteredItems() {
    if (!this.query.trim()) {
      this._filteredItems = this.groups.flatMap(group => group.items);
      return;
    }

    const query = this.query.toLowerCase();
    this._filteredItems = this.groups
      .flatMap(group => group.items)
      .filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
  }

  private _handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._selectedIndex = Math.min(this._selectedIndex + 1, this._filteredItems.length - 1);
        this._scrollSelectedIntoView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._selectedIndex = Math.max(this._selectedIndex - 1, 0);
        this._scrollSelectedIntoView();
        break;
      case 'Enter':
        e.preventDefault();
        this._executeSelectedItem();
        break;
      case 'Escape':
        e.preventDefault();
        this.dispatchEvent(new CustomEvent('close'));
        break;
    }
  };

  private _scrollSelectedIntoView() {
    const selectedElement = this.shadowRoot?.querySelector(`[data-index="${this._selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }

  private _executeSelectedItem() {
    const selectedItem = this._filteredItems[this._selectedIndex];
    if (selectedItem) {
      selectedItem.action();
      this.dispatchEvent(new CustomEvent('close'));
    }
  }

  private _handleItemClick(item: SlashMenuItem) {
    item.action();
    this.dispatchEvent(new CustomEvent('close'));
  }

  private _handleItemHover(index: number) {
    this._selectedIndex = index;
  }

  private _renderGroupedItems() {
    if (this.loading) {
      return html`
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <div>加载中...</div>
        </div>
      `;
    }

    if (this._filteredItems.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div>未找到匹配的块类型</div>
        </div>
      `;
    }

    // 如果有查询，直接显示过滤结果
    if (this.query.trim()) {
      return this._filteredItems.map((item, index) => this._renderItem(item, index));
    }

    // 否则按分组显示
    return this.groups.map(group => {
      const groupItems = group.items.filter(item => this._filteredItems.includes(item));
      if (groupItems.length === 0) return null;

      const startIndex = this._filteredItems.findIndex(item => groupItems.includes(item));
      
      return html`
        <div class="group-title">${group.title}</div>
        ${groupItems.map((item, relativeIndex) => {
          const absoluteIndex = startIndex + relativeIndex;
          return this._renderItem(item, absoluteIndex);
        })}
      `;
    });
  }

  private _renderItem(item: SlashMenuItem, index: number) {
    const isSelected = index === this._selectedIndex;
    
    return html`
      <div
        class=${classMap({
          'menu-item': true,
          'selected': isSelected
        })}
        data-index=${index}
        @click=${() => this._handleItemClick(item)}
        @mouseenter=${() => this._handleItemHover(index)}
      >
        <div class="item-icon">
          <div class="icon">${item.icon}</div>
        </div>
        <div class="item-content">
          <div class="item-title">${item.title}</div>
          <div class="item-description">${item.description}</div>
        </div>
        ${item.shortcut ? html`
          <div class="item-shortcut">${item.shortcut}</div>
        ` : ''}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="slash-menu">
        ${this._renderGroupedItems()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'improved-slash-menu': ImprovedSlashMenu;
  }
}

/**
 * 默认的块命令配置
 * 与右侧面板的设计保持一致
 */
export const DEFAULT_SLASH_MENU_GROUPS: SlashMenuGroup[] = [
  {
    name: 'basic',
    title: '基础块',
    items: [
      {
        id: 'paragraph',
        title: '段落',
        description: '转换为普通文本块',
        icon: '¶',
        keywords: ['paragraph', 'text', '段落', '文本'],
        group: 'basic',
        shortcut: 'Ctrl+Alt+0',
        action: () => console.log('Create paragraph'),
      },
      {
        id: 'heading1',
        title: '一级标题',
        description: '转换为大号标题',
        icon: 'H1',
        keywords: ['heading', 'h1', '标题', '一级'],
        group: 'basic',
        shortcut: 'Ctrl+Alt+1',
        action: () => console.log('Create heading 1'),
      },
      {
        id: 'heading2',
        title: '二级标题',
        description: '转换为中号标题',
        icon: 'H2',
        keywords: ['heading', 'h2', '标题', '二级'],
        group: 'basic',
        shortcut: 'Ctrl+Alt+2',
        action: () => console.log('Create heading 2'),
      },
      {
        id: 'heading3',
        title: '三级标题',
        description: '转换为小号标题',
        icon: 'H3',
        keywords: ['heading', 'h3', '标题', '三级'],
        group: 'basic',
        shortcut: 'Ctrl+Alt+3',
        action: () => console.log('Create heading 3'),
      },
    ],
  },
  {
    name: 'lists',
    title: '列表',
    items: [
      {
        id: 'bullet-list',
        title: '项目符号列表',
        description: '转换为项目符号列表',
        icon: '•',
        keywords: ['bullet', 'list', '列表', '项目符号'],
        group: 'lists',
        action: () => console.log('Create bullet list'),
      },
      {
        id: 'numbered-list',
        title: '编号列表',
        description: '转换为编号列表',
        icon: '1.',
        keywords: ['numbered', 'list', '编号', '列表'],
        group: 'lists',
        action: () => console.log('Create numbered list'),
      },
    ],
  },
  {
    name: 'content',
    title: '内容块',
    items: [
      {
        id: 'quote',
        title: '引用',
        description: '转换为引用块',
        icon: '"',
        keywords: ['quote', 'blockquote', '引用'],
        group: 'content',
        action: () => console.log('Create quote'),
      },
      {
        id: 'code',
        title: '代码',
        description: '转换为代码块',
        icon: '</>',
        keywords: ['code', 'pre', '代码'],
        group: 'content',
        action: () => console.log('Create code block'),
      },
      {
        id: 'divider',
        title: '分隔线',
        description: '插入分隔线',
        icon: '—',
        keywords: ['divider', 'hr', '分隔线'],
        group: 'content',
        action: () => console.log('Create divider'),
      },
    ],
  },
];

export { ImprovedSlashMenu };