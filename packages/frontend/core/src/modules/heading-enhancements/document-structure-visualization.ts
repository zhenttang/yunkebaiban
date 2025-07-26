import { WithDisposable } from '@blocksuite/global/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { BlockModel } from '@blocksuite/store';
import type { ParagraphBlockModel } from '@blocksuite/affine-model';

export interface DocumentNode {
  id: string;
  title: string;
  level: number;
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote' | 'divider';
  content: string;
  children: DocumentNode[];
  parent?: DocumentNode;
  wordCount: number;
  createTime: Date;
  updateTime: Date;
  tags: string[];
  collapsed: boolean;
}

export interface StructureSettings {
  showWordCount: boolean;
  showCreateTime: boolean;
  showTags: boolean;
  maxDepth: number;
  viewMode: 'tree' | 'mindmap' | 'timeline' | 'outline';
  theme: 'light' | 'dark' | 'colorful';
  enableSearch: boolean;
  enableFilter: boolean;
  enableExport: boolean;
  autoUpdate: boolean;
  compactMode: boolean;
}

export interface ViewPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 文档结构可视化组件
 * 支持树状图、思维导图、时间线、大纲等多种视图
 */
export class DocumentStructureVisualization extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .structure-container {
      position: relative;
      background: var(--affine-background-primary-color);
      border: 1px solid var(--affine-border-color);
      border-radius: 8px;
      overflow: hidden;
      min-height: 400px;
    }

    .structure-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--affine-background-secondary-color);
      border-bottom: 1px solid var(--affine-border-color);
    }

    .structure-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--affine-text-primary-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .structure-toolbar {
      display: flex;
      gap: 8px;
    }

    .toolbar-btn {
      padding: 4px 8px;
      background: transparent;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
      color: var(--affine-text-secondary-color);
    }

    .toolbar-btn:hover {
      background: var(--affine-hover-color);
      color: var(--affine-text-primary-color);
    }

    .toolbar-btn.active {
      background: var(--affine-primary-color);
      color: white;
      border-color: var(--affine-primary-color);
    }

    .structure-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: var(--affine-background-secondary-color);
      border-bottom: 1px solid var(--affine-border-color);
    }

    .view-mode-selector {
      display: flex;
      gap: 4px;
    }

    .view-mode-btn {
      padding: 6px 12px;
      background: transparent;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s ease;
      color: var(--affine-text-secondary-color);
    }

    .view-mode-btn:hover {
      background: var(--affine-hover-color);
      color: var(--affine-text-primary-color);
    }

    .view-mode-btn.active {
      background: var(--affine-primary-color);
      color: white;
      border-color: var(--affine-primary-color);
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 200px;
    }

    .search-input {
      width: 100%;
      padding: 4px 8px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      border-color: var(--affine-primary-color);
    }

    .filter-controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .filter-select {
      padding: 4px 8px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      font-size: 11px;
      background: white;
      cursor: pointer;
    }

    .structure-content {
      position: relative;
      height: 100%;
      min-height: 300px;
      overflow: auto;
    }

    /* 树状图视图 */
    .tree-view {
      padding: 16px;
    }

    .tree-node {
      position: relative;
      margin-bottom: 8px;
    }

    .tree-node-content {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: white;
      border: 1px solid var(--affine-border-color);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: var(--node-indent, 0);
    }

    .tree-node-content:hover {
      background: var(--affine-hover-color);
      border-color: var(--affine-primary-color);
      transform: translateX(4px);
    }

    .tree-node-content.active {
      background: rgba(91, 156, 255, 0.08);
      border-color: #5B9CFF;
    }

    .tree-node-toggle {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 2px;
      transition: all 0.2s ease;
      font-size: 10px;
      color: var(--affine-text-secondary-color);
    }

    .tree-node-toggle:hover {
      background: var(--affine-hover-color);
      color: var(--affine-text-primary-color);
    }

    .tree-node-toggle.expanded {
      transform: rotate(90deg);
    }

    .tree-node-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: var(--affine-icon-color);
    }

    .tree-node-info {
      flex: 1;
      min-width: 0;
    }

    .tree-node-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--affine-text-primary-color);
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tree-node-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10px;
      color: var(--affine-text-secondary-color);
    }

    .tree-node-children {
      margin-left: 24px;
      margin-top: 8px;
      border-left: 2px solid var(--affine-border-color);
      padding-left: 16px;
      transition: all 0.3s ease;
    }

    .tree-node-children.collapsed {
      display: none;
    }

    /* 思维导图视图 */
    .mindmap-view {
      position: relative;
      padding: 32px;
      overflow: hidden;
    }

    .mindmap-canvas {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 400px;
    }

    .mindmap-node {
      position: absolute;
      background: white;
      border: 2px solid var(--affine-border-color);
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 120px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .mindmap-node:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .mindmap-node.level-1 {
      background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
      color: white;
      border-color: #ff6b6b;
    }

    .mindmap-node.level-2 {
      background: linear-gradient(45deg, #4ecdc4, #45b7b8);
      color: white;
      border-color: #4ecdc4;
    }

    .mindmap-node.level-3 {
      background: linear-gradient(45deg, #45b7d1, #96ceb4);
      color: white;
      border-color: #45b7d1;
    }

    .mindmap-node.level-4 {
      background: linear-gradient(45deg, #f9ca24, #f0932b);
      color: white;
      border-color: #f9ca24;
    }

    .mindmap-connection {
      position: absolute;
      pointer-events: none;
    }

    .mindmap-line {
      stroke: var(--affine-border-color);
      stroke-width: 2;
      fill: none;
    }

    /* 时间线视图 */
    .timeline-view {
      padding: 16px;
    }

    .timeline-container {
      position: relative;
      padding-left: 40px;
    }

    .timeline-line {
      position: absolute;
      left: 20px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--affine-border-color);
    }

    .timeline-item {
      position: relative;
      margin-bottom: 24px;
    }

    .timeline-marker {
      position: absolute;
      left: -44px;
      top: 8px;
      width: 12px;
      height: 12px;
      background: var(--affine-primary-color);
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 2px var(--affine-primary-color);
    }

    .timeline-content {
      background: white;
      border: 1px solid var(--affine-border-color);
      border-radius: 6px;
      padding: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .timeline-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .timeline-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--affine-text-primary-color);
    }

    .timeline-time {
      font-size: 11px;
      color: var(--affine-text-secondary-color);
    }

    .timeline-preview {
      font-size: 12px;
      color: var(--affine-text-secondary-color);
      line-height: 1.4;
    }

    /* 大纲视图 */
    .outline-view {
      padding: 16px;
    }

    .outline-item {
      margin-bottom: 4px;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .outline-item:hover {
      background: var(--affine-hover-color);
    }

    .outline-item.active {
      background: rgba(91, 156, 255, 0.08);
      border-left: 3px solid #5B9CFF;
    }

    .outline-level-indicator {
      width: 4px;
      height: 4px;
      background: var(--affine-primary-color);
      border-radius: 50%;
      margin-left: var(--outline-indent, 0);
    }

    .outline-title {
      font-size: 13px;
      color: var(--affine-text-primary-color);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .outline-meta {
      font-size: 10px;
      color: var(--affine-text-secondary-color);
    }

    /* 统计信息 */
    .structure-stats {
      display: flex;
      gap: 16px;
      padding: 8px 16px;
      background: var(--affine-background-secondary-color);
      border-top: 1px solid var(--affine-border-color);
      font-size: 11px;
      color: var(--affine-text-secondary-color);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stat-value {
      font-weight: 600;
      color: var(--affine-text-primary-color);
    }

    /* 导出按钮 */
    .export-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid var(--affine-border-color);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      min-width: 150px;
      overflow: hidden;
    }

    .export-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 12px;
      color: var(--affine-text-primary-color);
      border-bottom: 1px solid var(--affine-border-color);
    }

    .export-item:hover {
      background: var(--affine-hover-color);
    }

    .export-item:last-child {
      border-bottom: none;
    }

    /* 紧凑模式 */
    .compact-mode .tree-node-content {
      padding: 4px 8px;
    }

    .compact-mode .tree-node-meta {
      display: none;
    }

    .compact-mode .tree-node-children {
      margin-left: 16px;
      padding-left: 8px;
    }

    /* 加载状态 */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--affine-text-secondary-color);
      font-size: 14px;
    }

    .loading::after {
      content: '';
      width: 16px;
      height: 16px;
      border: 2px solid var(--affine-border-color);
      border-top: 2px solid var(--affine-primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-left: 8px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* 空状态 */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--affine-text-secondary-color);
      font-size: 14px;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .structure-controls {
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
      }

      .view-mode-selector {
        flex-wrap: wrap;
      }

      .search-box {
        max-width: none;
      }

      .mindmap-view {
        padding: 16px;
      }

      .mindmap-node {
        min-width: 100px;
        font-size: 12px;
      }
    }
  `;

  @property({ attribute: false })
  declare model: BlockModel;

  @property({ attribute: false })
  declare settings: StructureSettings;

  constructor() {
    super();
    this.settings = {
      showWordCount: true,
      showCreateTime: true,
      showTags: false,
      maxDepth: 6,
      viewMode: 'tree',
      theme: 'light',
      enableSearch: true,
      enableFilter: true,
      enableExport: true,
      autoUpdate: true,
      compactMode: false,
    };
  }

  @state()
  private _documentTree: DocumentNode[] = [];

  @state()
  private _filteredTree: DocumentNode[] = [];

  @state()
  private _searchQuery = '';

  @state()
  private _selectedNode: DocumentNode | null = null;

  @state()
  private _isLoading = false;

  @state()
  private _showExportMenu = false;

  @state()
  private _collapsedNodes = new Set<string>();

  @state()
  private _statistics = {
    totalNodes: 0,
    totalWords: 0,
    maxDepth: 0,
    lastUpdate: new Date(),
  };

  override connectedCallback() {
    super.connectedCallback();
    this._buildDocumentTree();
    this._setupModelObserver();
  }

  private _setupModelObserver() {
    if (this.settings.autoUpdate) {
      this.disposables.add(
        this.model.doc.slots.blockUpdated.on(() => {
          this._updateDocumentTree();
        })
      );
    }
  }

  private _buildDocumentTree() {
    this._isLoading = true;
    this.requestUpdate();
    
    setTimeout(() => {
      const root = this.model.doc.root;
      if (!root) {
        this._documentTree = [];
        this._filteredTree = [];
        this._isLoading = false;
        this.requestUpdate();
        return;
      }
      
      this._documentTree = this._buildNodeTree(root);
      this._filteredTree = this._documentTree;
      this._updateStatistics();
      this._isLoading = false;
      this.requestUpdate();
    }, 100);
  }

  private _buildNodeTree(block: BlockModel, level: number = 0): DocumentNode[] {
    const nodes: DocumentNode[] = [];
    
    for (const child of block.children) {
      const node = this._createDocumentNode(child, level);
      if (node) {
        node.children = this._buildNodeTree(child, level + 1);
        nodes.push(node);
      }
    }
    
    return nodes;
  }

  private _createDocumentNode(block: BlockModel, level: number): DocumentNode | null {
    const content = this._getBlockContent(block);
    const title = this._getBlockTitle(block);
    
    if (!title && !content) return null;
    
    return {
      id: block.id,
      title: title || content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      level,
      type: this._getBlockType(block),
      content,
      children: [],
      wordCount: this._countWords(content),
      createTime: new Date(), // 简化实现
      updateTime: new Date(),
      tags: this._extractTags(content),
      collapsed: this._collapsedNodes.has(block.id),
    };
  }

  private _getBlockContent(block: BlockModel): string {
    if (block.flavour === 'affine:paragraph' || block.flavour === 'affine:list') {
      return (block as any).text?.toString() || '';
    }
    return '';
  }

  private _getBlockTitle(block: BlockModel): string {
    if (block.flavour === 'affine:paragraph') {
      const type = (block as any).type;
      if (type && type.startsWith('h')) {
        return (block as any).text?.toString() || '';
      }
    }
    return '';
  }

  private _getBlockType(block: BlockModel): DocumentNode['type'] {
    if (block.flavour === 'affine:paragraph') {
      const type = (block as any).type;
      if (type && type.startsWith('h')) {
        return 'heading';
      }
      if (type === 'quote') {
        return 'quote';
      }
    }
    
    if (block.flavour === 'affine:list') {
      return 'list';
    }
    
    if (block.flavour === 'affine:code') {
      return 'code';
    }
    
    if (block.flavour === 'affine:divider') {
      return 'divider';
    }
    
    return 'paragraph';
  }

  private _countWords(text: string): number {
    // 中文字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    
    // 英文单词
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0 && /[a-zA-Z]/.test(word))
      .length;
    
    return chineseChars + englishWords;
  }

  private _extractTags(content: string): string[] {
    const tags = [];
    const hashtagMatches = content.match(/#\w+/g);
    if (hashtagMatches) {
      tags.push(...hashtagMatches.map(tag => tag.substring(1)));
    }
    return tags;
  }

  private _updateDocumentTree() {
    this._buildDocumentTree();
  }

  private _updateStatistics() {
    let totalNodes = 0;
    let totalWords = 0;
    let maxDepth = 0;
    
    const traverse = (nodes: DocumentNode[], depth: number = 0) => {
      maxDepth = Math.max(maxDepth, depth);
      
      for (const node of nodes) {
        totalNodes++;
        totalWords += node.wordCount;
        traverse(node.children, depth + 1);
      }
    };
    
    traverse(this._documentTree);
    
    this._statistics = {
      totalNodes,
      totalWords,
      maxDepth,
      lastUpdate: new Date(),
    };
  }

  private _filterTree() {
    if (!this._searchQuery) {
      this._filteredTree = this._documentTree;
      return;
    }
    
    const query = this._searchQuery.toLowerCase();
    this._filteredTree = this._filterNodes(this._documentTree, query);
  }

  private _filterNodes(nodes: DocumentNode[], query: string): DocumentNode[] {
    const filtered: DocumentNode[] = [];
    
    for (const node of nodes) {
      const matchesQuery = 
        node.title.toLowerCase().includes(query) ||
        node.content.toLowerCase().includes(query) ||
        node.tags.some(tag => tag.toLowerCase().includes(query));
      
      const filteredChildren = this._filterNodes(node.children, query);
      
      if (matchesQuery || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });
      }
    }
    
    return filtered;
  }

  private _selectNode(node: DocumentNode) {
    this._selectedNode = node;
    this.requestUpdate();
    
    // 发送选择事件
    this.dispatchEvent(new CustomEvent('node-selected', {
      detail: { node }
    }));
  }

  private _toggleNodeCollapse(node: DocumentNode) {
    if (this._collapsedNodes.has(node.id)) {
      this._collapsedNodes.delete(node.id);
    } else {
      this._collapsedNodes.add(node.id);
    }
    
    node.collapsed = !node.collapsed;
    this.requestUpdate();
  }

  private _changeViewMode(mode: StructureSettings['viewMode']) {
    this.settings.viewMode = mode;
    this.requestUpdate();
  }

  private _getNodeIcon(type: DocumentNode['type']): string {
    switch (type) {
      case 'heading': return '📝';
      case 'paragraph': return '📄';
      case 'list': return '📋';
      case 'code': return '💻';
      case 'quote': return '💬';
      case 'divider': return '➖';
      default: return '📄';
    }
  }

  private _renderHeader() {
    return html`
      <div class="structure-header">
        <div class="structure-title">
          <span>🗂️</span>
          文档结构
        </div>
        <div class="structure-toolbar">
          <button 
            class="toolbar-btn"
            @click=${() => this._buildDocumentTree()}
            title="刷新"
          >
            🔄
          </button>
          <button 
            class="toolbar-btn"
            @click=${() => this.settings.compactMode = !this.settings.compactMode}
            title="紧凑模式"
          >
            📋
          </button>
          ${this.settings.enableExport ? html`
            <div style="position: relative;">
              <button 
                class="toolbar-btn"
                @click=${() => this._showExportMenu = !this._showExportMenu}
                title="导出"
              >
                📤
              </button>
              ${this._showExportMenu ? this._renderExportMenu() : nothing}
            </div>
          ` : nothing}
        </div>
      </div>
    `;
  }

  private _renderControls() {
    return html`
      <div class="structure-controls">
        <div class="view-mode-selector">
          ${(['tree', 'mindmap', 'timeline', 'outline'] as const).map(mode => html`
            <button
              class=${classMap({
                'view-mode-btn': true,
                'active': this.settings.viewMode === mode
              })}
              @click=${() => this._changeViewMode(mode)}
            >
              ${this._getViewModeIcon(mode)} ${this._getViewModeName(mode)}
            </button>
          `)}
        </div>
        
        ${this.settings.enableSearch ? html`
          <div class="search-box">
            <input
              class="search-input"
              type="text"
              placeholder="搜索文档结构..."
              .value=${this._searchQuery}
              @input=${(e: Event) => {
                this._searchQuery = (e.target as HTMLInputElement).value;
                this._filterTree();
                this.requestUpdate();
              }}
            />
          </div>
        ` : nothing}
        
        ${this.settings.enableFilter ? html`
          <div class="filter-controls">
            <select class="filter-select" @change=${this._onFilterChange}>
              <option value="all">所有类型</option>
              <option value="heading">标题</option>
              <option value="paragraph">段落</option>
              <option value="list">列表</option>
              <option value="code">代码</option>
            </select>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _getViewModeIcon(mode: string): string {
    switch (mode) {
      case 'tree': return '🌳';
      case 'mindmap': return '🧠';
      case 'timeline': return '📅';
      case 'outline': return '📋';
      default: return '📄';
    }
  }

  private _getViewModeName(mode: string): string {
    switch (mode) {
      case 'tree': return '树状图';
      case 'mindmap': return '思维导图';
      case 'timeline': return '时间线';
      case 'outline': return '大纲';
      default: return '未知';
    }
  }

  private _renderContent() {
    if (this._isLoading) {
      return html`<div class="loading">加载中...</div>`;
    }
    
    if (this._filteredTree.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-icon">📄</div>
          <div>暂无文档结构</div>
        </div>
      `;
    }
    
    switch (this.settings.viewMode) {
      case 'tree':
        return this._renderTreeView();
      case 'mindmap':
        return this._renderMindmapView();
      case 'timeline':
        return this._renderTimelineView();
      case 'outline':
        return this._renderOutlineView();
      default:
        return this._renderTreeView();
    }
  }

  private _renderTreeView() {
    return html`
      <div class=${classMap({
        'tree-view': true,
        'compact-mode': this.settings.compactMode
      })}>
        ${this._renderTreeNodes(this._filteredTree)}
      </div>
    `;
  }

  private _renderTreeNodes(nodes: DocumentNode[]): any {
    return nodes.map(node => html`
      <div class="tree-node">
        <div 
          class=${classMap({
            'tree-node-content': true,
            'active': this._selectedNode?.id === node.id
          })}
          style=${styleMap({
            '--node-indent': `${node.level * 20}px`
          })}
          @click=${() => this._selectNode(node)}
        >
          ${node.children.length > 0 ? html`
            <div 
              class=${classMap({
                'tree-node-toggle': true,
                'expanded': !node.collapsed
              })}
              @click=${(e: Event) => {
                e.stopPropagation();
                this._toggleNodeCollapse(node);
              }}
            >
              ▶
            </div>
          ` : html`<div class="tree-node-toggle"></div>`}
          
          <div class="tree-node-icon">
            ${this._getNodeIcon(node.type)}
          </div>
          
          <div class="tree-node-info">
            <div class="tree-node-title">${node.title}</div>
            <div class="tree-node-meta">
              ${this.settings.showWordCount ? html`
                <span>${node.wordCount} 字</span>
              ` : nothing}
              ${this.settings.showCreateTime ? html`
                <span>${node.createTime.toLocaleDateString()}</span>
              ` : nothing}
              ${this.settings.showTags && node.tags.length > 0 ? html`
                <span>${node.tags.join(', ')}</span>
              ` : nothing}
            </div>
          </div>
        </div>
        
        ${node.children.length > 0 && !node.collapsed ? html`
          <div class="tree-node-children">
            ${this._renderTreeNodes(node.children)}
          </div>
        ` : nothing}
      </div>
    `);
  }

  private _renderMindmapView() {
    return html`
      <div class="mindmap-view">
        <div class="mindmap-canvas">
          ${this._renderMindmapNodes()}
        </div>
      </div>
    `;
  }

  private _renderMindmapNodes() {
    // 简化的思维导图布局
    return this._filteredTree.map((node, index) => {
      const angle = (index * 360) / this._filteredTree.length;
      const radius = 150;
      const x = Math.cos(angle * Math.PI / 180) * radius + 50;
      const y = Math.sin(angle * Math.PI / 180) * radius + 50;
      
      return html`
        <div 
          class=${classMap({
            'mindmap-node': true,
            [`level-${Math.min(node.level + 1, 4)}`]: true
          })}
          style=${styleMap({
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)'
          })}
          @click=${() => this._selectNode(node)}
        >
          <div>${node.title}</div>
          ${this.settings.showWordCount ? html`
            <div style="font-size: 10px; opacity: 0.8;">${node.wordCount} 字</div>
          ` : nothing}
        </div>
      `;
    });
  }

  private _renderTimelineView() {
    return html`
      <div class="timeline-view">
        <div class="timeline-container">
          <div class="timeline-line"></div>
          ${this._filteredTree.map(node => html`
            <div class="timeline-item">
              <div class="timeline-marker"></div>
              <div class="timeline-content" @click=${() => this._selectNode(node)}>
                <div class="timeline-header">
                  <div class="timeline-title">${node.title}</div>
                  <div class="timeline-time">${node.createTime.toLocaleString()}</div>
                </div>
                <div class="timeline-preview">
                  ${node.content.substring(0, 100)}${node.content.length > 100 ? '...' : ''}
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderOutlineView() {
    return html`
      <div class="outline-view">
        ${this._renderOutlineNodes(this._filteredTree)}
      </div>
    `;
  }

  private _renderOutlineNodes(nodes: DocumentNode[]): any {
    return nodes.map(node => html`
      <div 
        class=${classMap({
          'outline-item': true,
          'active': this._selectedNode?.id === node.id
        })}
        @click=${() => this._selectNode(node)}
      >
        <div 
          class="outline-level-indicator"
          style=${styleMap({
            '--outline-indent': `${node.level * 16}px`
          })}
        ></div>
        <div class="outline-title">${node.title}</div>
        <div class="outline-meta">
          ${this.settings.showWordCount ? `${node.wordCount} 字` : ''}
        </div>
      </div>
      ${node.children.length > 0 ? this._renderOutlineNodes(node.children) : nothing}
    `);
  }

  private _renderExportMenu() {
    return html`
      <div class="export-menu">
        <div class="export-item" @click=${() => this._exportAs('json')}>
          💾 JSON 格式
        </div>
        <div class="export-item" @click=${() => this._exportAs('markdown')}>
          📝 Markdown 格式
        </div>
        <div class="export-item" @click=${() => this._exportAs('text')}>
          📄 纯文本格式
        </div>
        <div class="export-item" @click=${() => this._exportAs('image')}>
          🖼️ 图片格式
        </div>
      </div>
    `;
  }

  private _renderStatistics() {
    return html`
      <div class="structure-stats">
        <div class="stat-item">
          <span>节点数:</span>
          <span class="stat-value">${this._statistics.totalNodes}</span>
        </div>
        <div class="stat-item">
          <span>总字数:</span>
          <span class="stat-value">${this._statistics.totalWords}</span>
        </div>
        <div class="stat-item">
          <span>最大深度:</span>
          <span class="stat-value">${this._statistics.maxDepth}</span>
        </div>
        <div class="stat-item">
          <span>最后更新:</span>
          <span class="stat-value">${this._statistics.lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>
    `;
  }

  private _onFilterChange(e: Event) {
    const filterType = (e.target as HTMLSelectElement).value;
    
    if (filterType === 'all') {
      this._filteredTree = this._documentTree;
    } else {
      this._filteredTree = this._filterNodesByType(this._documentTree, filterType as DocumentNode['type']);
    }
    
    this.requestUpdate();
  }

  private _filterNodesByType(nodes: DocumentNode[], type: DocumentNode['type']): DocumentNode[] {
    const filtered: DocumentNode[] = [];
    
    for (const node of nodes) {
      const filteredChildren = this._filterNodesByType(node.children, type);
      
      if (node.type === type || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });
      }
    }
    
    return filtered;
  }

  private _exportAs(format: 'json' | 'markdown' | 'text' | 'image') {
    let content = '';
    
    switch (format) {
      case 'json':
        content = JSON.stringify(this._documentTree, null, 2);
        break;
      case 'markdown':
        content = this._generateMarkdown(this._documentTree);
        break;
      case 'text':
        content = this._generateText(this._documentTree);
        break;
      case 'image':
        this._exportAsImage();
        return;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-structure.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    
    this._showExportMenu = false;
    this.requestUpdate();
  }

  private _generateMarkdown(nodes: DocumentNode[], level: number = 0): string {
    let markdown = '';
    
    for (const node of nodes) {
      const indent = '  '.repeat(level);
      markdown += `${indent}- ${node.title}\n`;
      
      if (node.children.length > 0) {
        markdown += this._generateMarkdown(node.children, level + 1);
      }
    }
    
    return markdown;
  }

  private _generateText(nodes: DocumentNode[], level: number = 0): string {
    let text = '';
    
    for (const node of nodes) {
      const indent = '  '.repeat(level);
      text += `${indent}${node.title}\n`;
      
      if (node.children.length > 0) {
        text += this._generateText(node.children, level + 1);
      }
    }
    
    return text;
  }

  private _exportAsImage() {
    // 简化实现：创建SVG并导出为图片
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '600');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // 这里可以添加更复杂的SVG绘制逻辑
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50');
    text.setAttribute('y', '50');
    text.textContent = '文档结构图';
    svg.appendChild(text);
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document-structure.svg';
    a.click();
    URL.revokeObjectURL(url);
    
    this._showExportMenu = false;
    this.requestUpdate();
  }

  override render() {
    return html`
      <div class="structure-container">
        ${this._renderHeader()}
        ${this._renderControls()}
        <div class="structure-content">
          ${this._renderContent()}
        </div>
        ${this._renderStatistics()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'document-structure-visualization': DocumentStructureVisualization;
  }
}