export class PerformanceMonitor {
  private static observer: PerformanceObserver | null = null;
  private static thresholds = {
    'usePatchSpecs-edgeless': 50,
    'edgeless-render': 16,
    'std-render': 16,
    'std-rebuild': 100,
    'edgeless-focus-init': 100,
    'edgeless-renderBlock': 16,
    'viewport-getModels': 5,
    'refreshLayerViewport': 10,
    'updateLayers': 10,
  };

  static init() {
    if (this.observer || typeof PerformanceObserver === 'undefined') {
      return;
    }

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          const baseName = entry.name.replace(/-\d+$/, '');
          const threshold = this.thresholds[baseName as keyof typeof this.thresholds] ||
                          this.thresholds[entry.name as keyof typeof this.thresholds] ||
                          50;

          if (entry.duration > threshold) {
            console.warn(
              `⚠️ [Performance] ${entry.name} 耗时过长: ${entry.duration.toFixed(2)}ms (阈值: ${threshold}ms)`
            );
          } else if (entry.duration > 1 && !entry.name.match(/-\d+$/)) {
            console.log(
              `✅ [Performance] ${entry.name}: ${entry.duration.toFixed(2)}ms`
            );
          }
        }
      }
    });

    this.observer.observe({ entryTypes: ['measure'] });
    console.log('🔍 [Performance Monitor] 已启动性能监控');
  }

  static destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      console.log('🔍 [Performance Monitor] 已停止性能监控');
    }
  }

  static report() {
    const measures = performance.getEntriesByType('measure') as PerformanceMeasure[];

    if (measures.length === 0) {
      console.log('📊 [Performance Report] 暂无性能数据');
      return;
    }

    console.group('📊 [Performance Report] 性能分析报告');

    const grouped = new Map<string, number[]>();
    measures.forEach(m => {
      const existing = grouped.get(m.name) || [];
      existing.push(m.duration);
      grouped.set(m.name, existing);
    });

    grouped.forEach((durations, name) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);

      console.log(
        `${name}:\n` +
        `  调用次数: ${durations.length}\n` +
        `  平均: ${avg.toFixed(2)}ms\n` +
        `  最大: ${max.toFixed(2)}ms\n` +
        `  最小: ${min.toFixed(2)}ms`
      );
    });

    console.groupEnd();
  }

  static clear() {
    performance.clearMarks();
    performance.clearMeasures();
    console.log('🧹 [Performance Monitor] 已清除所有性能数据');
  }
}

if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = PerformanceMonitor;
  PerformanceMonitor.init();
}
