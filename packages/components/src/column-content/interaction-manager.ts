// 文件: packages/components/src/column-content/interaction-manager.ts
import { LitElement } from 'lit';
import { DragVisualFeedback } from './drag-visual-feedback.js';
import { InteractionAnimations } from './interaction-animations.js';
import { InteractionStateManager } from './interaction-state-manager.js';
import { AccessibilitySupport } from './accessibility-support.js';
import { SlashMenuIntegration } from './slash-menu-integration.js';
import { ColumnDragHandler } from './drag-handler.js';

/**
 * 交互管理器 - 统一协调所有交互功能
 * 
 * 作为开发者B2 (交互设计师) 的核心交付成果，
 * 这个管理器整合了所有交互相关的功能模块:
 * 
 * - 拖拽处理和视觉反馈
 * - 动画系统
 * - 状态管理
 * - 可访问性支持
 * - SlashMenu集成
 * - 键盘导航
 */
export class InteractionManager {
  private container: HTMLElement;
  
  // 功能模块
  private dragHandler: ColumnDragHandler;
  private visualFeedback: DragVisualFeedback;
  private animations: InteractionAnimations;
  private stateManager: InteractionStateManager;
  private accessibility: AccessibilitySupport;
  private slashMenu: SlashMenuIntegration;
  
  // 配置选项
  private options: InteractionManagerOptions;
  
  constructor(container: HTMLElement, options: Partial<InteractionManagerOptions> = {}) {
    this.container = container;
    this.options = {
      enableDrag: true,
      enableAnimations: true,
      enableStateManagement: true,
      enableAccessibility: true,
      enableSlashMenu: true,
      language: 'zh-CN',
      ...options
    };
    
    this.initializeModules();
    this.setupIntegration();
  }

  /**
   * 设置列内容的交互功能
   */
  setupColumnInteraction(columnElement: HTMLElement, columnIndex: number) {
    // 设置可访问性
    if (this.accessibility) {
      const blockCount = columnElement.querySelectorAll('.block-item').length;
      this.accessibility.setupColumnAccessibility(columnElement, columnIndex, blockCount);
    }
    
    // 设置状态管理
    if (this.stateManager) {
      // 列元素会自动被状态管理器处理
    }
    
    // 添加进入动画
    if (this.animations) {
      this.animations.animateComponentEntry(columnElement);
    }
    
    // 标记为可交互
    columnElement.setAttribute('data-interactive', 'true');
    columnElement.setAttribute('data-column-index', columnIndex.toString());
  }

  /**
   * 设置Block的交互功能
   */
  setupBlockInteraction(blockElement: HTMLElement, blockType: string, columnIndex: number, blockIndex: number) {
    // 设置可访问性
    if (this.accessibility) {
      this.accessibility.setupBlockAccessibility(blockElement, blockType, columnIndex, blockIndex);
    }
    
    // 设置拖拽属性
    if (this.dragHandler) {
      blockElement.setAttribute('data-block-type', blockType);
      blockElement.setAttribute('data-block-id', `block-${Date.now()}-${Math.random()}`);
      blockElement.classList.add('block-item');
    }
    
    // 添加进入动画
    if (this.animations) {
      this.animations.animateContentAddition(blockElement, blockIndex);
    }
    
    // 标记为可交互
    blockElement.setAttribute('data-interactive', 'true');
    blockElement.setAttribute('tabindex', '0');
  }

  /**
   * 设置添加按钮的交互功能
   */
  setupAddButtonInteraction(buttonElement: HTMLElement, columnIndex: number) {
    // 设置可访问性
    if (this.accessibility) {
      this.accessibility.setupAddButtonAccessibility(buttonElement, columnIndex);
    }
    
    // 设置状态管理
    if (this.stateManager) {
      // 按钮会自动被状态管理器处理
    }
    
    // 标记为可交互
    buttonElement.setAttribute('data-interactive', 'true');
    buttonElement.setAttribute('data-column-index', columnIndex.toString());
  }

  /**
   * 设置布局切换器的交互功能
   */
  setupLayoutSwitcherInteraction(switcherElement: HTMLElement) {
    // 设置可访问性
    if (this.accessibility) {
      this.accessibility.setupLayoutSwitcherAccessibility(switcherElement);
    }
    
    // 标记为可交互
    switcherElement.setAttribute('data-interactive', 'true');
  }

