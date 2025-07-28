// 文件: packages/components/src/column-content/drag-handler.ts
import { LitElement } from 'lit';
import { DragVisualFeedback } from './drag-visual-feedback.js';

/**
 * 高级拖拽处理器
 * 
 * 基于BlockSuite的拖拽模式，为列布局提供完整的拖拽功能:
 * - Block在列间的拖拽移动
 * - 精确的插入位置计算
 * - 自动滚动支持
 * - 拖拽约束和验证
 * - 流畅的视觉反馈
 */
export class ColumnDragHandler {
  private isDragging = false;
  private dragSourceInfo: DragSourceInfo | null = null;
  private currentDropTarget: DropTargetInfo | null = null;
  
  // 拖拽状态
  private dragOverIndex = -1;
  private autoScrollTimer?: number;
  private ghostElement: HTMLElement | null = null;
  
  // 视觉反馈管理器
  private visualFeedback: DragVisualFeedback;
  
  // 配置选项
  private options: DragHandlerOptions;
  
  constructor(
    private container: HTMLElement,
    options: Partial<DragHandlerOptions> = {}
  ) {
    this.options = {
      enableAutoScroll: true,
      scrollSpeed: 10,
      scrollZone: 50,
      enableConstraints: true,
      animationDuration: 300,
      ...options
    };
    
    // 初始化视觉反馈管理器
    this.visualFeedback = new DragVisualFeedback(this.container);
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    // 监听拖拽开始事件
    this.container.addEventListener('dragstart', this.handleDragStart);
    this.container.addEventListener('dragend', this.handleDragEnd);
    
    // 监听拖拽目标事件
    this.container.addEventListener('dragover', this.handleDragOver);
    this.container.addEventListener('dragenter', this.handleDragEnter);
    this.container.addEventListener('dragleave', this.handleDragLeave);
    this.container.addEventListener('drop', this.handleDrop);
    
    // 监听鼠标事件用于拖拽预览
    this.container.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }
  
  private handleDragStart = (event: DragEvent) => {
    const target = event.target as HTMLElement;
    const blockElement = this.findBlockElement(target);
    
    if (!blockElement) return;
    
    // 提取拖拽源信息
    this.dragSourceInfo = this.extractDragSourceInfo(blockElement);
    
    if (!this.dragSourceInfo) {
      event.preventDefault();
      return;
    }
    
    this.isDragging = true;
    
    // 开始视觉反馈
    this.visualFeedback.startDragFeedback(this.dragSourceInfo);
    
    // 设置拖拽数据
    this.setDragData(event, this.dragSourceInfo);
    
    // 创建标准拖拽预览（作为后备）
    this.createDragPreview(event, blockElement);
    
    // 添加基础拖拽样式
    this.addDragSourceStyles(blockElement);
    
    // 触发拖拽开始事件
    this.dispatchDragEvent('drag-start', {
      sourceInfo: this.dragSourceInfo,
      originalEvent: event
    });
  };
  
  private handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    
    if (!this.isDragging || !this.dragSourceInfo) return;
    
    // 计算插入位置
    const dropInfo = this.calculateDropPosition(event);
    
    if (!dropInfo) {
      this.clearDropIndicator();
      return;
    }
    
    // 检查拖拽约束
    const isValidDrop = this.validateDrop(this.dragSourceInfo, dropInfo);
    if (!isValidDrop) {
      event.dataTransfer!.dropEffect = 'none';
      
      // 显示约束违反提示
      this.showConstraintViolation('无法在此位置放置内容', {
        x: event.clientX,
        y: event.clientY
      });
      
      return;
    }
    
    event.dataTransfer!.dropEffect = 'move';
    this.currentDropTarget = dropInfo;
    
    // 更新视觉反馈
    this.visualFeedback.updateDragHover(dropInfo, isValidDrop);
    
    // 处理自动滚动
    if (this.options.enableAutoScroll) {
      this.handleAutoScroll(event.clientY);
    }
    
