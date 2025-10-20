# 代码流程图与 DSL 图形引擎需求文档

## 1. 背景与目标
- **课程价值**：在 "Yunke 白板前端实战营" 中引入 "代码/DSL → 图形" 功能，展示如何从复杂工程源码或抽象描述生成结构化流程/架构图，帮助学员理解 DI、协同、AI 等核心模块。
- **产品价值**：为白板/文档提供可视化编程资产展示能力，支持代码审查、技术评审、架构设计复盘、知识输出等多元场景。
- **技术验证**：基于 React + @toeverything/infra 架构验证浏览器侧 AST/DSL 解析、流程构建与图形渲染的可行性，为后续运行时追踪、AI 辅助建模、跨语言支持打基础。
- **长期愿景**：构建自定义 DSL，允许用户以简洁语法描述架构/业务流程/系统拓扑，自动映射到现有白板图形并支持二次编辑、美化、协作。

## 2. 使用范围与输入约束
- **输入形态**：
  - JavaScript / TypeScript 源代码片段。
  - Yunke Flow DSL（自定义语法糖）。
  - 后续扩展：多语言源代码、自然语言 → DSL（AI 生成）。
- **语法范围**：
  - **代码模式**：
    - MVP：函数定义、条件(if/else/switch)、循环(for/while/for..of)、try/catch、return/break/continue、async/await。
    - 进阶：解构、可选链、泛型、装饰器、生成器、顶层 await、模块导入分析。
  - **DSL 模式**：
    - MVP：节点声明、分组、连接、标签、主题。
    - 进阶：宏/模板、引用已有代码、图层、条件渲染、数据绑定。
- **代码来源**：手动粘贴、文件上传、白板块引用；后续可支持从仓库检索或编辑器选区。
- **使用场景**：课程演示、团队评审、技术方案撰写、复杂架构建模。

## 3. 功能需求
### 3.1 解析层
- **代码解析器**：使用 `@babel/parser` 或 TypeScript Compiler（Worker 中运行）生成 AST，按语法范围动态配置插件；提供解析耗时、节点计数统计。
- **DSL 解析器**：基于 PEG.js/nearley 或自研 LL(1) Parser，将 Yunke Flow DSL 转换为抽象语法树；语法定义版本化管理。
- **错误反馈**：统一错误对象（类型、行列、建议），前端展示并定位代码/DSL 文本。

### 3.2 语义构建层
- 将 AST 转换为内部流程/拓扑模型（节点、边、属性、范围）。
- 节点类型：开始/结束、语句、条件、循环、异常、函数调用、服务组件、数据源等；可扩展。
- 支持作用域与嵌套结构；对未知语法生成 `Unknown` 节点并保留原文本。
- DSL 节点与 Blocksuite 元素映射：矩形、菱形、群组、连接器（参考 blocksuite/yunke/model/src/elements/mindmap/mindmap.ts:44）。

### 3.3 渲染层
- 输出目标：
  - Mermaid Flowchart DSL（便于复制/导出）。
  - Yunke 图形 JSON（直接生成白板元素）。
- 在白板内创建真实元素，继承现有编辑能力（拖拽、样式、动画），利用 `LocalConnectorElementModel` 连接线能力（blocksuite/yunke/model/src/elements/mindmap/mindmap.ts:155）。
- 支持主题：默认、暗色、课程专用；可配置节点色、字体、阴影。
- 提供对齐/自动布局策略：分层布局、Sugiyama 算法、力导向（MVP 至少提供分层布局 + 简单手动微调）。

### 3.4 交互与编辑
- 代码/DSL 编辑区：语法高亮、实时校验、Prettier 格式化按钮。
- 图形区域：节点点击高亮对应代码行，反向联动；节点信息面板展示属性/注释。
- 支持拖拽重排、节点样式修改（颜色、图标、标签、徽标）；同步更新底层模型。
- 导入导出：Mermaid 文本、SVG/PNG、Yunke 白板块；支持版本保存、历史回滚。
- 提供模板库：常见流程/架构 DSL 示例，一键生成后可编辑。

