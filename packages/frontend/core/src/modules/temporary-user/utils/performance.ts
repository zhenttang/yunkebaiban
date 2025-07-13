/**
 * 性能优化工具集
 * 为临时用户功能提供各种性能优化方案
 */

/**
 * 防抖函数
 * 用于限制函数调用频率
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * 节流函数
 * 确保函数在指定时间间隔内最多执行一次
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 内存优化的LRU缓存
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 重新插入以更新顺序
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最久未使用的项
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * 批处理工具
 * 将多个操作合并为一次批处理执行
 */
export class BatchProcessor<T> {
  private items: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly delay: number;
  private readonly processor: (items: T[]) => void;

  constructor(
    processor: (items: T[]) => void,
    options: {
      batchSize?: number;
      delay?: number;
    } = {}
  ) {
    this.processor = processor;
    this.batchSize = options.batchSize || 10;
    this.delay = options.delay || 100;
  }

  add(item: T): void {
    this.items.push(item);

    // 如果达到批处理大小，立即处理
    if (this.items.length >= this.batchSize) {
      this.flush();
      return;
    }

    // 否则设置延迟处理
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.items.length === 0) {
      return;
    }

    const itemsToProcess = [...this.items];
    this.items.length = 0;
    this.processor(itemsToProcess);
  }

  get pendingCount(): number {
    return this.items.length;
  }
}

/**
 * 异步队列
 * 限制并发执行的异步操作数量
 */
export class AsyncQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private readonly concurrency: number;

  constructor(concurrency: number = 3) {
    this.concurrency = concurrency;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift()!;

    try {
      await task();
    } finally {
      this.running--;
      this.process();
    }
  }

  get size(): number {
    return this.queue.length;
  }

  get activeCount(): number {
    return this.running;
  }
}

/**
 * 懒加载工具
 * 延迟初始化资源直到真正需要时
 */
export class Lazy<T> {
  private value: T | undefined;
  private initialized = false;
  private readonly factory: () => T;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  get(): T {
    if (!this.initialized) {
      this.value = this.factory();
      this.initialized = true;
    }
    return this.value!;
  }

  reset(): void {
    this.value = undefined;
    this.initialized = false;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * 内存使用监控
 */
export class MemoryMonitor {
  private measurements: Array<{
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
  }> = [];

  /**
   * 记录当前内存使用情况
   */
  measure(): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        this.measurements.push({
          timestamp: Date.now(),
          heapUsed: memory.usedJSHeapSize,
          heapTotal: memory.totalJSHeapSize,
        });

        // 保持最多100条记录
        if (this.measurements.length > 100) {
          this.measurements.splice(0, 10);
        }
      }
    }
  }

  /**
   * 获取内存使用统计
   */
  getStats(): {
    current: { heapUsed: number; heapTotal: number } | null;
    average: { heapUsed: number; heapTotal: number } | null;
    peak: { heapUsed: number; heapTotal: number } | null;
  } {
    if (this.measurements.length === 0) {
      return { current: null, average: null, peak: null };
    }

    const current = this.measurements[this.measurements.length - 1];
    
    const avgHeapUsed = this.measurements.reduce((sum, m) => sum + m.heapUsed, 0) / this.measurements.length;
    const avgHeapTotal = this.measurements.reduce((sum, m) => sum + m.heapTotal, 0) / this.measurements.length;
    
    const peakHeapUsed = Math.max(...this.measurements.map(m => m.heapUsed));
    const peakHeapTotal = Math.max(...this.measurements.map(m => m.heapTotal));

    return {
      current: { heapUsed: current.heapUsed, heapTotal: current.heapTotal },
      average: { heapUsed: avgHeapUsed, heapTotal: avgHeapTotal },
      peak: { heapUsed: peakHeapUsed, heapTotal: peakHeapTotal },
    };
  }

  /**
   * 清理旧记录
   */
  cleanup(olderThan: number = 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThan;
    this.measurements = this.measurements.filter(m => m.timestamp > cutoff);
  }
}

/**
 * 性能监控工具
 */
export class PerformanceTracker {
  private timings = new Map<string, number>();
  private marks = new Map<string, number>();

  /**
   * 开始计时
   */
  start(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * 结束计时并返回耗时
   */
  end(name: string): number {
    const startTime = this.marks.get(name);
    if (startTime === undefined) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timings.set(name, duration);
    this.marks.delete(name);
    
    return duration;
  }

  /**
   * 获取计时结果
   */
  getTiming(name: string): number | undefined {
    return this.timings.get(name);
  }

  /**
   * 获取所有计时结果
   */
  getAllTimings(): Record<string, number> {
    return Object.fromEntries(this.timings);
  }

  /**
   * 清理计时数据
   */
  clear(): void {
    this.timings.clear();
    this.marks.clear();
  }
}

/**
 * 全局性能实例
 */
export const performanceTracker = new PerformanceTracker();
export const memoryMonitor = new MemoryMonitor();

/**
 * 性能装饰器
 * 用于自动测量方法执行时间
 */
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measureName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      performanceTracker.start(measureName);
      try {
        const result = originalMethod.apply(this, args);
        
        // 处理异步方法
        if (result instanceof Promise) {
          return result.finally(() => {
            performanceTracker.end(measureName);
          });
        }
        
        performanceTracker.end(measureName);
        return result;
      } catch (error) {
        performanceTracker.end(measureName);
        throw error;
      }
    };

    return descriptor;
  };
} 