  /**
   * 处理布局模式切换
   */
  async handleLayoutSwitch(oldColumns: HTMLElement[], newColumns: HTMLElement[], layoutMode: string) {
    // 播放切换动画
    if (this.animations) {
      await this.animations.animateLayoutSwitch(oldColumns, newColumns, layoutMode);
    }
    
    // 宣布布局变化
    if (this.accessibility) {
      this.accessibility.announceLayoutChange(this.getLayoutDisplayName(layoutMode));
    }
    
    // 重新设置新列的交互功能
    newColumns.forEach((column, index) => {
      this.setupColumnInteraction(column, index);
    });
  }

  /**
   * 处理内容添加
   */
  handleContentAdded(blockElement: HTMLElement, columnIndex: number, blockType: string) {
    const blockIndex = Array.from(
      blockElement.parentElement?.children || []
    ).indexOf(blockElement);
    
    // 设置Block交互功能
    this.setupBlockInteraction(blockElement, blockType, columnIndex, blockIndex);
    
    // 宣布内容变化
    if (this.accessibility) {
      this.accessibility.announceContentChange('added', { column: columnIndex + 1 });
    }
    
    // 聚焦新添加的内容
    if (this.stateManager) {
      this.stateManager.setFocus(blockElement, 'programmatic');
    }
  }

  /**
   * 处理内容移动
   */
  handleContentMoved(blockElement: HTMLElement, fromColumn: number, toColumn: number) {
    // 宣布移动
    if (this.accessibility) {
      this.accessibility.announceContentChange('moved', { 
        from: fromColumn + 1, 
        to: toColumn + 1 
      });
    }
    
    // 播放移动成功动画
    if (this.animations) {
      this.animations.animateSuccess(blockElement);
    }
  }

  /**
   * 处理内容删除
   */
  async handleContentRemoved(blockElement: HTMLElement) {
    // 播放退出动画
    if (this.animations) {
      await this.animations.animateContentRemoval(blockElement);
    }
    
    // 宣布删除
    if (this.accessibility) {
      this.accessibility.announceContentChange('removed', {});
    }
    
    // 移除元素
    blockElement.remove();
  }

  /**
   * 处理错误状态
   */
  handleError(element: HTMLElement, message: string) {
    // 播放错误动画
    if (this.animations) {
      this.animations.animateError(element);
    }
    
    // 宣布错误
    if (this.accessibility) {
      this.accessibility.announce(message, 'assertive');
    }
  }

  /**
   * 获取当前交互状态
   */
  getInteractionState() {
    return this.stateManager?.getCurrentState() || null;
  }

  /**
   * 启用/禁用交互功能
   */
  setInteractionEnabled(enabled: boolean) {
    if (this.stateManager) {
      this.stateManager.setInteractionDisabled(!enabled);
    }
    
    if (this.dragHandler) {
      if (enabled) {
        this.dragHandler.enableDrag();
      } else {
        this.dragHandler.disableDrag();
      }
    }
    
    // 更新容器状态
    this.container.classList.toggle('interaction-disabled', !enabled);
  }

  /**
   * 显示键盘帮助
   */
  showKeyboardHelp() {
    if (this.accessibility) {
      this.accessibility.createKeyboardHelp();
    }
  }

  // 私有方法
  
  private initializeModules() {
    // 初始化拖拽处理器
    if (this.options.enableDrag) {
      this.dragHandler = new ColumnDragHandler(this.container);
    }
    
    // 初始化动画系统
    if (this.options.enableAnimations) {
      this.animations = new InteractionAnimations(this.container);
    }
    
    // 初始化状态管理器
    if (this.options.enableStateManagement) {
      this.stateManager = new InteractionStateManager(this.container);
    }
    
    // 初始化可访问性支持
    if (this.options.enableAccessibility) {
      this.accessibility = new AccessibilitySupport(this.container, {
        language: this.options.language
      });
    }
    
    // 初始化SlashMenu集成
    if (this.options.enableSlashMenu) {
      this.slashMenu = new SlashMenuIntegration(
        this.container,
        this.handleBlockCreated.bind(this)
      );
    }
  }

