/**
 * 列内容组件
 * 
 * 负责在多列布局中渲染和管理单个列的内容
 * 支持拖拽排序、块的增删、响应式布局等功能
 */

import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import { 
  Block,
  BlockMoveEvent,
  IColumnContent 
} from '../types/component-contracts.js';
import { DesignTokens, CommonStyles, StyleUtils, AnimationKeyframes } from '../shared/design-tokens.js';
import { columnContentStyles, EmptyStateIcons } from './styles.js';

// 响应式功能集成
import { ResponsiveManager } from '@blocksuite/yunke-layout-interactions/responsive/responsive-manager';
import { ContainerQueryManager } from '@blocksuite/yunke-layout-interactions/responsive/container-query-manager';
import type { ResponsiveChangeEvent } from '@blocksuite/yunke-layout-interactions/types/responsive-contracts';

/**
 * 列内容组件
 * 
 * @example
 * ```html
 * <column-content 
 *   .columnIndex=${0}
 *   .blocks=${this.columnBlocks}
 *   .readonly=${false}
 *   .allowDrop=${true}
 *   @block-move=${this.handleBlockMove}
 *   @block-select=${this.handleBlockSelect}>
 * </column-content>
 * ```
 */
@customElement('column-content')
export class ColumnContent extends LitElement implements IColumnContent {
  static styles = columnContentStyles;

  // ============= 组件属性 =============
  
  /**
   * 列索引
   */
  @property({ type: Number })
  columnIndex = 0;
  
  /**
   * 列中的Block列表
   */
  @property({ type: Array })
  blocks: Block[] = [];
  
  /**
   * 是否只读模式
   */
  @property({ type: Boolean, reflect: true })
  readonly = false;
  
  /**
   * 是否允许拖拽放置
   */
  @property({ type: Boolean })
  allowDrop = true;
  
  /**
   * 列标题
   */
  @property({ type: String })
  title = '';
  
  /**
   * 是否显示统计信息
   */
  @property({ type: Boolean })
  showStats = true;
  
  /**
   * 最大Block数量（0表示无限制）
   */
  @property({ type: Number })
  maxBlocks = 0;
  
  /**
   * 是否启用响应式功能
   */
  @property({ type: Boolean })
  enableResponsive = true;
  
  /**
   * 响应式断点
   */
  @property({ type: String })
  responsiveBreakpoint = 'desktop';
  
  // ============= 内部状态 =============
  
  /**
   * 当前选中的Block ID
   */
  @state()
  private selectedBlockId: string | null = null;
  
  /**
   * 是否正在拖拽中
   */
  @state()
  private isDragging = false;
  
  /**
   * 拖拽悬停状态
   */
  @state()
  private isDraggingOver = false;
  
  /**
   * 拖拽插入位置
   */
  @state()
  private dropInsertIndex = -1;
  
  /**
   * 是否正在加载
   */
  @state()
  private isLoading = false;
  
  /**
   * 当前响应式断点
   */
  @state()
  private currentBreakpoint = 'desktop';
  
  /**
   * 是否处于移动端模式
   */
  @state()
  private isMobileMode = false;
  
  /**
   * Block移动事件监听器
   */
  private blockMoveListeners: Array<(event: BlockMoveEvent) => void> = [];
  
  /**
   * 响应式管理器
   */
  private responsiveManager = new ResponsiveManager();
  
  /**
   * 容器查询管理器
   */
  private containerQueryManager = ContainerQueryManager.getInstance();
  
  /**
   * 响应式监听器句柄
   */
  private responsiveHandle?: any;
  
  // ============= DOM引用 =============
  
  @query('.blocks-container')
  private blocksContainer!: HTMLElement;
  
  @query('.drop-indicator')
  private dropIndicator!: HTMLElement;

  // ============= 生命周期方法 =============
  
