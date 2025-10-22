# 🐛 调试指南

## 问题：生成成功但看不到元素

### 已修复的问题

✅ **颜色问题**：将 CSS 变量改为实际颜色值
```typescript
// 之前（错误）
fillColor: '--affine-palette-shape-blue'  ❌

// 现在（正确）
fillColor: '#1e96ed'  ✅
```

### 调试步骤

现在点击生成按钮后，控制台会输出详细日志：

```
开始创建元素，偏移量: { offsetX: xxx, offsetY: xxx }
布局信息: { 节点数: 3, 连线数: 2, 节点列表: [...] }
创建节点: { id: 'start', x: xxx, y: xxx, width: 180, height: 80, label: '开始' }
节点已创建，ID: xxxx
创建节点: { id: 'process', ... }
节点已创建，ID: xxxx
创建节点: { id: 'end', ... }
节点已创建，ID: xxxx
所有节点创建完成: [...]
创建连线: { from: 'start', to: 'process', sourceId: xxx, targetId: xxx }
连线已创建，ID: xxxx
创建连线: { from: 'process', to: 'end', ... }
连线已创建，ID: xxxx
所有连线创建完成: [...]
✅ 流程图已生成: {节点数: 3, 连线数: 2}
```

### 检查清单

1. **打开浏览器开发者工具**（F12）
2. **点击生成按钮**
3. **查看控制台输出**

#### ✅ 如果看到上述日志

说明元素已经创建到 surface 中了。如果还是看不到，可能是：

**位置问题**：
- 检查控制台中的 `offsetX` 和 `offsetY`
- 这应该是视口中心坐标
- 尝试缩小白板（Ctrl + 鼠标滚轮）查看全局
- 按 `Ctrl/Cmd + 0` 重置视口

**查看元素位置**：
```javascript
// 在控制台运行
console.log('视口中心:', { x: viewport.centerX, y: viewport.centerY });
```

**手动查找元素**：
1. 按 `Ctrl/Cmd + A` 全选所有元素
2. 如果可以选中，说明元素存在但位置可能不对
3. 拖动画布或缩放查看

#### ❌ 如果没有看到日志

说明按钮点击事件没有触发或代码有错误：

1. 检查是否有红色错误信息
2. 确认是否在白板模式（不是页面模式）
3. 刷新页面重试

### 快速测试

在控制台直接运行：

```javascript
// 获取 surface
const edgeless = document.querySelector('yunke-edgeless-root');
const surface = edgeless.service.surface;

// 创建测试节点
const testId = surface.addElement({
  type: 'shape',
  xywh: '[0,0,200,100]',
  shapeType: 'rect',
  filled: true,
  fillColor: '#ff0000',  // 红色，很明显
  strokeWidth: 3,
  strokeColor: '#000000',
  text: new Y.Text('测试节点')
});

console.log('测试节点已创建，ID:', testId);
```

如果测试节点能看到，说明 surface API 是正常的。

### 可能的解决方案

#### 方案1：调整生成位置

修改 `flowchart-tool-button.ts`：

```typescript
// 强制在 (0, 0) 位置生成
const x = 0;
const y = 0;
```

#### 方案2：生成后自动聚焦

在元素生成后，自动移动视口：

```typescript
// 生成完成后
service.viewport.setCenter(x, y);
```

#### 方案3：使用更大的节点

如果节点太小看不见，可以调大：

在 `layout-engine.ts` 中：
```typescript
const LAYOUT_CONFIG = {
  NODE_WIDTH: 300,   // 增大到 300
  NODE_HEIGHT: 150,  // 增大到 150
  ...
};
```

### 验证元素确实存在

在控制台运行：

```javascript
// 获取 surface
const edgeless = document.querySelector('yunke-edgeless-root');
const surface = edgeless.service.surface;

// 查看所有元素
const shapes = surface.getElementsByType('shape');
const connectors = surface.getElementsByType('connector');

console.log('Shape 数量:', shapes.length);
console.log('Connector 数量:', connectors.length);

// 查看最新的 3 个 shape
shapes.slice(-3).forEach(shape => {
  console.log('Shape:', {
    id: shape.id,
    xywh: shape.xywh,
    text: shape.text?.toString(),
    fillColor: shape.fillColor
  });
});
```

如果输出显示有新的 shape，说明元素已经创建成功！

---

**请按照上述步骤检查，并告诉我控制台输出了什么。** 🔍