### 3.5 高级能力
- **宏与模板**：用户可定义 `macro`/`component`，复用模块；支持参数化和默认样式。
- **引用现有代码**：DSL 中 `use function path/to/file.ts#getData` 自动解析代码生成子图。
- **多视图**：流程图、架构拓扑、时序图（后续与 Mermaid/自研渲染器结合）。
- **协同**：生成的图作为白板元素，自带协同能力，无需额外实现。

## 4. 非功能需求
- **性能**：1000 行以内代码解析+渲染 ≤ 2s；DSL 文本 5k 字以内解析 ≤ 1s；Worker 内存 ≤ 200MB。
- **安全**：浏览器侧解析，禁止执行；上传文件只在本地缓存；Mermaid/DSL 渲染前做 XSS 过滤。
- **可维护性**：解析、语义构建、渲染三层解耦；DSL 语法文件与版本控制；Vitest 覆盖率 ≥ 70%。
- **可扩展性**：预留插件系统，允许注册新节点类型、布局器、导出器。

## 5. 运行架构设计
- **前端页面**：新建 Workbench 页面模块，使用 `configureBrowserWorkbenchModule` 已有 DI 流程挂载（packages/frontend/apps/web/src/app.tsx:12）。
- **Web Worker**：
  - 独立 Worker 处理 AST/DSL 解析与语义构建；与主线程通过 `postMessage` 传输 JSON。
  - 复用 `getWorkerUrl` + `StoreManagerClient` 的初始化模式保证资源管理（packages/frontend/apps/web/src/app.tsx:31，packages/common/nbstore/src/worker/client.ts:52）。
- **渲染引擎**：利用 Blocksuite 元素 API 创建节点/连线；必要时新增自定义元素扩展集。
- **后端（可选）**：提供 CLI/服务端渲染导出高分辨率图、批量生成；非 MVP 必选。

## 6. 迭代规划
- **MVP 范围速览**（评审确认）
  - **输入支持**：JS/TS 函数级片段 + Yunke Flow DSL 基础语法（节点、连接、分组、主题）。
  - **解析能力**：Babel AST → 控制流模型；DSL Parser → 拓扑模型；统一错误提示。
  - **渲染能力**：生成 Mermaid 文本 + 白板矩形/菱形节点与连接线；提供分层布局与手动调整。
  - **交互体验**：代码/DSL 编辑区、高亮联动、主题切换、导出 Mermaid、保存为白板块。
  - **非功能**：单页内 1000 行代码 2s 内渲染、Worker 内存 < 200MB、安全解析、本地处理。
- **里程碑0：DSL 草案验证**
  - 定义语法文档和 BNF。
  - 实现最简 Parser，输出 JSON。
  - 手动映射成白板节点做演示。
- **里程碑1（MVP）**：
  - 代码解析 + 基础流程图。
  - DSL 支持节点/连线/分组生成白板元素。
  - Mermaid 导出、错误提示、主题切换。
- **里程碑2**：
  - DSL 宏/模板、子图折叠、SVG 导出。
  - 代码/DSL 混合引用、节点样式编辑同步。
  - 文件载入、版本管理。
- **里程碑3**：
  - 运行时追踪 & Trace 回放。
  - AI 辅助（自动生成 DSL、图形评论）。
  - 多语言解析插件体系。

## 7. 验收指标
- **功能性**：MVP 支持不少于 10 个 JS/TS 示例与 10 个 DSL 模板正确生成图；DSL 宏能复用并正确渲染。
- **体验**：解析错误 3s 内提示；默认布局可读，无严重重叠；节点拖拽后 1s 内完成布局刷新。
- **可维护**：文档完善（语法手册、开发指南、API）；Vitest 单测覆盖率 ≥ 70%，关键链路端到端用例。
- **性能**：1000 行代码解析渲染耗时 ≤ 2s；Worker 释放后内存回收正常。

