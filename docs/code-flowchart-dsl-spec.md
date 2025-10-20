# Yunke Flow DSL 规范草案

## 1. 设计目标
- 使用文本描述复杂架构/流程结构，易读、易写、可版本控制。
- 与 Blocksuite 图形模型一一对应，最少语法即可生成白板可编辑图形。
- 支持组件化、参数化，可重复使用常见拓扑片段。
- 兼容未来扩展：条件逻辑、数据绑定、跨文件引用、AI 生成。

## 2. 关键字与保留字
```
diagram, node, group, component, macro, use, import,
layout, theme, style, when, label, type, icon, color,
width, height, note, data, extends
```
- 关键字大小写敏感（全小写）。
- 标识符遵循 `/[A-Za-z_][A-Za-z0-9_.-]*/`，`.` 用于命名空间。

## 3. 基本语法（EBNF）
```
Document        ::= { ImportDecl | ComponentDecl | DiagramDecl }
ImportDecl      ::= "import" StringLiteral
ComponentDecl   ::= "component" Identifier [ "(" ParamList ")" ] Block
DiagramDecl     ::= "diagram" StringLiteral Block

Block           ::= "{" { Statement } "}"
Statement       ::= NodeDecl | GroupDecl | EdgeDecl | UseStmt | LayoutStmt
                  | ThemeStmt | NoteStmt | StyleStmt | DataStmt

NodeDecl        ::= "node" Identifier NodeOptions
NodeOptions     ::= { NodeOption }
NodeOption      ::= Identifier
                  | "label" StringLiteral
                  | "type" Identifier
                  | "icon" Identifier
                  | "color" ColorLiteral
                  | "style" StyleList
                  | "width" NumberLiteral
                  | "height" NumberLiteral
                  | "note" StringLiteral

GroupDecl       ::= "group" Identifier [ GroupOptions ] Block
GroupOptions    ::= { GroupOption }
GroupOption     ::= "label" StringLiteral | "style" StyleList

EdgeDecl        ::= Identifier EdgeArrow Identifier EdgeOptions
EdgeArrow       ::= "->" | "=>" | "~>"
EdgeOptions     ::= { EdgeOption }
EdgeOption      ::= ":" StringLiteral
                  | "when" Expression
                  | "style" StyleList
                  | "note" StringLiteral

UseStmt         ::= "use" Identifier [ "(" ArgList ")" ]
LayoutStmt      ::= "layout" Identifier { Identifier }
ThemeStmt       ::= "theme" Identifier
NoteStmt        ::= "note" Identifier StringLiteral
StyleStmt       ::= "style" Identifier StyleList
DataStmt        ::= "data" Identifier JsonObject

ParamList       ::= Identifier { "," Identifier }
ArgList         ::= Expression { "," Expression }
StyleList       ::= Identifier { "," Identifier }
Expression      ::= StringLiteral | NumberLiteral | BooleanLiteral
                  | Identifier | Interpolation
Interpolation   ::= "${" Expression "}"
```

## 4. 核心语义规则
1. 所有 `node` 自动注册到当前作用域（diagram 或 group 内部），`use` 展开后节点加入调用上下文。
2. `group` 支持嵌套，内部节点默认继承父 group 样式，可被局部 `style` 覆盖。
3. `EdgeArrow` 不同箭头表示语义：
   - `->` 普通控制流/依赖
   - `=>` 强制/同步依赖（渲染为粗线或实箭头）
   - `~>` 异步/事件触发（渲染为虚线）
4. `style` 列表映射到预设样式，如 `rounded`, `shadow`, `warning` 等。
5. `when` 表达式仅用于展示条件标签，不执行；解析保留原字符串。
6. `data` 允许附加 JSON 元数据，落在白板节点的自定义属性中。
7. `component` 支持参数化，调用时以值替换内部 `${}` 插值；未提供的参数报错。

## 5. 错误类别
- `SyntaxError`: nearley 解析失败，包含期望 token、行列信息。
- `DuplicateNode`: 同一作用域节点重复声明。
- `UndefinedReference`: `Edge` 或 `use` 引用未定义节点/组件。
- `CircularComponent`: 组件递归调用导致死循环。
- `InvalidColor`: 颜色值不符合 Hex/RGB 标准。
- `MissingArgument`: 组件调用缺少必填参数。

## 6. 样式表（预设）
| 样式名 | 描述 | 默认效果 |
| --- | --- | --- |
| `rounded` | 圆角矩形 | `border-radius: 16px` |
| `shadow` | 投影 | `box-shadow: 0 8px 16px rgba(0,0,0,0.12)` |
| `database` | 数据源图标 | 图形替换为 cylinder |
| `service` | 服务节点 | 带齿轮图标、蓝色背景 |
| `warning` | 警告 | 黄色背景、⚠️ 图标 |
| `success` | 成功 | 绿色背景、✔️ 图标 |

## 7. 布局指示
- `layout horizontal` / `layout vertical`：指示主流向。
- `layout grid <n>`：按列/行平铺。
- `layout swimlane <lane1> <lane2>`：将节点按 `data.lane` 分类。

## 8. 大小与单位
- `width` / `height` 单位 px，默认 180x80。
- 若省略，Renderer 根据文本长度自适应。

## 9. 扩展语法预留
- `extends`：组件继承或图继承，可覆盖节点。
- `macro`：轻量级模板，不生成独立作用域。
- `include`：内联其他 DSL 片段。
- `scenario`：为同一 diagram 定义多视角视图。

## 10. 示例与输出映射
见《docs/code-flowchart-sample-library.md》。

