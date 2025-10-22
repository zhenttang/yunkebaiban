# 🔀 Yunke Flow 图表生成器 - 正确需求文档

## 📋 需求概述

在无限白板（Edgeless）模式下，用户可以通过编写 DSL 代码，一键生成由**真实白板元素**组成的流程图。生成的图表元素与手动创建的元素完全相同，可以独立操作。

## 🎯 核心目标

### ✅ 应该做的
1. 解析 DSL 代码，生成**真实的白板元素**（Shape、Connector、Group）
2. 每个节点是一个独立的 `ShapeElement`，可以：
   - 单独选中、移动、缩放
   - 编辑文本内容
   - 修改样式（颜色、边框等）
   - 复制、删除
3. 每条连线是一个独立的 `ConnectorElement`，可以：
   - 自动吸附到节点
   - 跟随节点移动而自动调整
   - 调整路径
   - 编辑标签文本
4. 分组是一个 `GroupElement`，可以：
   - 包含多个子元素
   - 整体移动
   - 展开/折叠

### ❌ 不应该做的
1. ❌ 创建一个整体的 SVG 图片块
2. ❌ 生成静态的、不可编辑的图表
3. ❌ 创建新的块类型（Block）

## 👥 用户交互流程

### 方案 A: 斜杠命令触发（推荐）

```
用户流程：
1. 在白板中输入 `/flowchart` 或 `/flow`
2. 弹出代码编辑器模态框
3. 输入/粘贴 DSL 代码
4. 实时预览布局（可选）
5. 点击"生成"按钮
6. 在当前鼠标位置/画布中心生成图表元素
7. 关闭编辑器，用户可以操作生成的元素
```

### 方案 B: 粘贴自动识别

```
用户流程：
1. 用户复制 DSL 代码（包含 diagram 关键字）
2. 在白板中粘贴（Ctrl+V）
3. 系统识别是 Flowchart DSL
4. 自动在粘贴位置生成图表元素
```

### 方案 C: 专用工具按钮

```
用户流程：
1. 点击白板工具栏的"流程图"按钮
2. 弹出编辑器
3. 编写代码并生成
```

**推荐：方案 A + 方案 B 组合**

## 🔧 技术实现方案

### 架构概览

```
DSL 代码
   ↓
[解析器] parseDSL()
   ↓
DiagramModel { nodes, edges, groups }
   ↓
[布局引擎] calculateLayout()
   ↓
LayoutedDiagram { nodes: {id, x, y, width, height}, edges: {from, to, points} }
   ↓
[元素生成器] generateElements()
   ↓
调用 EdgelessCRUD API 创建真实元素
   ↓
白板上的 ShapeElement、ConnectorElement、GroupElement
```

### 核心模块

#### 1. DSL 解析器（已实现）

**文件**: `dsl-parser.ts`

功能：将 DSL 代码解析为结构化数据

```typescript
interface ParsedDiagram {
  name: string;
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  groups: Map<string, GroupInfo>;
}
```

#### 2. 布局引擎（需新建）

**文件**: `layout-engine.ts`

功能：计算每个节点的具体坐标位置

```typescript
interface LayoutedDiagram {
  nodes: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
  groups: Array<{
    id: string;
    label: string;
    nodeIds: string[];
    bounds: { x: number; y: number; width: number; height: number };
  }>;
}
```

布局算法：
- 分层布局（Layered Layout / Sugiyama）
- 横向从左到右
- 自动避免重叠

#### 3. 元素生成器（需新建）

**文件**: `element-generator.ts`

功能：调用白板 API 创建真实元素

