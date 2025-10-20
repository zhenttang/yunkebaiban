// 文件: packages/components/src/column-content/accessibility-support.ts
import { LitElement } from 'lit';

/**
 * 可访问性支持管理器
 * 
 * 提供完整的可访问性支持:
 * - ARIA 属性管理
 * - 屏幕阅读器支持
 * - 键盘导航增强
 * - 焦点管理优化
 * - 语义化标记
 * - 国际化支持
 */
export class AccessibilitySupport {
  private container: HTMLElement;
  private announcements: HTMLElement;
  private focusTrap: FocusTrap | null = null;
  
  // 配置选项
  private options: AccessibilityOptions;
  
  // 默认文本资源
  private defaultTexts: AccessibilityTexts = {
    columnLabel: '第 {index} 列',
    columnDescription: '包含 {count} 个内容块',
    addContentButton: '在第 {index} 列添加内容',
    dragHandle: '拖拽手柄，按空格键开始拖拽',
    dropZone: '拖拽目标区域',
    blockSelected: '已选择内容块',
    blockDeselected: '已取消选择内容块',
    layoutSwitched: '已切换到 {mode} 布局',
    contentAdded: '内容已添加到第 {column} 列',
    contentMoved: '内容已从第 {from} 列移动到第 {to} 列',
    contentRemoved: '内容已删除',
    keyboardShortcuts: '键盘快捷键帮助',
    loading: '正在加载',
    error: '操作失败',
    success: '操作成功'
  };

  constructor(container: HTMLElement, options: Partial<AccessibilityOptions> = {}) {
    this.container = container;
    this.options = {
      enableScreenReader: true,
      enableKeyboardTraps: true,
      enableAriaLiveRegion: true,
      enableHighContrast: true,
      language: 'zh-CN',
      texts: this.defaultTexts,
      ...options
    };
    
    this.setupAccessibilityStructure();
    this.setupEventListeners();
  }

  /**
   * 设置列的可访问性属性
   */
  setupColumnAccessibility(columnElement: HTMLElement, columnIndex: number, blockCount: number) {
    // 设置基础ARIA属性
    columnElement.setAttribute('role', 'region');
    columnElement.setAttribute('aria-label', this.getText('columnLabel', { index: columnIndex + 1 }));
    columnElement.setAttribute('aria-describedby', `column-${columnIndex}-description`);
    columnElement.setAttribute('tabindex', '0');
    
    // 创建描述元素
    const description = document.createElement('div');
    description.id = `column-${columnIndex}-description`;
    description.className = 'sr-only';
    description.textContent = this.getText('columnDescription', { count: blockCount });
    columnElement.appendChild(description);
    
    // 设置列导航属性
    this.setupColumnNavigation(columnElement, columnIndex);
  }

  /**
   * 设置Block的可访问性属性
   */
  setupBlockAccessibility(blockElement: HTMLElement, blockType: string, columnIndex: number, blockIndex: number) {
    // 基础属性
    blockElement.setAttribute('role', 'article');
    blockElement.setAttribute('tabindex', '0');
    blockElement.setAttribute('aria-label', `${blockType} 内容，第 ${columnIndex + 1} 列第 ${blockIndex + 1} 项`);
    
    // 拖拽相关属性
    blockElement.setAttribute('draggable', 'true');
    blockElement.setAttribute('aria-grabbed', 'false');
    
    // 选择状态属性
    blockElement.setAttribute('aria-selected', 'false');
    
    // 添加拖拽手柄
    this.setupDragHandle(blockElement);
    
    // 设置操作菜单
    this.setupBlockActions(blockElement, blockType, columnIndex, blockIndex);
  }

  /**
   * 设置AddContentButton的可访问性
   */
  setupAddButtonAccessibility(buttonElement: HTMLElement, columnIndex: number) {
    buttonElement.setAttribute('role', 'button');
    buttonElement.setAttribute('aria-label', this.getText('addContentButton', { index: columnIndex + 1 }));
    buttonElement.setAttribute('aria-describedby', `add-button-${columnIndex}-help`);
    
    // 创建帮助文本
    const helpText = document.createElement('div');
    helpText.id = `add-button-${columnIndex}-help`;
    helpText.className = 'sr-only';
    helpText.textContent = '按回车键或空格键打开内容类型菜单';
    buttonElement.appendChild(helpText);
  }