    // 触发拖拽悬停事件
    this.dispatchDragEvent('drag-over', {
      sourceInfo: this.dragSourceInfo,
      dropTarget: dropInfo,
      originalEvent: event
    });
  };
  
  private handleDrop = (event: DragEvent) => {
    event.preventDefault();
    
    if (!this.isDragging || !this.dragSourceInfo || !this.currentDropTarget) {
      return;
    }
    
    // 执行拖拽移动
    this.executeDrop(this.dragSourceInfo, this.currentDropTarget);
    
    // 触发拖拽完成事件
    this.dispatchDragEvent('drag-drop', {
      sourceInfo: this.dragSourceInfo,
      dropTarget: this.currentDropTarget,
      originalEvent: event
    });
    
    // 清理拖拽状态
    this.cleanupDragState();
  };
  
  private handleDragEnd = (event: DragEvent) => {
    // 结束视觉反馈
    const success = this.currentDropTarget !== null;
    this.visualFeedback.endDragFeedback(success);
    
    // 清理所有拖拽状态
    this.cleanupDragState();
    
    // 触发拖拽结束事件
    this.dispatchDragEvent('drag-end', {
      sourceInfo: this.dragSourceInfo,
      originalEvent: event
    });
  };
  
  private calculateDropPosition(event: DragEvent): DropTargetInfo | null {
    const target = event.target as HTMLElement;
    const columnElement = this.findColumnElement(target);
    
    if (!columnElement) return null;
    
    const columnIndex = this.getColumnIndex(columnElement);
    const insertIndex = this.calculateInsertIndex(event.clientY, columnElement);
    
    return {
      columnIndex,
      insertIndex,
      columnElement,
      position: { x: event.clientX, y: event.clientY }
    };
  }
  
  private calculateInsertIndex(clientY: number, columnElement: HTMLElement): number {
    const blockElements = Array.from(
      columnElement.querySelectorAll('.block-item')
    ) as HTMLElement[];
    
    if (blockElements.length === 0) return 0;
    
    const containerRect = columnElement.getBoundingClientRect();
    const relativeY = clientY - containerRect.top;
    
    for (let i = 0; i < blockElements.length; i++) {
      const blockRect = blockElements[i].getBoundingClientRect();
      const blockRelativeY = blockRect.top - containerRect.top;
      const blockCenter = blockRelativeY + blockRect.height / 2;
      
      if (relativeY < blockCenter) {
        return i;
      }
    }
    
    return blockElements.length;
  }
  
  private showConstraintViolation(message: string, position: { x: number; y: number }) {
    this.visualFeedback.showConstraintViolation(message, position);
  }
  
  private handleAutoScroll(clientY: number) {
    const scrollContainer = this.findScrollContainer();
    if (!scrollContainer) return;
    
    const rect = scrollContainer.getBoundingClientRect();
    const scrollZone = this.options.scrollZone;
    
    // 清除之前的自动滚动
    if (this.autoScrollTimer) {
      clearTimeout(this.autoScrollTimer);
    }
    
    let scrollDirection = 0;
    
    if (clientY < rect.top + scrollZone) {
      // 向上滚动
      scrollDirection = -1;
    } else if (clientY > rect.bottom - scrollZone) {
      // 向下滚动
      scrollDirection = 1;
    }
    
    if (scrollDirection !== 0) {
      this.autoScrollTimer = window.setTimeout(() => {
        scrollContainer.scrollTop += scrollDirection * this.options.scrollSpeed;
        
        // 继续自动滚动
        if (this.isDragging) {
          this.handleAutoScroll(clientY);
        }
      }, 16); // 60fps
    }
  }
  
  private validateDrop(source: DragSourceInfo, target: DropTargetInfo): boolean {
    if (!this.options.enableConstraints) return true;
    
    // 不能拖拽到同一位置
    if (source.columnIndex === target.columnIndex && 
        source.blockIndex === target.insertIndex) {
      return false;
    }
    
    // 不能拖拽到紧邻的位置 (没有实际移动)
    if (source.columnIndex === target.columnIndex) {
      const adjacentIndex = source.blockIndex + 1;
      if (target.insertIndex === adjacentIndex) {
        return false;
      }
    }
    
    // 检查目标列是否允许此类型的Block
    if (!this.isBlockTypeAllowed(source.blockType, target.columnIndex)) {
      return false;
    }
    
    // 检查只读模式
    if (this.isColumnReadonly(target.columnIndex)) {
      return false;
    }
    
    return true;
  }
  
  private async executeDrop(source: DragSourceInfo, target: DropTargetInfo) {
    try {
      // 显示加载状态
      this.showDropLoadingState(target);
      
      // 执行Block移动
      await this.moveBlock(source, target);
      
      // 显示成功反馈
      this.showDropSuccessFeedback(source, target);
      
    } catch (error) {
      console.error('Failed to execute drop:', error);
      
      // 显示错误反馈
      this.showDropErrorFeedback(error as Error);
      
    } finally {
      // 清理加载状态
      this.hideDropLoadingState();
    }
  }
  
  private async moveBlock(source: DragSourceInfo, target: DropTargetInfo) {
    // 注意: 这里需要等待开发者A1的Mock服务
    // 目前先创建模拟实现
    
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        try {
          // 模拟Block移动
          console.log('移动Block:', {
            blockId: source.blockId,
            fromColumn: source.columnIndex,
            toColumn: target.columnIndex,
            fromIndex: source.blockIndex,
            toIndex: target.insertIndex
          });
          
          // 触发Block移动事件
          this.dispatchDragEvent('block-moved', {
            sourceInfo: source,
            dropTarget: target
          });
          
          resolve();
          
        } catch (error) {
          reject(error);
        }
      }, 200); // 模拟异步操作
    });
  }
  
  private createDragPreview(event: DragEvent, blockElement: HTMLElement) {
    // 拖拽预览现在由 DragVisualFeedback 管理
    // 这里保留原始的简单预览作为后备
    const preview = blockElement.cloneNode(true) as HTMLElement;
    preview.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      width: ${blockElement.offsetWidth}px;
      opacity: 0.8;
      pointer-events: none;
      z-index: 9999;
    `;
    
    document.body.appendChild(preview);
    this.ghostElement = preview;
    
    if (event.dataTransfer) {
      event.dataTransfer.setDragImage(preview, 0, 0);
    }
    
    setTimeout(() => {
      if (this.ghostElement) {
        this.ghostElement.remove();
        this.ghostElement = null;
      }
    }, 0);
  }
  
  private setDragData(event: DragEvent, source: DragSourceInfo) {
    if (!event.dataTransfer) return;
    
    // 设置拖拽数据
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'column-block',
      blockId: source.blockId,
      blockType: source.blockType,
      columnIndex: source.columnIndex,
      blockIndex: source.blockIndex
    }));
    
    event.dataTransfer.effectAllowed = 'move';
  }
  
  private addDragSourceStyles(blockElement: HTMLElement) {
    // 拖拽源样式现在由 DragVisualFeedback 管理
    // 这里保留基础样式作为后备
    blockElement.classList.add('dragging');
  }
  
  private removeDragSourceStyles() {
    const draggingElements = this.container.querySelectorAll('.dragging');
    draggingElements.forEach(element => {
      element.classList.remove('dragging');
    });
  }
  
  private cleanupDragState() {
    this.isDragging = false;
    this.dragSourceInfo = null;
    this.currentDropTarget = null;
    this.dragOverIndex = -1;
    
    // 清理UI状态 (保留基础清理)
    this.removeDragSourceStyles();
    
    // 清理自动滚动
    if (this.autoScrollTimer) {
      clearTimeout(this.autoScrollTimer);
      this.autoScrollTimer = undefined;
    }
    
    // 清理Ghost元素
    if (this.ghostElement) {
      this.ghostElement.remove();
      this.ghostElement = null;
    }
  }
  
  // 辅助方法
  private findBlockElement(element: HTMLElement): HTMLElement | null {
    return element.closest('.block-item') as HTMLElement;
  }
  
  private findColumnElement(element: HTMLElement): HTMLElement | null {
    return element.closest('.column-content') as HTMLElement;
  }
  
  private getColumnIndex(columnElement: HTMLElement): number {
    const index = columnElement.getAttribute('data-column-index');
    return index ? parseInt(index, 10) : -1;
  }
  
  private extractDragSourceInfo(blockElement: HTMLElement): DragSourceInfo | null {
    const columnElement = this.findColumnElement(blockElement);
    if (!columnElement) return null;
    
    const blockId = blockElement.getAttribute('data-block-id');
    const blockType = blockElement.getAttribute('data-block-type');
    const columnIndex = this.getColumnIndex(columnElement);
    
    if (!blockId || !blockType || columnIndex === -1) return null;
    
    // 计算Block在列中的索引
    const blockElements = Array.from(columnElement.querySelectorAll('.block-item'));
    const blockIndex = blockElements.indexOf(blockElement);
    
    return {
      blockId,
      blockType,
      columnIndex,
      blockIndex,
      element: blockElement
    };
  }
  
  private findScrollContainer(): HTMLElement | null {
    return this.container.querySelector('.layout-container') as HTMLElement ||
           document.documentElement;
  }
  
  private isBlockTypeAllowed(blockType: string, columnIndex: number): boolean {
    // 这里可以添加特定的约束逻辑
    // 例如: 某些列只允许特定类型的Block
    return true;
  }
  
  private isColumnReadonly(columnIndex: number): boolean {
    const columnElement = this.container.querySelector(
      `[data-column-index="${columnIndex}"]`
    );
    return columnElement?.hasAttribute('readonly') || false;
  }
  
  private showDropLoadingState(target: DropTargetInfo) {
    target.columnElement.classList.add('drop-loading');
  }
  
  private hideDropLoadingState() {
    const loadingColumns = this.container.querySelectorAll('.drop-loading');
    loadingColumns.forEach(column => column.classList.remove('drop-loading'));
  }
  
  private showDropSuccessFeedback(source: DragSourceInfo, target: DropTargetInfo) {
    this.showToast(
      `内容已移动到第 ${target.columnIndex + 1} 列`,
      'success'
    );
  }
  
  private showDropErrorFeedback(error: Error) {
    this.showToast(
      `移动失败: ${error.message}`,
      'error'
    );
  }
  
  private showToast(message: string, type: 'success' | 'error') {
    const toast = document.createElement('div');
    toast.className = `drag-toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#22c55e' : '#ef4444'};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  private dispatchDragEvent(type: string, detail: any) {
    this.container.dispatchEvent(new CustomEvent(`column-${type}`, {
      detail,
      bubbles: true
    }));
  }
  
  // 鼠标事件处理 (增强拖拽体验)
  private handleMouseDown = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const blockElement = this.findBlockElement(target);
    
    if (blockElement && this.shouldEnableDrag(blockElement)) {
      blockElement.draggable = true;
    }
  };
  
  private handleMouseMove = (event: MouseEvent) => {
    // 可以在这里添加拖拽手柄的显示逻辑
  };
  
  private handleMouseUp = (event: MouseEvent) => {
    // 清理临时的draggable属性
    const draggableElements = this.container.querySelectorAll('[draggable="true"]');
    draggableElements.forEach(element => {
      (element as HTMLElement).draggable = false;
    });
  };
  
  private shouldEnableDrag(blockElement: HTMLElement): boolean {
    // 检查是否应该启用拖拽
    return !blockElement.closest('.readonly') && 
           !blockElement.hasAttribute('data-no-drag');
  }
  
  // 公共方法
  enableDrag() {
    this.options.enableConstraints = true;
  }
  
  disableDrag() {
    this.options.enableConstraints = false;
    this.cleanupDragState();
  }
  
  dispose() {
    this.cleanupDragState();
    
    // 清理视觉反馈管理器
    this.visualFeedback.dispose();
    
    // 移除事件监听器
    this.container.removeEventListener('dragstart', this.handleDragStart);
    this.container.removeEventListener('dragend', this.handleDragEnd);
    this.container.removeEventListener('dragover', this.handleDragOver);
    this.container.removeEventListener('dragenter', this.handleDragEnter);
    this.container.removeEventListener('dragleave', this.handleDragLeave);
    this.container.removeEventListener('drop', this.handleDrop);
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }
  
  // 未实现的方法占位符
  private handleDragEnter = (event: DragEvent) => {
    // 拖拽进入处理
  };
  
  private handleDragLeave = (event: DragEvent) => {
    // 拖拽离开处理
  };
}

// 类型定义
interface DragSourceInfo {
  blockId: string;
  blockType: string;
  columnIndex: number;
  blockIndex: number;
  element: HTMLElement;
}

interface DropTargetInfo {
  columnIndex: number;
  insertIndex: number;
  columnElement: HTMLElement;
  position: { x: number; y: number };
}

interface DragHandlerOptions {
  enableAutoScroll: boolean;
  scrollSpeed: number;
  scrollZone: number;
  enableConstraints: boolean;
  animationDuration: number;
}

// 导出工厂函数
export function createColumnDragHandler(
  container: HTMLElement,
  options?: Partial<DragHandlerOptions>
): ColumnDragHandler {
  return new ColumnDragHandler(container, options);
}