```typescript
class FlowchartElementGenerator {
  constructor(
    private edgelessService: EdgelessRootService,
    private surface: SurfaceBlockModel
  ) {}

  async generateFromDSL(dslCode: string, centerX: number, centerY: number) {
    // 1. 解析 DSL
    const parsed = parseDSL(dslCode);
    
    // 2. 计算布局
    const layout = calculateLayout(parsed);
    
    // 3. 创建节点（Shape）
    const nodeElements = this.createNodes(layout.nodes, centerX, centerY);
    
    // 4. 创建连线（Connector）
    const edgeElements = this.createEdges(layout.edges, nodeElements);
    
    // 5. 创建分组（Group）
    const groupElements = this.createGroups(layout.groups, nodeElements);
    
    return {
      nodes: nodeElements,
      edges: edgeElements,
      groups: groupElements,
    };
  }

  private createNodes(nodes, offsetX, offsetY) {
    const nodeMap = new Map();
    
    nodes.forEach(node => {
      // 使用 EdgelessCRUD.addBlock 或 service.addElement
      const shapeId = this.surface.addElement({
        type: 'shape',
        xywh: `[${node.x + offsetX}, ${node.y + offsetY}, ${node.width}, ${node.height}]`,
        shapeType: 'rect',
        radius: 8,
        filled: true,
        fillColor: '#1e96ed',
        strokeColor: '#1565c0',
        strokeWidth: 2,
        text: new DocCollection.Y.Text(node.label),
      });
      
      nodeMap.set(node.id, shapeId);
    });
    
    return nodeMap;
  }

  private createEdges(edges, nodeMap) {
    return edges.map(edge => {
      const fromId = nodeMap.get(edge.from);
      const toId = nodeMap.get(edge.to);
      
      return this.surface.addElement({
        type: 'connector',
        mode: ConnectorMode.Orthogonal,
        strokeWidth: 2,
        stroke: '#666666',
        source: { id: fromId },
        target: { id: toId },
        // 如果有标签
        text: edge.label ? new DocCollection.Y.Text(edge.label) : undefined,
      });
    });
  }

  private createGroups(groups, nodeMap) {
    return groups.map(group => {
      const childIds = group.nodeIds.map(id => nodeMap.get(id));
      
      return this.surface.addElement({
        type: 'group',
        title: new DocCollection.Y.Text(group.label),
        children: new DocCollection.Y.Map(
          childIds.map(id => [id, true])
        ),
        xywh: `[${group.bounds.x}, ${group.bounds.y}, ${group.bounds.width}, ${group.bounds.height}]`,
      });
    });
  }
}
```

#### 4. 编辑器 UI（需新建）

**文件**: `flowchart-editor-widget.ts`

功能：提供代码编辑界面

选项：
- **独立 Widget**（推荐）：类似 slash-menu，独立的浮层
- **集成到工具栏**：在 edgeless-toolbar 中添加按钮

```typescript
export class FlowchartEditorWidget extends WidgetComponent {
  // 模态框编辑器
  // 包含：
  // - 代码输入区
  // - 示例模板选择
  // - 预览区（可选）
  // - 生成按钮
}
```

### 关键 API 参考

#### 获取白板服务

```typescript
// 在 Widget 或 Service 中
const edgelessService = this.std.spec.getService(
  'affine:page'
) as EdgelessRootService;

const surface = edgelessService.surface;
```

#### 创建形状元素

```typescript
const shapeId = surface.addElement({
  type: 'shape',
  xywh: '[x, y, width, height]',
  shapeType: 'rect',
  radius: 8,
  filled: true,
  fillColor: '#1e96ed',
  strokeColor: '#1565c0',
  strokeWidth: 2,
  text: new DocCollection.Y.Text('节点文本'),
});
```

#### 创建连接线

```typescript
const connectorId = surface.addElement({
  type: 'connector',
  mode: ConnectorMode.Orthogonal, // 正交路径
  strokeWidth: 2,
  stroke: '#666666',
  source: { id: sourceShapeId },
  target: { id: targetShapeId },
});
```

#### 创建分组

```typescript
const groupId = surface.addElement({
  type: 'group',
  title: new DocCollection.Y.Text('分组标题'),
  children: new DocCollection.Y.Map([
    [childId1, true],
    [childId2, true],
  ]),
});
```

## 📐 DSL 语法（保持不变）

```
diagram "图表名称" {
  // 定义节点
  node 节点ID label "显示文本"
  
  // 定义分组
  group 分组ID label "分组名" {
    node 子节点ID label "文本"
  }
  
  // 定义连线
  节点A -> 节点B : "连线标签"
  节点C -> 分组.子节点
}
```

