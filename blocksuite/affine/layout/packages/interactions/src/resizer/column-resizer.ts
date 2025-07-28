import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { IColumnResizer, ColumnResizeEvent } from '../types/responsive-contracts.js';
import { EnhancedColumnConstraintManager } from './drag-manager.js';

/**
 * 列宽调整器组件 - 支持拖拽调整列宽度
 */
@customElement('column-resizer')
export class ColumnResizer extends LitElement implements IColumnResizer {
  // 公共属性
  @property({ type: Number }) columnIndex!: number;
  @property({ type: Number }) minWidth = 200;
  @property({ type: Number }) maxWidth = 800;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) enableSmartConstraints = true;

  // 内部状态
  @state() private accessor isDragging = false;
  @state() private accessor isHovering = false;
  
  // 拖拽状态
  private startX = 0;
  private startWidths: number[] = [];
  private currentWidths: number[] = [];
  private guideLine?: HTMLElement;
  private tooltip?: HTMLElement;
  private constraintManager?: EnhancedColumnConstraintManager;
  
  // 事件监听器
  private resizeCallbacks: Array<(widths: number[]) => void> = [];
  
  // 样式定义
  static styles = css`
    :host {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 8px;
      margin-left: -4px;
      cursor: col-resize;
      z-index: 10;
      user-select: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    :host(:hover) {
      opacity: 1;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.3;
    }

    .resizer-handle {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 40px;
      margin: -20px 0 0 -2px;
      background: var(--affine-primary-color, #1e96eb);
      border-radius: 2px;
      opacity: 0;
      transition: all 0.2s ease;
    }

    :host(:hover) .resizer-handle {
      opacity: 0.6;
      width: 6px;
      margin-left: -3px;
    }

    :host([data-dragging]) .resizer-handle {
      opacity: 1;
      height: 60px;
      margin-top: -30px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .resize-guide-line {
      position: fixed;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--affine-primary-color, #1e96eb);
      opacity: 0;
      z-index: 1000;
      pointer-events: none;
      transition: opacity 0.1s ease;
    }

    .resize-guide-line.active {
      opacity: 0.8;
      box-shadow: 0 0 4px var(--affine-primary-color, #1e96eb);
    }

    .resize-tooltip {
      position: fixed;
      top: var(--tooltip-y, 0);
      left: var(--tooltip-x, 0);
      padding: 4px 8px;
      background: var(--affine-background-overlay-panel-color, rgba(0, 0, 0, 0.8));
      color: var(--affine-text-primary-color, white);
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 1001;
      pointer-events: none;
    }

    .resize-tooltip.active {
      opacity: 1;
    }

    .resize-tooltip::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -4px;
      border: 4px solid transparent;
      border-top-color: var(--affine-background-overlay-panel-color, rgba(0, 0, 0, 0.8));
    }

    /* 移动端适配 */
    @media (max-width: 768px) {
      :host {
        width: 12px;
        margin-left: -6px;
      }
      
      .resizer-handle {
        width: 6px;
        height: 50px;
        margin: -25px 0 0 -3px;
      }
      
      :host(:hover) .resizer-handle {
        width: 8px;
        margin-left: -4px;
      }
    }

    /* 触摸设备优化 */
    @media (hover: none) {
      :host {
        opacity: 0.3;
      }
      
      .resizer-handle {
        opacity: 0.6;
        width: 6px;
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.setupEventListeners();
    this.initializeConstraintManager();
  }

  /**
   * 初始化约束管理器
   */
  private initializeConstraintManager(): void {
    if (this.enableSmartConstraints) {
      const containerWidth = this.getContainerWidth();
      this.constraintManager = new EnhancedColumnConstraintManager(
        this.minWidth,
        this.maxWidth,
        containerWidth,
        {
          enableContentAnalysis: true,
          enableResponsiveConstraints: true,
          preferredDistribution: 'content-based'
        }
      );
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  render(): TemplateResult {
    return html`
      <div class="resizer-handle"></div>
    `;
  }

  // IColumnResizer 接口实现
  setColumnWidths(widths: number[]): void {
    this.currentWidths = [...widths];
  }

  onColumnResize(callback: (widths: number[]) => void): void {
    this.resizeCallbacks.push(callback);
  }

  enable(): void {
    this.disabled = false;
  }

  disable(): void {
    this.disabled = true;
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 鼠标事件
    this.addEventListener('mousedown', this.handleMouseDown);
    this.addEventListener('mouseenter', this.handleMouseEnter);
    this.addEventListener('mouseleave', this.handleMouseLeave);
    
    // 触摸事件
    this.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    
    // 双击重置
    this.addEventListener('dblclick', this.handleDoubleClick);
  }

  /**
   * 鼠标按下事件
   */
  private handleMouseDown = (event: MouseEvent) => {
    if (this.disabled || event.button !== 0) return;
    
    this.startDrag(event.clientX);
    event.preventDefault();
  };

  /**
   * 触摸开始事件
   */
  private handleTouchStart = (event: TouchEvent) => {
    if (this.disabled || event.touches.length !== 1) return;
    
    this.startDrag(event.touches[0].clientX);
    event.preventDefault();
  };

  /**
   * 鼠标进入事件
   */
  private handleMouseEnter = () => {
    this.isHovering = true;
  };

  /**
   * 鼠标离开事件
   */
  private handleMouseLeave = () => {
    this.isHovering = false;
  };

  /**
   * 双击重置事件
   */
  private handleDoubleClick = () => {
    if (this.disabled) return;
    
    this.resetColumnWidths();
  };

  /**
   * 开始拖拽
   */
  private startDrag(clientX: number): void {
    this.isDragging = true;
    this.startX = clientX;
    this.startWidths = this.getCurrentColumnWidths();
    
    // 设置拖拽属性
    this.setAttribute('data-dragging', '');
    
    // 显示引导元素
    this.showGuideElements();
    
    // 设置全局拖拽状态
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    // 添加全局事件监听
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
    
    // 触发拖拽开始事件
    this.dispatchEvent(new CustomEvent('resize-start', {
      detail: { columnIndex: this.columnIndex, startWidths: this.startWidths },
      bubbles: true
    }));
  }

  /**
   * 鼠标移动事件
   */
  private handleMouseMove = (event: MouseEvent) => {
    if (!this.isDragging) return;
    this.updateResize(event.clientX);
  };

  /**
   * 触摸移动事件
   */
  private handleTouchMove = (event: TouchEvent) => {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.updateResize(event.touches[0].clientX);
    event.preventDefault();
  };

  /**
   * 鼠标释放事件
   */
  private handleMouseUp = () => {
    if (!this.isDragging) return;
    this.endDrag();
  };

  /**
   * 触摸结束事件
   */
  private handleTouchEnd = () => {
    if (!this.isDragging) return;
    this.endDrag();
  };

  /**
   * 更新调整
   */
  private updateResize(clientX: number): void {
    const deltaX = clientX - this.startX;
    const newWidths = this.calculateNewWidths(deltaX);
    
    // 应用约束
    const constrainedWidths = this.applyConstraints(newWidths);
    
    // 更新引导线和提示
    this.updateGuideLine(clientX);
    this.updateTooltip(clientX, constrainedWidths);
    
    // 实时更新列宽 (可选)
    this.currentWidths = constrainedWidths;
  }

  /**
   * 结束拖拽
   */
  private endDrag(): void {
    this.isDragging = false;
    
    // 移除拖拽属性
    this.removeAttribute('data-dragging');
    
    // 应用最终宽度
    const finalWidths = this.currentWidths;
    this.applyColumnWidths(finalWidths);
    
    // 清理UI
    this.hideGuideElements();
    
    // 恢复全局状态
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // 移除全局事件监听
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    
    // 触发拖拽结束事件
    const resizeEvent: ColumnResizeEvent = {
      columnIndex: this.columnIndex,
      oldWidth: this.startWidths[this.columnIndex] || 0,
      newWidth: finalWidths[this.columnIndex] || 0,
      allWidths: finalWidths,
      timestamp: Date.now()
    };
    
    this.dispatchEvent(new CustomEvent('resize-end', {
      detail: resizeEvent,
      bubbles: true
    }));
    
    // 通知回调函数
    this.resizeCallbacks.forEach(callback => callback(finalWidths));
  }

  /**
   * 计算新的列宽度
   */
  private calculateNewWidths(deltaX: number): number[] {
    const widths = [...this.startWidths];
    const leftIndex = this.columnIndex;
    const rightIndex = this.columnIndex + 1;
    
    if (rightIndex >= widths.length) return widths;
    
    // 计算像素变化对应的比例变化
    const containerWidth = this.getContainerWidth();
    const deltaRatio = deltaX / containerWidth;
    
    // 调整相邻列的宽度
    widths[leftIndex] += deltaRatio;
    widths[rightIndex] -= deltaRatio;
    
    return widths;
  }

  /**
   * 应用宽度约束
   */
  private applyConstraints(widths: number[]): number[] {
    if (!this.enableSmartConstraints || !this.constraintManager) {
      // 使用基础约束
      const containerWidth = this.getContainerWidth();
      const constrainedWidths = [...widths];
      
      for (let i = 0; i < constrainedWidths.length; i++) {
        const pixelWidth = constrainedWidths[i] * containerWidth;
        const minRatio = this.minWidth / containerWidth;
        const maxRatio = this.maxWidth / containerWidth;
        
        constrainedWidths[i] = Math.max(minRatio, Math.min(maxRatio, constrainedWidths[i]));
      }
      
      // 重新归一化确保总和为1
      const sum = constrainedWidths.reduce((a, b) => a + b, 0);
      return constrainedWidths.map(w => w / sum);
    }

    // 使用高级约束系统
    const containerWidth = this.getContainerWidth();
    this.constraintManager.updateContainerWidth(containerWidth);
    
    const result = this.constraintManager.applyConstraints(widths);
    
    // 如果有违规情况，可以在这里处理（如显示警告）
    if (result.violations.length > 0) {
      console.warn('列宽约束违规:', result.violations);
    }
    
    return result.constrainedWidths;
  }

  /**
   * 获取当前列宽度
   */
  private getCurrentColumnWidths(): number[] {
    // 从布局容器获取当前列宽度
    const container = this.closest('.column-layout-container') as HTMLElement;
    if (!container) return [1, 1, 1]; // 默认值
    
    const computedStyle = getComputedStyle(container);
    const gridColumns = computedStyle.gridTemplateColumns;
    
    if (gridColumns && gridColumns !== 'none') {
      // 解析 grid-template-columns 值
      const columns = gridColumns.split(' ');
      const totalFr = columns.reduce((sum, col) => {
        const match = col.match(/(\d+(?:\.\d+)?)fr/);
        return sum + (match ? parseFloat(match[1]) : 0);
      }, 0);
      
      return columns.map(col => {
        const match = col.match(/(\d+(?:\.\d+)?)fr/);
        return match ? parseFloat(match[1]) / totalFr : 0;
      });
    }
    
    return this.currentWidths.length > 0 ? this.currentWidths : [1, 1, 1];
  }

  /**
   * 获取容器宽度
   */
  private getContainerWidth(): number {
    const container = this.closest('.column-layout-container') as HTMLElement;
    return container?.getBoundingClientRect().width || 1000;
  }

  /**
   * 应用列宽度
   */
  private applyColumnWidths(widths: number[]): void {
    const container = this.closest('.column-layout-container') as HTMLElement;
    if (!container) return;
    
    const gridColumns = widths.map(w => `${w}fr`).join(' ');
    container.style.gridTemplateColumns = gridColumns;
  }

  /**
   * 重置列宽度
   */
  private resetColumnWidths(): void {
    const columnCount = this.getCurrentColumnWidths().length;
    const equalWidths = Array(columnCount).fill(1 / columnCount);
    
    this.applyColumnWidths(equalWidths);
    this.currentWidths = equalWidths;
    
    // 触发重置事件
    this.dispatchEvent(new CustomEvent('resize-reset', {
      detail: { columnIndex: this.columnIndex, newWidths: equalWidths },
      bubbles: true
    }));
    
    // 通知回调函数
    this.resizeCallbacks.forEach(callback => callback(equalWidths));
  }

  /**
   * 显示引导元素
   */
  private showGuideElements(): void {
    this.createGuideLine();
    this.createTooltip();
  }

  /**
   * 隐藏引导元素
   */
  private hideGuideElements(): void {
    this.removeGuideLine();
    this.removeTooltip();
  }

  /**
   * 创建引导线
   */
  private createGuideLine(): void {
    this.guideLine = document.createElement('div');
    this.guideLine.className = 'resize-guide-line';
    document.body.appendChild(this.guideLine);
  }

  /**
   * 更新引导线位置
   */
  private updateGuideLine(clientX: number): void {
    if (!this.guideLine) return;
    
    this.guideLine.style.left = clientX + 'px';
    this.guideLine.classList.add('active');
  }

  /**
   * 移除引导线
   */
  private removeGuideLine(): void {
    if (this.guideLine) {
      this.guideLine.remove();
      this.guideLine = undefined;
    }
  }

  /**
   * 创建提示框
   */
  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'resize-tooltip';
    document.body.appendChild(this.tooltip);
  }

  /**
   * 更新提示框
   */
  private updateTooltip(clientX: number, widths: number[]): void {
    if (!this.tooltip) return;
    
    const containerWidth = this.getContainerWidth();
    const leftWidth = Math.round(widths[this.columnIndex] * containerWidth);
    const rightWidth = Math.round(widths[this.columnIndex + 1] * containerWidth);
    
    this.tooltip.textContent = `${leftWidth}px | ${rightWidth}px`;
    this.tooltip.style.left = (clientX - this.tooltip.offsetWidth / 2) + 'px';
    this.tooltip.style.top = (this.getBoundingClientRect().top - 40) + 'px';
    this.tooltip.classList.add('active');
  }

  /**
   * 移除提示框
   */
  private removeTooltip(): void {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = undefined;
    }
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.hideGuideElements();
    this.resizeCallbacks = [];
    
    // 移除全局事件监听器
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }
}