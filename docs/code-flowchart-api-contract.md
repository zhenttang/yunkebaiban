# Flowchart 服务接口 & 消息协议

## 1. 主线程服务接口
### 1.1 FlowchartService
```ts
interface FlowchartService {
  parseCode(options: ParseCodeOptions): Promise<FlowGraphResult>;
  parseDSL(options: ParseDslOptions): Promise<DiagramResult>;
  buildDiagram(options: BuildDiagramOptions): Promise<DiagramResult>;
  exportMermaid(model: DiagramModel, options?: ExportOptions): string;
  renderToBoard(model: DiagramModel, target: SurfaceRef, opts?: RenderOptions): Promise<RenderResult>;
}
```

### 1.2 类型定义
```ts
interface ParseCodeOptions {
  source: string;
  language: 'js' | 'ts';
  enableJSX?: boolean;
  features?: ParserFeature[]; // e.g. ['asyncAwait','switch']
  requestId?: string;
}

interface ParseDslOptions {
  source: string;
  scope?: string; // for namespacing imports/components
  requestId?: string;
}

interface BuildDiagramOptions {
  sourceType: 'code' | 'dsl';
  source: string;
  language?: 'js' | 'ts';
  config?: DiagramConfig;
}

interface FlowGraphResult {
  graph: FlowGraph;
  diagnostics: Diagnostic[];
  perf: { parseMs: number; transformMs: number };
}

interface DiagramResult {
  model: DiagramModel;
  diagnostics: Diagnostic[];
  perf: { parseMs: number; transformMs: number; layoutMs?: number };
}
```

## 2. Worker 消息协议
### 2.1 Request
```ts
type WorkerRequest =
  | { type: 'parse-code'; id: string; payload: ParseCodeOptions }
  | { type: 'parse-dsl'; id: string; payload: ParseDslOptions }
  | { type: 'build-diagram'; id: string; payload: BuildDiagramOptions };
```

### 2.2 Response
```ts
type WorkerResponse =
  | { type: 'success'; id: string; payload: FlowGraphResult | DiagramResult }
  | { type: 'error'; id: string; payload: WorkerError };

interface WorkerError {
  kind: 'ParserError' | 'TransformError' | 'LayoutError' | 'InternalError';
  message: string;
  stack?: string;
  diagnostics?: Diagnostic[];
}
```
- 所有消息以 `MessagePort` 传输，使用 `structuredClone` 安全传递。
- Worker 端维护队列与超时（默认 5s），发生超时报 InternalError。

## 3. 校验策略
- 主线程在请求前执行快速校验：
  - 代码长度 <= 3000 行（MVP）；超出提示拆分。
  - DSL 关键字匹配基础正则，提前捕捉明显错误。
- Worker 端解析后以 `diagnostics` 返回详细错误；若错误严重则 `WorkerError`。
- DiagramModel 生成后进行 schema 校验：节点/边/组 ID 唯一、引用存在、布局信息合理。

## 4. 渲染接口
```ts
interface RenderOptions {
  theme?: Theme;
  autoLayout?: boolean;
  preserveSelection?: boolean;
}

interface RenderResult {
  nodeCount: number;
  edgeCount: number;
  groups: number;
  bounds: { width: number; height: number };
  surfaceId: string;
}
```
- 渲染完成后返回元素数量及画布范围，供 UI 统计。

## 5. 错误码建议
| 错误码 | 类型 | 说明 | 建议文案 |
| --- | --- | --- | --- |
| FC100 | ParserError | 语法解析失败 | 检查语法或补齐括号 | 
| FC110 | ParserError | 不支持的语法特性 | 暂不支持 XXX 语法 |
| FC200 | TransformError | 节点构建失败 | 无法生成流程节点 |
| FC210 | TransformError | 未知引用 | 找不到引用的节点/组件 |
| FC300 | LayoutError | 布局失败 | 自动布局失败，请尝试手动调整 |
| FC999 | InternalError | 未知错误 | 请重试或联系支持 |

## 6. 性能监控
- 主线程记录每次请求耗时，超过阈值（2s）标记 warning。
- Worker 统计解析次数、缓存命中率。
- UI 提供调试面板展示最近 10 次请求的诊断信息。

