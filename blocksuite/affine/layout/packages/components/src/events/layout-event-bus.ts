/**
 * 布局组件事件系统
 * 提供组件间通信和BlockSuite事件集成
 */

import { signal } from '@preact/signals-core';
import { 
  PageLayoutMode, 
  LayoutModeChangeEvent, 
  BlockMoveEvent, 
  ColumnResizeEvent,
  Block 
} from '../types/component-contracts.js';

/**
 * 扩展的布局事件类型
 */
export interface LayoutInitEvent {
  type: 'layout-init';
  docId: string;
  initialMode: PageLayoutMode;
  timestamp: number;
}

export interface LayoutErrorEvent {
  type: 'layout-error';
  docId: string;
  error: Error;
  operation: string;
  timestamp: number;
}

export interface LayoutStateChangeEvent {
  type: 'layout-state-change';
  docId: string;
  state: 'idle' | 'loading' | 'error' | 'transitioning';
  timestamp: number;
}

export interface BlockSelectionEvent {
  type: 'block-selection';
  blockId: string;
  columnIndex: number;
  selected: boolean;
  timestamp: number;
}

export interface LayoutQualityEvent {
  type: 'layout-quality';
  docId: string;
  qualityScore: number;
  recommendations: string[];
  timestamp: number;
}

export type LayoutEvent = 
  | LayoutModeChangeEvent 
  | BlockMoveEvent 
  | ColumnResizeEvent
  | LayoutInitEvent
  | LayoutErrorEvent
  | LayoutStateChangeEvent
  | BlockSelectionEvent
  | LayoutQualityEvent;

/**
 * 事件监听器类型
 */
export type LayoutEventListener<T extends LayoutEvent = LayoutEvent> = (event: T) => void;

/**
 * 布局事件总线
 */
export class LayoutEventBus {
  private listeners = new Map<string, LayoutEventListener[]>();
  private eventHistory: LayoutEvent[] = [];
  private maxHistorySize = 100;
  
  // 状态信号
  private currentState$ = signal<'idle' | 'loading' | 'error' | 'transitioning'>('idle');
  private currentMode$ = signal<PageLayoutMode>('normal');
  private blockCount$ = signal<number>(0);
  
