# 画笔粗细选择器视觉化改进方案

**创建日期**: 2025-01-09  
**最后更新**: 2025-01-09  
**状态**: 设计分析阶段

## 目录

1. [需求分析](#需求分析)
2. [当前实现分析](#当前实现分析)
3. [改进方案](#改进方案)
4. [技术实现要点](#技术实现要点)
5. [UI 设计细节](#ui-设计细节)
6. [实施计划](#实施计划)

---

## 需求分析

### 用户需求

**当前问题**:
- 画笔粗细选择器上的所有点大小都一样
- 用户无法直观地看到每个档位对应的实际粗细效果
- 需要点击/选择后才能看到效果

**期望效果**:
- 每个点的大小应该根据其代表的粗细值而不同
- 点的大小直接反映画笔的粗细程度
- 用户可以一目了然地看到每个档位的视觉效果
- 类似"阶梯"一样，从小到大递增

### 视觉参考

根据用户提供的图片描述：
- 一条水平线上有多个点（通常5个）
- 当前选中的点更大、更深色
- 每个点代表不同的画笔粗细

**改进后应该**:
- 每个点的大小 = 其代表的画笔粗细值
- 点的排列呈现"阶梯"效果，从小到大递增
- 当前选中的点高亮显示（颜色更深、可能有边框）

---

## 当前实现分析

### 可能的实现位置

画笔粗细选择器可能出现在以下场景：
1. **绘图工具工具栏** - 绘图/画笔工具的属性面板
2. **标注工具** - 高亮、标记工具的粗细选择
3. **形状工具** - 绘制形状时的边框粗细选择
4. **主题编辑器** - 如果用于调整某些元素的粗细

### 典型的当前实现

```typescript
// 典型的实现方式（所有点大小相同）
const StrokeWidthSelector = ({ value, onChange }) => {
  const sizes = [1, 2, 4, 6, 8]; // 粗细值
  
  return (
    <div className={styles.selector}>
      {sizes.map(size => (
        <div
          key={size}
          className={styles.dot}
          data-active={value === size}
          onClick={() => onChange(size)}
        />
      ))}
    </div>
  );
};
```

```css
/* 当前样式 - 所有点大小相同 */
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: gray;
}

.dot[data-active="true"] {
  background: black;
  width: 10px;
  height: 10px;
}
```

### 问题分析

1. **视觉问题**: 所有点大小相同，无法直观看出粗细差异
2. **用户体验**: 需要试错才能找到合适的粗细
3. **信息传达**: 无法快速理解每个档位的实际效果

---

## 改进方案

### 方案一：点大小直接映射粗细值（推荐）⭐⭐

#### 设计思路

每个点的大小 = 其代表的画笔粗细值（或按比例缩放）

#### 实现方式

```typescript
const StrokeWidthSelector = ({ value, onChange }) => {
  const sizes = [1, 2, 4, 6, 8]; // 粗细值（像素）
  
  return (
    <div className={styles.selector}>
      {sizes.map(size => (
        <div
          key={size}
          className={styles.dot}
          data-active={value === size}
          data-size={size}
          style={{
            width: `${size * 2}px`,  // 点的大小 = 粗细值 × 2
            height: `${size * 2}px`,
          }}
          onClick={() => onChange(size)}
        />
      ))}
    </div>
  );
};
```

#### 视觉效果

```
   1px   2px   4px   6px   8px
    •     ••    ••••  ••••••  ••••••••
    (小)  (中)  (大)  (很大)  (超大)
```

#### 优点

- ✅ 最直观，点的大小直接反映粗细
- ✅ 用户一眼就能看出区别
- ✅ 实现简单

#### 缺点

- ⚠️ 如果粗细值差距很大，点的尺寸可能差异过大
- ⚠️ 需要适当的缩放比例

---

### 方案二：比例缩放 + 视觉优化

#### 设计思路

点的大小按比例缩放，但添加最小/最大限制，确保视觉平衡

#### 实现方式

```typescript
const StrokeWidthSelector = ({ value, onChange }) => {
  const sizes = [1, 2, 4, 6, 8];
  const minDotSize = 4;  // 最小点大小
  const maxDotSize = 16; // 最大点大小
  const scale = 1.5;     // 缩放比例
  
  const getDotSize = (strokeWidth: number) => {
    const size = strokeWidth * scale;
    return Math.max(minDotSize, Math.min(maxDotSize, size));
  };
  
  return (
    <div className={styles.selector}>
      {sizes.map(size => (
        <div
          key={size}
          className={styles.dot}
          data-active={value === size}
          style={{
            width: `${getDotSize(size)}px`,
            height: `${getDotSize(size)}px`,
          }}
          onClick={() => onChange(size)}
        />
      ))}
    </div>
  );
};
```

#### 优点

- ✅ 视觉平衡，不会太大或太小
- ✅ 仍然能看出差异
- ✅ 可自定义缩放比例

#### 缺点

- ⚠️ 需要调整缩放参数
- ⚠️ 可能不如方案一直观

---

### 方案三：显示实际画笔效果（最佳体验）⭐⭐⭐

#### 设计思路

不仅点的大小不同，还显示实际的画笔描边效果

#### 实现方式

```typescript
const StrokeWidthSelector = ({ value, onChange }) => {
  const sizes = [1, 2, 4, 6, 8];
  
  return (
    <div className={styles.selector}>
      {sizes.map(size => (
        <div
          key={size}
          className={styles.dot}
          data-active={value === size}
          onClick={() => onChange(size)}
        >
          {/* 显示实际的画笔描边效果 */}
          <div 
            className={styles.strokePreview}
            style={{
              width: `${size * 3}px`,
              height: `${size * 3}px`,
              borderWidth: `${size}px`,
            }}
          />
        </div>
      ))}
    </div>
  );
};
```

#### 视觉效果

```
   1px     2px     4px     6px     8px
   ─       ──      ────    ──────  ────────
   (细线)  (中线)  (粗线)  (很粗)  (超粗)
```

#### 优点

- ✅ 最直观，显示实际效果
- ✅ 用户可以看到真实的画笔粗细
- ✅ 体验最佳

#### 缺点

- ⚠️ 实现稍复杂
- ⚠️ 需要更多UI空间

---

## 技术实现要点

### 1. 基础实现

#### TypeScript 组件

```typescript
import { useCallback } from 'react';
import * as styles from './stroke-width-selector.css';

interface StrokeWidthSelectorProps {
  value: number;
  onChange: (width: number) => void;
  sizes?: number[]; // 可选的粗细值列表
}

export const StrokeWidthSelector = ({
  value,
  onChange,
  sizes = [1, 2, 4, 6, 8],
}: StrokeWidthSelectorProps) => {
  const handleClick = useCallback(
    (size: number) => {
      onChange(size);
    },
    [onChange]
  );

  return (
    <div className={styles.container}>
      {sizes.map(size => {
        const dotSize = size * 2; // 缩放比例
        const isActive = value === size;
        
        return (
          <button
            key={size}
            type="button"
            className={styles.dot}
            data-active={isActive}
            data-size={size}
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
            }}
            onClick={() => handleClick(size)}
            aria-label={`画笔粗细 ${size}px`}
            aria-pressed={isActive}
          />
        );
      })}
    </div>
  );
};
```

### 2. CSS 样式

#### 基础样式

```typescript
// stroke-width-selector.css.ts
import { cssVar } from '@toeverything/theme';
import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
});

export const dot = style({
  flexShrink: 0,
  borderRadius: '50%',
  border: `2px solid ${cssVar('borderColor')}`,
  backgroundColor: cssVar('iconColor'),
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  padding: 0,
  minWidth: 0,
  minHeight: 0,
  
  selectors: {
    '&:hover': {
      transform: 'scale(1.1)',
      borderColor: cssVar('brandColor'),
    },
    '&[data-active="true"]': {
      backgroundColor: cssVar('brandColor'),
      borderColor: cssVar('brandColor'),
      boxShadow: `0 0 0 2px ${cssVar('brandColor')}20`,
    },
  },
});
```

#### 进阶样式（显示实际描边效果）

```typescript
export const dot = style({
  // ... 基础样式
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
});

export const strokePreview = style({
  width: '100%',
  height: '2px', // 固定高度，宽度根据粗细值变化
  backgroundColor: 'currentColor',
  borderRadius: 1,
});
```

### 3. 响应式处理

```typescript
// 根据容器大小自适应缩放
const getScaledSize = (baseSize: number, containerWidth: number) => {
  const maxContainerWidth = 200; // 参考宽度
  const scale = Math.min(1, containerWidth / maxContainerWidth);
  return baseSize * scale;
};
```

### 4. 无障碍支持

```typescript
// 添加键盘支持
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent, size: number, index: number) => {
    if (e.key === 'ArrowLeft' && index > 0) {
      onChange(sizes[index - 1]);
    } else if (e.key === 'ArrowRight' && index < sizes.length - 1) {
      onChange(sizes[index + 1]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      onChange(size);
    }
  },
  [onChange, sizes]
);
```

---

## UI 设计细节

### 设计规格

#### 点的大小计算

```
粗细值 (px)  →  点大小 (px)  →  视觉效果
─────────────────────────────────────────
1            →  4-6          →  小点
2            →  8-10         →  中点
4            →  12-14        →  大点
6            →  16-18        →  很大点
8            →  20-24        →  超大点
```

#### 布局设计

```
┌─────────────────────────────────────┐
│  画笔粗细                            │
│  ─────────────────────────────────  │
│   •    ••    ••••   ••••••  ••••••••│
│   1px  2px   4px    6px     8px    │
│  (选中时高亮显示)                     │
└─────────────────────────────────────┘
```

#### 视觉层次

1. **未选中状态**:
   - 点的大小 = 粗细值 × 缩放比例
   - 颜色: 灰色 (#999)
   - 边框: 浅灰色

2. **悬停状态**:
   - 轻微放大 (scale 1.1)
   - 边框颜色变为品牌色
   - 显示工具提示（如"4px"）

3. **选中状态**:
   - 颜色: 品牌色或黑色
   - 边框: 品牌色，带阴影
   - 可能显示"✓"标记

### 间距和排列

```typescript
// 点之间的间距应该根据点的大小动态调整
const getGap = (dotSize: number) => {
  return Math.max(4, dotSize * 0.3); // 至少4px，或点大小的30%
};

// 垂直对齐
export const container = style({
  display: 'flex',
  alignItems: 'center', // 底部对齐，让大小不同的点底部对齐
  justifyContent: 'center',
  gap: 'var(--gap, 8px)',
});
```

### 动画效果

```typescript
export const dot = style({
  // ... 其他样式
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  selectors: {
    '&[data-active="true"]': {
      animation: `${pulse} 0.3s ease-out`,
    },
  },
});

const pulse = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.15)' },
  '100%': { transform: 'scale(1)' },
});
```

---

## 实施计划

### 第一阶段：基础实现（预计 0.5 天）

**目标**: 实现点大小根据粗细值变化

**任务清单**:

- [ ] **Step 1: 修改组件逻辑**
  - [ ] 添加点大小计算逻辑
  - [ ] 根据粗细值动态设置点的大小
  - [ ] 测试不同粗细值的显示效果

- [ ] **Step 2: 样式调整**
  - [ ] 修改 CSS，移除固定大小
  - [ ] 添加动态样式支持
  - [ ] 优化视觉效果

- [ ] **Step 3: 对齐优化**
  - [ ] 确保所有点底部对齐
  - [ ] 调整间距
  - [ ] 测试布局

**验收标准**:
- ✅ 每个点的大小正确反映其粗细值
- ✅ 点的大小呈现"阶梯"效果
- ✅ 布局美观，对齐正确

---

### 第二阶段：视觉增强（预计 0.5 天）

**目标**: 添加更好的视觉反馈和交互效果

**任务清单**:

- [ ] **Step 1: 交互效果**
  - [ ] 添加悬停效果
  - [ ] 添加选中状态高亮
  - [ ] 添加过渡动画

- [ ] **Step 2: 工具提示**
  - [ ] 悬停时显示粗细值
  - [ ] 显示实际效果预览（可选）

- [ ] **Step 3: 无障碍支持**
  - [ ] 添加键盘导航
  - [ ] 添加 ARIA 标签
  - [ ] 测试无障碍功能

**验收标准**:
- ✅ 交互流畅，视觉反馈清晰
- ✅ 用户能清楚看到每个档位的效果
- ✅ 无障碍功能正常

---

### 第三阶段：优化和测试（预计 0.5 天）

**目标**: 性能优化和用户体验完善

**任务清单**:

- [ ] **Step 1: 性能优化**
  - [ ] 优化重渲染
  - [ ] 优化动画性能
  - [ ] 测试不同设备性能

- [ ] **Step 2: 边界情况**
  - [ ] 处理极端粗细值
  - [ ] 处理自定义粗细值列表
  - [ ] 测试响应式布局

- [ ] **Step 3: 测试**
  - [ ] 端到端测试
  - [ ] 不同浏览器兼容性
  - [ ] 用户体验测试

**验收标准**:
- ✅ 性能满足要求
- ✅ 所有边界情况处理正确
- ✅ 用户体验良好

---

## 代码示例

### 完整组件实现

```typescript
import { useCallback, useMemo } from 'react';
import * as styles from './stroke-width-selector.css';

interface StrokeWidthSelectorProps {
  value: number;
  onChange: (width: number) => void;
  sizes?: number[];
  scale?: number; // 缩放比例，默认2
  minDotSize?: number; // 最小点大小，默认4
  maxDotSize?: number; // 最大点大小，默认24
}

export const StrokeWidthSelector = ({
  value,
  onChange,
  sizes = [1, 2, 4, 6, 8],
  scale = 2,
  minDotSize = 4,
  maxDotSize = 24,
}: StrokeWidthSelectorProps) => {
  const handleClick = useCallback(
    (size: number) => {
      onChange(size);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, size: number, index: number) => {
      if (e.key === 'ArrowLeft' && index > 0) {
        onChange(sizes[index - 1]);
      } else if (e.key === 'ArrowRight' && index < sizes.length - 1) {
        onChange(sizes[index + 1]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        onChange(size);
      }
    },
    [onChange, sizes]
  );

  const getDotSize = useCallback(
    (strokeWidth: number) => {
      const size = strokeWidth * scale;
      return Math.max(minDotSize, Math.min(maxDotSize, size));
    },
    [scale, minDotSize, maxDotSize]
  );

  return (
    <div className={styles.container} role="group" aria-label="画笔粗细选择">
      {sizes.map((size, index) => {
        const dotSize = getDotSize(size);
        const isActive = value === size;
        
        return (
          <button
            key={size}
            type="button"
            className={styles.dot}
            data-active={isActive}
            data-size={size}
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
            }}
            onClick={() => handleClick(size)}
            onKeyDown={e => handleKeyDown(e, size, index)}
            aria-label={`画笔粗细 ${size}px`}
            aria-pressed={isActive}
            title={`${size}px`}
          />
        );
      })}
    </div>
  );
};
```

### CSS 样式

```typescript
// stroke-width-selector.css.ts
import { cssVar } from '@toeverything/theme';
import { keyframes, style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  alignItems: 'flex-end', // 底部对齐，让大小不同的点底部对齐
  justifyContent: 'center',
  gap: 8,
  padding: '8px 4px',
});

const pulse = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.15)' },
  '100%': { transform: 'scale(1)' },
});

export const dot = style({
  flexShrink: 0,
  borderRadius: '50%',
  border: `2px solid ${cssVar('borderColor')}`,
  backgroundColor: cssVar('iconColor') || '#666',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  padding: 0,
  minWidth: 0,
  minHeight: 0,
  position: 'relative',
  
  selectors: {
    '&:hover': {
      transform: 'scale(1.1)',
      borderColor: cssVar('brandColor'),
      zIndex: 1,
    },
    '&:focus': {
      outline: `2px solid ${cssVar('brandColor')}`,
      outlineOffset: 2,
    },
    '&[data-active="true"]': {
      backgroundColor: cssVar('brandColor') || '#000',
      borderColor: cssVar('brandColor') || '#000',
      boxShadow: `0 0 0 2px ${cssVar('brandColor')}20`,
      animation: `${pulse} 0.3s ease-out`,
    },
  },
});

// 可选：显示实际描边效果
export const strokePreview = style({
  width: '100%',
  height: 2,
  backgroundColor: 'currentColor',
  borderRadius: 1,
  position: 'absolute',
  bottom: '50%',
  left: 0,
  transform: 'translateY(50%)',
});
```

---

## 设计变体

### 变体一：水平线连接

```
   •────•────•────•────•
   1px  2px  4px  6px  8px
```

### 变体二：垂直排列

```
   •
   ••
   ••••
   ••••••
   ••••••••
```

### 变体三：显示数值标签

```
   • 1px    •• 2px    •••• 4px    •••••• 6px    •••••••• 8px
```

---

## 参考设计

### 类似实现

1. **Adobe Photoshop 画笔大小选择器**
   - 点的大小直接反映画笔大小
   - 清晰的可视化效果

2. **Figma 描边宽度选择器**
   - 显示实际的描边效果
   - 点的大小不同

3. **Procreate 画笔大小滑块**
   - 视觉化的粗细指示
   - 清晰的档位区分

---

## 更新日志

- **2025-01-09**: 创建文档，完成设计分析

---

## 备注

- 缩放比例和点的大小范围可以根据实际使用情况调整
- 建议先实现基础版本，然后根据用户反馈优化
- 确保在不同主题下都有良好的视觉效果
- 考虑移动端的触摸体验

