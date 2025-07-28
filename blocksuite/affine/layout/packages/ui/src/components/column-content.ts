/**
 * 列内容组件实现
 * 开发者B1任务：实现ColumnContent组件
 */

import { LitElement, html, css, PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { createAnimationManager } from '@blocksuite/affine-layout-interactions';
import { Block, IColumnDistributor, IBlockHeightEstimator, SERVICE_TOKENS } from '@blocksuite/affine-layout-core';

/**
 * 列内容组件
 * 负责渲染和管理单个列中的Block内容
 */
@customElement('column-content')
export class ColumnContent extends LitElement {
  @property({ type: Number })
  columnIndex = 0;
  
  @property({ type: String })
  docId = '';
  
  @property({ type: Array })
  blocks: Block[] = [];
  
  @property({ type: Boolean })
  isDragOver = false;
  
  @property({ type: Boolean })
  allowDrop = true;
  
  @property({ type: Number })
  minHeight = 200;
  
  @property({ type: String })
  emptyMessage = '将内容拖拽到此处';
  
  @state()
  private dragOverIndex = -1;
  
  @state()
  private isReordering = false;
  
  @state()
  private hoveredBlock: string | null = null;
  
  @query('.column-content')
  private contentElement?: HTMLElement;
  
  // 服务实例
  private animationManager = createAnimationManager();
  private heightEstimator?: IBlockHeightEstimator;
  private columnDistributor?: IColumnDistributor;
  
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    
    .column-content {
      display: flex;
      flex-direction: column;
      gap: var(--block-gap, 8px);
      padding: var(--column-padding, 12px);
      min-height: var(--min-height);
      background: var(--column-background, transparent);
      border: 2px dashed transparent;
      border-radius: var(--column-border-radius, 8px);
      transition: all 0.2s ease;
      position: relative;
      overflow-y: auto;
    }
    
    .column-content.drag-over {
      border-color: var(--primary-color, #3b82f6);
      background: var(--primary-background, rgba(59, 130, 246, 0.05));
    }
    
    .column-content.empty {
      justify-content: center;
      align-items: center;
      color: var(--text-secondary);
      font-style: italic;
    }
    
    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--header-background, rgba(0, 0, 0, 0.02));
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .column-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }
    
    .column-stats {
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .block-item {
      position: relative;
      background: var(--block-background, white);
      border: 1px solid var(--block-border, #e5e7eb);
      border-radius: 6px;
      padding: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .block-item:hover {
      border-color: var(--primary-color, #3b82f6);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      transform: translateY(-1px);
    }
    
    .block-item.dragging {
      opacity: 0.5;
      transform: rotate(2deg) scale(0.98);
    }
    
    .block-item.drop-target {
      border-color: var(--success-color, #10b981);
      background: var(--success-background, rgba(16, 185, 129, 0.05));
    }
    
    .block-content {
      line-height: 1.5;
      color: var(--text-primary);
    }
    
    .block-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .block-type {
      background: var(--tag-background, #f3f4f6);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      text-transform: uppercase;
    }
    
    .block-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .block-item:hover .block-actions {
      opacity: 1;
    }
    
    .action-button {
      background: none;
      border: none;
      padding: 4px;
      border-radius: 3px;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }
    
    .action-button:hover {
      background: var(--button-hover-background, #f3f4f6);
      color: var(--text-primary);
    }
    
    .drop-indicator {
      height: 2px;
      background: var(--primary-color, #3b82f6);
      border-radius: 1px;
      margin: 4px 0;
      opacity: 0;
      transform: scaleX(0);
      transition: all 0.2s ease;
    }
    
    .drop-indicator.active {
      opacity: 1;
      transform: scaleX(1);
    }
    
    .empty-message {
      text-align: center;
      color: var(--text-secondary);
      font-style: italic;
      padding: 40px 20px;
    }
    
    .add-block-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 2px dashed var(--border-color, #e5e7eb);
      border-radius: 6px;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 8px;
    }
    
    .add-block-button:hover {
      border-color: var(--primary-color, #3b82f6);
      color: var(--primary-color, #3b82f6);
      background: var(--primary-background, rgba(59, 130, 246, 0.05));
    }
    
    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 6px;
      height: 80px;
      margin-bottom: 8px;
    }
    
    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
    
    /* 响应式调整 */
    @media (max-width: 768px) {
      .column-content {
        padding: 8px;
        gap: 6px;
      }
      
      .block-item {
        padding: 8px;
      }
    }
  `;
  
  connectedCallback() {
    super.connectedCallback();
    this.initializeServices();
    this.setupDragAndDrop();
    this.updateCSSProperties();
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    this.animationManager.cleanup();
  }
  
  protected updated(changedProperties: PropertyValues) {
    if (changedProperties.has('blocks')) {
      this.updateColumnStats();
    }
    
    if (changedProperties.has('minHeight')) {
      this.updateCSSProperties();
    }
  }
  
  /**
   * 初始化服务
   */
  private async initializeServices() {
    try {
      // 这里应该通过DI获取服务实例
      // this.heightEstimator = container.get<IBlockHeightEstimator>(SERVICE_TOKENS.BLOCK_HEIGHT_ESTIMATOR);
      // this.columnDistributor = container.get<IColumnDistributor>(SERVICE_TOKENS.COLUMN_DISTRIBUTOR);
      
      // 临时使用Mock服务
      this.heightEstimator = await this.createMockHeightEstimator();
      this.columnDistributor = await this.createMockDistributor();
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  }
  
  /**
   * 设置拖拽功能
   */
  private setupDragAndDrop() {
    if (!this.allowDrop) return;
    
    this.addEventListener('dragover', this.handleDragOver.bind(this));
    this.addEventListener('drop', this.handleDrop.bind(this));
    this.addEventListener('dragenter', this.handleDragEnter.bind(this));
    this.addEventListener('dragleave', this.handleDragLeave.bind(this));
  }
  
  /**
   * 更新CSS自定义属性
   */
  private updateCSSProperties() {
    this.style.setProperty('--min-height', `${this.minHeight}px`);
  }
  
  /**
   * 更新列统计信息
   */
  private updateColumnStats() {
    const totalBlocks = this.blocks.length;
    const estimatedHeight = this.blocks.reduce((total, block) => {
      return total + (this.heightEstimator?.estimate(block) || 100);
    }, 0);
    
    this.dispatchEvent(new CustomEvent('column-stats-update', {
      detail: {
        columnIndex: this.columnIndex,
        blockCount: totalBlocks,
        estimatedHeight
      },
      bubbles: true
    }));
  }
  
  render() {
    return html`
      <div class="column-header">
        <div class="column-title">列 ${this.columnIndex + 1}</div>
        <div class="column-stats">${this.blocks.length} 个项目</div>
      </div>
      
      <div 
        class="column-content ${this.isDragOver ? 'drag-over' : ''} ${this.blocks.length === 0 ? 'empty' : ''}"
        @scroll="${this.handleScroll}"
      >
        ${this.blocks.length === 0 ? 
          this.renderEmptyState() : 
          this.renderBlocks()
        }
        
        ${this.renderAddButton()}
      </div>
    `;
  }
  
  /**
   * 渲染空状态
   */
  private renderEmptyState() {
    return html`
      <div class="empty-message">
        ${this.emptyMessage}
      </div>
    `;
  }
  
  /**
   * 渲染Block列表
   */
  private renderBlocks() {
    return html`
      ${this.blocks.map((block, index) => html`
        ${this.renderDropIndicator(index)}
        ${this.renderBlock(block, index)}
      `)}
      ${this.renderDropIndicator(this.blocks.length)}
    `;
  }
  
  /**
   * 渲染单个Block
   */
  private renderBlock(block: Block, index: number) {
    const isHovered = this.hoveredBlock === block.id;
    const isDragging = false; // 这里应该检查实际的拖拽状态
    
    return html`
      <div 
        class="block-item ${isDragging ? 'dragging' : ''}"
        data-block-id="${block.id}"
        data-block-index="${index}"
        draggable="true"
        @dragstart="${(e: DragEvent) => this.handleBlockDragStart(e, block, index)}"
        @dragend="${this.handleBlockDragEnd}"
        @mouseenter="${() => this.hoveredBlock = block.id}"
        @mouseleave="${() => this.hoveredBlock = null}"
        @click="${() => this.handleBlockClick(block)}"
      >
        <div class="block-content">
          ${this.renderBlockContent(block)}
        </div>
        
        <div class="block-meta">
          <span class="block-type">${block.type}</span>
          <div class="block-actions">
            <button 
              class="action-button"
              @click="${(e: Event) => this.handleMoveUp(e, block, index)}"
              ?disabled="${index === 0}"
              title="上移"
            >↑</button>
            <button 
              class="action-button"
              @click="${(e: Event) => this.handleMoveDown(e, block, index)}"
              ?disabled="${index === this.blocks.length - 1}"
              title="下移"
            >↓</button>
            <button 
              class="action-button"
              @click="${(e: Event) => this.handleDeleteBlock(e, block, index)}"
              title="删除"
            >🗑</button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 渲染Block内容
   */
  private renderBlockContent(block: Block): any {
    // 这里应该根据Block类型渲染不同的内容
    const content = this.getBlockDisplayContent(block);
    
    switch (block.type) {
      case 'heading':
        const level = block.properties?.level || 1;
        return html`<h${level}>${content}</h${level}>`;
      
      case 'paragraph':
        return html`<p>${content}</p>`;
      
      case 'list':
        return html`
          <ul>
            ${block.children?.map(child => html`<li>${this.getBlockDisplayContent(child)}</li>`)}
          </ul>
        `;
      
      case 'image':
        return html`
          <img 
            src="${block.properties?.src || '#'}" 
            alt="${block.properties?.alt || ''}"
            style="max-width: 100%; height: auto;"
          />
          ${block.properties?.caption ? html`<div class="caption">${block.properties.caption}</div>` : ''}
        `;
      
      case 'code':
        return html`
          <pre><code>${content}</code></pre>
        `;
      
      default:
        return html`<div>${content}</div>`;
    }
  }
  
  /**
   * 获取Block显示内容
   */
  private getBlockDisplayContent(block: Block): string {
    if (typeof block.content === 'string') {
      return block.content;
    }
    
    if (block.content?.text) {
      return block.content.text;
    }
    
    if (block.content?.delta) {
      return block.content.delta.map((op: any) => op.insert || '').join('');
    }
    
    return `[${block.type} Block]`;
  }
  
  /**
   * 渲染放置指示器
   */
  private renderDropIndicator(index: number) {
    const isActive = this.dragOverIndex === index;
    
    return html`
      <div class="drop-indicator ${isActive ? 'active' : ''}"></div>
    `;
  }
  
  /**
   * 渲染添加按钮
   */
  private renderAddButton() {
    return html`
      <button 
        class="add-block-button"
        @click="${this.handleAddBlock}"
      >
        <span>＋</span>
        <span>添加内容</span>
      </button>
    `;
  }
  
  // ===== 事件处理方法 =====
  
  private handleDragOver(event: DragEvent) {
    if (!this.allowDrop) return;
    
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    
    const index = this.calculateDropIndex(event);
    this.dragOverIndex = index;
    this.isDragOver = true;
  }
  
  private handleDrop(event: DragEvent) {
    if (!this.allowDrop) return;
    
    event.preventDefault();
    this.isDragOver = false;
    this.dragOverIndex = -1;
    
    const dropIndex = this.calculateDropIndex(event);
    const data = event.dataTransfer?.getData('text/plain');
    
    if (data) {
      this.handleBlockDrop(data, dropIndex);
    }
  }
  
  private handleDragEnter(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }
  
  private handleDragLeave(event: DragEvent) {
    // 只有当真正离开组件时才重置状态
    if (!this.contains(event.relatedTarget as Node)) {
      this.isDragOver = false;
      this.dragOverIndex = -1;
    }
  }
  
  private handleBlockDragStart(event: DragEvent, block: Block, index: number) {
    const dragData = JSON.stringify({
      blockId: block.id,
      sourceColumn: this.columnIndex,
      sourceIndex: index
    });
    
    event.dataTransfer!.setData('text/plain', dragData);
    event.dataTransfer!.effectAllowed = 'move';
    
    // 延迟添加拖拽样式，避免影响拖拽图像
    setTimeout(() => {
      const element = event.target as HTMLElement;
      element.classList.add('dragging');
    }, 0);
  }
  
  private handleBlockDragEnd(event: DragEvent) {
    const element = event.target as HTMLElement;
    element.classList.remove('dragging');
  }
  
  private calculateDropIndex(event: DragEvent): number {
    const rect = this.contentElement!.getBoundingClientRect();
    const y = event.clientY - rect.top;
    
    let index = 0;
    const blockElements = this.contentElement!.querySelectorAll('.block-item');
    
    for (let i = 0; i < blockElements.length; i++) {
      const blockRect = blockElements[i].getBoundingClientRect();
      const blockY = blockRect.top - rect.top + blockRect.height / 2;
      
      if (y < blockY) {
        break;
      }
      index = i + 1;
    }
    
    return index;
  }
  
  private async handleBlockDrop(dragData: string, dropIndex: number) {
    try {
      const data = JSON.parse(dragData);
      
      this.dispatchEvent(new CustomEvent('block-drop', {
        detail: {
          ...data,
          targetColumn: this.columnIndex,
          targetIndex: dropIndex
        },
        bubbles: true
      }));
      
      // 添加放置动画效果
      await this.animationManager.createParticleEffect(this, 'transform');
      
    } catch (error) {
      console.error('Failed to handle block drop:', error);
    }
  }
  
  private handleBlockClick(block: Block) {
    this.dispatchEvent(new CustomEvent('block-select', {
      detail: { block, columnIndex: this.columnIndex },
      bubbles: true
    }));
  }
  
  private async handleMoveUp(event: Event, block: Block, index: number) {
    event.stopPropagation();
    
    if (index > 0) {
      await this.animateBlockMove(index, index - 1);
      
      this.dispatchEvent(new CustomEvent('block-move', {
        detail: {
          blockId: block.id,
          fromIndex: index,
          toIndex: index - 1,
          columnIndex: this.columnIndex
        },
        bubbles: true
      }));
    }
  }
  
  private async handleMoveDown(event: Event, block: Block, index: number) {
    event.stopPropagation();
    
    if (index < this.blocks.length - 1) {
      await this.animateBlockMove(index, index + 1);
      
      this.dispatchEvent(new CustomEvent('block-move', {
        detail: {
          blockId: block.id,
          fromIndex: index,
          toIndex: index + 1,
          columnIndex: this.columnIndex
        },
        bubbles: true
      }));
    }
  }
  
  private handleDeleteBlock(event: Event, block: Block, index: number) {
    event.stopPropagation();
    
    if (confirm('确定要删除这个内容块吗？')) {
      this.dispatchEvent(new CustomEvent('block-delete', {
        detail: {
          blockId: block.id,
          index,
          columnIndex: this.columnIndex
        },
        bubbles: true
      }));
    }
  }
  
  private handleAddBlock() {
    this.dispatchEvent(new CustomEvent('add-block', {
      detail: {
        columnIndex: this.columnIndex,
        position: this.blocks.length
      },
      bubbles: true
    }));
  }
  
  private handleScroll(event: Event) {
    // 实现虚拟滚动或懒加载逻辑
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // 接近底部时触发加载更多
    if (scrollHeight - scrollTop - clientHeight < 100) {
      this.dispatchEvent(new CustomEvent('load-more', {
        detail: { columnIndex: this.columnIndex },
        bubbles: true
      }));
    }
  }
  
  // ===== 动画方法 =====
  
  private async animateBlockMove(fromIndex: number, toIndex: number) {
    const blockElements = this.contentElement!.querySelectorAll('.block-item');
    const fromElement = blockElements[fromIndex] as HTMLElement;
    const toElement = blockElements[toIndex] as HTMLElement;
    
    if (fromElement && toElement) {
      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();
      
      // 使用动画管理器执行移动动画
      await this.animationManager.createMagneticEffect(
        fromElement,
        toRect.left,
        toRect.top
      );
    }
  }
  
  // ===== Mock服务 =====
  
  private async createMockHeightEstimator(): Promise<IBlockHeightEstimator> {
    return {
      estimate: (block: Block) => {
        const baseHeights = {
          paragraph: 60,
          heading: 80,
          list: 100,
          image: 200,
          code: 120,
          table: 150
        };
        return baseHeights[block.type as keyof typeof baseHeights] || 60;
      },
      cacheHeight: () => {},
      getCachedHeight: () => null,
      clearCache: () => {},
      batchEstimate: (blocks: Block[]) => blocks.map(b => this.createMockHeightEstimator().then(e => e.estimate(b)))
    } as any;
  }
  
  private async createMockDistributor(): Promise<IColumnDistributor> {
    return {
      distributeBlocks: (blocks: Block[], columnCount: number) => {
        const columns: Block[][] = Array.from({ length: columnCount }, () => []);
        blocks.forEach((block, index) => {
          columns[index % columnCount].push(block);
        });
        return columns;
      },
      redistributeOnModeChange: (currentColumns: Block[][], newColumnCount: number) => {
        const allBlocks = currentColumns.flat();
        return this.createMockDistributor().then(d => d.distributeBlocks(allBlocks, newColumnCount));
      },
      moveBlock: (blockId: string, targetColumn: number, targetIndex: number, columns: Block[][]) => {
        // 简单的移动实现
        return columns;
      },
      evaluateDistribution: () => 0.8
    } as any;
  }
}