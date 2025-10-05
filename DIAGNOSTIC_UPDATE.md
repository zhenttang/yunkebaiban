# 添加内容卡顿问题 - 诊断代码已部署

## 🔍 新增的诊断功能

### 1. updateLayers 调用计数
会在控制台显示 `updateLayers` 被调用了多少次，如果超过10次会警告。

### 2. refreshLayerViewport 性能监控
每次调用都会记录耗时，超过10ms会警告。

### 3. 支持序列化性能指标
可以追踪同一函数的多次调用（如 `updateLayers-1`, `updateLayers-2`...）

## 📊 请执行以下测试

```javascript
// 1. 启动FPS监控
window.__edgelessPerformanceMonitor.startFPSMonitoring()

// 2. 清空之前的数据
window.__performanceMonitor.clear()

// 3. 在白板添加一个元素（文本/图形/便签）

// 4. 等待3秒

// 5. 查看报告
window.__performanceMonitor.report()
window.__edgelessPerformanceMonitor.reportFPS()
```

## 🎯 重点关注的输出

在控制台查找：

1. **"updateLayers 调用过于频繁"** - 说明图层更新过多
2. **"refreshLayerViewport 耗时过长"** - 说明背景刷新慢
3. **FPS的具体数值和变化模式** - 确认是否还是1→49的模式

## 🔧 根据输出的优化方向

### 如果看到 "updateLayers 调用过于频繁"
说明添加内容时触发了过多的图层更新，需要批量合并。

### 如果看到 "refreshLayerViewport 耗时过长"
说明背景网格刷新过慢，需要优化CSS操作。

### 如果FPS仍然从1开始
说明主线程被同步操作阻塞，需要使用 Chrome DevTools Performance 深入分析。

请测试后将完整的控制台输出发给我！