  override async connectedCallback() {
    super.connectedCallback();
    this.setupDragAndDrop();
    
    // 启用响应式功能
    if (this.enableResponsive) {
      await this.setupResponsiveListeners();
    }
  }
  
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanupEventListeners();
    this.cleanupResponsiveListeners();
  }
  
  // ============= 渲染方法 =============
  
  override render(): TemplateResult {
    const columnTitle = this.title || `列 ${this.columnIndex + 1}`;
    const blockCount = this.blocks.length;
    const hasBlocks = blockCount > 0;
    
    // 响应式CSS类
    const containerClasses = {
      'column-content-container': true,
      'mobile-mode': this.isMobileMode,
      'responsive-enabled': this.enableResponsive,
      [`breakpoint-${this.currentBreakpoint}`]: this.enableResponsive
    };
    
    return html`
      <div class=${classMap(containerClasses)}>
        ${this.renderColumnHeader(columnTitle, blockCount)}
        
        <div class="blocks-container" 
             @dragover=${this.handleDragOver}
             @dragleave=${this.handleDragLeave}
             @drop=${this.handleDrop}>
          
          ${hasBlocks ? html`
            ${repeat(this.blocks, (block) => block.id, (block, index) => 
              this.renderBlockItem(block, index)
            )}
          ` : this.renderEmptyState()}
          
          <div class="drop-indicator ${this.dropInsertIndex >= 0 ? 'visible' : ''}"></div>
        </div>
        
        <div class="drop-zone ${this.isDraggingOver ? 'active' : ''}"></div>
        
        ${this.isLoading ? html`
          <div class="loading-overlay">
            <div class="loading-spinner"></div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * 渲染列头部
   */
  private renderColumnHeader(title: string, blockCount: number): TemplateResult {
    return html`
      <div class="column-header">
        <span class="column-title" title="${title}">${title}</span>
        ${this.showStats ? html`
          <span class="column-stats">${blockCount} 个项目</span>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * 渲染单个Block项
   */
  private renderBlockItem(block: Block, index: number): TemplateResult {
    const isSelected = this.selectedBlockId === block.id;
    const isDragging = this.isDragging && isSelected;
    
    const classes = {
      'block-item': true,
      'selected': isSelected,
      'dragging': isDragging
    };
    
    return html`
      <div 
        class=${classMap(classes)}
        data-block-id="${block.id}"
        data-index="${index}"
        draggable="${!this.readonly}"
        @click=${() => this.selectBlock(block.id)}
        @dragstart=${(e: DragEvent) => this.handleBlockDragStart(e, block, index)}
        @dragend=${this.handleBlockDragEnd}>
        
        <div class="block-content">
          ${this.renderBlockContent(block)}
        </div>
        
        <div class="block-meta">
          <span class="block-type">${block.flavour}</span>
          <div class="block-actions">
            <button class="action-button" 
                    title="编辑" 
                    @click=${(e: Event) => this.handleEditBlock(e, block)}>
              ✏️
            </button>
            <button class="action-button" 
                    title="删除" 
                    @click=${(e: Event) => this.handleDeleteBlock(e, block.id)}>
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 渲染Block内容
   */
  private renderBlockContent(block: Block): TemplateResult {
    // 根据Block类型渲染不同的内容
    switch (block.flavour) {
      case 'yunke:paragraph':
        return html`<p>${block.text || '空段落'}</p>`;
      case 'yunke:heading':
        const level = block.props?.level || 1;
        return html`<h${level}>${block.text || '标题'}</h${level}>`;
      case 'yunke:image':
        return html`<div>📷 图片块</div>`;
      case 'yunke:code':
        return html`<code>${block.text || '代码块'}</code>`;
      default:
        return html`<div>${block.text || `${block.flavour} 块`}</div>`;
    }
  }
  
  /**
   * 渲染空状态
   */
  private renderEmptyState(): TemplateResult {
    const canDrop = this.allowDrop && !this.readonly;
    const emptyText = canDrop 
      ? '拖拽内容到这里或点击添加新内容'
      : '暂无内容';
    
    // 使用B3样式工程师设计的图标
    const emptyIcon = canDrop ? EmptyStateIcons.add : EmptyStateIcons.default;
    
    return html`
      <div class="empty-state">
        <div class="empty-icon">${emptyIcon}</div>
        <div class="empty-text">${emptyText}</div>
      </div>
    `;
  }
  
  // ============= 公共接口实现 =============
  
  /**
   * 设置列中的Block列表
   */
  setBlocks(blocks: Block[]): void {
    this.blocks = [...blocks];
    this.requestUpdate();
  }
  
  /**
   * 在指定位置添加Block
   */
  addBlock(block: Block, index?: number): void {
    if (this.maxBlocks > 0 && this.blocks.length >= this.maxBlocks) {
      console.warn(`Column ${this.columnIndex} has reached maximum blocks limit: ${this.maxBlocks}`);
      return;
    }
    
    const newBlocks = [...this.blocks];
    const insertIndex = index !== undefined ? index : newBlocks.length;
    
    newBlocks.splice(insertIndex, 0, block);
    this.blocks = newBlocks;
    
    // 触发动画
    this.requestUpdate();
    this.updateComplete.then(() => {
      const blockElement = this.shadowRoot?.querySelector(`[data-block-id="${block.id}"]`);
      if (blockElement instanceof HTMLElement) {
        blockElement.style.animation = 'none';
        blockElement.offsetHeight; // 强制重流
        blockElement.style.animation = `slideUp ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut}`;
      }
    });
  }
  
  /**
   * 移除指定的Block
   */
  removeBlock(blockId: string): void {
    const blockIndex = this.blocks.findIndex(block => block.id === blockId);
    if (blockIndex === -1) return;
    
    // 添加移除动画
    const blockElement = this.shadowRoot?.querySelector(`[data-block-id="${blockId}"]`);
    if (blockElement instanceof HTMLElement) {
      blockElement.style.animation = 'fadeOut 0.2s ease-out forwards';
      setTimeout(() => {
        this.blocks = this.blocks.filter(block => block.id !== blockId);
        if (this.selectedBlockId === blockId) {
          this.selectedBlockId = null;
        }
      }, 200);
    } else {
      this.blocks = this.blocks.filter(block => block.id !== blockId);
      if (this.selectedBlockId === blockId) {
        this.selectedBlockId = null;
      }
    }
  }
  
  /**
   * 监听Block移动事件
   */
  onBlockMove(callback: (event: BlockMoveEvent) => void): void {
    this.blockMoveListeners.push(callback);
  }
  
  /**
   * 设置只读模式
   */
  setReadonly(readonly: boolean): void {
    this.readonly = readonly;
  }
  
  // ============= 私有方法 =============
  
  /**
   * 选择Block
   */
  private selectBlock(blockId: string): void {
    this.selectedBlockId = this.selectedBlockId === blockId ? null : blockId;
    
    // 触发选择事件
    this.dispatchEvent(new CustomEvent('block-select', {
      detail: { blockId, columnIndex: this.columnIndex },
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * 处理编辑Block
   */
  private handleEditBlock(event: Event, block: Block): void {
    event.stopPropagation();
    
    this.dispatchEvent(new CustomEvent('block-edit', {
      detail: { block, columnIndex: this.columnIndex },
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * 处理删除Block
   */
  private handleDeleteBlock(event: Event, blockId: string): void {
    event.stopPropagation();
    
    if (confirm('确定要删除这个块吗？')) {
      this.removeBlock(blockId);
      
      this.dispatchEvent(new CustomEvent('block-delete', {
        detail: { blockId, columnIndex: this.columnIndex },
        bubbles: true,
        composed: true
      }));
    }
  }
  
  /**
   * 设置拖拽功能
   */
  private setupDragAndDrop(): void {
    this.addEventListener('dragover', this.handleDragOver);
    this.addEventListener('drop', this.handleDrop);
  }
  
  /**
   * 清理事件监听器
   */
  private cleanupEventListeners(): void {
    this.removeEventListener('dragover', this.handleDragOver);
    this.removeEventListener('drop', this.handleDrop);
    this.blockMoveListeners = [];
  }
  
  /**
   * 设置响应式监听器
   */
  private async setupResponsiveListeners(): Promise<void> {
    try {
      // 初始化响应式管理器
      await this.responsiveManager.initialize?.();
      
      // 获取容器元素
      const container = this.closest('.layout-container') || 
                       this.closest('.page-container') || 
                       document.body;

      // 设置响应式监听
      this.responsiveHandle = this.responsiveManager.setupResponsiveListeners(
        container as HTMLElement,
        (event: ResponsiveChangeEvent) => this.handleResponsiveChange(event)
      );

      // 立即更新当前状态
      this.updateResponsiveState();
      
      console.log('✅ ColumnContent: 响应式功能已启用');
    } catch (error) {
      console.warn('⚠️ ColumnContent 响应式功能启用失败，将使用默认行为:', error);
      this.enableResponsive = false;
    }
  }
  
  /**
   * 清理响应式监听器
   */
  private cleanupResponsiveListeners(): void {
    if (this.responsiveHandle) {
      this.responsiveHandle.cleanup();
      this.responsiveHandle = null;
    }
  }
  
  /**
   * 处理响应式变化
   */
  private handleResponsiveChange(event: ResponsiveChangeEvent): void {
    console.log('📱 ColumnContent 响应式变化事件:', event);
    
    this.currentBreakpoint = event.breakpoint;
    this.isMobileMode = event.breakpoint === 'mobile';
    
    // 更新组件的响应式状态
    this.responsiveBreakpoint = event.breakpoint;
    
    // 根据断点调整组件行为
    if (this.isMobileMode) {
      // 移动端优化：简化UI
      this.showStats = false;
    } else {
      // 桌面端：恢复完整功能
      this.showStats = true;
    }

    // 触发自定义事件通知父组件
    this.dispatchEvent(new CustomEvent('responsive-change', {
      detail: { 
        ...event, 
        columnIndex: this.columnIndex,
        isMobileMode: this.isMobileMode
      },
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * 更新当前响应式状态
   */
  private updateResponsiveState(): void {
    this.currentBreakpoint = this.responsiveManager.getCurrentBreakpoint();
    this.isMobileMode = this.responsiveManager.isMobile();
  }
  
  /**
   * 处理Block拖拽开始
   */
  private handleBlockDragStart = (event: DragEvent, block: Block, index: number): void => {
    if (this.readonly) {
      event.preventDefault();
      return;
    }
    
    this.isDragging = true;
    this.selectedBlockId = block.id;
    
    // 设置拖拽数据
    event.dataTransfer?.setData('application/json', JSON.stringify({
      blockId: block.id,
      sourceColumnIndex: this.columnIndex,
      sourceIndex: index,
      block: block
    }));
    
    event.dataTransfer!.effectAllowed = 'move';
  };
  
  /**
   * 处理Block拖拽结束
   */
  private handleBlockDragEnd = (): void => {
    this.isDragging = false;
    this.isDraggingOver = false;
    this.dropInsertIndex = -1;
  };
  
  /**
   * 处理拖拽悬停
   */
  private handleDragOver = (event: DragEvent): void => {
    if (!this.allowDrop || this.readonly) return;
    
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    
    this.isDraggingOver = true;
    
    // 计算插入位置
    const rect = this.blocksContainer.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const blockElements = Array.from(this.blocksContainer.querySelectorAll('.block-item'));
    
    let insertIndex = this.blocks.length;
    
    for (let i = 0; i < blockElements.length; i++) {
      const blockRect = blockElements[i].getBoundingClientRect();
      const blockY = blockRect.top - rect.top + blockRect.height / 2;
      
      if (y < blockY) {
        insertIndex = i;
        break;
      }
    }
    
    this.dropInsertIndex = insertIndex;
    
    // 更新指示器位置
    if (this.dropIndicator) {
      const targetY = insertIndex < blockElements.length 
        ? (blockElements[insertIndex] as HTMLElement).offsetTop - 1
        : this.blocksContainer.scrollHeight;
      
      this.dropIndicator.style.top = `${targetY}px`;
    }
  };
  
  /**
   * 处理拖拽离开
   */
  private handleDragLeave = (event: DragEvent): void => {
    const rect = this.getBoundingClientRect();
    const { clientX, clientY } = event;
    
    // 检查是否真的离开了组件区域
    if (clientX < rect.left || clientX > rect.right || 
        clientY < rect.top || clientY > rect.bottom) {
      this.isDraggingOver = false;
      this.dropInsertIndex = -1;
    }
  };
  
  /**
   * 处理拖拽放置
   */
  private handleDrop = (event: DragEvent): void => {
    if (!this.allowDrop || this.readonly) return;
    
    event.preventDefault();
    
    try {
      const dragData = JSON.parse(event.dataTransfer?.getData('application/json') || '{}');
      const { blockId, sourceColumnIndex, sourceIndex, block } = dragData;
      
      if (!blockId || !block) return;
      
      const targetIndex = this.dropInsertIndex >= 0 ? this.dropInsertIndex : this.blocks.length;
      
      // 触发Block移动事件
      const moveEvent: BlockMoveEvent = {
        blockId,
        fromColumn: sourceColumnIndex,
        toColumn: this.columnIndex,
        fromIndex: sourceIndex,
        toIndex: targetIndex
      };
      
      this.notifyBlockMoveListeners(moveEvent);
      
      // 如果是同一列内的移动，直接处理
      if (sourceColumnIndex === this.columnIndex) {
        this.moveBlockWithinColumn(sourceIndex, targetIndex);
      } else {
        // 跨列移动，添加到目标位置
        this.addBlock(block, targetIndex);
      }
      
    } catch (error) {
      console.error('Error handling block drop:', error);
    } finally {
      this.isDraggingOver = false;
      this.dropInsertIndex = -1;
    }
  };
  
  /**
   * 在同一列内移动Block
   */
  private moveBlockWithinColumn(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    
    const newBlocks = [...this.blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    
    // 调整目标索引
    const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    newBlocks.splice(adjustedToIndex, 0, movedBlock);
    
    this.blocks = newBlocks;
  }
  
  /**
   * 通知Block移动监听器
   */
  private notifyBlockMoveListeners(event: BlockMoveEvent): void {
    this.blockMoveListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in block move listener:', error);
      }
    });
    
    // 同时触发DOM事件
    this.dispatchEvent(new CustomEvent('block-move', {
      detail: event,
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * 设置加载状态
   */
  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }
  
  /**
   * 获取列统计信息
   */
  getStats(): { blockCount: number; maxBlocks: number; canAddMore: boolean } {
    return {
      blockCount: this.blocks.length,
      maxBlocks: this.maxBlocks,
      canAddMore: this.maxBlocks === 0 || this.blocks.length < this.maxBlocks
    };
  }
  
  /**
   * 获取响应式状态
   */
  getResponsiveState() {
    return {
      breakpoint: this.currentBreakpoint,
      isMobileMode: this.isMobileMode,
      enableResponsive: this.enableResponsive,
      columnIndex: this.columnIndex,
      isDesktop: this.responsiveManager?.isDesktop() || false,
      isTablet: this.responsiveManager?.isTablet() || false
    };
  }
  
  /**
   * 设置响应式功能开关
   */
  setResponsiveEnabled(enabled: boolean): void {
    if (enabled === this.enableResponsive) return;
    
    this.enableResponsive = enabled;
    
    if (enabled && !this.responsiveHandle) {
      this.setupResponsiveListeners();
    } else if (!enabled && this.responsiveHandle) {
      this.cleanupResponsiveListeners();
    }
  }
}