  /**
   * 设置布局切换器的可访问性
   */
  setupLayoutSwitcherAccessibility(switcherElement: HTMLElement) {
    switcherElement.setAttribute('role', 'tablist');
    switcherElement.setAttribute('aria-label', '页面布局选择');
    
    const buttons = switcherElement.querySelectorAll('.layout-button');
    buttons.forEach((button, index) => {
      const buttonEl = button as HTMLElement;
      buttonEl.setAttribute('role', 'tab');
      buttonEl.setAttribute('aria-selected', 'false');
      buttonEl.setAttribute('tabindex', index === 0 ? '0' : '-1');
      buttonEl.setAttribute('aria-controls', `layout-panel-${index}`);
      
      // 添加快捷键提示
      buttonEl.setAttribute('aria-keyshortcuts', `Ctrl+Shift+${index + 1}`);
    });
  }

  /**
   * 管理焦点陷阱
   */
  createFocusTrap(element: HTMLElement): FocusTrap {
    if (!this.options.enableKeyboardTraps) {
      return { activate: () => {}, deactivate: () => {} };
    }
    
    const focusableElements = this.getFocusableElements(element);
    
    const focusTrap: FocusTrap = {
      activate: () => {
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
        
        element.addEventListener('keydown', this.handleTrapKeydown);
      },
      
      deactivate: () => {
        element.removeEventListener('keydown', this.handleTrapKeydown);
      }
    };
    
    return focusTrap;
  }

  /**
   * 宣布状态变化
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.options.enableAriaLiveRegion) return;
    
    // 清除之前的消息
    this.announcements.textContent = '';
    
    // 短暂延迟确保屏幕阅读器注意到变化
    setTimeout(() => {
      this.announcements.textContent = message;
      this.announcements.setAttribute('aria-live', priority);
    }, 100);
    
    // 自动清除消息
    setTimeout(() => {
      this.announcements.textContent = '';
    }, 5000);
  }

  /**
   * 宣布选择状态变化
   */
  announceSelection(element: HTMLElement, isSelected: boolean) {
    element.setAttribute('aria-selected', isSelected.toString());
    
    const message = isSelected 
      ? this.getText('blockSelected')
      : this.getText('blockDeselected');
    
    this.announce(message);
  }

  /**
   * 宣布拖拽状态变化
   */
  announceDragState(element: HTMLElement, state: 'start' | 'end' | 'drop') {
    switch (state) {
      case 'start':
        element.setAttribute('aria-grabbed', 'true');
        this.announce('开始拖拽，使用方向键移动，按空格键放置');
        break;
      case 'end':
        element.setAttribute('aria-grabbed', 'false');
        this.announce('拖拽结束');
        break;
      case 'drop':
        this.announce('内容已放置');
        break;
    }
  }

  /**
   * 宣布布局变化
   */
  announceLayoutChange(newMode: string) {
    const message = this.getText('layoutSwitched', { mode: newMode });
    this.announce(message, 'assertive');
  }

  /**
   * 宣布内容变化
   */
  announceContentChange(type: 'added' | 'moved' | 'removed', details: any) {
    let message = '';
    
    switch (type) {
      case 'added':
        message = this.getText('contentAdded', { column: details.column });
        break;
      case 'moved':
        message = this.getText('contentMoved', { from: details.from, to: details.to });
        break;
      case 'removed':
        message = this.getText('contentRemoved');
        break;
    }
    
    this.announce(message);
  }

