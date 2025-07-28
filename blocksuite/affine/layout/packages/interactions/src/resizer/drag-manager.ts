import type { ColumnResizeEvent } from '../types/responsive-contracts.js';
import { AdvancedConstraintSystem, type ConstraintApplicationResult } from './advanced-constraint-system.js';

/**
 * 拖拽管理器 - 处理复杂的拖拽交互逻辑
 */
export class DragManager {
  private isDragging = false;
  private dragData: DragData | null = null;
  private callbacks: DragCallbacks = {};

  constructor(callbacks: DragCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * 开始拖拽
   */
  startDrag(event: MouseEvent | TouchEvent, data: DragData): void {
    if (this.isDragging) return;

    this.isDragging = true;
    this.dragData = {
      ...data,
      startTime: Date.now(),
      lastEvent: event
    };

    // 获取起始位置
    const clientX = this.getClientX(event);
    const clientY = this.getClientY(event);
    
    this.dragData.startX = clientX;
    this.dragData.startY = clientY;
    this.dragData.lastX = clientX;
    this.dragData.lastY = clientY;

    // 设置全局拖拽状态
    this.setGlobalDragState(true);

    // 添加全局事件监听
    this.addGlobalListeners();

    // 触发开始回调
    this.callbacks.onDragStart?.(this.dragData, event);
  }

  /**
   * 处理拖拽移动
   */
  private handleDragMove = (event: MouseEvent | TouchEvent) => {
    if (!this.isDragging || !this.dragData) return;

    const clientX = this.getClientX(event);
    const clientY = this.getClientY(event);
    
    // 计算增量
    const deltaX = clientX - this.dragData.lastX;
    const deltaY = clientY - this.dragData.lastY;
    const totalDeltaX = clientX - this.dragData.startX;
    const totalDeltaY = clientY - this.dragData.startY;

    // 更新拖拽数据
    this.dragData.lastX = clientX;
    this.dragData.lastY = clientY;
    this.dragData.deltaX = deltaX;
    this.dragData.deltaY = deltaY;
    this.dragData.totalDeltaX = totalDeltaX;
    this.dragData.totalDeltaY = totalDeltaY;
    this.dragData.lastEvent = event;

    // 触发移动回调
    this.callbacks.onDragMove?.(this.dragData, event);
  };

  /**
   * 结束拖拽
   */
  private handleDragEnd = (event: MouseEvent | TouchEvent) => {
    if (!this.isDragging || !this.dragData) return;

    const endTime = Date.now();
    const duration = endTime - this.dragData.startTime;

    // 设置结束数据
    this.dragData.endTime = endTime;
    this.dragData.duration = duration;
    this.dragData.lastEvent = event;

    // 触发结束回调
    this.callbacks.onDragEnd?.(this.dragData, event);

    // 清理状态
    this.cleanup();
  };

  /**
   * 取消拖拽
   */
  cancelDrag(): void {
    if (!this.isDragging || !this.dragData) return;

    // 触发取消回调
    this.callbacks.onDragCancel?.(this.dragData);

    // 清理状态
    this.cleanup();
  }

  /**
   * 清理拖拽状态
   */
  private cleanup(): void {
    this.isDragging = false;
    this.dragData = null;

    // 恢复全局状态
    this.setGlobalDragState(false);

    // 移除全局事件监听
    this.removeGlobalListeners();
  }

  /**
   * 设置全局拖拽状态
   */
  private setGlobalDragState(dragging: boolean): void {
    if (dragging) {
      document.body.style.cursor = this.dragData?.cursor || 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.classList.add('dragging');
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('dragging');
    }
  }

  /**
   * 添加全局事件监听器
   */
  private addGlobalListeners(): void {
    // 鼠标事件
    document.addEventListener('mousemove', this.handleDragMove as EventListener);
    document.addEventListener('mouseup', this.handleDragEnd as EventListener);
    
    // 触摸事件
    document.addEventListener('touchmove', this.handleDragMove as EventListener, { passive: false });
    document.addEventListener('touchend', this.handleDragEnd as EventListener);
    
    // 键盘事件 (ESC取消)
    document.addEventListener('keydown', this.handleKeyDown);
    
    // 防止页面滚动
    document.addEventListener('scroll', this.preventScroll, { passive: false });
  }

  /**
   * 移除全局事件监听器
   */
  private removeGlobalListeners(): void {
    document.removeEventListener('mousemove', this.handleDragMove as EventListener);
    document.removeEventListener('mouseup', this.handleDragEnd as EventListener);
    document.removeEventListener('touchmove', this.handleDragMove as EventListener);
    document.removeEventListener('touchend', this.handleDragEnd as EventListener);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('scroll', this.preventScroll);
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.cancelDrag();
    }
  };

