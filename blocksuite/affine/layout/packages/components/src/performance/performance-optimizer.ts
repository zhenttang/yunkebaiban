/**
 * 布局组件性能优化工具
 * 提供虚拟滚动、懒加载、防抖等性能优化功能
 */

import { signal } from '@preact/signals-core';

/**
 * 虚拟滚动配置
 */
export interface VirtualScrollConfig {
  /** 容器高度 */
  containerHeight: number;
  /** 单项高度 */
  itemHeight: number;
  /** 缓冲区大小 */
  bufferSize?: number;
  /** 是否启用动态高度 */
  dynamicHeight?: boolean;
}

/**
 * 虚拟滚动项目
 */
export interface VirtualScrollItem {
  id: string;
  height?: number;
  data: any;
}

/**
 * 虚拟滚动管理器
 */
export class VirtualScrollManager {
  private config: VirtualScrollConfig;
  private items: VirtualScrollItem[] = [];
  private scrollTop$ = signal(0);
  private visibleRange$ = signal({ start: 0, end: 0 });
  private heights = new Map<string, number>();
  
  constructor(config: VirtualScrollConfig) {
    this.config = {
      bufferSize: 5,
      dynamicHeight: false,
      ...config
    };
  }
  
  /**
   * 设置数据项
   */
  setItems(items: VirtualScrollItem[]): void {
    this.items = items;
    this.updateVisibleRange();
  }
  
  /**
   * 更新滚动位置
   */
  updateScrollTop(scrollTop: number): void {
    this.scrollTop$.value = scrollTop;
    this.updateVisibleRange();
  }
  
  /**
   * 获取可见范围
   */
  getVisibleRange(): { start: number; end: number } {
    return this.visibleRange$.value;
  }
  
  /**
   * 获取可见项目
   */
  getVisibleItems(): VirtualScrollItem[] {
    const { start, end } = this.visibleRange$.value;
    return this.items.slice(start, end + 1);
  }
  
  /**
   * 获取总高度
   */
  getTotalHeight(): number {
    if (this.config.dynamicHeight) {
      return this.items.reduce((total, item) => {
        return total + (this.heights.get(item.id) || this.config.itemHeight);
      }, 0);
    }
    return this.items.length * this.config.itemHeight;
  }
  
  /**
   * 缓存项目高度
   */
  cacheItemHeight(itemId: string, height: number): void {
    this.heights.set(itemId, height);
    this.updateVisibleRange();
  }
  
  private updateVisibleRange(): void {
    const scrollTop = this.scrollTop$.value;
    const { containerHeight, itemHeight, bufferSize = 5 } = this.config;
    
    let start = Math.floor(scrollTop / itemHeight) - bufferSize;
    let end = Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize;
    
    start = Math.max(0, start);
    end = Math.min(this.items.length - 1, end);
    
    this.visibleRange$.value = { start, end };
  }
}

/**
 * 懒加载管理器
 */
export class LazyLoadManager {
  private observer?: IntersectionObserver;
  private loadedItems = new Set<string>();
  private loadingItems = new Set<string>();
  
  constructor() {
    this.setupIntersectionObserver();
  }
  
  /**
   * 观察元素
   */
  observe(element: HTMLElement, itemId: string, loadCallback: () => Promise<void>): void {
    if (this.loadedItems.has(itemId) || this.loadingItems.has(itemId)) {
      return;
    }
    
    element.dataset.lazyItemId = itemId;
    element.dataset.lazyLoadCallback = 'true';
    
    if (this.observer) {
      this.observer.observe(element);
    }
    
    // 存储回调函数
    (element as any).__lazyLoadCallback = loadCallback;
  }
  
  /**
   * 取消观察
   */
  unobserve(element: HTMLElement): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }
  
  /**
   * 标记项目已加载
   */
  markAsLoaded(itemId: string): void {
    this.loadedItems.add(itemId);
    this.loadingItems.delete(itemId);
  }
  
  /**
   * 检查项目是否已加载
   */
  isLoaded(itemId: string): boolean {
    return this.loadedItems.has(itemId);
  }
  
  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, lazy loading disabled');
      return;
    }
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const itemId = element.dataset.lazyItemId;
            const callback = (element as any).__lazyLoadCallback;
            
            if (itemId && callback && !this.loadingItems.has(itemId)) {
              this.loadingItems.add(itemId);
              
              try {
                await callback();
                this.markAsLoaded(itemId);
                this.unobserve(element);
              } catch (error) {
                console.error('Lazy load error:', error);
                this.loadingItems.delete(itemId);
              }
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }
  
  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.loadedItems.clear();
    this.loadingItems.clear();
  }
}

/**
 * 防抖工具
 */
export class DebounceManager {
  private timers = new Map<string, number>();
  
