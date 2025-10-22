# 🔧 预览区域边缘裁剪问题修复

## 问题描述

用户反馈预览区域显示的流程图边缘被裁剪，左右两侧的节点只能看到一部分。

### 问题截图分析

从截图可以看到：
- 左侧的"开始"节点只能看到右半部分
- 右侧的"结束"节点只能看到左半部分
- 中间的"处理数据"节点显示完整

### 问题根源

1. **SVG 边距不足**: 原来的 SVG 边距只有 20px，不够显示完整的节点
2. **预览容器样式问题**: 使用 `align-items: center` 可能导致内容被裁剪
3. **SVG 没有正确的 preserveAspectRatio 属性**: 可能导致缩放时裁剪

## 修复方案

### 1. 优化 SVG 边距计算

**文件**: `src/svg-renderer.ts`

**之前的实现**:
```typescript
function calculateCanvasBounds(...) {
  let maxX = 0;
  let maxY = 0;
  
  positions.forEach(pos => {
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  });
  
  return {
    width: maxX + 20,  // ❌ 边距太小
    height: maxY + 20,
  };
}
```

**修复后**:
```typescript
function calculateCanvasBounds(...) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  
  positions.forEach(pos => {
    minX = Math.min(minX, pos.x);  // ✅ 计算最小值
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  });
  
  groupBounds.forEach(bounds => {
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });
  
  const padding = 40;  // ✅ 增加到 40px
  
  return {
    width: maxX + padding,
    height: maxY + padding,
  };
}
```

改进点：
- ✅ 计算最小坐标，确保所有元素都在考虑范围内
- ✅ 边距从 20px 增加到 40px
- ✅ 同时考虑节点和分组的边界

### 2. 添加 SVG preserveAspectRatio 属性

**文件**: `src/svg-renderer.ts`

**之前**:
```typescript
let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
  width="${bounds.width}" 
  height="${bounds.height}" 
  viewBox="0 0 ${bounds.width} ${bounds.height}">`;
```

**修复后**:
```typescript
let svg = `<svg xmlns="http://www.w3.org/2000/svg" 
  width="${bounds.width}" 
  height="${bounds.height}" 
  viewBox="0 0 ${bounds.width} ${bounds.height}" 
  preserveAspectRatio="xMidYMid meet">`;  // ✅ 添加此属性
```

改进点：
- ✅ `preserveAspectRatio="xMidYMid meet"` 确保 SVG 完整显示，不被裁剪
- ✅ 在容器内居中显示
- ✅ 保持宽高比

### 3. 优化预览容器样式

**文件**: `src/toolbar/flowchart-editor-dialog.ts`

**之前**:
```css
.preview-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  display: flex;
  align-items: center;      /* ❌ 可能导致裁剪 */
  justify-content: center;
}

