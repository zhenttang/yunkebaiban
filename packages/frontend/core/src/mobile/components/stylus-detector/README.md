# 触控笔检测器 (Stylus Detector)

## 功能说明

这是一个用于检测和识别触控笔输入的组件，支持：

- ✅ **iPad Apple Pencil** (第1代、第2代)
- ✅ **安卓触控笔** 
  - 小米触控笔
  - 三星 S Pen
  - 华为 M-Pencil
  - 其他支持 Pointer Events 的触控笔
- ✅ **实时压感检测** (0.0 - 1.0)
- ✅ **倾斜角度检测** (tiltX, tiltY)
- ✅ **设备类型识别** (手指/触控笔/鼠标)

## 技术原理

使用 **Pointer Events API** 来检测输入设备：

```typescript
// 监听指针事件
document.addEventListener('pointerdown', (e: PointerEvent) => {
  if (e.pointerType === 'pen') {
    // 这是触控笔
    console.log('压感:', e.pressure);
    console.log('倾斜:', e.tiltX, e.tiltY);
  }
});
```

## 检测属性

| 属性 | 说明 | 值范围 |
|------|------|--------|
| `pointerType` | 设备类型 | 'pen', 'touch', 'mouse' |
| `pressure` | 压感值 | 0.0 - 1.0 |
| `tiltX` | X轴倾斜角度 | -90° - 90° |
| `tiltY` | Y轴倾斜角度 | -90° - 90° |

## 使用方法

### 方式1: 直接使用组件

```tsx
import { StylusDetector } from '@yunke/core/mobile/components';

function App() {
  return <StylusDetector />;
}
```

### 方式2: 自定义实现

```tsx
import { useEffect, useState } from 'react';

function useStylusDetector() {
  const [isStylus, setIsStylus] = useState(false);
  
  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      setIsStylus(e.pointerType === 'pen');
    };
    
    document.addEventListener('pointerdown', handlePointer);
    return () => document.removeEventListener('pointerdown', handlePointer);
  }, []);
  
  return isStylus;
}
```

## 测试方法

1. 在支持触控笔的设备上打开应用
2. 检测器会自动弹出
3. 用手指触摸屏幕 → 显示"手指触摸"
4. 用触控笔触摸屏幕 → 显示对应的触控笔类型

## 支持的设备

### iOS/iPadOS
- iPad Pro (所有型号) + Apple Pencil
- iPad Air (第3代及以上) + Apple Pencil
- iPad (第6代及以上) + Apple Pencil
- iPad mini (第5代及以上) + Apple Pencil

### Android
- 小米平板系列 + 小米触控笔
- 三星 Galaxy Tab 系列 + S Pen
- 华为 MatePad 系列 + M-Pencil
- 其他支持 USI 标准的触控笔

## 注意事项

1. **浏览器兼容性**: 需要支持 Pointer Events API
   - Chrome/Edge: ✅ 完全支持
   - Safari: ✅ 完全支持
   - Firefox: ✅ 完全支持

2. **权限要求**: 无需特殊权限

3. **性能影响**: 极小，仅监听指针事件

## 临时测试

当前检测器已临时添加到 workspace layout 中，如需移除：

```tsx
// 在 mobile/pages/workspace/layout.tsx 中注释掉：
// <StylusDetector />
```

