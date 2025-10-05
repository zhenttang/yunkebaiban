# 无限白板实时性能监控已添加

## 🎯 针对"添加内容卡顿"问题的优化

### 问题分析
从你的反馈"往白板上加内容的时候感觉帧率卡卡的"，我添加了以下优化：

## 1. 新增实时 FPS 监控 ⭐

**文件**: `packages/frontend/core/src/blocksuite/utils/edgeless-performance-monitor.ts`

**使用方法**（浏览器控制台）:
```javascript
// 开始监控帧率
window.__edgelessPerformanceMonitor.startFPSMonitoring()

// 在白板上添加内容、拖拽、绘制...

// 查看当前 FPS
window.__edgelessPerformanceMonitor.reportFPS()

// 停止监控
window.__edgelessPerformanceMonitor.stopFPSMonitoring()
```

**自动告警**:
- FPS < 30: ❌ 卡顿警告
- FPS < 50: ⚡ 性能提示
- FPS ≥ 55: ✅ 流畅

## 2. 增强渲染性能监控

**文件**: `blocksuite/affine/blocks/root/src/edgeless/edgeless-root-block.ts`

**新增监控点**:
- `edgeless-renderBlock`: 白板主渲染方法（阈值: 16ms）
- `viewport-getModels`: 视口模型查询（阈值: 5ms）

这些指标会在你**添加内容时**实时触发，能准确定位卡顿位置。

## 3. 性能优化

**并发渲染数量**: 从 6 提升到 8
```typescript
.maxConcurrentRenders=${8}  // 原来是 6
```

这可以提高复杂场景下的渲染并发度，减少排队等待时间。

## 4. 完整测试流程

### Step 1: 启动 FPS 监控
```javascript
window.__edgelessPerformanceMonitor.startFPSMonitoring()
```

### Step 2: 在白板上操作
- 添加文本
- 绘制图形
- 拖拽元素
- 缩放画布

### Step 3: 观察控制台输出

**正常情况** ✅:
```
✅ [Performance] edgeless-renderBlock: 8.30ms
✅ [Performance] viewport-getModels: 2.10ms
```

**性能问题** ⚠️:
```
⚠️ [FPS] 帧率过低: 28 FPS (目标: 60 FPS)
⚠️ [Performance] edgeless-renderBlock 耗时过长: 25.40ms (阈值: 16ms)
⚠️ [Performance] viewport-getModels 耗时过长: 8.50ms (阈值: 5ms)
```

### Step 4: 查看详细报告
```javascript
// 查看 FPS 状态
window.__edgelessPerformanceMonitor.reportFPS()

// 查看所有性能数据
window.__performanceMonitor.report()
```

## 5. 可能的卡顿原因及解决方案

### 问题 1: viewport-getModels 耗时长
**原因**: 视口内元素过多，查询慢
**解决方案**:
- 减少同时显示的元素数量
- 考虑分层渲染
- 优化空间索引（gfx.grid）

### 问题 2: edgeless-renderBlock 耗时长
**原因**: 渲染管线过载
**解决方案**:
- 检查是否有复杂的 SVG/Canvas 元素
- 考虑虚拟化渲染
- 可能需要进一步提高 maxConcurrentRenders

### 问题 3: FPS 持续 < 30
**原因**: 主线程被阻塞
**解决方案**:
- 检查 JavaScript 执行时间
- 使用 Chrome DevTools Performance Profiler
- 可能需要将部分计算移到 Web Worker

## 6. 下一步诊断

请按照上述测试流程操作，并将控制台输出反馈给我，特别关注：

1. **FPS 数值** - 是否低于 30？
2. **哪个指标超时** - `edgeless-renderBlock` 还是 `viewport-getModels`？
3. **什么操作触发卡顿** - 添加元素？拖拽？缩放？

有了这些数据，我可以提供更精准的优化方案。

## 7. 快速命令参考

```javascript
// 完整监控套装
window.__edgelessPerformanceMonitor.startFPSMonitoring()

// 10秒后查看报告
setTimeout(() => {
  window.__edgelessPerformanceMonitor.reportFPS()
  window.__performanceMonitor.report()
}, 10000)
```