  /**
   * 防抖执行
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      const timer = setTimeout(() => {
        fn(...args);
        this.timers.delete(key);
      }, delay);
      
      this.timers.set(key, timer);
    };
  }
  
  /**
   * 取消防抖
   */
  cancel(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
  
  /**
   * 清理所有定时器
   */
  cleanup(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

/**
 * 节流工具
 */
export class ThrottleManager {
  private lastExecution = new Map<string, number>();
  
  /**
   * 节流执行
   */
  throttle<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    interval: number = 100
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const now = Date.now();
      const lastTime = this.lastExecution.get(key) || 0;
      
      if (now - lastTime >= interval) {
        fn(...args);
        this.lastExecution.set(key, now);
      }
    };
  }
  
  /**
   * 清理记录
   */
  cleanup(): void {
    this.lastExecution.clear();
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private observers = new Set<PerformanceObserver>();
  
  constructor() {
    this.setupPerformanceObservers();
  }
  
  /**
   * 记录指标
   */
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 限制历史记录大小
    if (values.length > 100) {
      values.shift();
    }
  }
  
  /**
   * 获取指标统计
   */
  getMetricStats(name: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(name) || [];
    
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }
  
  /**
   * 测量函数执行时间
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.recordMetric(name, end - start);
    
    return result;
  }
  
  /**
   * 异步测量
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.recordMetric(name, end - start);
    
    return result;
  }
  
  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }
    
    // 观察渲染性能
    try {
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric(`paint-${entry.name}`, entry.startTime);
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.add(paintObserver);
    } catch (error) {
      console.warn('Paint observer setup failed:', error);
    }
    
    // 观察布局偏移
    try {
      const layoutObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.hadRecentInput) return;
          this.recordMetric('layout-shift', entry.value);
        });
      });
      layoutObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.add(layoutObserver);
    } catch (error) {
      console.warn('Layout shift observer setup failed:', error);
    }
  }
  
  /**
   * 清理资源
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

/**
 * 综合性能优化管理器
 */
export class PerformanceOptimizer {
  public readonly virtualScroll: VirtualScrollManager;
  public readonly lazyLoad: LazyLoadManager;
  public readonly debounce: DebounceManager;
  public readonly throttle: ThrottleManager;
  public readonly monitor: PerformanceMonitor;
  
  constructor(virtualScrollConfig?: VirtualScrollConfig) {
    this.virtualScroll = virtualScrollConfig ? new VirtualScrollManager(virtualScrollConfig) : null as any;
    this.lazyLoad = new LazyLoadManager();
    this.debounce = new DebounceManager();
    this.throttle = new ThrottleManager();
    this.monitor = new PerformanceMonitor();
  }
  
  /**
   * 优化大列表渲染
   */
  optimizeListRendering<T>(
    container: HTMLElement,
    items: T[],
    renderItem: (item: T, index: number) => HTMLElement,
    config?: { itemHeight?: number; enableVirtualScroll?: boolean }
  ): void {
    const { itemHeight = 50, enableVirtualScroll = true } = config || {};
    
    if (enableVirtualScroll && items.length > 100) {
      // 使用虚拟滚动
      if (!this.virtualScroll) {
        console.warn('Virtual scroll not initialized');
        return;
      }
      
      this.virtualScroll.setItems(items.map((item, index) => ({
        id: `item-${index}`,
        data: item
      })));
      
      // 实现虚拟滚动渲染逻辑
      this.renderVirtualList(container, renderItem);
    } else {
      // 使用懒加载
      this.renderLazyList(container, items, renderItem);
    }
  }
  
  private renderVirtualList<T>(
    container: HTMLElement,
    renderItem: (item: T, index: number) => HTMLElement
  ): void {
    // 虚拟滚动实现
    const visibleItems = this.virtualScroll.getVisibleItems();
    const fragment = document.createDocumentFragment();
    
    visibleItems.forEach((vItem, index) => {
      const element = renderItem(vItem.data, index);
      fragment.appendChild(element);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
  }
  
  private renderLazyList<T>(
    container: HTMLElement,
    items: T[],
    renderItem: (item: T, index: number) => HTMLElement
  ): void {
    const fragment = document.createDocumentFragment();
    
    items.forEach((item, index) => {
      const element = renderItem(item, index);
      
      // 添加懒加载
      this.lazyLoad.observe(element, `item-${index}`, async () => {
        // 懒加载逻辑
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      fragment.appendChild(element);
    });
    
    container.appendChild(fragment);
  }
  
  /**
   * 清理所有资源
   */
  cleanup(): void {
    this.lazyLoad.cleanup();
    this.debounce.cleanup();
    this.throttle.cleanup();
    this.monitor.cleanup();
  }
}