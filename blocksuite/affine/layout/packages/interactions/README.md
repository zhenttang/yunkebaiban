# 动画系统使用指南

## 概述

这个动画系统为BlockSuite列布局功能提供了完整的动画解决方案，包括布局切换、Block移动、列宽调整等各种动画效果。

## 基础使用

### 1. 创建动画管理器

```typescript
import { createAnimationManager, AnimationConfig } from '@blocksuite/affine-layout-interactions';

// 使用默认配置
const animationManager = createAnimationManager();

// 使用自定义配置
const config: Partial<AnimationConfig> = {
  enableAnimations: true,
  defaultDuration: 300,
  quality: 'high',
  reducedMotion: false
};

const animationManager = createAnimationManager(config);
```

### 2. 布局切换动画

```typescript
import { PageLayoutMode } from '@blocksuite/affine-layout-interactions';

// 从单列切换到三列布局
await animationManager.animateLayoutTransition(
  PageLayoutMode.Normal,
  PageLayoutMode.ThreeColumn
);
```

### 3. Block移动动画

```typescript
const blockElement = document.querySelector('.block-item') as HTMLElement;

// 将Block从第1列移动到第3列
await animationManager.animateBlockMovement(blockElement, 0, 2);
```

### 4. 列宽调整动画

```typescript
// 调整第2列宽度为400px
await animationManager.animateColumnResize(1, 400);
```

## 高级功能

### 1. 粒子效果

```typescript
const element = document.querySelector('.layout-container') as HTMLElement;

// 展开效果
await animationManager.createParticleEffect(element, 'expand');

// 收缩效果
await animationManager.createParticleEffect(element, 'collapse');

// 变换效果
await animationManager.createParticleEffect(element, 'transform');
```

### 2. 弹性动画

```typescript
const button = document.querySelector('.column-switch-btn') as HTMLElement;

// 创建弹性点击效果
const animation = animationManager.createElasticAnimation(button, {
  scale: 1.2,
  duration: 600,
  elasticity: 0.8
});
```

### 3. 3D翻转动画

```typescript
const card = document.querySelector('.layout-card') as HTMLElement;

// Y轴翻转180度
const animation = animationManager.create3DFlipAnimation(card, 'y', 180);

// X轴翻转90度
const animation = animationManager.create3DFlipAnimation(card, 'x', 90);
```

### 4. 磁性吸附效果

```typescript
const draggableBlock = document.querySelector('.draggable-block') as HTMLElement;

// 吸附到指定位置
await animationManager.createMagneticEffect(draggableBlock, 300, 200);
```

## 专门动画器的高级使用

### Block移动动画器

```typescript
const blockAnimator = animationManager.getBlockMovementAnimator();

// 使用磁性移动效果
const advancedAnimator = new AdvancedBlockMovementAnimator();
await advancedAnimator.executeMagneticMovement(blockElement, 0, 2);

// 检查是否有移动动画正在进行
if (blockAnimator.hasActiveMovements()) {
  // 取消所有移动动画
  blockAnimator.cancelAllMovements();
}
```

### 列宽调整动画器

```typescript
const resizeAnimator = animationManager.getColumnResizeAnimator();

// 创建实时调整预览
const preview = resizeAnimator.createLiveResizePreview(1, (width) => {
  console.log('预览宽度:', width);
});

// 开始预览
preview.startPreview();

// 更新预览
preview.updatePreview(350);

// 结束预览
preview.endPreview();

// 获取智能宽度建议
const suggestion = resizeAnimator.suggestOptimalWidth(1, 280);
console.log(\`建议宽度: \${suggestion.suggested}px，原因: \${suggestion.reason}\`);
```

## 配置选项

### 动画配置

```typescript
interface AnimationConfig {
  enableAnimations: boolean;        // 是否启用动画
  defaultDuration: number;          // 默认持续时间（毫秒）
  defaultEasing: string;           // 默认缓动函数
  reducedMotion: boolean;          // 减弱动画模式
  quality: 'low' | 'medium' | 'high'; // 动画质量
  maxConcurrentAnimations: number;  // 最大并发动画数
}
```

### 预设配置

```typescript
import { ANIMATION_PRESETS, DURATION, EASING_FUNCTIONS } from '@blocksuite/affine-layout-interactions';

// 使用预设持续时间
const duration = DURATION.fast; // 150ms

// 使用预设缓动函数
const easing = EASING_FUNCTIONS.easeOutBack;

// 使用预设动画配置
const preset = ANIMATION_PRESETS.bounce;
```

## 事件监听

```typescript
// 监听动画事件
animationManager.addEventListener('start', (event) => {
  console.log('动画开始:', event.animationId);
});

animationManager.addEventListener('complete', (event) => {
  console.log('动画完成:', event.animationId);
});

animationManager.addEventListener('cancel', (event) => {
  console.log('动画取消:', event.animationId);
});
```

## 性能优化

### 1. 自动性能调整

```typescript
// 系统会自动监控性能并调整质量
// 当并发动画过多时，会自动降低质量设置
```

### 2. 减弱动画支持

```typescript
// 系统会自动检测用户的减弱动画偏好
// 可以手动检查
import { AnimationUtils } from '@blocksuite/affine-layout-interactions';

if (AnimationUtils.prefersReducedMotion()) {
  // 用户偏好减弱动画，可以禁用或简化动画
  animationManager.setAnimationConfig({
    ...currentConfig,
    enableAnimations: false
  });
}
```

### 3. 性能监控

```typescript
import { PerformanceMonitor } from '@blocksuite/affine-layout-interactions';

const monitor = new PerformanceMonitor((fps) => {
  console.log('当前FPS:', fps);
  
  if (fps < 30) {
    // FPS过低，降低动画质量
    animationManager.setAnimationConfig({
      ...currentConfig,
      quality: 'low'
    });
  }
});
```

## 最佳实践

### 1. 资源清理

```typescript
// 在组件销毁时清理动画资源
class LayoutComponent {
  private animationManager: AnimationManager;
  
  constructor() {
    this.animationManager = createAnimationManager();
  }
  
  dispose() {
    // 清理所有动画资源
    this.animationManager.cleanup();
  }
}
```

### 2. 动画队列管理

```typescript
// 避免同时触发过多动画
if (!animationManager.isAnimating()) {
  await animationManager.animateLayoutTransition(from, to);
}
```

### 3. 错误处理

```typescript
try {
  await animationManager.animateBlockMovement(block, fromCol, toCol);
} catch (error) {
  console.error('Block移动动画失败:', error);
  // 提供降级方案
  block.style.transform = \`translateX(\${targetX}px)\`;
}
```

## API参考

详细的API文档请参考各个模块的TypeScript类型定义和注释。主要包括：

- `AnimationManager` - 核心动画管理器
- `LayoutTransitionAnimator` - 布局切换动画器
- `BlockMovementAnimator` - Block移动动画器
- `ColumnResizeAnimator` - 列宽调整动画器
- `AdvancedEffectsManager` - 高级效果管理器

所有动画器都支持取消、暂停、恢复等操作，并提供了丰富的配置选项和事件监听功能。