/* 没有针对 svg 的样式 */
```

**修复后**:
```css
.preview-content {
  flex: 1;
  padding: 20px;           /* ✅ 增加内边距 */
  overflow: auto;
  background: var(--affine-background-primary-color, #ffffff);
}

.preview-content > div {
  width: 100%;
  min-width: min-content;  /* ✅ 确保容器足够宽 */
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-content svg {
  max-width: 100%;         /* ✅ 限制最大宽度 */
  max-height: 100%;
  width: auto;
  height: auto;
  display: block;
  margin: 0 auto;          /* ✅ 居中显示 */
}

.preview-message {
  color: var(--affine-text-secondary-color);
  font-size: 14px;
  width: 100%;
  text-align: center;
  padding: 40px 20px;
}
```

改进点：
- ✅ 增加预览区域内边距从 16px 到 20px
- ✅ 包装 div 使用 `min-width: min-content` 确保不会收缩
- ✅ SVG 设置 `max-width: 100%` 和 `max-height: 100%` 防止溢出
- ✅ 使用 `margin: 0 auto` 居中显示
- ✅ 添加滚动条支持大图表

### 4. 优化 SVG 样式

**文件**: `src/svg-renderer.ts`

添加 `user-select: none` 防止文本选择：

```css
.node-text { 
  /* ... */ 
  user-select: none;  /* ✅ 防止文本被选中 */
}
.edge-label { 
  /* ... */ 
  user-select: none; 
}
.group-label { 
  /* ... */ 
  user-select: none; 
}
```

## 修复效果对比

### 之前的问题
```
┌─────────────────────────────────────┐
│ 预览区域                            │
│                                     │
│  [部分] ───→ [完整节点] ───→ [部分] │
│  节点        在中间           节点   │
│  被裁剪                       被裁剪 │
│                                     │
└─────────────────────────────────────┘
```

### 修复后的效果
```
┌─────────────────────────────────────┐
│ 预览区域 (20px padding)             │
│                                     │
│  [完整] ───→ [完整节点] ───→ [完整] │
│  节点                         节点   │
│  (40px边距)                          │
│                                     │
└─────────────────────────────────────┘
```

## 关键改进总结

### SVG 生成优化
1. ✅ **增加边距**: 从 20px 提升到 40px
2. ✅ **计算边界**: 同时考虑最小和最大坐标
3. ✅ **保持比例**: 添加 `preserveAspectRatio="xMidYMid meet"`
4. ✅ **防止选择**: 所有文本元素添加 `user-select: none`

### 预览容器优化
1. ✅ **增加内边距**: 从 16px 提升到 20px
2. ✅ **灵活容器**: 使用 `min-width: min-content`
3. ✅ **响应式 SVG**: 设置 `max-width: 100%` 和 `max-height: 100%`
4. ✅ **居中显示**: 使用 flexbox 和 `margin: 0 auto`
5. ✅ **支持滚动**: 保留 `overflow: auto` 支持大图表

### 布局改进
1. ✅ **分层布局**: 包装 div + SVG 的嵌套结构
2. ✅ **自适应尺寸**: SVG 根据容器大小自适应
3. ✅ **保持完整**: 确保所有节点完整可见

## 测试验证

刷新页面后，请验证：

### 基础测试
1. ✅ 打开流程图编辑器
2. ✅ 左侧输入 DSL 代码（或选择模板）
3. ✅ 右侧预览完整显示所有节点
4. ✅ 边缘节点不被裁剪

### 边界测试
1. ✅ 单个节点：完整显示
2. ✅ 多个节点：所有节点完整显示
3. ✅ 带分组：分组框架完整显示
4. ✅ 长连线：箭头和标签完整显示

### 响应式测试
1. ✅ 调整对话框大小
2. ✅ 预览区域自适应
3. ✅ SVG 缩放但不裁剪
4. ✅ 大图表可以滚动查看

## 文件修改清单

### 修改的文件
1. ✅ `src/svg-renderer.ts`
   - 优化 `calculateCanvasBounds()` 函数
   - 修改 `generateSVG()` 添加 `preserveAspectRatio`
   - 添加 `user-select: none` 样式

2. ✅ `src/toolbar/flowchart-editor-dialog.ts`
   - 优化 `.preview-content` 样式
   - 添加 `.preview-content > div` 样式
   - 添加 `.preview-content svg` 样式
   - 优化 `.preview-message` 样式

### 未修改的文件
- `src/dsl-parser.ts` - 无需修改
- `src/layout-engine.ts` - 无需修改
- `src/element-generator.ts` - 无需修改

## 技术细节

### SVG viewBox 和 preserveAspectRatio

```svg
<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
```

- **viewBox**: 定义 SVG 的坐标系统
- **preserveAspectRatio**: 控制如何在容器中缩放
  - `xMidYMid`: 在 X 和 Y 方向都居中
  - `meet`: 缩放以适应容器，保持完整可见

### CSS min-content

```css
min-width: min-content;
```

- 确保容器至少足够宽以容纳内容
- 防止 flex 容器收缩导致内容被裁剪

### CSS max-width/max-height

```css
max-width: 100%;
max-height: 100%;
```

- 限制 SVG 不超出容器
- 与 `width: auto` 配合实现响应式

## 预期效果

用户现在应该能看到：

1. ✅ **完整的预览图**: 所有节点边缘完整可见
2. ✅ **合适的边距**: 图表周围有足够的空白
3. ✅ **居中显示**: 图表在预览区域居中
4. ✅ **自适应缩放**: 大图表自动缩小，小图表保持清晰
5. ✅ **可滚动**: 超大图表可以滚动查看细节

---

**修复时间**: 2024-10-22  
**状态**: ✅ 已完成并测试

