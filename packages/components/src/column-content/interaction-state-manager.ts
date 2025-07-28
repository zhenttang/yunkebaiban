// 文件: packages/components/src/column-content/interaction-state-manager.ts
import { LitElement } from 'lit';
import { signal, computed, Signal } from '@preact/signals-core';

/**
 * 交互状态管理器
 * 
 * 负责管理列布局系统的所有交互状态:
 * - 焦点状态管理
 * - 选择状态跟踪
 * - 悬停状态管理
 * - 激活状态控制
 * - 拖拽状态协调
 * - 键盘导航状态
 */
export class InteractionStateManager {
  private container: HTMLElement;
  
  // 核心状态信号
  private readonly _focusedElement$ = signal<HTMLElement | null>(null);
  private readonly _selectedElements$ = signal<Set<HTMLElement>>(new Set());
  private readonly _hoveredElement$ = signal<HTMLElement | null>(null);
  private readonly _activeElement$ = signal<HTMLElement | null>(null);
  private readonly _draggingElement$ = signal<HTMLElement | null>(null);
  private readonly _keyboardNavigation$ = signal<boolean>(false);
  
  // 组合状态
  private readonly _interactionMode$ = signal<InteractionMode>('mouse');
  private readonly _isInteractionDisabled$ = signal<boolean>(false);
  
  // 计算属性
  public readonly focusedElement$ = computed(() => this._focusedElement$.value);
  public readonly selectedElements$ = computed(() => Array.from(this._selectedElements$.value));
  public readonly hoveredElement$ = computed(() => this._hoveredElement$.value);
  public readonly activeElement$ = computed(() => this._activeElement$.value);
  public readonly draggingElement$ = computed(() => this._draggingElement$.value);
  public readonly isKeyboardNavigation$ = computed(() => this._keyboardNavigation$.value);
  public readonly interactionMode$ = computed(() => this._interactionMode$.value);
  public readonly isInteractionDisabled$ = computed(() => this._isInteractionDisabled$.value);
  
  // 状态历史
  private stateHistory: InteractionState[] = [];
  private historyIndex = -1;
  private maxHistoryLength = 50;
  