  private setupIntegration() {
    // 集成拖拽和状态管理
    if (this.dragHandler && this.stateManager) {
      this.container.addEventListener('column-drag-start', (event: CustomEvent) => {
        const element = event.detail.sourceInfo.element;
        this.stateManager.startDragging(element);
        
        if (this.accessibility) {
          this.accessibility.announceDragState(element, 'start');
        }
      });
      
      this.container.addEventListener('column-drag-end', (event: CustomEvent) => {
        this.stateManager.endDragging();
        
        if (this.accessibility && event.detail.sourceInfo.element) {
          this.accessibility.announceDragState(event.detail.sourceInfo.element, 'end');
        }
      });
      
      this.container.addEventListener('column-block-moved', (event: CustomEvent) => {
        const { sourceInfo, dropTarget } = event.detail;
        this.handleContentMoved(
          sourceInfo.element,
          sourceInfo.columnIndex,
          dropTarget.columnIndex
        );
      });
    }
    
    // 集成SlashMenu和动画
    if (this.slashMenu && this.animations) {
      this.container.addEventListener('show-slash-menu', (event: CustomEvent) => {
        // SlashMenu显示时的动画可以在这里添加
      });
    }
    
    // 集成状态管理和动画
    if (this.stateManager && this.animations) {
      this.stateManager.on('focus-change', (data: any) => {
        if (data.current && data.reason === 'keyboard-navigation') {
          // 键盘导航时的焦点动画
          this.animations.animateComponentEntry(data.current, { duration: 150 });
        }
      });
      
      this.stateManager.on('selection-change', (data: any) => {
        if (data.selected.length > 0 && this.accessibility) {
          this.accessibility.announceSelection(data.selected[0], true);
        }
      });
    }
    
    // 全局键盘事件处理
    this.container.addEventListener('keydown', this.handleGlobalKeyboard.bind(this));
  }

  private handleGlobalKeyboard(event: KeyboardEvent) {
    // F1 或 Shift+? 显示键盘帮助
    if (event.key === 'F1' || (event.key === '?' && event.shiftKey)) {
      event.preventDefault();
      this.showKeyboardHelp();
      return;
    }
    
    // Ctrl+Shift+数字键切换布局
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
      const number = parseInt(event.key);
      if (number >= 1 && number <= 5) {
        event.preventDefault();
        this.handleLayoutShortcut(number);
        return;
      }
    }
    
    // Escape 清除所有状态
    if (event.key === 'Escape') {
      if (this.stateManager) {
        this.stateManager.setFocus(null);
        this.stateManager.clearSelection();
      }
    }
  }

  private handleLayoutShortcut(number: number) {
    // 触发布局切换事件
    const modes = ['normal', 'two-column', 'three-column', 'four-column', 'five-column'];
    const targetMode = modes[number - 1];
    
    this.container.dispatchEvent(new CustomEvent('layout-switch-request', {
      detail: { mode: targetMode },
      bubbles: true
    }));
  }

  private handleBlockCreated(blockId: string, columnIndex: number) {
    // Block创建后的处理逻辑
    // 这里会在实际集成时与具体的Block系统对接
    console.log(`Block ${blockId} created in column ${columnIndex}`);
  }

  private getLayoutDisplayName(mode: string): string {
    const names: Record<string, string> = {
      'normal': '单列布局',
      'two-column': '双列布局',
      'three-column': '三列布局',
      'four-column': '四列布局',
      'five-column': '五列布局'
    };
    
    return names[mode] || mode;
  }

  // 公共方法
  
  /**
   * 清理所有交互状态
   */
  cleanup() {
    if (this.stateManager) {
      this.stateManager.dispose();
    }
    
    if (this.dragHandler) {
      this.dragHandler.dispose();
    }
    
    if (this.animations) {
      this.animations.dispose();
    }
    
    if (this.accessibility) {
      this.accessibility.dispose();
    }
    
    if (this.slashMenu) {
      this.slashMenu.dispose();
    }
  }

  /**
   * 获取功能模块实例（用于高级定制）
   */
  getModules() {
    return {
      dragHandler: this.dragHandler,
      animations: this.animations,
      stateManager: this.stateManager,
      accessibility: this.accessibility,
      slashMenu: this.slashMenu
    };
  }
}

// 类型定义
interface InteractionManagerOptions {
  enableDrag: boolean;
  enableAnimations: boolean;
  enableStateManagement: boolean;
  enableAccessibility: boolean;
  enableSlashMenu: boolean;
  language: string;
}

// 导出工厂函数
export function createInteractionManager(
  container: HTMLElement,
  options?: Partial<InteractionManagerOptions>
): InteractionManager {
  return new InteractionManager(container, options);
}

// 导出所有子模块
export {
  DragVisualFeedback,
  InteractionAnimations,
  InteractionStateManager,
  AccessibilitySupport,
  SlashMenuIntegration,
  ColumnDragHandler
};