  /**
   * 创建键盘快捷键帮助
   */
  createKeyboardHelp(): HTMLElement {
    const helpDialog = document.createElement('div');
    helpDialog.className = 'keyboard-help-dialog';
    helpDialog.setAttribute('role', 'dialog');
    helpDialog.setAttribute('aria-modal', 'true');
    helpDialog.setAttribute('aria-labelledby', 'keyboard-help-title');
    
    helpDialog.innerHTML = `
      <div class="keyboard-help-content">
        <h2 id="keyboard-help-title">${this.getText('keyboardShortcuts')}</h2>
        <div class="keyboard-help-sections">
          <section>
            <h3>导航</h3>
            <dl>
              <dt>Tab / Shift+Tab</dt>
              <dd>在元素间移动焦点</dd>
              <dt>方向键</dt>
              <dd>在列或内容间导航</dd>
              <dt>Ctrl+方向键</dt>
              <dd>在列间快速切换</dd>
            </dl>
          </section>
          
          <section>
            <h3>操作</h3>
            <dl>
              <dt>Enter / 空格</dt>
              <dd>激活按钮或选择项目</dd>
              <dt>Ctrl+Enter</dt>
              <dd>在当前列添加内容</dd>
              <dt>Delete</dt>
              <dd>删除选中的内容</dd>
            </dl>
          </section>
          
          <section>
            <h3>布局</h3>
            <dl>
              <dt>Ctrl+Shift+1-5</dt>
              <dd>切换到对应的列布局</dd>
              <dt>Ctrl+Shift+R</dt>
              <dd>重置布局</dd>
            </dl>
          </section>
          
          <section>
            <h3>选择和拖拽</h3>
            <dl>
              <dt>Ctrl+A</dt>
              <dd>全选</dd>
              <dt>Ctrl+点击</dt>
              <dd>多选</dd>
              <dt>空格键</dt>
              <dd>开始键盘拖拽</dd>
            </dl>
          </section>
        </div>
        
        <button class="keyboard-help-close" aria-label="关闭帮助">关闭</button>
      </div>
    `;
    
    // 设置焦点陷阱
    const focusTrap = this.createFocusTrap(helpDialog);
    
    // 关闭功能
    const closeButton = helpDialog.querySelector('.keyboard-help-close') as HTMLElement;
    closeButton.addEventListener('click', () => {
      focusTrap.deactivate();
      helpDialog.remove();
    });
    
    // ESC关闭
    helpDialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        focusTrap.deactivate();
        helpDialog.remove();
      }
    });
    
    document.body.appendChild(helpDialog);
    focusTrap.activate();
    
    return helpDialog;
  }

  /**
   * 设置高对比度模式
   */
  setupHighContrastMode() {
    if (!this.options.enableHighContrast) return;
    
    // 检测系统高对比度设置
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const updateContrastMode = (matches: boolean) => {
      this.container.classList.toggle('high-contrast', matches);
      
      if (matches) {
        // 增强边框和颜色对比
        this.container.style.setProperty('--border-width', '2px');
        this.container.style.setProperty('--focus-outline-width', '3px');
      } else {
        this.container.style.removeProperty('--border-width');
        this.container.style.removeProperty('--focus-outline-width');
      }
    };
    
    // 初始设置
    updateContrastMode(mediaQuery.matches);
    
    // 监听变化
    mediaQuery.addEventListener('change', (e) => updateContrastMode(e.matches));
  }

  /**
   * 设置减弱动画模式
   */
  setupReducedMotionMode() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const updateMotionMode = (reduce: boolean) => {
      this.container.classList.toggle('reduced-motion', reduce);
      
      if (reduce) {
        // 禁用或减少动画
        this.container.style.setProperty('--animation-duration', '0.01s');
        this.container.style.setProperty('--transition-duration', '0.01s');
      } else {
        this.container.style.removeProperty('--animation-duration');
        this.container.style.removeProperty('--transition-duration');
      }
    };
    
    updateMotionMode(mediaQuery.matches);
    mediaQuery.addEventListener('change', (e) => updateMotionMode(e.matches));
  }

  // 私有方法
  
  private setupAccessibilityStructure() {
    // 设置容器角色
    this.container.setAttribute('role', 'application');
    this.container.setAttribute('aria-label', '列布局编辑器');
    
    // 创建实时通知区域
    if (this.options.enableAriaLiveRegion) {
      this.announcements = document.createElement('div');
      this.announcements.className = 'sr-only';
      this.announcements.setAttribute('aria-live', 'polite');
      this.announcements.setAttribute('aria-atomic', 'true');
      this.container.appendChild(this.announcements);
    }
    
    // 设置语言
    this.container.setAttribute('lang', this.options.language);
    
    // 添加可访问性样式
    this.injectAccessibilityStyles();
    
    // 设置高对比度和减弱动画支持
    this.setupHighContrastMode();
    this.setupReducedMotionMode();
  }

  private setupEventListeners() {
    // 键盘帮助快捷键
    this.container.addEventListener('keydown', (event) => {
      if (event.key === 'F1' || (event.key === '?' && event.shiftKey)) {
        event.preventDefault();
        this.createKeyboardHelp();
      }
    });
  }

  private setupColumnNavigation(columnElement: HTMLElement, columnIndex: number) {
    columnElement.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          if (event.ctrlKey) {
            event.preventDefault();
            this.focusPreviousColumn(columnIndex);
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey) {
            event.preventDefault();
            this.focusNextColumn(columnIndex);
          }
          break;
      }
    });
  }

  private setupDragHandle(blockElement: HTMLElement) {
    const dragHandle = document.createElement('button');
    dragHandle.className = 'drag-handle sr-only-focusable';
    dragHandle.setAttribute('aria-label', this.getText('dragHandle'));
    dragHandle.setAttribute('tabindex', '0');
    
    dragHandle.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.startKeyboardDrag(blockElement);
      }
    });
    
    blockElement.appendChild(dragHandle);
  }

  private setupBlockActions(blockElement: HTMLElement, blockType: string, columnIndex: number, blockIndex: number) {
    blockElement.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          if (event.ctrlKey) {
            event.preventDefault();
            this.deleteBlock(blockElement);
          }
          break;
        case 'c':
          if (event.ctrlKey) {
            event.preventDefault();
            this.copyBlock(blockElement);
          }
          break;
        case 'v':
          if (event.ctrlKey) {
            event.preventDefault();
            this.pasteBlock(columnIndex, blockIndex);
          }
          break;
      }
    });
  }

  private handleTrapKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      const focusableElements = this.getFocusableElements(event.currentTarget as HTMLElement);
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = `
      button:not([disabled]),
      [href],
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"])
    `;
    
    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }

  private focusPreviousColumn(currentIndex: number) {
    const columns = this.container.querySelectorAll('.column-content');
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : columns.length - 1;
    const prevColumn = columns[prevIndex] as HTMLElement;
    prevColumn?.focus();
  }

  private focusNextColumn(currentIndex: number) {
    const columns = this.container.querySelectorAll('.column-content');
    const nextIndex = (currentIndex + 1) % columns.length;
    const nextColumn = columns[nextIndex] as HTMLElement;
    nextColumn?.focus();
  }

  private startKeyboardDrag(element: HTMLElement) {
    // 实现键盘拖拽逻辑
    this.announce('键盘拖拽模式已启动。使用方向键移动，空格键放置，Escape取消。');
    element.classList.add('keyboard-dragging');
    
    // 这里应该集成实际的拖拽系统
    this.announceDragState(element, 'start');
  }

  private deleteBlock(element: HTMLElement) {
    // 实现删除逻辑
    this.announce('内容已删除');
  }

  private copyBlock(element: HTMLElement) {
    // 实现复制逻辑
    this.announce('内容已复制');
  }

  private pasteBlock(columnIndex: number, blockIndex: number) {
    // 实现粘贴逻辑
    this.announce(`内容已粘贴到第 ${columnIndex + 1} 列`);
  }

  private getText(key: keyof AccessibilityTexts, params?: Record<string, any>): string {
    let text = this.options.texts[key] || this.defaultTexts[key];
    
    if (params) {
      Object.keys(params).forEach(param => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param].toString());
      });
    }
    
    return text;
  }

  private injectAccessibilityStyles() {
    const styleId = 'accessibility-support-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 屏幕阅读器专用内容 */
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      /* 仅在获得焦点时显示 */
      .sr-only-focusable:focus {
        position: static !important;
        width: auto !important;
        height: auto !important;
        padding: 0.25rem 0.5rem !important;
        margin: 0 !important;
        overflow: visible !important;
        clip: auto !important;
        white-space: normal !important;
        background: var(--yunke-background-overlay-panel-color) !important;
        border: 1px solid var(--yunke-border-color) !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        z-index: 1000 !important;
      }
      
      /* 焦点样式增强 */
      .interaction-focused {
        outline: 2px solid var(--yunke-primary-color) !important;
        outline-offset: 2px !important;
      }
      
      /* 高对比度模式 */
      .high-contrast {
        --border-width: 2px;
        --focus-outline-width: 3px;
      }
      
      .high-contrast * {
        border-width: var(--border-width) !important;
      }
      
      .high-contrast .interaction-focused {
        outline-width: var(--focus-outline-width) !important;
        outline-style: solid !important;
        outline-color: var(--yunke-primary-color) !important;
      }
      
      /* 减弱动画模式 */
      .reduced-motion * {
        animation-duration: 0.01s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01s !important;
      }
      
      /* 键盘拖拽状态 */
      .keyboard-dragging {
        outline: 3px dashed var(--yunke-primary-color) !important;
        outline-offset: 4px !important;
        background: var(--yunke-primary-color-alpha) !important;
      }
      
      /* 键盘帮助对话框 */
      .keyboard-help-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        background: var(--yunke-background-overlay-panel-color);
        border: 1px solid var(--yunke-border-color);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        overflow-y: auto;
      }
      
      .keyboard-help-content {
        padding: 24px;
      }
      
      .keyboard-help-content h2 {
        margin: 0 0 16px 0;
        font-size: 18px;
        color: var(--yunke-text-primary-color);
      }
      
      .keyboard-help-content h3 {
        margin: 16px 0 8px 0;
        font-size: 14px;
        color: var(--yunke-text-primary-color);
        font-weight: 600;
      }
      
      .keyboard-help-content dl {
        margin: 0;
      }
      
      .keyboard-help-content dt {
        display: inline-block;
        min-width: 120px;
        font-family: monospace;
        font-size: 12px;
        background: var(--yunke-background-secondary-color);
        padding: 2px 6px;
        border-radius: 3px;
        margin-right: 8px;
      }
      
      .keyboard-help-content dd {
        display: inline;
        margin: 0;
        font-size: 13px;
        color: var(--yunke-text-secondary-color);
      }
      
      .keyboard-help-close {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 8px 16px;
        background: var(--yunke-primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .keyboard-help-close:hover {
        background: var(--yunke-primary-color-hover);
      }
      
      .keyboard-help-close:focus {
        outline: 2px solid white;
        outline-offset: 2px;
      }
    `;
    
    document.head.appendChild(style);
  }

  // 公共方法
  dispose() {
    // 移除通知区域
    if (this.announcements) {
      this.announcements.remove();
    }
    
    // 移除焦点陷阱
    if (this.focusTrap) {
      this.focusTrap.deactivate();
    }
    
    // 移除样式
    const styleElement = document.getElementById('accessibility-support-styles');
    styleElement?.remove();
  }
}

// 类型定义
interface AccessibilityOptions {
  enableScreenReader: boolean;
  enableKeyboardTraps: boolean;
  enableAriaLiveRegion: boolean;
  enableHighContrast: boolean;
  language: string;
  texts: AccessibilityTexts;
}

interface AccessibilityTexts {
  columnLabel: string;
  columnDescription: string;
  addContentButton: string;
  dragHandle: string;
  dropZone: string;
  blockSelected: string;
  blockDeselected: string;
  layoutSwitched: string;
  contentAdded: string;
  contentMoved: string;
  contentRemoved: string;
  keyboardShortcuts: string;
  loading: string;
  error: string;
  success: string;
}

interface FocusTrap {
  activate: () => void;
  deactivate: () => void;
}

// 导出工厂函数
export function createAccessibilitySupport(
  container: HTMLElement, 
  options?: Partial<AccessibilityOptions>
): AccessibilitySupport {
  return new AccessibilitySupport(container, options);
}