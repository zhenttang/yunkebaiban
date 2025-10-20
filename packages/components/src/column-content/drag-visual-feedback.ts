// 文件: packages/components/src/column-content/drag-visual-feedback.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * 拖拽视觉反馈管理器
 * 
 * 提供丰富的拖拽视觉反馈:
 * - 增强的插入指示器
 * - 拖拽预览增强
 * - 列高亮效果
 * - 约束提示
 * - 动画过渡效果
 */
export class DragVisualFeedback {
  private container: HTMLElement;
  private currentPreview: HTMLElement | null = null;
  private currentIndicator: HTMLElement | null = null;
  private currentColumnHighlight: HTMLElement | null = null;
  
  // 反馈状态
  private isActive = false;
  private dragSourceInfo: DragSourceInfo | null = null;
  private currentDropTarget: DropTargetInfo | null = null;
  
  // 动画配置
  private animationOptions: KeyframeAnimationOptions = {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards'
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.injectStyles();
  }

  /**
   * 开始拖拽视觉反馈
   */
  startDragFeedback(sourceInfo: DragSourceInfo) {
    this.isActive = true;
    this.dragSourceInfo = sourceInfo;
    
    // 创建增强的拖拽预览
    this.createEnhancedDragPreview(sourceInfo);
    
    // 添加源Block的拖拽状态
    this.addSourceBlockFeedback(sourceInfo);
    
    // 高亮所有可用的拖拽目标
    this.highlightDropTargets();
  }

  /**
   * 更新拖拽悬停反馈
   */
  updateDragHover(dropTarget: DropTargetInfo, isValid: boolean) {
    this.currentDropTarget = dropTarget;
    
    // 更新插入指示器
    this.updateDropIndicator(dropTarget, isValid);
    
    // 更新列高亮
    this.updateColumnHighlight(dropTarget, isValid);
    
    // 更新拖拽预览位置
    this.updatePreviewPosition(dropTarget);
  }

  /**
   * 结束拖拽反馈
   */
  endDragFeedback(success: boolean = false) {
    if (!this.isActive) return;
    
    if (success) {
      this.playSuccessAnimation();
    } else {
      this.playRevertAnimation();
    }
    
    // 延迟清理以播放动画
    setTimeout(() => {
      this.cleanup();
    }, 300);
  }

  /**
   * 显示约束违反提示
   */
  showConstraintViolation(message: string, position: { x: number; y: number }) {
    const violation = document.createElement('div');
    violation.className = 'drag-constraint-violation';
    violation.innerHTML = `
      <div class="violation-icon">⚠️</div>
      <div class="violation-message">${message}</div>
    `;
    
    violation.style.cssText = `
      position: fixed;
      left: ${position.x}px;
      top: ${position.y - 40}px;
      background: #ef4444;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10000;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0;
      transform: translateY(10px);
      animation: violation-appear 0.3s ease forwards;
    `;
    
    document.body.appendChild(violation);
    
    // 自动消失
    setTimeout(() => {
      violation.style.animation = 'violation-disappear 0.3s ease forwards';
      setTimeout(() => violation.remove(), 300);
    }, 2000);
  }