  // 事件监听器
  private listeners = new Map<string, Function[]>();
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.setupEventListeners();
    this.setupStateWatchers();
  }

  // === 焦点管理 ===
  
  /**
   * 设置焦点元素
   */
  setFocus(element: HTMLElement | null, reason: FocusReason = 'programmatic') {
    const previousFocus = this._focusedElement$.value;
    this._focusedElement$.value = element;
    
    // 更新DOM焦点状态
    this.updateFocusStyles(previousFocus, element);
    
    // 触发焦点事件
    this.emit('focus-change', {
      previous: previousFocus,
      current: element,
      reason
    });
    
    // 记录状态变化
    this.recordStateChange('focus', { element, reason });
  }

  /**
   * 移动焦点到下一个可聚焦元素
   */
  focusNext(): boolean {
    const focusableElements = this.getFocusableElements();
    const currentIndex = this._focusedElement$.value 
      ? focusableElements.indexOf(this._focusedElement$.value)
      : -1;
    
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    if (focusableElements[nextIndex]) {
      this.setFocus(focusableElements[nextIndex], 'keyboard-navigation');
      return true;
    }
    
    return false;
  }

  /**
   * 移动焦点到上一个可聚焦元素
   */
  focusPrevious(): boolean {
    const focusableElements = this.getFocusableElements();
    const currentIndex = this._focusedElement$.value 
      ? focusableElements.indexOf(this._focusedElement$.value)
      : 0;
    
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
    if (focusableElements[prevIndex]) {
      this.setFocus(focusableElements[prevIndex], 'keyboard-navigation');
      return true;
    }
    
    return false;
  }

  // === 选择管理 ===
  
  /**
   * 选择元素
   */
  select(element: HTMLElement, mode: SelectionMode = 'replace') {
    const selected = new Set(this._selectedElements$.value);
    
    switch (mode) {
      case 'replace':
        selected.clear();
        selected.add(element);
        break;
      case 'add':
        selected.add(element);
        break;
      case 'toggle':
        if (selected.has(element)) {
          selected.delete(element);
        } else {
          selected.add(element);
        }
        break;
      case 'range':
        // 实现范围选择逻辑
        this.selectRange(element, selected);
        break;
    }
    
    this._selectedElements$.value = selected;
    this.updateSelectionStyles();
    
    this.emit('selection-change', {
      selected: Array.from(selected),
      mode,
      target: element
    });
    
    this.recordStateChange('selection', { selected, mode });
  }

  /**
   * 清除所有选择
   */
  clearSelection() {
    this._selectedElements$.value = new Set();
    this.updateSelectionStyles();
    
    this.emit('selection-change', {
      selected: [],
      mode: 'clear'
    });
  }

  /**
   * 检查元素是否被选中
   */
  isSelected(element: HTMLElement): boolean {
    return this._selectedElements$.value.has(element);
  }

  // === 悬停管理 ===
  
  /**
   * 设置悬停元素
   */
  setHover(element: HTMLElement | null) {
    const previousHover = this._hoveredElement$.value;
    this._hoveredElement$.value = element;
    
    // 更新悬停样式
    this.updateHoverStyles(previousHover, element);
    
    this.emit('hover-change', {
      previous: previousHover,
      current: element
    });
  }

  // === 激活状态管理 ===
  
  /**
   * 设置激活元素
   */
  setActive(element: HTMLElement | null, reason: ActiveReason = 'click') {
    const previousActive = this._activeElement$.value;
    this._activeElement$.value = element;
    
    // 更新激活样式
    this.updateActiveStyles(previousActive, element);
    
    this.emit('active-change', {
      previous: previousActive,
      current: element,
      reason
    });
    
    this.recordStateChange('active', { element, reason });
  }

  // === 拖拽状态管理 ===
  
  /**
   * 开始拖拽
   */
  startDragging(element: HTMLElement) {
    this._draggingElement$.value = element;
    this.setInteractionMode('drag');
    
    // 更新拖拽样式
    this.updateDragStyles(element, true);
    
    this.emit('drag-start', { element });
    this.recordStateChange('drag-start', { element });
  }

  /**
   * 结束拖拽
   */
  endDragging() {
    const draggingElement = this._draggingElement$.value;
    this._draggingElement$.value = null;
    this.setInteractionMode('mouse');
    
    if (draggingElement) {
      this.updateDragStyles(draggingElement, false);
    }
    
    this.emit('drag-end', { element: draggingElement });
    this.recordStateChange('drag-end', { element: draggingElement });
  }

  // === 交互模式管理 ===
  
  /**
   * 设置交互模式
   */
  setInteractionMode(mode: InteractionMode) {
    const previousMode = this._interactionMode$.value;
    this._interactionMode$.value = mode;
    
    // 根据模式更新键盘导航状态
    this._keyboardNavigation$.value = mode === 'keyboard';
    
    // 更新容器类名
    this.updateModeStyles(previousMode, mode);
    
    this.emit('mode-change', {
      previous: previousMode,
      current: mode
    });
  }

  /**
   * 启用/禁用交互
   */
  setInteractionDisabled(disabled: boolean) {
    this._isInteractionDisabled$.value = disabled;
    
    // 更新容器状态
    this.container.classList.toggle('interaction-disabled', disabled);
    
    if (disabled) {
      // 清除所有活动状态
      this.clearAllStates();
    }
    
    this.emit('interaction-disabled-change', { disabled });
  }

  // === 状态历史管理 ===
  
  /**
   * 撤销上一个状态变化
   */
  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.stateHistory[this.historyIndex];
      this.restoreState(state);
      
      this.emit('state-restore', { state, type: 'undo' });
      return true;
    }
    
    return false;
  }

  /**
   * 重做下一个状态变化
   */
  redo(): boolean {
    if (this.historyIndex < this.stateHistory.length - 1) {
      this.historyIndex++;
      const state = this.stateHistory[this.historyIndex];
      this.restoreState(state);
      
      this.emit('state-restore', { state, type: 'redo' });
      return true;
    }
    
    return false;
  }

  /**
   * 获取当前完整状态
   */
  getCurrentState(): InteractionState {
    return {
      timestamp: Date.now(),
      focusedElement: this._focusedElement$.value,
      selectedElements: new Set(this._selectedElements$.value),
      hoveredElement: this._hoveredElement$.value,
      activeElement: this._activeElement$.value,
      draggingElement: this._draggingElement$.value,
      interactionMode: this._interactionMode$.value,
      isKeyboardNavigation: this._keyboardNavigation$.value,
      isInteractionDisabled: this._isInteractionDisabled$.value
    };
  }

  // === 事件系统 ===
  
  /**
   * 监听状态变化事件
   */
  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    
    // 返回取消监听函数
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * 移除事件监听器
   */
  off(event: string, listener?: Function) {
    if (!listener) {
      this.listeners.delete(event);
    } else {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }

  // === 私有方法 ===
  
  private setupEventListeners() {
    // 鼠标事件
    this.container.addEventListener('mouseenter', this.handleMouseEnter);
    this.container.addEventListener('mouseleave', this.handleMouseLeave);
    this.container.addEventListener('mousedown', this.handleMouseDown);
    this.container.addEventListener('mouseup', this.handleMouseUp);
    this.container.addEventListener('click', this.handleClick);
    
    // 键盘事件
    this.container.addEventListener('keydown', this.handleKeyDown);
    this.container.addEventListener('keyup', this.handleKeyUp);
    
    // 焦点事件
    this.container.addEventListener('focusin', this.handleFocusIn);
    this.container.addEventListener('focusout', this.handleFocusOut);
    
    // 拖拽事件
    this.container.addEventListener('dragstart', this.handleDragStart);
    this.container.addEventListener('dragend', this.handleDragEnd);
  }

  private setupStateWatchers() {
    // 监听焦点变化
    this._focusedElement$.subscribe(element => {
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }
    });
    
    // 监听模式变化
    this._interactionMode$.subscribe(mode => {
      this.container.setAttribute('data-interaction-mode', mode);
    });
  }

  private handleMouseEnter = (event: MouseEvent) => {
    if (this._isInteractionDisabled$.value) return;
    
    const target = this.findInteractiveElement(event.target as HTMLElement);
    if (target) {
      this.setHover(target);
      this.setInteractionMode('mouse');
    }
  };

  private handleMouseLeave = (event: MouseEvent) => {
    if (this._isInteractionDisabled$.value) return;
    
    const target = this.findInteractiveElement(event.target as HTMLElement);
    if (target === this._hoveredElement$.value) {
      this.setHover(null);
    }
  };

  private handleMouseDown = (event: MouseEvent) => {
    if (this._isInteractionDisabled$.value) return;
    
    const target = this.findInteractiveElement(event.target as HTMLElement);
    if (target) {
      this.setActive(target, 'mousedown');
      this.setInteractionMode('mouse');
    }
  };

  private handleMouseUp = (event: MouseEvent) => {
    if (this._isInteractionDisabled$.value) return;
    
    if (this._activeElement$.value) {
      this.setActive(null);
    }
  };

  private handleClick = (event: MouseEvent) => {
    if (this._isInteractionDisabled$.value) return;
    
    const target = this.findInteractiveElement(event.target as HTMLElement);
    if (target) {
      // 处理选择逻辑
      let mode: SelectionMode = 'replace';
      if (event.ctrlKey || event.metaKey) {
        mode = 'toggle';
      } else if (event.shiftKey) {
        mode = 'range';
      }
      
      this.select(target, mode);
      this.setFocus(target, 'click');
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this._isInteractionDisabled$.value) return;
    
    this.setInteractionMode('keyboard');
    
    // 处理导航快捷键
    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        if (event.shiftKey) {
          this.focusPrevious();
        } else {
          this.focusNext();
        }
        break;
        
      case 'Escape':
        this.clearAllStates();
        break;
        
      case 'Enter':
      case ' ':
        if (this._focusedElement$.value) {
          this.setActive(this._focusedElement$.value, 'keyboard');
        }
        break;
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (this._isInteractionDisabled$.value) return;
    
    if (this._activeElement$.value && (event.key === 'Enter' || event.key === ' ')) {
      this.setActive(null);
    }
  };

  private handleFocusIn = (event: FocusEvent) => {
    if (this._isInteractionDisabled$.value) return;
    
    const target = this.findInteractiveElement(event.target as HTMLElement);
    if (target) {
      this.setFocus(target, 'focus-event');
    }
  };

  private handleFocusOut = (event: FocusEvent) => {
    if (this._isInteractionDisabled$.value) return;
    
    // 延迟检查，确保焦点没有移动到子元素
    setTimeout(() => {
      if (!this.container.contains(document.activeElement as HTMLElement)) {
        this.setFocus(null);
      }
    }, 0);
  };

  private handleDragStart = (event: DragEvent) => {
    const target = this.findInteractiveElement(event.target as HTMLElement);
    if (target) {
      this.startDragging(target);
    }
  };

  private handleDragEnd = (event: DragEvent) => {
    this.endDragging();
  };

  private findInteractiveElement(element: HTMLElement): HTMLElement | null {
    // 查找可交互的父元素
    return element.closest('.block-item, .column-content, .add-content-button, [data-interactive]') as HTMLElement;
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = `
      .block-item[tabindex]:not([tabindex="-1"]),
      .add-content-button:not([disabled]),
      .column-content[tabindex]:not([tabindex="-1"]),
      [data-focusable]:not([disabled])
    `;
    
    return Array.from(this.container.querySelectorAll(selector)) as HTMLElement[];
  }

  private selectRange(endElement: HTMLElement, selected: Set<HTMLElement>) {
    const focusableElements = this.getFocusableElements();
    const focusedIndex = this._focusedElement$.value 
      ? focusableElements.indexOf(this._focusedElement$.value)
      : -1;
    const endIndex = focusableElements.indexOf(endElement);
    
    if (focusedIndex >= 0 && endIndex >= 0) {
      const start = Math.min(focusedIndex, endIndex);
      const end = Math.max(focusedIndex, endIndex);
      
      for (let i = start; i <= end; i++) {
        selected.add(focusableElements[i]);
      }
    }
  }

  private updateFocusStyles(previous: HTMLElement | null, current: HTMLElement | null) {
    if (previous) {
      previous.classList.remove('interaction-focused');
      previous.removeAttribute('data-focused');
    }
    
    if (current) {
      current.classList.add('interaction-focused');
      current.setAttribute('data-focused', 'true');
    }
  }

  private updateSelectionStyles() {
    // 清除所有选择样式
    const allSelected = this.container.querySelectorAll('.interaction-selected');
    allSelected.forEach(element => {
      element.classList.remove('interaction-selected');
      element.removeAttribute('data-selected');
    });
    
    // 应用当前选择样式
    this._selectedElements$.value.forEach(element => {
      element.classList.add('interaction-selected');
      element.setAttribute('data-selected', 'true');
    });
  }

  private updateHoverStyles(previous: HTMLElement | null, current: HTMLElement | null) {
    if (previous) {
      previous.classList.remove('interaction-hovered');
      previous.removeAttribute('data-hovered');
    }
    
    if (current) {
      current.classList.add('interaction-hovered');
      current.setAttribute('data-hovered', 'true');
    }
  }

  private updateActiveStyles(previous: HTMLElement | null, current: HTMLElement | null) {
    if (previous) {
      previous.classList.remove('interaction-active');
      previous.removeAttribute('data-active');
    }
    
    if (current) {
      current.classList.add('interaction-active');
      current.setAttribute('data-active', 'true');
    }
  }

  private updateDragStyles(element: HTMLElement, isDragging: boolean) {
    if (isDragging) {
      element.classList.add('interaction-dragging');
      element.setAttribute('data-dragging', 'true');
    } else {
      element.classList.remove('interaction-dragging');
      element.removeAttribute('data-dragging');
    }
  }

  private updateModeStyles(previous: InteractionMode, current: InteractionMode) {
    this.container.classList.remove(`interaction-mode-${previous}`);
    this.container.classList.add(`interaction-mode-${current}`);
  }

  private clearAllStates() {
    this.setFocus(null);
    this.clearSelection();
    this.setHover(null);
    this.setActive(null);
    this.endDragging();
  }

  private recordStateChange(type: string, data: any) {
    const state = this.getCurrentState();
    
    // 清除历史索引之后的记录
    if (this.historyIndex < this.stateHistory.length - 1) {
      this.stateHistory = this.stateHistory.slice(0, this.historyIndex + 1);
    }
    
    // 添加新状态
    this.stateHistory.push(state);
    this.historyIndex++;
    
    // 限制历史记录长度
    if (this.stateHistory.length > this.maxHistoryLength) {
      this.stateHistory.shift();
      this.historyIndex--;
    }
  }

  private restoreState(state: InteractionState) {
    this._focusedElement$.value = state.focusedElement;
    this._selectedElements$.value = new Set(state.selectedElements);
    this._hoveredElement$.value = state.hoveredElement;
    this._activeElement$.value = state.activeElement;
    this._draggingElement$.value = state.draggingElement;
    this._interactionMode$.value = state.interactionMode;
    this._keyboardNavigation$.value = state.isKeyboardNavigation;
    this._isInteractionDisabled$.value = state.isInteractionDisabled;
    
    // 更新样式
    this.updateFocusStyles(null, state.focusedElement);
    this.updateSelectionStyles();
    this.updateHoverStyles(null, state.hoveredElement);
    this.updateActiveStyles(null, state.activeElement);
    if (state.draggingElement) {
      this.updateDragStyles(state.draggingElement, true);
    }
  }

  private emit(event: string, data?: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // 公共方法
  dispose() {
    // 移除所有事件监听器
    this.container.removeEventListener('mouseenter', this.handleMouseEnter);
    this.container.removeEventListener('mouseleave', this.handleMouseLeave);
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    this.container.removeEventListener('mouseup', this.handleMouseUp);
    this.container.removeEventListener('click', this.handleClick);
    this.container.removeEventListener('keydown', this.handleKeyDown);
    this.container.removeEventListener('keyup', this.handleKeyUp);
    this.container.removeEventListener('focusin', this.handleFocusIn);
    this.container.removeEventListener('focusout', this.handleFocusOut);
    this.container.removeEventListener('dragstart', this.handleDragStart);
    this.container.removeEventListener('dragend', this.handleDragEnd);
    
    // 清除所有监听器
    this.listeners.clear();
    
    // 清除状态
    this.clearAllStates();
    
    // 清除历史
    this.stateHistory = [];
    this.historyIndex = -1;
  }
}

// 类型定义
type InteractionMode = 'mouse' | 'keyboard' | 'touch' | 'drag';
type FocusReason = 'programmatic' | 'keyboard-navigation' | 'click' | 'focus-event';
type ActiveReason = 'click' | 'mousedown' | 'keyboard' | 'programmatic';
type SelectionMode = 'replace' | 'add' | 'toggle' | 'range' | 'clear';

interface InteractionState {
  timestamp: number;
  focusedElement: HTMLElement | null;
  selectedElements: Set<HTMLElement>;
  hoveredElement: HTMLElement | null;
  activeElement: HTMLElement | null;
  draggingElement: HTMLElement | null;
  interactionMode: InteractionMode;
  isKeyboardNavigation: boolean;
  isInteractionDisabled: boolean;
}

// 导出工厂函数
export function createInteractionStateManager(container: HTMLElement): InteractionStateManager {
  return new InteractionStateManager(container);
}