  /**
   * 防止页面滚动
   */
  private preventScroll = (event: Event) => {
    event.preventDefault();
  };

  /**
   * 获取客户端X坐标
   */
  private getClientX(event: MouseEvent | TouchEvent): number {
    if (event instanceof MouseEvent) {
      return event.clientX;
    } else {
      return event.touches[0]?.clientX || 0;
    }
  }

  /**
   * 获取客户端Y坐标
   */
  private getClientY(event: MouseEvent | TouchEvent): number {
    if (event instanceof MouseEvent) {
      return event.clientY;
    } else {
      return event.touches[0]?.clientY || 0;
    }
  }

  /**
   * 检查是否正在拖拽
   */
  get dragging(): boolean {
    return this.isDragging;
  }

  /**
   * 获取当前拖拽数据
   */
  get currentDragData(): DragData | null {
    return this.dragData;
  }
}

/**
 * 拖拽数据接口
 */
export interface DragData {
  type: 'column-resize' | 'block-move' | 'custom';
  element: HTMLElement;
  cursor?: string;
  
  // 位置数据
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  deltaX?: number;
  deltaY?: number;
  totalDeltaX?: number;
  totalDeltaY?: number;
  
  // 时间数据
  startTime: number;
  endTime?: number;
  duration?: number;
  
  // 事件数据
  lastEvent?: MouseEvent | TouchEvent;
  
  // 自定义数据
  customData?: any;
}

/**
 * 拖拽回调接口
 */
export interface DragCallbacks {
  onDragStart?: (data: DragData, event: MouseEvent | TouchEvent) => void;
  onDragMove?: (data: DragData, event: MouseEvent | TouchEvent) => void;
  onDragEnd?: (data: DragData, event: MouseEvent | TouchEvent) => void;
  onDragCancel?: (data: DragData) => void;
}

/**
 * 增强的列宽约束管理器 - 集成高级约束系统
 */
export class EnhancedColumnConstraintManager {
  private constraintSystem: AdvancedConstraintSystem;
  private minWidth: number;
  private maxWidth: number;
  private containerWidth: number;
  
  constructor(
    minWidth = 200,
    maxWidth = 800,
    containerWidth = 1000,
    constraintConfig?: any
  ) {
    this.minWidth = minWidth;
    this.maxWidth = maxWidth;
    this.containerWidth = containerWidth;
    
    // 创建高级约束系统
    this.constraintSystem = new AdvancedConstraintSystem(constraintConfig);
    
    // 更新基础约束规则
    this.updateBasicConstraints();
  }

  /**
   * 更新基础约束
   */
  private updateBasicConstraints(): void {
    const minRatio = this.minWidth / this.containerWidth;
    const maxRatio = this.maxWidth / this.containerWidth;
    
    // 更新最小宽度约束
    this.constraintSystem.removeRule('global-min-width');
    this.constraintSystem.addRule({
      id: 'global-min-width',
      type: 'min-width',
      priority: 9,
      value: minRatio,
      message: `列宽不能小于${this.minWidth}px (${(minRatio * 100).toFixed(1)}%)`,
      enabled: true
    });

    // 更新最大宽度约束
    this.constraintSystem.removeRule('global-max-width');
    this.constraintSystem.addRule({
      id: 'global-max-width',
      type: 'max-width',
      priority: 9,
      value: maxRatio,
      message: `列宽不能大于${this.maxWidth}px (${(maxRatio * 100).toFixed(1)}%)`,
      enabled: true
    });
  }

  /**
   * 更新容器宽度
   */
  updateContainerWidth(containerWidth: number): void {
    this.containerWidth = containerWidth;
    this.updateBasicConstraints();
  }

  /**
   * 应用约束到列宽度数组
   */
  applyConstraints(
    widths: number[],
    contentAnalysis?: any
  ): ConstraintApplicationResult {
    return this.constraintSystem.applyConstraints(
      widths,
      this.containerWidth,
      contentAnalysis
    );
  }

