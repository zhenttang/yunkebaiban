export class EdgelessPerformanceMonitor {
  private static frameTimestamps: number[] = [];
  private static frameId: number | null = null;
  private static isMonitoring = false;

  static startFPSMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.frameTimestamps = [];

    const measureFPS = (timestamp: number) => {
      this.frameTimestamps.push(timestamp);

      const cutoff = timestamp - 1000;
      this.frameTimestamps = this.frameTimestamps.filter(t => t > cutoff);

      const fps = this.frameTimestamps.length;

      if (fps < 30) {
        console.warn(`⚠️ [FPS] 帧率过低: ${fps} FPS (目标: 60 FPS)`);
      } else if (fps < 50) {
        console.log(`⚡ [FPS] 帧率: ${fps} FPS`);
      }

      if (this.isMonitoring) {
        this.frameId = requestAnimationFrame(measureFPS);
      }
    };

    this.frameId = requestAnimationFrame(measureFPS);
    console.log('🎬 [FPS Monitor] 已启动帧率监控');
  }

  static stopFPSMonitoring() {
    this.isMonitoring = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    console.log('🎬 [FPS Monitor] 已停止帧率监控');
  }

  static monitorViewportRender() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' && entry.name.includes('viewport-render')) {
          if (entry.duration > 16) {
            console.warn(
              `⚠️ [Viewport] ${entry.name} 渲染耗时过长: ${entry.duration.toFixed(2)}ms (目标: <16ms)`
            );
          }
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });
    console.log('📐 [Viewport Monitor] 已启动视口渲染监控');

    return () => observer.disconnect();
  }

  static reportFPS() {
    if (this.frameTimestamps.length === 0) {
      console.log('📊 [FPS Report] 请先启动 FPS 监控: EdgelessPerformanceMonitor.startFPSMonitoring()');
      return;
    }

    const now = performance.now();
    const cutoff = now - 1000;
    const recentFrames = this.frameTimestamps.filter(t => t > cutoff);
    const fps = recentFrames.length;

    console.group('📊 [FPS Report] 帧率分析');
    console.log(`当前 FPS: ${fps}`);
    console.log(`状态: ${fps >= 55 ? '✅ 流畅' : fps >= 30 ? '⚠️ 一般' : '❌ 卡顿'}`);
    console.groupEnd();
  }
}

if (typeof window !== 'undefined') {
  (window as any).__edgelessPerformanceMonitor = EdgelessPerformanceMonitor;
}
