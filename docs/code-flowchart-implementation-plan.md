# 代码/DSL → 图形 实施计划

## 1. 汇总
- **目标**：在现有 Yunke 白板前端中落地 MVP 级别的代码/DSL 自动制图能力，实现解析、建模、渲染和交互的闭环。
- **时间拆分**：按模块并行推进，优先交付解析与白板渲染链路，随后补强模板与导出能力。

## 2. 任务拆分
| 序号 | 模块 | 任务 | 依赖 | 输出 | 优先级 |
| --- | --- | --- | --- | --- | --- |
| T1 | 解析 | 选型 Babel + 自定义配置，封装 `parseCode()` API | 无 | Babel 配置、解析封装文档 | HIGH |
| T2 | 解析 | 设计 Yunke Flow DSL BNF，选型 nearley/PEG.js，产出 `parseDSL()` | T1(可并行) | DSL 语法文件、parser 最小实现 | HIGH |
| T3 | 语义 | 定义统一中间模型 `FlowGraph` / `DiagramModel` 接口 | T1、T2 | Type 定义、示例 JSON | HIGH |
| T4 | 语义 | AST→FlowGraph 转换器，覆盖 MVP 语法 | T1、T3 | `transformCodeToGraph` | HIGH |
| T5 | 语义 | DSL AST→DiagramModel 转换器，支持节点/连线/分组 | T2、T3 | `transformDSLToDiagram` | HIGH |
| T6 | Worker | 新建 `flowchart.worker.ts`，封装消息协议、错误类型 | T1~T5 | Worker 脚本、消息 schema | HIGH |
| T7 | 前端 | 创建 Workbench 页面（代码/DSL 输入、图形预览、日志面板） | T6 | React 页面 + 状态管理 | HIGH |
| T8 | 渲染 | 实现 Mermaid 导出 + 预览组件 | T3 | Mermaid renderer、导出按钮 | MEDIUM |
| T9 | 渲染 | 构建 Blocksuite 元素生成器（节点、连线、分组） | T3、T6 | 白板渲染服务、示例白板 | HIGH |
| T10 | 渲染 | 自动布局器 PoC（分层布局 + 手动调整 hook） | T9 | 布局模块、交互脚本 | MEDIUM |
| T11 | 交互 | 代码/图形联动高亮、错误提示 UI、预设主题 | T7、T9 | UI 交互实现 | MEDIUM |
| T12 | 工具 | 模板库（示例 DSL、代码片段）、导出 Mermaid 文本、保存为白板块 | T7、T8、T9 | 模板面板、导出逻辑 | LOW |
| T13 | 测试 | Unit：解析 & 转换；E2E：页面交互 | T1~T11 | Vitest + Playwright 脚本 | HIGH |
| T14 | 文档 | 开发指南、DSL 语法手册、用户说明 | 全局 | README/Docs | MEDIUM |

## 3. 依赖关系图（文字）
1. **基础解析链路**：T1/T2 → T3 → T4/T5 → T6 → T9 → T7/T11。
2. **渲染增强**：T8、T10 在基础链路完成后补充。
3. **工具与文档**：T12、T14 在主流程稳定后迭代。
4. **测试保障**：T13 持续穿插，最终验收前集中跑。

## 4. 里程碑拆分
- **M0（PoC 完成）**：T1~T6 + T9 基础版，实现从 DSL 生成白板简单图形。
- **M1（MVP 字段完成）**：M0 基础上，完成 T4、T7、T8、T11、T13 的关键用例，支持代码/DSL 双向生成、Mermaid 导出、错误提示。
- **M2（体验增强）**：补齐 T10、T12、T14，并迭代性能与模板库。

## 5. 风险与对策
- **解析性能**：提前基准测试 Babel/nearley；若性能不足，考虑增量解析或 WebAssembly 编译器。
- **布局复杂度**：保底提供分层布局 + 手动微调；后续再引入高级布局算法。
- **DSL 学习成本**：提供模板库、语法提示、白板侧可视化编辑。
- **跨模块协同**：建立 `flowchart` 包含 Worker、Parser、Renderer 的公共包，方便测试与复用。

## 6. 下一步
1. 确定 parser 选型（T1/T2），输出 BNF 草案与 API 设计。 
2. 建立 `packages/frontend/core/src/modules/flowchart`（或独立包）骨架，准备 Worker 与服务注入点。 
3. 启动物料收集：典型代码片段、DSL 示例，作为后续模板与自动化测试样例。
