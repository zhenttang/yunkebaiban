# 代码/DSL → 图形 技术设计草案

## 1. 模块概览
```
+--------------------+        +-----------------+        +-----------------+
|   Flowchart Page   |<------>| FlowchartWorker |<------>| Parser Modules  |
| (React Workbench)  |   IPC  |  (SharedWorker) |   AST  |  (Babel / DSL)  |
+--------------------+        +-----------------+        +-----------------+
          |                           |                             |
          v                           v                             v
+--------------------+        +-----------------+        +-----------------+
|  Renderer Service  |------->| Diagram Builder |<-------| Transformer API |
| (Blocksuite + UI)  | Graph  | (Graph → Nodes) |  Graph | (AST → Graph)   |
+--------------------+        +-----------------+        +-----------------+
```

## 2. 包结构建议
```
packages/
  frontend/
    core/
      src/modules/
        flowchart/
          index.ts            # DI 注册，暴露服务
          worker/
            flowchart.worker.ts
            messages.ts        # 类型定义
          parser/
            code-parser.ts     # Babel 封装
            dsl-parser.ts      # DSL parser
            ast-types.ts
          transform/
            code-to-graph.ts
            dsl-to-graph.ts
            graph-types.ts
          renderer/
            blocksuite-adapter.ts
            mermaid-exporter.ts
            layout/
              layered-layout.ts
          ui/
            FlowchartWorkbenchView.tsx
            components/
              CodeEditor.tsx
              DiagramPreview.tsx
              ErrorPanel.tsx
```

## 3. Parser 设计
### 3.1 代码解析器 (`code-parser.ts`)
- 使用 `@babel/parser` 搭配 `@babel/types`；配置 `sourceType: "module"`，plugins 包含 `typescript`、`jsx`（可开关）。
- 输入：`ParseCodeOptions { source: string; language: 'js'|'ts'; features?: ParserFeature[] }`
- 输出：`ParseResult<Babel.File>`，包含 AST、diagnostics、耗时。
- Worker 中保留缓存：对相同输入 hash 命中直接返回。

### 3.2 DSL 解析器 (`dsl-parser.ts`)
- 采用 nearley + moo tokenizer：
  - Tokens：关键词(`diagram`,`node`,`group`,`component`,`use`)、标识符、字符串、颜色、数字、符号(`->`,`{`,`}`)。
  - 语法：参考需求文档第 10 节；生成 AST 节点 `DiagramDeclaration`、`NodeDeclaration` 等。
- 输出：`ParseResult<DiagramAst>`。
- 错误处理：nearley 提供的 error token + 自定义消息，包含期望 token、行列号。

## 4. Transformer 设计
### 4.1 统一图模型 (`graph-types.ts`)
```ts
interface FlowGraph {
  kind: 'flow';
  nodes: FlowNode[];
  edges: FlowEdge[];
  meta: {
    source: 'code' | 'dsl';
    diagnostics: Diagnostic[];
  };
}

interface DiagramModel {
  kind: 'diagram';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
  theme: Theme;
}
```
- FlowGraph 侧重控制流（代码）；DiagramModel 强调拓扑/样式（DSL）。二者可互转。

### 4.2 代码 → FlowGraph (`code-to-graph.ts`)
- 遍历 Babel AST：
  - `FunctionDeclaration` / `ArrowFunctionExpression`：创建入口节点。
  - `IfStatement`、`SwitchStatement`：生成条件节点（True/False 分支）。
  - `For/While`：生成循环节点，back-edge 表示回环。
  - `TryStatement`：主流程 + catch/finally 边。
  - `Return`：终止节点。
- 利用 CFG 构建算法：深度优先遍历 + 节点 ID 生成。
- 结果附带 `sourceSpan`，方便高亮。

### 4.3 DSL → DiagramModel (`dsl-to-graph.ts`)
- 解析 AST 生成节点：
  - `node` → `DiagramNode`（附类型、样式）
  - `group` → `DiagramGroup` 包含成员
  - `component` + `use`：以符号表实现宏展开，支持参数替换
  - `A -> B` → `DiagramEdge`（带 label / condition / style）
- 解析主题、布局提示保存在 `meta`。

## 5. Worker 架构
- Worker 接口：
```ts
type WorkerRequest =
  | { type: 'parse-code'; payload: ParseCodeOptions }
  | { type: 'parse-dsl'; payload: ParseDslOptions }
  | { type: 'build-diagram'; payload: BuildDiagramOptions };

type WorkerResponse =
  | { type: 'success'; requestId: string; result: WorkerResult }
  | { type: 'error'; requestId: string; error: WorkerError };
```
- 主线程通过 `FlowchartService` 管理请求队列、超时、并发限制。
- 错误分类：`ParserError`, `TransformError`, `LayoutError`。

## 6. 渲染与布局
### 6.1 Blocksuite 适配 (`blocksuite-adapter.ts`)
- 输入：`DiagramModel`
- 流程：
  1. 创建白板画布（surface）引用。
  2. 遍历节点 → 调用 Blocksuite API 创建对应元素（矩形/菱形/标签）。
  3. 根据布局结果设置 `xywh`。
  4. 遍历 edges → 创建 `LocalConnectorElementModel`，绑定起止节点。
- 样式：根据 `node.type` / `style` 选用配色和 icon。

### 6.2 布局 (`layered-layout.ts`)
- 算法：Sugiyama 分层 + 简化 crossing minimization；若节点数 > N 切换到简单网格。
- 数据：每个节点 `level`、`order`，计算 `x`, `y`, `width`, `height`。
- 手动调整：提供 `useLayoutState()` hook 支持节点拖拽后更新模型。

### 6.3 Mermaid 导出 (`mermaid-exporter.ts`)
- 将 `FlowGraph` / `DiagramModel` 转为 Mermaid DSL。
- 支持 `graph TD` / `graph LR` 方向配置。
- 留意转义，防止 XSS。

## 7. UI 流程
1. 用户在 Workbench 页面输入代码或 DSL。
2. 触发 `onRun` → 调用 FlowchartService：
   - 发送 `parse` 请求 → 获取 AST + diagnostics。
   - 如源为代码：调用 `transformCodeToGraph` → `diagramBuilder.code`。
   - 如源为 DSL：直接 `transformDSLToDiagram`。
3. Worker 返回数据 → 渲染器生成白板元素；同步写入 Mermaid。
4. 错误时更新 ErrorPanel，同时保留上一次成功图形供对比。

## 8. 数据模型 & 类型
- `Diagnostic { severity: 'error'|'warning'; message: string; location?: SourceSpan }`
- `SourceSpan { file?: string; start: { line: number; column: number }; end: {...} }`
- `NodeStyle { color?: string; icon?: string; shape?: 'rect'|'diamond'|'ellipse'; theme?: Theme }`

## 9. 测试策略
- **Parser 单测**：使用快照验证 AST/DSL 输出；注入错误用例确保诊断准确。
- **Transformer**：给定 AST/DSL AST 的 mock，断言输出图模型节点数、连线关系。
- **Renderer**：使用 JSDOM + Blocksuite mock，验证元素数量及属性；E2E 用 Playwright 检查页面交互。
- **性能基准**：在 Vitest 中模拟 1000 行代码解析，记录耗时。

## 10. 未来扩展
- WebAssembly Parser（esbuild/Tree-sitter）以提升性能。
- 运行时 trace：在 Worker 中接入执行日志，生成动态序列图。
- AI 集成：提供 DSL 自动补全、流程解释、错误修复建议。