## 8. 依赖与风险
- **依赖**：Babel/TypeScript 编译器、PEG/nearley Parser、Blocksuite 图形 API、Mermaid、自研布局算法、Prettier。
- **风险**：
  - DSL 语法复杂度高导致学习成本上升；需提供可视化编辑/模板减少门槛。
  - 大图布局性能压力；可能需引入增量布局或虚拟化渲染。
  - 多语言解析需大量语法适配，建议逐步投入。
  - Mermaid 在节点过多时性能瓶颈，需准备备用渲染方案。

## 9. 开放问题
1. DSL 是否需要支持条件/循环语法（例如 `if`、`for`）来动态生成图？
2. 是否需要跨文件调用图、依赖图（模块级 vs 函数级）？
3. 代码/DSL 输入是否需要后端存储与团队共享？
4. 版本管理、历史对比是否纳入 MVP 还是后续迭代？
5. AI 能力：是做推荐模板、语法补全，还是直接生成完整 DSL？
6. 布局算法是否需要自研（结合 Blocksuite 渲染性能）？

## 10. Yunke Flow DSL 语法设计草案
### 10.1 设计原则
- 人类可读、键盘友好，兼顾可视化与结构化描述。
- 一等公民：节点、连线、分组、模板、样式。
- 可组合：支持模块化导入、宏、参数。
- 与代码解析互补：DSL 可引用代码片段，反向将 AST 转换为 DSL。

### 10.2 基础语法示例
```plain
diagram "Workspace Sync" {
  theme dark
  node frontend.app label "Web App" icon browser color #5B8DEF
  node worker.yjs type worker label "Shared Worker"
  group storage label "Storage Layer" {
    node idb type database label "IndexedDB Cache"
    node cloud type service label "Cloud Doc Storage"
  }

  frontend.app -> worker.yjs : "pushUpdate()"
  worker.yjs -> storage.idb : cache
  worker.yjs -> storage.cloud : sync when online
}
```
- `diagram` 定义图；`theme` 选择主题；`node` 支持 `type`、`label`、`icon`、`color`；`group` 创建分组；`->` 定义带标签的有向连线。

### 10.3 高级语法
```plain
component NBStoreSync(space) {
  group storage label "${space} Storage" {
    node ${space}.cache type database label "${space} Cache"
    node ${space}.cloud type service label "${space} Cloud"
  }
}

import "./components/nbstore.dsl"

diagram "Realtime Sync" {
  use NBStoreSync("workspace")
  node app type browser label "Editor" style rounded shadow
  app -> workspace.cache
  app -> workspace.cloud when online
}
```
- `component` 定义可复用模块，参数化；`use` 调用模块；`style` 支持样式标记；`when` 定义条件标签。

### 10.4 语法要素
- **节点**：`node <id> [type <type>] [label "..."] [icon <name>] [color <#hex>] [style <...>]`
- **分组**：`group <id> label "..." { ... }`
- **连接**：`A -> B [: label] [when condition] [style dashed]`
- **注释**：`// inline`、`/* block */`
- **模板/宏**：`component`、`use`、`macro`
- **导入**：`import "path"`
- **主题**：`theme default|dark|course`
- **布局 hint**：`layout horizontal|vertical|grid`、`order <list>`

### 10.5 解析输出结构
```ts
interface DiagramModel {
  id: string;
  title: string;
  theme: Theme;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
  componentsUsed: string[];
}
```
- `DiagramNode` 映射到 Blocksuite 元素结构；保留源 DSL 位置信息以便反向定位。
- 解析结果在 Worker 中序列化传回主线程，由渲染引擎创建白板节点。

## 11. 开发路线建议
1. **DSL 规范冻结**：完成语法文档、BNF、示例集合，并在课程中展示。
2. **解析框架选择**：评估 PEG.js vs nearley vs 自研；确认性能与可维护性。
3. **PoC**：实现最简 DSL → 白板节点生成，验证 Blocksuite 元素 API 可行性。
4. **模块化实现**：
   - 解析模块：AST/DSL Parser、错误系统。
   - 语义模块：节点建模、布局器接口。
   - 渲染模块：白板元素创建、样式系统、交互。
   - 工具模块：模板库、导入导出、版本管理。
5. **课程整合**：准备教学案例、动手实验、作业模板，展示从 DSL 文本到架构图的全流程。