  /**
   * 添加事件监听器
   */
  addEventListener<T extends LayoutEvent>(
    eventType: T['type'], 
    listener: LayoutEventListener<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    const typedListener = listener as LayoutEventListener;
    this.listeners.get(eventType)!.push(typedListener);
    
    // 返回移除函数
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(typedListener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }
  
  /**
   * 移除事件监听器
   */
  removeEventListener<T extends LayoutEvent>(
    eventType: T['type'], 
    listener: LayoutEventListener<T>
  ): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener as LayoutEventListener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * 触发事件
   */
  emit<T extends LayoutEvent>(event: T): void {
    // 添加到历史记录
    this.addToHistory(event);
    
    // 更新内部状态
    this.updateInternalState(event);
    
    // 通知监听器
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in layout event listener for ${event.type}:`, error);
        }
      });
    }
    
    // 发送到全局事件系统（如果存在）
    this.forwardToGlobalEventSystem(event);
  }
  
  /**
   * 获取事件历史
   */
  getEventHistory(eventType?: string): LayoutEvent[] {
    if (eventType) {
      return this.eventHistory.filter(event => event.type === eventType);
    }
    return [...this.eventHistory];
  }
  
  /**
   * 清除事件历史
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }
  
  /**
   * 获取当前状态
   */
  getCurrentState(): 'idle' | 'loading' | 'error' | 'transitioning' {
    return this.currentState$.value;
  }
  
  /**
   * 获取当前布局模式
   */
  getCurrentMode(): PageLayoutMode {
    return this.currentMode$.value;
  }
  
  /**
   * 获取当前Block数量
   */
  getBlockCount(): number {
    return this.blockCount$.value;
  }
  
  /**
   * 订阅状态变化
   */
  onStateChange(callback: (state: 'idle' | 'loading' | 'error' | 'transitioning') => void): () => void {
    return this.currentState$.subscribe(callback);
  }
  
  /**
   * 订阅模式变化
   */
  onModeChange(callback: (mode: PageLayoutMode) => void): () => void {
    return this.currentMode$.subscribe(callback);
  }
  
  /**
   * 创建便捷的事件发射器
   */
  createEventEmitters(docId: string) {
    return {
      emitModeChange: (previousMode: PageLayoutMode, currentMode: PageLayoutMode) => {
        this.emit<LayoutModeChangeEvent>({
          type: 'layout-mode-change',
          docId,
          previousMode,
          currentMode,
          columnWidths: [],
          timestamp: Date.now(),
          source: 'user'
        });
      },
      
      emitBlockMove: (blockId: string, fromColumn: number, toColumn: number, fromIndex: number, toIndex: number) => {
        this.emit<BlockMoveEvent>({
          type: 'block-move',
          blockId,
          fromColumn,
          toColumn,
          fromIndex,
          toIndex
        });
      },
      
      emitColumnResize: (columnIndex: number, newWidth: number, allWidths: number[]) => {
        this.emit<ColumnResizeEvent>({
          type: 'column-resize',
          columnIndex,
          newWidth,
          allWidths
        });
      },
      
      emitError: (error: Error, operation: string) => {
        this.emit<LayoutErrorEvent>({
          type: 'layout-error',
          docId,
          error,
          operation,
          timestamp: Date.now()
        });
      },
      
      emitStateChange: (state: 'idle' | 'loading' | 'error' | 'transitioning') => {
        this.emit<LayoutStateChangeEvent>({
          type: 'layout-state-change',
          docId,
          state,
          timestamp: Date.now()
        });
      },
      
      emitBlockSelection: (blockId: string, columnIndex: number, selected: boolean) => {
        this.emit<BlockSelectionEvent>({
          type: 'block-selection',
          blockId,
          columnIndex,
          selected,
          timestamp: Date.now()
        });
      },
      
      emitQualityAnalysis: (qualityScore: number, recommendations: string[]) => {
        this.emit<LayoutQualityEvent>({
          type: 'layout-quality',
          docId,
          qualityScore,
          recommendations,
          timestamp: Date.now()
        });
      }
    };
  }
  
  // ============= 私有方法 =============
  
  /**
   * 添加到历史记录
   */
  private addToHistory(event: LayoutEvent): void {
    this.eventHistory.push(event);
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
  
  /**
   * 更新内部状态
   */
  private updateInternalState(event: LayoutEvent): void {
    switch (event.type) {
      case 'layout-mode-change':
        this.currentMode$.value = event.currentMode;
        break;
        
      case 'layout-state-change':
        this.currentState$.value = event.state;
        break;
        
      case 'block-move':
        // 可以在这里更新Block计数逻辑
        break;
    }
  }
  
  /**
   * 转发到全局事件系统
   */
  private forwardToGlobalEventSystem(event: LayoutEvent): void {
    // 如果存在BlockSuite全局事件系统，转发事件
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const customEvent = new CustomEvent(`blocksuite:layout:${event.type}`, {
        detail: event,
        bubbles: true
      });
      window.dispatchEvent(customEvent);
    }
    
    // 如果存在文档级别的事件系统
    if (typeof document !== 'undefined') {
      const docEvent = new CustomEvent(`layout:${event.type}`, {
        detail: event,
        bubbles: true,
        composed: true
      });
      document.dispatchEvent(docEvent);
    }
  }
}

/**
 * 全局事件总线实例
 */
export const layoutEventBus = new LayoutEventBus();

/**
 * 事件装饰器 - 自动发送事件
 */
export function emitLayoutEvent<T extends LayoutEvent>(eventType: T['type']) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const result = originalMethod.apply(this, args);
      
      // 如果是Promise，等待完成后发送事件
      if (result instanceof Promise) {
        return result.then((res) => {
          // 这里可以根据方法结果构造事件
          return res;
        });
      }
      
      return result;
    };
    
    return descriptor;
  };
}

/**
 * 组件混入 - 为组件添加事件功能
 */
export interface LayoutEventMixin {
  docId: string;
  emitLayoutEvent<T extends LayoutEvent>(event: Omit<T, 'timestamp'>): void;
  addEventListener<T extends LayoutEvent>(eventType: T['type'], listener: LayoutEventListener<T>): () => void;
}

export function withLayoutEvents<T extends new (...args: any[]) => any>(Base: T) {
  return class extends Base implements LayoutEventMixin {
    declare docId: string;
    
    emitLayoutEvent<E extends LayoutEvent>(event: Omit<E, 'timestamp'>): void {
      layoutEventBus.emit({
        ...event,
        timestamp: Date.now()
      } as E);
    }
    
    addEventListener<E extends LayoutEvent>(
      eventType: E['type'], 
      listener: LayoutEventListener<E>
    ): () => void {
      return layoutEventBus.addEventListener(eventType, listener);
    }
  };
}