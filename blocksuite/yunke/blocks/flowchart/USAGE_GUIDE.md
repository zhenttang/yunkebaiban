# Flowchart 功能使用指南

## 🎯 功能概述

通过点击白板底部工具栏的流程图按钮，可以打开一个代码编辑器，用户可以输入 DSL 代码来生成流程图。生成的图表元素是真实的白板元素（ShapeElement 和 ConnectorElement），可以独立操作。

## 🚀 使用步骤

### 1. 打开编辑器

1. 进入白板（Edgeless）模式
2. 在底部工具栏找到流程图按钮（图标：🔀）
3. 点击按钮，会弹出 "Yunke Flow 图表生成器" 对话框

### 2. 编写 DSL 代码

在左侧编辑器中输入 DSL 代码，右侧会实时预览图表效果。

#### 基础示例

```
diagram "简单流程" {
  node start label "开始"
  node process label "处理数据"
  node end label "结束"
  
  start -> process : "执行"
  process -> end : "完成"
}
```

### 3. 使用模板

点击 "💡 快速开始" 下拉菜单，可以选择预设的模板：

- **简单流程** - 基础的节点和连线示例
- **实时同步架构** - 白板实时同步拓扑
- **微服务架构** - 前后端分离的微服务示例
- **CI/CD 流水线** - 持续集成和部署流程
- **数据处理流程** - ETL 数据处理流程
- **用户认证流程** - OAuth 2.0 认证流程
- **消息队列系统** - 发布/订阅消息系统

### 4. 生成图表

1. 确认代码无误（右侧预览正常显示）
2. 点击右上角的 "生成到白板" 按钮
3. 图表元素会在白板视口中心生成

### 5. 编辑图表元素

生成的元素是真实的白板元素，可以：

- ✅ 单独选中、移动每个节点
- ✅ 调整节点大小
- ✅ 双击编辑文本
- ✅ 修改颜色、样式
- ✅ 删除单个元素
- ✅ 连线会自动跟随节点移动

## 📐 DSL 语法说明

### 基本语法

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

### 完整示例：微服务架构

```
diagram "微服务架构" {
  node frontend label "前端应用"
  node gateway label "API 网关"
  
  group services label "后端服务" {
    node auth label "认证服务"
    node user label "用户服务"
    node data label "数据服务"
  }
  
  node cache label "Redis 缓存"
  node db label "MySQL 数据库"
  
  frontend -> gateway : "HTTP"
  gateway -> services.auth : "验证"
  gateway -> services.user : "用户信息"
  gateway -> services.data : "业务数据"
  
  services.auth -> cache : "存储 Token"
  services.user -> db : "查询用户"
  services.data -> db : "CRUD"
}
```

## 🔧 技术实现

### 核心组件

1. **FlowchartToolButton** (`flowchart-tool-button.ts`)
   - 白板底部工具栏按钮
   - 点击打开编辑器对话框

2. **FlowchartEditorDialog** (`flowchart-editor-dialog.ts`)
   - 代码编辑器对话框
   - 提供代码输入、模板选择、实时预览功能

3. **DSL Parser** (`dsl-parser.ts`)
   - 解析 DSL 代码为结构化数据

4. **Layout Engine** (`layout-engine.ts`)
   - 使用分层布局算法计算节点位置

5. **Element Generator** (`element-generator.ts`)
   - 在白板上创建真实的 Shape 和 Connector 元素

### 生成流程

```
DSL 代码
   ↓
[解析器] parseDSL()
   ↓
DiagramModel { nodes, edges, groups }
   ↓
[布局引擎] calculateLayout()
   ↓
LayoutedDiagram { nodes: {x, y, width, height}, edges: {from, to} }
   ↓
[元素生成器] generateFromDSL()
   ↓
调用 surface.addElement() 创建真实元素
   ↓
白板上的 ShapeElement、ConnectorElement
```

## 📝 最近更新

### 2024-10-22

- ✅ 修改了 `FlowchartToolButton` 组件
- ✅ 点击按钮现在会打开编辑器对话框，而不是直接生成图表
- ✅ 集成了 `FlowchartEditorDialog` 组件
- ✅ 支持用户手动输入 DSL 代码生成图表

### 主要改动

**文件**: `baibanfront/blocksuite/yunke/blocks/flowchart/src/toolbar/flowchart-tool-button.ts`

- 导入了 `FlowchartEditorDialog` 组件
- 添加了 `@query` 装饰器来获取对话框实例
- 修改 `_handleClick` 方法，调用 `_editorDialog.show()` 打开对话框
- 在 render 方法中添加了 `<flowchart-editor-dialog>` 元素

## 🎨 界面预览

```
┌─────────────────────────────────────────────┐
│  🔀 Yunke Flow 图表生成器           [✕]    │
├─────────────────────────────────────────────┤
│  💡 快速开始: [选择模板 ▼]                 │
├─────────────────┬───────────────────────────┤
│                 │                           │
│  DSL 代码       │   预览                    │
│                 │                           │
│  [代码编辑器]   │   [SVG 预览]              │
│                 │                           │
│                 │                           │
├─────────────────┴───────────────────────────┤
│  3 个节点 · 2 条连线                        │
└─────────────────────────────────────────────┘
      [生成到白板 →]  [取消]
```

## ⚠️ 注意事项

1. **代码格式**: DSL 代码需要严格遵循语法格式，否则会解析失败
2. **节点 ID**: 节点 ID 必须是唯一的，不能重复
3. **连线引用**: 连线的 from 和 to 必须引用已定义的节点 ID
4. **分组引用**: 引用分组内的节点时，使用 `分组ID.节点ID` 格式
5. **生成位置**: 图表会生成在当前视口的中心位置

## 🚀 未来计划

- [ ] 支持更多节点形状（圆形、菱形、六边形等）
- [ ] 支持自定义节点颜色和样式
- [ ] 支持导出为图片
- [ ] 支持从已有元素生成 DSL 代码（反向工程）
- [ ] 支持拖拽式可视化编辑器
- [ ] 支持协作实时编辑

---

**祝您使用愉快！** 🎉

