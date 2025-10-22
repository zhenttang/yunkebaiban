# 🔍 Blocksuite Connector 技术分析报告

## 核心发现

### ✅ **方案可行：可以设置自定义路径点！**

## 技术细节

### 1. Connector 属性结构

```typescript
// ConnectorElementModel 属性
{
  mode: ConnectorMode,           // Straight | Orthogonal | Curve
  source: Connection,            // { id?: string, position?: [number, number] }
  target: Connection,            // { id?: string, position?: [number, number] }
  path: PointLocation[],         // 路径点数组（可手动设置！）
  absolutePath: PointLocation[], // 绝对坐标路径（自动计算）
  // ... 其他属性
}
```

### 2. 关键方法：`updatePath()`

**位置**：`baibanfront/blocksuite/yunke/gfx/connector/src/connector-manager.ts:1185`

```typescript
static updatePath(
  connector: ConnectorElementModel,
  path: PointLocation[] | null,  // ⭐️ 可以传入自定义路径！
  elementGetter?: (id: string) => GfxModel | null
)
```

**工作原理**：
1. **如果 `path === null`**：自动计算路径（根据 mode 和 source/target）
2. **如果 `path !== null`**：使用传入的路径点 ⭐️
3. 更新 connector 的 `xywh` 和 `path` 属性
4. 自动处理标签位置

### 3. PointLocation 类型

```typescript
class PointLocation extends Array<number> {
  [0]: number;  // x
  [1]: number;  // y
  _in: IVec;    // 贝塞尔曲线控制点（进入）
  _out: IVec;   // 贝塞尔曲线控制点（离开）
  _tangent: IVec;
}

// 创建方法
new PointLocation([x, y])
```

---

## 🎯 推荐方案：直接设置路径点

### 方案概述

**不需要隐藏锚点节点！** 直接使用 `ConnectorPathGenerator.updatePath()` 设置自定义路径。

### 实现步骤

#### 1. 创建带自定义路径的 Connector

```typescript
import { PointLocation } from '@blocksuite/global/gfx';
import { ConnectorPathGenerator } from '@blocksuite/yunke-gfx-connector';

// 创建 Connector（先不连接任何节点）
const connectorId = surface.addElement({
  type: 'connector',
  mode: ConnectorMode.Straight,  // 使用直线模式
  source: { position: [0, 0] },  // 临时位置
  target: { position: [0, 0] },
  stroke: '#999999',
  strokeWidth: 2,
});

// 获取 connector 实例
const connector = surface.getElementById(connectorId);

// 定义自定义路径点
const customPath = [
  new PointLocation([parentX, parentBottomY]),  // 起点
  new PointLocation([parentX, midY]),           // 中间点
  new PointLocation([childX, midY]),            // 转折点
  new PointLocation([childX, childTopY]),       // 终点
];

// 更新路径
ConnectorPathGenerator.updatePath(
  connector,
  customPath,  // 传入自定义路径
  (id) => surface.getElementById(id)
);
```

#### 2. 为树状图绘制连线

```typescript
// 场景 1: 单个子节点（2个点）
const pathSingle = [
  new PointLocation([parentCenterX, parentBottomY]),
  new PointLocation([childCenterX, childTopY])
];

// 场景 2: 多个子节点 - 垂直线（2个点）
const pathVertical = [
  new PointLocation([parentCenterX, parentBottomY]),
  new PointLocation([parentCenterX, midY])
];

// 场景 3: 多个子节点 - 水平线（2个点）
const pathHorizontal = [
  new PointLocation([leftmostX, midY]),
  new PointLocation([rightmostX, midY])
];

// 场景 4: 多个子节点 - 到子节点的垂直线（2个点）
const pathToChild = [
  new PointLocation([childCenterX, midY]),
  new PointLocation([childCenterX, childTopY])
];
```

---

## ⚠️ 注意事项

### 1. Source/Target 设置

```typescript
// 方式 A: 只设置位置（不连接节点）
source: { position: [x, y] }
target: { position: [x, y] }

// 方式 B: 连接到节点
source: { id: nodeId }
target: { id: nodeId }

// 方式 C: 连接到节点的特定位置
source: { id: nodeId, position: [0.5, 1] }  // 节点底部中心
```

**推荐**：使用方式 A（只设置位置），这样路径不会被自动重算。

### 2. Mode 选择

```typescript
ConnectorMode.Straight    // 直线 - 推荐用于树状图
ConnectorMode.Orthogonal  // 正交 - 会自动重算路径！
ConnectorMode.Curve       // 曲线 - 会自动计算贝塞尔曲线
```

**推荐**：使用 `Straight` 模式，配合自定义路径点。

### 3. 路径更新时机

```typescript
// 创建后立即更新路径
const connector = surface.getElementById(connectorId);
ConnectorPathGenerator.updatePath(connector, customPath, getElementById);
```

### 4. 移动节点时保持连接

如果需要在移动节点时自动更新连线：

```typescript
// 监听节点位置变化
doc.on('yUpdate', () => {
  // 重新计算路径点
  const newPath = calculateTreePath(parentNode, childNode);
  
  // 更新 connector
  ConnectorPathGenerator.updatePath(connector, newPath, getElementById);
});
```

---

## 🚀 优势

1. ✅ **真正的 Connector** - 可编辑、可选中、可删除
2. ✅ **不需要隐藏节点** - 代码更简洁
3. ✅ **路径可控** - 精确的 T 形树状结构
4. ✅ **性能更好** - 只创建 Connector，不创建额外节点
5. ✅ **符合 Blocksuite 设计** - 使用官方 API

---

## 📝 实现清单

- [ ] 导入 `PointLocation` 和 `ConnectorPathGenerator`
- [ ] 修改 `EdgelessRenderer.createEdge()` 方法
- [ ] 使用 `mode: ConnectorMode.Straight`
- [ ] 设置 `source/target` 为位置而非节点 ID
- [ ] 创建 Connector 后调用 `updatePath()` 设置自定义路径
- [ ] 测试单个子节点和多个子节点场景

---

## 🔗 相关文件

- `baibanfront/blocksuite/yunke/model/src/elements/connector/connector.ts`
- `baibanfront/blocksuite/yunke/gfx/connector/src/connector-manager.ts`
- `baibanfront/blocksuite/framework/global/src/gfx/model/point-location.ts`

---

**结论**：使用 Blocksuite 的 `ConnectorPathGenerator.updatePath()` API 设置自定义路径点是最佳方案！