  /**
   * 验证单个列宽度
   */
  validateWidth(width: number): number {
    const minRatio = this.minWidth / this.containerWidth;
    const maxRatio = this.maxWidth / this.containerWidth;
    return Math.max(minRatio, Math.min(maxRatio, width));
  }

  /**
   * 检查宽度是否有效
   */
  isValidWidth(width: number): boolean {
    const minRatio = this.minWidth / this.containerWidth;
    const maxRatio = this.maxWidth / this.containerWidth;
    return width >= minRatio && width <= maxRatio;
  }

  /**
   * 获取约束信息
   */
  getConstraints() {
    const minRatio = this.minWidth / this.containerWidth;
    const maxRatio = this.maxWidth / this.containerWidth;
    
    return {
      minWidth: this.minWidth,
      maxWidth: this.maxWidth,
      minRatio,
      maxRatio,
      rules: this.constraintSystem.getRules(),
      violations: this.constraintSystem.getViolationHistory()
    };
  }

  /**
   * 计算调整后的相邻列宽度
   */
  adjustAdjacentColumns(
    leftWidth: number,
    rightWidth: number,
    delta: number,
    contentAnalysis?: any
  ): [number, number] {
    const deltaRatio = delta / this.containerWidth;
    const newLeftWidth = leftWidth + deltaRatio;
    const newRightWidth = rightWidth - deltaRatio;
    
    // 使用约束系统验证调整
    const result = this.constraintSystem.applyConstraints(
      [newLeftWidth, newRightWidth],
      this.containerWidth,
      contentAnalysis
    );
    
    return [result.constrainedWidths[0], result.constrainedWidths[1]];
  }

  /**
   * 生成智能宽度分布
   */
  generateSmartDistribution(
    columnCount: number,
    contentAnalysis?: any
  ): number[] {
    return this.constraintSystem.generateSmartDistribution(
      columnCount,
      this.containerWidth,
      contentAnalysis
    );
  }

  /**
   * 添加自定义约束规则
   */
  addCustomRule(rule: any): void {
    this.constraintSystem.addRule(rule);
  }

  /**
   * 移除约束规则
   */
  removeRule(ruleId: string): boolean {
    return this.constraintSystem.removeRule(ruleId);
  }

  /**
   * 获取约束应用报告
   */
  getConstraintReport(result: ConstraintApplicationResult): string {
    const { ConstraintSystemUtils } = require('./advanced-constraint-system.js');
    return ConstraintSystemUtils.generateConstraintReport(
      result,
      this.constraintSystem.getRules()
    );
  }

  /**
   * 获取约束系统实例
   */
  getConstraintSystem(): AdvancedConstraintSystem {
    return this.constraintSystem;
  }
}

/**
 * 兼容性：保留原有的ColumnConstraintManager类
 * @deprecated 请使用 EnhancedColumnConstraintManager
 */
export class ColumnConstraintManager extends EnhancedColumnConstraintManager {
  constructor(minWidth = 200, maxWidth = 800, containerWidth = 1000) {
    super(minWidth, maxWidth, containerWidth);
  }
}

/**
 * 拖拽辅助工具
 */
export class DragUtils {
  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func(...args), delay);
    };
  }

  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * 计算两点间距离
   */
  static getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * 检查是否为触摸设备
   */
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * 获取元素相对于视口的位置
   */
  static getElementPosition(element: HTMLElement): { x: number; y: number; width: number; height: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * 检查点是否在元素内
   */
  static isPointInElement(x: number, y: number, element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  /**
   * 创建拖拽数据对象
   */
  static createDragData(
    type: DragData['type'],
    element: HTMLElement,
    event: MouseEvent | TouchEvent,
    customData?: any
  ): Partial<DragData> {
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0]?.clientX || 0;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0]?.clientY || 0;
    
    return {
      type,
      element,
      startX: clientX,
      startY: clientY,
      lastX: clientX,
      lastY: clientY,
      startTime: Date.now(),
      lastEvent: event,
      customData
    };
  }

  /**
   * 格式化拖拽事件数据
   */
  static formatResizeEvent(
    columnIndex: number,
    oldWidths: number[],
    newWidths: number[]
  ): ColumnResizeEvent {
    return {
      columnIndex,
      oldWidth: oldWidths[columnIndex] || 0,
      newWidth: newWidths[columnIndex] || 0,
      allWidths: [...newWidths],
      timestamp: Date.now()
    };
  }
}