示例：

```
diagram "微服务架构" {
  node frontend label "前端"
  node gateway label "网关"
  
  group backend label "后端服务" {
    node auth label "认证"
    node user label "用户"
    node data label "数据"
  }
  
  node db label "数据库"
  
  frontend -> gateway : "HTTP"
  gateway -> backend.auth
  gateway -> backend.user
  backend.data -> db : "SQL"
}
```

## 🔍 参考的现有实现

### 1. Shape 创建参考

**文件**: `blocksuite/yunke/gfx/shape/src/shape-element.ts`

查看 ShapeElement 的属性定义

### 2. Connector 创建参考

**文件**: `blocksuite/yunke/gfx/connector/src/connector-element.ts`

查看 ConnectorElement 的属性定义

### 3. Surface 元素管理

**文件**: `blocksuite/yunke/blocks/surface/src/surface-model.ts`

查看 `addElement()` 方法

### 4. EdgelessCRUD 服务

**文件**: `blocksuite/yunke/blocks/root/src/edgeless/utils/crud.ts`

提供了白板元素的 CRUD 操作

### 5. 类似功能参考：Mindmap

**文件**: `blocksuite/yunke/gfx/mindmap/`

Mindmap 也是通过代码生成多个白板元素，可以参考其实现

## 📝 实现步骤建议

### Phase 1: 核心功能（MVP）
1. ✅ DSL 解析器（已完成）
2. 🔲 布局引擎（简单的分层布局）
3. 🔲 元素生成器（创建 Shape 和 Connector）
4. 🔲 基础编辑器 Widget（模态框）
5. 🔲 斜杠命令集成（`/flowchart`）

### Phase 2: 增强功能
1. 🔲 分组（Group）支持
2. 🔲 粘贴自动识别 DSL
3. 🔲 预览功能
4. 🔲 更多节点样式（圆形、菱形等）

### Phase 3: 高级功能
1. 🔲 智能布局算法优化
2. 🔲 导出为 DSL 代码（反向工程）
3. 🔲 模板库
4. 🔲 协作实时同步

## 🎨 UI/UX 细节

### 编辑器界面布局

```
┌─────────────────────────────────────────────┐
│  🔀 Yunke Flow 图表生成器           [✕]    │
├─────────────────────────────────────────────┤
│  💡 快速开始: [选择模板 ▼]                 │
├─────────────────┬───────────────────────────┤
│                 │                           │
│  代码编辑区     │   预览区（可选）          │
│                 │                           │
│  [DSL 代码]     │   [布局预览]              │
│                 │                           │
│                 │                           │
├─────────────────┴───────────────────────────┤
│  [取消]              [生成到白板 →]         │
└─────────────────────────────────────────────┘
```

### 生成位置

默认生成位置选项：
1. **画布中心**（推荐）
2. 当前视口中心
3. 鼠标点击位置

## 🚀 期望效果

用户体验：

1. **输入代码** → 点击生成
2. **立即看到** 白板上出现多个图形和连线
3. **可以操作** 每个元素：
   - 拖动节点，连线自动跟随
   - 双击编辑文本
   - 删除单个节点
   - 调整大小、颜色
4. **和手动创建的完全一样**，没有任何区别

这样用户可以：
- 快速搭建复杂图表的初始结构
- 然后手动微调细节
- 提高效率 10 倍以上！

---

## ✅ 验收标准

1. [ ] 可以通过斜杠命令打开编辑器
2. [ ] 可以输入 DSL 代码并生成
3. [ ] 生成的节点是真实的 ShapeElement
4. [ ] 生成的连线是真实的 ConnectorElement
5. [ ] 可以单独选中、移动每个元素
6. [ ] 连线会跟随节点移动
7. [ ] 可以编辑节点文本
8. [ ] 可以删除单个元素
9. [ ] 生成的元素和手动创建的外观一致
10. [ ] 支持至少 3 种示例模板

---

**这份文档是正确的实现方向！** 🎯

