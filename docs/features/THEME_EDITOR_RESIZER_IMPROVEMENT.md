# 主题编辑器侧边栏调整大小功能改进方案

**创建日期**: 2025-01-09  
**最后更新**: 2025-01-09  
**状态**: 设计分析阶段

## 目录

1. [当前实现分析](#当前实现分析)
2. [问题分析](#问题分析)
3. [改进方案](#改进方案)
4. [技术实现要点](#技术实现要点)
5. [UI 设计建议](#ui-设计建议)
6. [实施计划](#实施计划)

---

## 当前实现分析

### 1. 代码位置

**文件**: `packages/frontend/core/src/desktop/pages/theme-editor/theme-editor.tsx`

**关键代码**:

```typescript
// 常量定义
const SIDEBAR_WIDTH_KEY = 'theme-editor-sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;

// 拖拽处理逻辑（第90-97行）
const handleMouseMove = (moveEvent: MouseEvent) => {
  if (!isDraggingRef.current || !sidebarRef.current) return;
  
  const newWidth = moveEvent.clientX;  // 连续值
  const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
  setSidebarWidth(clampedWidth);
  localStorage.setItem(SIDEBAR_WIDTH_KEY, clampedWidth.toString());
};
```

### 2. 当前行为

- **调整方式**: 连续拖拽调整
- **值范围**: 200px - 600px（连续值）
- **步长**: 无步长限制，可以是任意像素值
- **视觉效果**: 平滑连续变化
- **交互体验**: 拖拽时实时响应，无明显的"卡顿"或"吸附"效果

### 3. 存储方式

- 使用 `localStorage` 存储宽度值
- 保存的是精确的像素值（如 `345px`）

---

## 问题分析

### 当前问题

1. **缺乏分级感**
   - 当前实现是连续调整，用户无法感知到明确的"档位"
   - 调整时没有明确的"阶梯"感，可能难以精确控制

2. **大小敏感度不足**
   - 拖拽时响应过于平滑，缺乏明显的反馈
   - 用户可能希望有明确的几个档位，每个档位代表不同的侧边栏宽度

3. **用户体验**
   - 连续调整可能导致用户难以找到"合适"的宽度
   - 缺乏视觉反馈，用户不知道当前处于哪个"档位"

### 用户需求

根据用户描述"调整大小的部分改成一个阶梯一样的感觉 就是大小敏感一点"，可以理解为：

1. **阶梯式调整**: 将连续的值改为离散的、分级的选项
2. **更敏感**: 调整步长更精细，或者有明显的档次区分
3. **视觉反馈**: 用户可以清楚地看到当前处于哪个"阶梯"

---

## 改进方案

### 方案一：离散步长调整（推荐）⭐

#### 设计思路

将连续的宽度值改为基于步长的离散值，类似于"阶梯"效果。

#### 实现方式

```typescript
// 定义阶梯档位
const WIDTH_STEPS = [200, 240, 280, 320, 360, 400, 450, 500, 550, 600];

// 或者使用步长方式
const STEP_SIZE = 20; // 每20px一个阶梯
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;

// 计算最近的阶梯值
const snapToStep = (width: number): number => {
  const step = Math.round((width - MIN_SIDEBAR_WIDTH) / STEP_SIZE);
  const snappedWidth = MIN_SIDEBAR_WIDTH + step * STEP_SIZE;
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, snappedWidth));
};
```

#### 优点

- ✅ 实现简单，改动最小
- ✅ 提供明确的"阶梯"感
- ✅ 拖拽时有"吸附"效果，用户体验好
- ✅ 易于理解和控制

#### 缺点

- ⚠️ 步长固定，可能不够灵活
- ⚠️ 需要选择合适的步长值

---

### 方案二：预设档位选择器

#### 设计思路

提供几个预设的宽度档位，用户可以快速选择，类似图片中的笔触粗细选择器。

#### 实现方式

```typescript
// 预设档位
const PRESET_WIDTHS = [
  { label: '紧凑', value: 200 },
  { label: '标准', value: 240 },
  { label: '舒适', value: 320 },
  { label: '宽敞', value: 400 },
  { label: '超宽', value: 600 },
];

// UI 组件
<WidthSelector>
  {PRESET_WIDTHS.map(preset => (
    <WidthOption 
      key={preset.value}
      active={sidebarWidth === preset.value}
      onClick={() => setSidebarWidth(preset.value)}
    >
      {preset.label}
    </WidthOption>
  ))}
</WidthSelector>
```

#### 优点

- ✅ 用户一目了然，选择明确
- ✅ 不需要拖拽，点击即可
- ✅ 提供有意义的标签（如"紧凑"、"标准"）

#### 缺点

- ❌ 失去了拖拽调整的灵活性
- ❌ 需要额外的 UI 空间

---

### 方案三：混合方案（最佳体验）⭐⭐

#### 设计思路

结合拖拽和预设档位，提供最佳的交互体验。

#### 实现方式

1. **拖拽时吸附到最近的阶梯**
   ```typescript
   const handleMouseMove = (moveEvent: MouseEvent) => {
     if (!isDraggingRef.current || !sidebarRef.current) return;
     
     const rawWidth = moveEvent.clientX;
     const snappedWidth = snapToStep(rawWidth); // 吸附到最近的阶梯
     setSidebarWidth(snappedWidth);
   };
   ```

2. **视觉指示器显示当前档位**
   - 在拖拽手柄附近显示当前档位指示
   - 或者在侧边栏边缘显示"阶梯"标记

3. **可选：快速选择按钮**
   - 在侧边栏顶部或拖拽手柄附近添加预设档位按钮
   - 用户可以选择快速跳转到某个档位

#### 优点

- ✅ 保留拖拽的灵活性
- ✅ 提供明确的阶梯感
- ✅ 视觉反馈清晰
- ✅ 支持快速选择

#### 缺点

- ⚠️ 实现复杂度较高
- ⚠️ 需要设计额外的 UI 元素

---

## 技术实现要点

### 1. 阶梯值计算

#### 方法一：固定步长

```typescript
const STEP_SIZE = 20; // 每20px一个阶梯

const snapToStep = (width: number): number => {
  const step = Math.round((width - MIN_SIDEBAR_WIDTH) / STEP_SIZE);
  const snappedWidth = MIN_SIDEBAR_WIDTH + step * STEP_SIZE;
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, snappedWidth));
};
```

**优点**: 实现简单，档位均匀  
**缺点**: 步长固定，可能不够灵活

#### 方法二：预设档位列表

```typescript
const WIDTH_STEPS = [200, 240, 280, 320, 360, 400, 450, 500, 550, 600];

const snapToStep = (width: number): number => {
  // 找到最近的档位
  return WIDTH_STEPS.reduce((prev, curr) => 
    Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev
  );
};
```

**优点**: 可以自定义档位，更灵活  
**缺点**: 需要手动定义所有档位

#### 方法三：智能步长（推荐）

```typescript
// 使用非均匀步长，在常用范围内更精细
const WIDTH_STEPS = [
  200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 520, 540, 560, 580, 600
];

// 或者使用动态步长
const getStepSize = (width: number): number => {
  if (width < 300) return 20;      // 小宽度：20px步长
  if (width < 450) return 30;      // 中等宽度：30px步长
  return 50;                        // 大宽度：50px步长
};
```

**优点**: 在常用范围内更精细，用户体验更好  
**缺点**: 实现稍复杂

### 2. 拖拽吸附逻辑

```typescript
const handleMouseMove = (moveEvent: MouseEvent) => {
  if (!isDraggingRef.current || !sidebarRef.current) return;
  
  const rawWidth = moveEvent.clientX;
  
  // 吸附到最近的阶梯
  const snappedWidth = snapToStep(rawWidth);
  
  // 只有当值发生变化时才更新（避免频繁更新）
  if (Math.abs(snappedWidth - sidebarWidth) > 0) {
    setSidebarWidth(snappedWidth);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, snappedWidth.toString());
  }
};
```

### 3. 视觉反馈

#### 档位指示器

```typescript
// 在拖拽手柄上显示当前档位
<div className={styles.sidebarResizer}>
  <div className={styles.stepIndicator}>
    {WIDTH_STEPS.map(step => (
      <div
        key={step}
        className={styles.stepMarker}
        data-active={step === sidebarWidth}
        style={{ left: `${(step - MIN_SIDEBAR_WIDTH) / (MAX_SIDEBAR_WIDTH - MIN_SIDEBAR_WIDTH) * 100}%` }}
      />
    ))}
  </div>
</div>
```

#### CSS 样式

```typescript
export const stepIndicator = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  pointerEvents: 'none',
});

export const stepMarker = style({
  position: 'absolute',
  width: 2,
  height: '100%',
  backgroundColor: cssVarV2('layer/insideBorder/border'),
  transition: 'background-color 0.2s',
  selectors: {
    '&[data-active="true"]': {
      backgroundColor: cssVar('brandColor'),
      width: 3,
    },
  },
});
```

### 4. 动画效果

```typescript
// 添加平滑的过渡动画
export const sidebar = style({
  // ... 其他样式
  transition: 'width 0.15s cubic-bezier(0.4, 0, 0.2, 1)', // 平滑过渡
});
```

**注意**: 过渡时间不宜过长，建议 0.1-0.2s，以保持响应性。

---

## UI 设计建议

### 设计参考

根据用户提供的图片描述，笔触粗细选择器的设计特点：
- 五个灰色点连接成一条线
- 当前选中的点更大、更深色
- 清晰的视觉反馈

### 侧边栏宽度选择器设计

#### 方案 A：内联指示器

```
┌─────────────────────────────────┐
│ 侧边栏内容                        │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
 │ [││││││││││] ← 拖拽手柄 + 阶梯指示
```

**特点**:
- 在拖拽手柄上显示阶梯标记
- 当前档位高亮显示
- 悬停时显示宽度值

#### 方案 B：浮动工具提示

```
┌─────────────────────────────────┐
│ 侧边栏内容                        │
│                                 │
│                                 │
└─────────────────────────────────┘
 │ ← 拖拽手柄
     ┌─────────────┐
     │ 当前: 320px  │ ← 浮动提示
     │ [紧凑|标准|舒适|宽敞|超宽] │
     └─────────────┘
```

**特点**:
- 拖拽时显示浮动提示
- 显示当前宽度值和档位名称
- 提供快速选择按钮

#### 方案 C：顶部快捷选择（推荐）⭐⭐

```
┌─────────────────────────────────┐
│ [紧凑] [标准] [舒适] [宽敞] [超宽] │ ← 快捷选择
├─────────────────────────────────┤
│ 侧边栏内容                        │
│                                 │
│                                 │
└─────────────────────────────────┘
 │ ← 拖拽手柄（仍支持拖拽）
```

**特点**:
- 顶部提供快速选择按钮
- 保留拖拽功能
- 视觉清晰，操作直观

### 推荐设计方案

**最终推荐**: 方案 C + 拖拽吸附

- **顶部快捷选择**: 提供 5-7 个预设档位按钮
- **拖拽功能**: 保留拖拽，但吸附到最近的阶梯
- **视觉反馈**: 在拖拽手柄上显示当前档位指示器
- **过渡动画**: 平滑的宽度变化动画

---

## 实施计划

### 第一阶段：基础阶梯功能（预计 1 天）

**目标**: 实现拖拽时的阶梯吸附效果

**任务清单**:

- [ ] **Step 1: 定义阶梯值**
  - [ ] 确定步长或预设档位列表
  - [ ] 实现 `snapToStep()` 函数
  - [ ] 测试不同宽度范围的吸附效果

- [ ] **Step 2: 修改拖拽逻辑**
  - [ ] 修改 `handleMouseMove` 使用 `snapToStep()`
  - [ ] 添加防抖或节流（避免频繁更新）
  - [ ] 测试拖拽体验

- [ ] **Step 3: 视觉反馈**
  - [ ] 添加当前档位指示器
  - [ ] 添加过渡动画
  - [ ] 测试视觉效果

**验收标准**:
- ✅ 拖拽时有明显的阶梯吸附效果
- ✅ 宽度值自动对齐到最近的阶梯
- ✅ 视觉反馈清晰

---

### 第二阶段：UI 增强（预计 1-2 天）

**目标**: 添加快捷选择功能和更好的视觉反馈

**任务清单**:

- [ ] **Step 1: 快捷选择按钮**
  - [ ] 设计并实现预设档位按钮组件
  - [ ] 添加到侧边栏顶部或合适位置
  - [ ] 实现点击切换功能

- [ ] **Step 2: 视觉指示器**
  - [ ] 在拖拽手柄上显示阶梯标记
  - [ ] 当前档位高亮显示
  - [ ] 悬停时显示宽度值

- [ ] **Step 3: 交互优化**
  - [ ] 优化动画效果
  - [ ] 添加键盘快捷键支持（可选）
  - [ ] 完善错误处理和边界情况

**验收标准**:
- ✅ 用户可以通过按钮快速选择档位
- ✅ 拖拽时有清晰的视觉反馈
- ✅ 交互流畅，体验良好

---

### 第三阶段：优化和测试（预计 0.5-1 天）

**目标**: 性能优化和用户体验完善

**任务清单**:

- [ ] **Step 1: 性能优化**
  - [ ] 优化拖拽时的计算性能
  - [ ] 添加防抖/节流机制
  - [ ] 优化重渲染

- [ ] **Step 2: 边界情况处理**
  - [ ] 处理窗口大小变化
  - [ ] 处理极端值情况
  - [ ] 处理存储失败情况

- [ ] **Step 3: 测试**
  - [ ] 端到端测试
  - [ ] 不同浏览器兼容性测试
  - [ ] 用户体验测试

**验收标准**:
- ✅ 性能满足要求
- ✅ 所有边界情况处理正确
- ✅ 用户体验良好

---

## 技术细节

### 1. 阶梯值配置

#### 推荐配置

```typescript
// 方案A: 均匀步长（简单）
const STEP_SIZE = 20;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;
// 结果: 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 520, 540, 560, 580, 600

// 方案B: 预设档位（推荐）
const PRESET_WIDTHS = [
  { label: '紧凑', value: 200 },
  { label: '标准', value: 240 },
  { label: '舒适', value: 320 },
  { label: '宽敞', value: 400 },
  { label: '超宽', value: 600 },
];

// 方案C: 智能步长（最佳体验）
const WIDTH_STEPS = [
  200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 520, 540, 560, 580, 600
];
```

### 2. 性能优化

#### 防抖处理

```typescript
const debouncedSetWidth = useMemo(
  () => debounce((width: number) => {
    setSidebarWidth(width);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, width.toString());
  }, 100),
  []
);
```

#### 节流处理

```typescript
const throttledSetWidth = useMemo(
  () => throttle((width: number) => {
    setSidebarWidth(width);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, width.toString());
  }, 16), // 约60fps
  []
);
```

### 3. 无障碍支持

```typescript
// 添加键盘支持
const handleKeyDown = useCallback((e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    const currentIndex = WIDTH_STEPS.indexOf(sidebarWidth);
    if (currentIndex > 0) {
      setSidebarWidth(WIDTH_STEPS[currentIndex - 1]);
    }
  } else if (e.key === 'ArrowRight') {
    const currentIndex = WIDTH_STEPS.indexOf(sidebarWidth);
    if (currentIndex < WIDTH_STEPS.length - 1) {
      setSidebarWidth(WIDTH_STEPS[currentIndex + 1]);
    }
  }
}, [sidebarWidth]);
```

---

## 参考设计

### 类似交互模式

1. **VS Code 侧边栏调整**
   - 拖拽时有轻微的吸附效果
   - 显示当前宽度值
   - 支持键盘快捷键

2. **Figma 工具栏调整**
   - 离散的档位选择
   - 清晰的视觉反馈
   - 快速切换

3. **Adobe XD 属性面板**
   - 拖拽调整 + 预设值
   - 数值输入框
   - 视觉指示器

---

## 风险评估

### 技术风险

1. **性能风险**
   - 风险: 频繁的宽度计算和更新可能影响性能
   - 缓解: 使用防抖/节流，优化计算逻辑

2. **兼容性风险**
   - 风险: 不同浏览器的拖拽行为可能不一致
   - 缓解: 充分测试，使用标准 API

### 用户体验风险

1. **学习成本**
   - 风险: 用户可能不习惯阶梯式调整
   - 缓解: 保留拖拽功能，提供清晰的视觉反馈

2. **灵活性**
   - 风险: 阶梯式调整可能不够灵活
   - 缓解: 提供足够的档位选择，或允许自定义

---

## 后续扩展

### 短期扩展

1. **自定义档位**
   - 允许用户自定义阶梯值
   - 保存用户偏好

2. **记忆功能**
   - 记住用户常用的宽度值
   - 智能推荐

### 中期扩展

1. **响应式调整**
   - 根据窗口大小自动调整可用档位
   - 移动端适配

2. **多场景预设**
   - 为不同使用场景提供预设宽度
   - 快速切换

---

## 更新日志

- **2025-01-09**: 创建文档，完成设计分析

---

## 备注

- 本方案优先保证用户体验，在灵活性和易用性之间找到平衡
- 阶梯值可以根据实际使用情况调整
- UI 设计需要遵循现有的设计规范
- 所有改动需要保持向后兼容（已有的 localStorage 数据）

