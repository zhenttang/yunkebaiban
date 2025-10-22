# Yunke Flow 图表块

## 简介

Yunke Flow 图表块是一个完全自研的图表系统，使用自定义的 DSL（领域特定语言）来描述系统架构、流程图和拓扑结构。

## 特性

- ✅ **自定义 DSL**：使用 Yunke Flow DSL 语法，易读易写
- ✅ **零依赖**：完全自研，不依赖任何第三方图表库
- ✅ **版本控制友好**：纯文本描述，易于版本管理和协作
- ✅ **实时预览**：编辑时实时渲染图表
- ✅ **丰富示例**：内置多种常用架构图示例
- ✅ **可扩展**：支持组件化、参数化、主题等高级功能

## 使用方法

### 1. 通过斜杠菜单创建

在编辑器中输入 `/flow` 或 `/yunke`，选择"Yunke Flow 图表"。

### 2. DSL 语法示例

#### 基础示例

```
diagram "我的架构图" {
  node app label "应用"
  node db label "数据库"
  
  app -> db : "查询数据"
}
```

#### 带分组的示例

```
diagram "微服务架构" {
  node frontend label "前端"
  
  group backend label "后端服务" {
    node api label "API 网关"
    node auth label "认证服务"
    node data label "数据服务"
  }
  
  frontend -> backend.api : "HTTP"
  backend.api -> backend.auth : "验证"
  backend.api -> backend.data : "业务逻辑"
}
```

#### 完整示例

```
diagram "实时同步系统" {
  theme default
  layout horizontal
  
  node app type browser label "编辑器"
  node worker type worker label "Shared Worker"
  
  group storage label "存储层" {
    node cache type database label "IndexedDB"
    node cloud type service label "云存储"
  }
  
  app -> worker : "文档更新"
  worker -> storage.cache : "本地缓存"
  worker -> storage.cloud : "云端同步"
}
```

## DSL 语法参考

### 关键字

- `diagram`: 定义图表
- `node`: 定义节点
- `group`: 定义分组
- `component`: 定义可复用组件
- `use`: 使用组件
- `layout`: 布局指示
- `theme`: 主题
- `style`: 样式
- `label`: 标签
- `type`: 类型
- `when`: 条件

### 节点类型

- `browser`: 浏览器/客户端
- `worker`: Worker 线程
- `database`: 数据库
- `service`: 服务
- `cache`: 缓存

### 边的类型

- `->`: 普通连线
- `=>`: 强制/同步连线
- `~>`: 异步/事件连线

### 布局模式

- `horizontal`: 横向布局（默认）
- `vertical`: 纵向布局
- `grid`: 网格布局
- `swimlane`: 泳道布局

## 开发状态

✅ **已完成**:
- 基础块结构
- DSL 解析器（简化版）
- 可视化渲染
- 编辑器界面
- 斜杠菜单集成
- 示例库

🚧 **待完成**:
- 集成完整的 FlowchartService（来自 `@yunke/core/modules/flowchart`）
- 高级布局算法
- 主题系统
- 导出功能（PNG、SVG、Mermaid）
- 组件化支持

## 技术架构

```
flowchart/
├── src/
│   ├── flowchart-model.ts       # 数据模型和 Schema
│   ├── flowchart-service.ts     # 块服务
│   ├── flowchart-block.ts       # UI 组件
│   ├── view.ts                  # 视图扩展
│   ├── store.ts                 # 存储扩展
│   ├── effects.ts               # 副作用注册
│   ├── styles.ts                # 样式
│   ├── examples.ts              # 示例库
│   ├── renderer.ts              # 渲染器（TODO: 集成真实渲染器）
│   └── configs/
│       └── slash-menu.ts        # 斜杠菜单配置
├── package.json
└── tsconfig.json
```

## 集成说明

该块已集成到系统中：

1. **View 扩展**: `blocksuite/yunke/all/src/extensions/view.ts`
2. **Store 扩展**: `blocksuite/yunke/all/src/extensions/store.ts`
3. **核心服务**: `packages/frontend/core/src/modules/flowchart`

## 相关文档

- [DSL 规范](../../../docs/code-flowchart-dsl-spec.md)
- [API 契约](../../../docs/code-flowchart-api-contract.md)
- [示例库](../../../docs/code-flowchart-sample-library.md)

## 贡献

欢迎贡献示例、优化渲染算法、添加新特性！

