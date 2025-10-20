# 测试与风险控制计划

## 1. 测试范围
- Parser 层：代码解析器、DSL 解析器。
- Transformer 层：AST → FlowGraph、DSL AST → DiagramModel。
- Renderer 层：Mermaid 导出、Blocksuite 元素生成、布局模块。
- UI 层：Workbench 页面交互、错误提示、导出功能。
- Worker 通信：消息协议、异常处理、超时重试。

## 2. 单元测试（Vitest）
| 模块 | 用例 | 内容 |
| --- | --- | --- |
| code-parser | 正常解析 | JS/TS 样例输出 AST 快照 |
| code-parser | 错误处理 | 非法语法抛出 diagnostics |
| dsl-parser | 基础语法 | 节点/连线解析正确 |
| dsl-parser | 组件展开 | use + 参数替换正常 |
| transform/code | if/for/try 生成 FlowGraph 结构 |
| transform/dsl | group/edge/style 映射保持属性 |
| layout | 分层布局 | 输入图输出坐标稳定 |
| mermaid | 导出语法 | 节点/连接转为正确 DSL |
| renderer | 元素数量 | DiagramModel 渲染节点数正确 |

- 使用快照对比时注意稳定排序（节点 ID 生成器 deterministic）。
- 覆盖率目标：语句 70%，分支 60%。

## 3. 集成测试（Playwright/Vitest E2E）
- 场景 1：输入基础代码 → 生成流程图 → 图节点可点击高亮。
- 场景 2：输入 DSL（含 group 和 component）→ 渲染白板 → 拖拽节点重排。
- 场景 3：语法错误时显示错误面板，旧图保持。
- 场景 4：导出 Mermaid 按钮可复制文本。
- 场景 5：Worker 超时（模拟慢解析）→ UI 提示重试。

## 4. 性能测试
- 使用 Vitest + Benchmark：
  - 解析 500/1000/2000 行代码，记录 parse + transform 耗时。
  - 渲染 100/300/500 节点图，验证布局耗时与帧率。
- 记录在 `docs/perf/` 中，持续跟踪。

## 5. 风险与缓解
| 风险 | 影响 | 缓解措施 |
| --- | --- | --- |
| 复杂语法导致解析失败 | 功能不可用 | MVP 收敛语法；快速错误提示；提供兼容指南 |
| 布局性能不足 | 图形卡顿 | 提供手动布局；限制节点数；异步渲染 |
| Worker 与主线程同步问题 | UI 卡死 | 限制并发、设置超时、提供取消按钮 |
| DSL 学习成本 | 用户抵触 | 提供模板库、语法提示、示例说明 |
| 依赖升级破坏 | 构建失败 | 锁定版本、引入 pnpm/yarn resolutions、CI 跑测试 |

## 6. 工具与自动化
- Lint：ESLint + custom rules（禁止在主线程做繁重解析）。
- 格式化：Prettier（代码/DSL 模板非 JSON 时也格式化）。
- CI：
  - `yarn test flowchart` → 运行所有相关单测。
  - `yarn e2e flowchart` → Playwright 无头。
  - `yarn lint flowchart` → Module 范围 lint。

## 7. 可观测性
- 在 dev 模式下提供调试面板：显示最新请求、耗时、错误码、Mermaid 结果。
- 抛错时向 `console` 打印结构化日志，便于学员调试。
- 预留 Hook 与监控平台对接（后续）。

## 8. 验收前检查清单
1. 所有单元测试通过，覆盖率达标。
2. E2E 用例跑通，关键路径无回归。
3. 性能报告符合目标。
4. 文档齐全：使用手册、API、DSL 语法。
5. Demo 白板/视频准备完成，供课程使用。