  private createEnhancedDragPreview(sourceInfo: DragSourceInfo) {
    const sourceElement = sourceInfo.element;
    const preview = sourceElement.cloneNode(true) as HTMLElement;
    
    // 增强预览样式
    preview.className = 'drag-preview-enhanced';
    preview.style.cssText = `
      position: fixed;
      left: -9999px;
      top: -9999px;
      width: ${sourceElement.offsetWidth}px;
      height: ${sourceElement.offsetHeight}px;
      opacity: 0.9;
      transform: rotate(2deg) scale(1.02);
      box-shadow: 
        0 12px 32px rgba(0, 0, 0, 0.2),
        0 0 0 1px var(--yunke-primary-color);
      border-radius: 8px;
      pointer-events: none;
      z-index: 9999;
      transition: all 0.2s ease;
      backdrop-filter: blur(1px);
    `;
    
    // 添加拖拽标识
    const dragBadge = document.createElement('div');
    dragBadge.className = 'drag-badge';
    dragBadge.innerHTML = '📦';
    dragBadge.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      background: var(--yunke-primary-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    `;
    
    preview.appendChild(dragBadge);
    document.body.appendChild(preview);
    this.currentPreview = preview;
    
    // 入场动画
    requestAnimationFrame(() => {
      preview.style.opacity = '0.9';
      preview.style.transform = 'rotate(2deg) scale(1.02)';
    });
  }

  private addSourceBlockFeedback(sourceInfo: DragSourceInfo) {
    const sourceElement = sourceInfo.element;
    sourceElement.classList.add('dragging-source');
    
    // 添加拖拽中的视觉效果
    sourceElement.style.cssText += `
      opacity: 0.4;
      transform: scale(0.98);
      border: 2px dashed var(--yunke-primary-color);
      background: var(--yunke-primary-color-alpha);
      transition: all 0.2s ease;
      position: relative;
    `;
    
    // 添加拖拽中指示器
    const dragIndicator = document.createElement('div');
    dragIndicator.className = 'drag-source-indicator';
    dragIndicator.innerHTML = '↗️ 拖拽中...';
    dragIndicator.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--yunke-primary-color);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      z-index: 10;
      white-space: nowrap;
      opacity: 0;
      animation: pulse-appear 0.3s ease forwards;
    `;
    
    sourceElement.appendChild(dragIndicator);
  }

  private highlightDropTargets() {
    const columns = this.container.querySelectorAll('.column-content');
    columns.forEach((column, index) => {
      if (this.dragSourceInfo && index !== this.dragSourceInfo.columnIndex) {
        column.classList.add('drag-target-available');
        
        // 添加目标提示
        const targetHint = document.createElement('div');
        targetHint.className = 'drop-target-hint';
        targetHint.textContent = `拖拽到第 ${index + 1} 列`;
        targetHint.style.cssText = `
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--yunke-primary-color);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          pointer-events: none;
          z-index: 5;
          opacity: 0;
          animation: hint-fade-in 0.3s ease 0.2s forwards;
        `;
        
        column.appendChild(targetHint);
      }
    });
  }

  private updateDropIndicator(dropTarget: DropTargetInfo, isValid: boolean) {
    // 清除之前的指示器
    this.clearDropIndicator();
    
    if (!isValid) return;
    
    // 创建增强的插入指示器
    const indicator = document.createElement('div');
    indicator.className = 'drop-indicator-enhanced';
    
    const indicatorContent = document.createElement('div');
    indicatorContent.className = 'indicator-content';
    indicatorContent.innerHTML = `
      <div class="indicator-line"></div>
      <div class="indicator-dot"></div>
      <div class="indicator-label">在此插入内容</div>
    `;
    
    indicator.appendChild(indicatorContent);
    
    // 应用样式
    indicator.style.cssText = `
      position: relative;
      height: 4px;
      margin: 12px 0;
      opacity: 0;
      transform: scaleX(0.8);
      animation: indicator-appear 0.2s ease forwards;
    `;
    
    // 找到插入位置
    const blockElements = Array.from(
      dropTarget.columnElement.querySelectorAll('.block-item')
    );
    
    if (dropTarget.insertIndex < blockElements.length) {
      blockElements[dropTarget.insertIndex].parentNode?.insertBefore(
        indicator,
        blockElements[dropTarget.insertIndex]
      );
    } else {
      const container = dropTarget.columnElement.querySelector('.block-container');
      container?.appendChild(indicator);
    }
    
    this.currentIndicator = indicator;
  }

  private updateColumnHighlight(dropTarget: DropTargetInfo, isValid: boolean) {
    // 清除之前的高亮
    this.clearColumnHighlight();
    
    const columnElement = dropTarget.columnElement;
    
    if (isValid) {
      columnElement.classList.add('drag-over-valid');
      
      // 添加动态边框效果
      const highlight = document.createElement('div');
      highlight.className = 'column-highlight-border';
      highlight.style.cssText = `
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid var(--yunke-primary-color);
        border-radius: 8px;
        pointer-events: none;
        z-index: 1;
        opacity: 0;
        animation: border-glow 0.3s ease forwards;
      `;
      
      const columnWrapper = columnElement.closest('.column-wrapper');
      if (columnWrapper) {
        columnWrapper.style.position = 'relative';
        columnWrapper.appendChild(highlight);
        this.currentColumnHighlight = highlight;
      }
    } else {
      columnElement.classList.add('drag-over-invalid');
    }
  }

  private updatePreviewPosition(dropTarget: DropTargetInfo) {
    if (!this.currentPreview) return;
    
    // 平滑跟随鼠标位置
    const preview = this.currentPreview;
    const targetRect = dropTarget.columnElement.getBoundingClientRect();
    
    // 计算预览位置
    const previewX = targetRect.left + targetRect.width / 2 - preview.offsetWidth / 2;
    const previewY = dropTarget.position.y - preview.offsetHeight / 2;
    
    // 应用位置变化
    preview.style.left = previewX + 'px';
    preview.style.top = previewY + 'px';
    preview.style.transform = 'rotate(1deg) scale(1.05)';
  }

  private playSuccessAnimation() {
    if (this.currentPreview) {
      // 成功投放动画
      this.currentPreview.animate([
        { 
          transform: 'rotate(1deg) scale(1.05)',
          opacity: 0.9
        },
        { 
          transform: 'rotate(0deg) scale(1.1)',
          opacity: 1
        },
        { 
          transform: 'rotate(0deg) scale(0.8)',
          opacity: 0
        }
      ], {
        duration: 400,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      });
    }
    
    // 成功指示器动画
    if (this.currentIndicator) {
      this.currentIndicator.style.background = '#22c55e';
      this.currentIndicator.animate([
        { transform: 'scaleX(1)' },
        { transform: 'scaleX(1.2)' },
        { transform: 'scaleX(0)', opacity: 0 }
      ], { duration: 300 });
    }
  }

  private playRevertAnimation() {
    if (this.currentPreview && this.dragSourceInfo) {
      const sourceRect = this.dragSourceInfo.element.getBoundingClientRect();
      
      // 回弹到原位置
      this.currentPreview.animate([
        {
          left: this.currentPreview.style.left,
          top: this.currentPreview.style.top,
          transform: 'rotate(1deg) scale(1.05)',
          opacity: 0.9
        },
        {
          left: sourceRect.left + 'px',
          top: sourceRect.top + 'px',
          transform: 'rotate(0deg) scale(1)',
          opacity: 0
        }
      ], {
        duration: 300,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
    }
  }

  private clearDropIndicator() {
    if (this.currentIndicator) {
      this.currentIndicator.remove();
      this.currentIndicator = null;
    }
    
    // 清除所有指示器
    const indicators = this.container.querySelectorAll('.drop-indicator-enhanced');
    indicators.forEach(indicator => indicator.remove());
  }

  private clearColumnHighlight() {
    if (this.currentColumnHighlight) {
      this.currentColumnHighlight.remove();
      this.currentColumnHighlight = null;
    }
    
    // 清除所有列高亮
    const columns = this.container.querySelectorAll('.column-content');
    columns.forEach(column => {
      column.classList.remove('drag-over-valid', 'drag-over-invalid');
    });
    
    const highlights = this.container.querySelectorAll('.column-highlight-border');
    highlights.forEach(highlight => highlight.remove());
  }

  private cleanup() {
    this.isActive = false;
    this.dragSourceInfo = null;
    this.currentDropTarget = null;
    
    // 清理拖拽预览
    if (this.currentPreview) {
      this.currentPreview.remove();
      this.currentPreview = null;
    }
    
    // 清理指示器
    this.clearDropIndicator();
    
    // 清理列高亮
    this.clearColumnHighlight();
    
    // 清理源Block状态
    const draggingSources = this.container.querySelectorAll('.dragging-source');
    draggingSources.forEach(source => {
      source.classList.remove('dragging-source');
      (source as HTMLElement).style.cssText = '';
      
      // 移除拖拽指示器
      const indicators = source.querySelectorAll('.drag-source-indicator');
      indicators.forEach(indicator => indicator.remove());
    });
    
    // 清理目标高亮
    const targets = this.container.querySelectorAll('.drag-target-available');
    targets.forEach(target => {
      target.classList.remove('drag-target-available');
      
      // 移除目标提示
      const hints = target.querySelectorAll('.drop-target-hint');
      hints.forEach(hint => hint.remove());
    });
    
    // 清理约束违反提示
    const violations = document.querySelectorAll('.drag-constraint-violation');
    violations.forEach(violation => violation.remove());
  }

  private injectStyles() {
    const styleId = 'drag-visual-feedback-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 拖拽预览增强 */
      .drag-preview-enhanced {
        filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
      }
      
      /* 拖拽源状态 */
      .dragging-source {
        position: relative;
      }
      
      /* 目标可用状态 */
      .drag-target-available {
        background: var(--yunke-primary-color-alpha);
        border: 1px dashed var(--yunke-primary-color);
        border-radius: 8px;
        position: relative;
      }
      
      /* 列悬停状态 */
      .drag-over-valid {
        background: linear-gradient(
          135deg,
          var(--yunke-primary-color-alpha) 0%,
          transparent 100%
        );
      }
      
      .drag-over-invalid {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.1) 0%,
          transparent 100%
        );
        border-color: #ef4444 !important;
      }
      
      /* 插入指示器增强 */
      .drop-indicator-enhanced .indicator-content {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 4px;
      }
      
      .drop-indicator-enhanced .indicator-line {
        flex: 1;
        height: 3px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          var(--yunke-primary-color) 20%, 
          var(--yunke-primary-color) 80%, 
          transparent 100%
        );
        border-radius: 2px;
      }
      
      .drop-indicator-enhanced .indicator-dot {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 8px;
        height: 8px;
        background: var(--yunke-primary-color);
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .drop-indicator-enhanced .indicator-label {
        position: absolute;
        left: 50%;
        top: -20px;
        transform: translateX(-50%);
        background: var(--yunke-primary-color);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0.9;
      }
      
      /* 动画定义 */
      @keyframes violation-appear {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes violation-disappear {
        to {
          opacity: 0;
          transform: translateY(-10px);
        }
      }
      
      @keyframes pulse-appear {
        to {
          opacity: 1;
        }
      }
      
      @keyframes hint-fade-in {
        to {
          opacity: 0.9;
        }
      }
      
      @keyframes indicator-appear {
        to {
          opacity: 1;
          transform: scaleX(1);
        }
      }
      
      @keyframes border-glow {
        0% {
          opacity: 0;
          transform: scale(0.95);
        }
        50% {
          opacity: 0.8;
          transform: scale(1.02);
        }
        100% {
          opacity: 0.6;
          transform: scale(1);
        }
      }
      
      /* 响应式适配 */
      @media (max-width: 768px) {
        .drag-preview-enhanced {
          transform: rotate(1deg) scale(0.95);
        }
        
        .drop-indicator-enhanced .indicator-label {
          display: none;
        }
        
        .drop-target-hint {
          font-size: 10px;
          padding: 2px 6px;
        }
      }
      
      /* 高对比度模式 */
      @media (prefers-contrast: high) {
        .drag-target-available {
          border-width: 2px;
        }
        
        .drop-indicator-enhanced .indicator-line {
          background: var(--yunke-primary-color);
          height: 4px;
        }
      }
      
      /* 减弱动画模式 */
      @media (prefers-reduced-motion: reduce) {
        .drag-preview-enhanced,
        .drop-indicator-enhanced,
        .column-highlight-border {
          animation: none;
          transition: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // 公共方法
  isActiveFeedback(): boolean {
    return this.isActive;
  }

  dispose() {
    this.cleanup();
    
    // 移除注入的样式
    const styleElement = document.getElementById('drag-visual-feedback-styles');
    styleElement?.remove();
  }
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

// 导出工厂函数
export function createDragVisualFeedback(container: HTMLElement): DragVisualFeedback {
  return new DragVisualFeedback(container);
}