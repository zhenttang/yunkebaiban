# 主题编辑器变量分析文档

本文档详细说明了主题编辑器中各个样式字段管理的UI部分。

## 变量命名规则

所有CSS变量都以 `--yunke-` 或 `--yunke-v2-` 开头，使用斜杠 `/` 分隔层级。

## 主要分类说明

### 1. `aI/` - AI功能相关
- **用途**: 控制AI功能相关的UI样式
- **包含字段**:
  - `applyBackground` - AI应用操作的背景色
  - `applyDeleteHighlight` - 删除高亮背景色
  - `applyTextHighlight` - 文本高亮颜色
  - `applyTextHighlightBackground` - 文本高亮背景色
  - `errorBackground` - 错误背景色
  - `errorDetailBackground` - 错误详情背景色
  - `errorText` - 错误文本颜色
  - `thinkingOutputBackground` - AI思考输出背景色
  - `thinkingOutputText` - AI思考输出文本颜色
  - `userTextBackground` - 用户文本背景色

### 2. `block/` - 文档块相关
- **用途**: 控制文档中各种块元素的样式
- **子分类**:
  - `callout/` - 标注块（背景和图标颜色，支持多种颜色：blue/green/grey/magenta/orange/purple/red/teal/yellow）
  - `code/` - 代码块
    - `lineNum` - 行号颜色
  - `comment/` - 评论相关
    - `hanelActive` - 激活状态背景
    - `highlightActive` - 激活高亮
    - `highlightDefault` - 默认高亮
    - `highlightUnderline` - 下划线高亮
  - `divider/` - 分割线
    - `divider` - 分割线颜色
  - `footnote/` - 脚注
    - `numberBg` - 数字背景色
    - `numberBgHover` - 悬停时数字背景色
  - `list/` - 列表
    - `header` - 列表头颜色
  - `notSupportedBlock/` - 不支持的块
    - `background` - 背景色
    - `inlineBg/default` - 内联默认背景
    - `inlineBg/hover` - 内联悬停背景
  - `recordBlock/` - 记录块
    - `buttonBg` - 按钮背景
    - `primary` - 主色
    - `secordary` - 次色
    - `timelineIndeicator` - 时间线指示器颜色

### 3. `button/` - 按钮相关
- **用途**: 控制各种按钮的样式
- **包含字段**:
  - `actionActive` - 激活状态背景
  - `badgesColor` - 徽章颜色
  - `buttonOverHover` - 悬停背景
  - `checkBox` - 复选框颜色
  - `disable` - 禁用状态颜色
  - `emptyIconBackground` - 空图标背景
  - `error` - 错误按钮颜色
  - `iconButtonSolid` - 图标按钮实心背景
  - `innerBlackBorder` - 内部黑色边框
  - `primary` - 主按钮颜色
  - `pureWhiteText` - 纯白文本颜色
  - `secondary` - 次按钮颜色
  - `success` - 成功按钮颜色
  - `templateLabelBackground` - 模板标签背景
  - `grabber/` - 抓取器
    - `select` - 选中状态
    - `default` - 默认状态
  - `mobile/` - 移动端按钮
    - `aIActionBackground` - AI操作背景
    - `deletedAction` - 删除操作颜色
  - `sidebarButton/` - 侧边栏按钮
    - `background` - 背景色
  - `siderbarPrimary/` - 侧边栏主按钮
    - `background` - 背景色
  - `signinbutton/` - 登录按钮
    - `background` - 背景色

### 4. `chip/` - 标签/芯片组件
- **用途**: 控制标签和芯片组件的样式
- **子分类**:
  - `label/` - 标签样式（支持多种颜色：blue/green/grey/magenta/orange/purple/red/teal/yellow/white）
    - `text` - 文本颜色
  - `tag/` - 标签样式（支持多种颜色：blue/green/grey/orange/purple/red/teal/yellow）

### 5. `edgeless/` - 无边界画布
- **用途**: 控制无边界画布模式下的所有元素样式
- **子分类**:
  - `alignment/` - 对齐辅助线
    - `edgeGuides` - 边缘引导线颜色
    - `guides` - 引导线颜色
  - `frame/` - 框架/容器
    - `background/` - 背景色（支持多种颜色：black/blue/green/grey/magenta/orange/purple/red/teal/white/yellow）
    - `border/` - 边框
      - `active` - 激活状态边框
      - `default` - 默认边框
    - `fontColor/` - 字体颜色
      - `font` - 字体颜色
  - `group/` - 组合/分组
    - `background/` - 背景色
      - `background` - 背景颜色
    - `border/` - 边框
      - `active` - 激活状态
      - `borderHint` - 边框提示
      - `hover` - 悬停状态
    - `fontColor/` - 字体颜色
      - `active` - 激活状态
      - `default` - 默认状态
      - `hover` - 悬停状态
      - `rename` - 重命名状态
  - `line/` - 线条（支持多种颜色：black/blue/green/grey/magenta/orange/purple/red/teal/white/yellow）
  - `lock/` - 锁定状态
    - `locked` - 锁定颜色
  - `mindMap/` - 思维导图
    - `line` - 线条颜色
  - `note/` - 便签（支持多种颜色：black/blue/green/grey/magenta/orange/purple/red/teal/white/yellow）
  - `palette/` - 调色板
    - `black` / `white` - 基础颜色
    - `heavy/` - 深色系（支持多种颜色）
    - `light/` - 浅色系（支持多种颜色）
    - `medium/` - 中等色系（支持多种颜色）
  - `selection/` - 选择框
    - `selectionMarqueeBackground` - 选框背景
    - `selectionMarqueeBorder` - 选框边框
  - `shape/` - 形状（支持多种颜色：black/blue/green/grey/magenta/orange/purple/red/teal/white/yellow）
  - `edgelessToolbar/` - 工具栏
    - `highlightPen/` - 高亮笔工具（各种渐变和阴影效果）
    - `media/` - 媒体工具
      - `whiteVector` - 白色矢量颜色
    - `note/` - 便签工具
      - `background` - 背景色
      - `textColor` - 文本颜色
    - `others/` - 其他工具（渐变和线性效果）
    - `penEraser/` - 画笔/橡皮擦工具（各种阴影和高光效果）

### 6. `icon/` - 图标相关
- **用途**: 控制图标的各种状态和颜色
- **包含字段**:
  - `activated` - 激活状态颜色
  - `disable` - 禁用状态颜色
  - `fileIconBorder` - 文件图标边框
  - `monotone` - 单色图标颜色
  - `primary` - 主图标颜色
  - `secondary` - 次图标颜色
  - `tertiary` - 第三级图标颜色
  - `transparentBlack` - 透明黑色
  - `fileIconColors/` - 文件图标颜色（支持多种颜色：blue/green/grey/magenta/purple/red/yellow）

### 7. `input/` - 输入框相关
- **用途**: 控制输入框的样式
- **包含字段**:
  - `background` - 背景色
  - `scrollBar/handle` - 滚动条手柄颜色
  - `border/` - 边框
    - `active` - 激活状态边框
    - `default` - 默认边框
    - `error` - 错误状态边框

### 8. `layer/` - 图层/背景
- **用途**: 控制应用的整体背景和图层样式
- **包含字段**:
  - `black` / `white` / `pureBlack` / `pureWhite` - 基础颜色
  - `insideBorder/` - 内部边框
    - `blackBorder` - 黑色边框
    - `border` - 默认边框
    - `primaryBorder` - 主边框
    - `splitviewActived` - 分割视图激活边框
    - `whiteBorder` - 白色边框
  - `background/` - 背景色
    - `codeBlock` - 代码块背景
    - `edgelessGrid` - 无边界画布网格背景
    - `error` - 错误背景
    - `hoverOverlay` - 悬停遮罩
    - `linkedDocOnEdgeless` - 无边界画布上的链接文档背景
    - `modal` - 模态框背景
    - `modalWhite` - 白色模态框背景
    - `overlayPanel` - 覆盖面板背景
    - `primary` - 主背景色
    - `processing` - 处理中背景
    - `secondary` - 次背景色
    - `success` - 成功背景
    - `tertiary` - 第三级背景
    - `translucentUI` - 半透明UI背景
    - `warning` - 警告背景
    - `mobile/` - 移动端背景
      - `iOSControl` - iOS控件背景
      - `modal` - 模态框背景
      - `primary` - 主背景
      - `secondary` - 次背景
      - `tertiary` - 第三级背景

### 9. `text/` - 文本相关
- **用途**: 控制文本的各种状态和颜色
- **包含字段**:
  - `disable` - 禁用文本颜色
  - `emphasis` - 强调文本颜色
  - `link` - 链接颜色
  - `listDotAndNumber` - 列表点和数字颜色
  - `placeholder` - 占位符颜色
  - `primary` - 主文本颜色
  - `pureWhite` - 纯白文本
  - `secondary` - 次文本颜色
  - `tertiary` - 第三级文本颜色
  - `highlight/` - 文本高亮
    - `border` - 高亮边框
    - `bg/` - 高亮背景（支持多种颜色：blue/green/grey/magenta/orange/purple/red/teal/yellow）
    - `fg/` - 高亮前景（支持多种颜色：blue/green/grey/magenta/orange/purple/red/teal/yellow）

### 10. `table/` - 表格相关
- **用途**: 控制表格的样式
- **包含字段**:
  - `border` - 边框颜色
  - `focusBackground` - 聚焦背景
  - `focusBorder` - 聚焦边框
  - `textSecondary` - 次要文本颜色
  - `headerBackground/` - 表头背景（支持多种颜色：blue/green/grey/orange/purple/red/teal/yellow/default）
    - `headerColor` - 表头颜色
  - `indicator/` - 指示器
    - `activated` - 激活状态
    - `border` - 边框
    - `drag` - 拖拽状态
    - `hover` - 悬停状态
    - `pointerActive` - 指针激活状态
    - `pointerDefault` - 指针默认状态

### 11. `tab/` - 标签页
- **用途**: 控制标签页的样式
- **包含字段**:
  - `divider/` - 分割线
    - `divider` - 分割线颜色
    - `indicator` - 指示器颜色
  - `fontColor/` - 字体颜色
    - `active` - 激活状态
    - `default` - 默认状态
    - `hover` - 悬停状态
  - `iconColor/` - 图标颜色
    - `active` - 激活状态
    - `default` - 默认状态
    - `hover` - 悬停状态
  - `tabBackground/` - 标签背景
    - `active` - 激活状态
    - `default` - 默认状态
    - `hover` - 悬停状态

### 12. `toggle/` - 开关/切换
- **用途**: 控制开关组件的样式
- **包含字段**:
  - `background` - 激活背景色
  - `backgroundDisable` - 禁用背景色
  - `backgroundOff` - 关闭状态背景
  - `foreground` - 前景色（开关按钮）
  - `foregroundDisable` - 禁用前景色

### 13. `switch/` - 开关组件
- **用途**: 控制开关组件的样式（与toggle类似但更详细）
- **包含字段**:
  - `buttonBackground/` - 按钮背景
    - `active` - 激活状态
    - `hover` - 悬停状态
  - `fontColor/` - 字体颜色
    - `primary` - 主色
    - `secondary` - 次色
    - `tertiary` - 第三级颜色
  - `iconColor/` - 图标颜色
    - `active` - 激活状态
    - `default` - 默认状态
  - `switchBackground/` - 开关背景
    - `background` - 背景色

### 14. 其他分类

#### `adjustmentHandle/` - 调整手柄
- `background` - 背景色
- `border` - 边框颜色

#### `backlinks/` - 反向链接
- `blockBackgroundColor` - 块背景色
- `blockBorder` - 块边框
- `blockHover` - 块悬停状态

#### `badge/` - 徽章
- `believer` - 信徒徽章
- `free` - 免费徽章
- `pro` - 专业版徽章

#### `calendar/` - 日历
- 支持多种颜色：blue/green/grey/magenta/orange/purple/red/teal/yellow

#### `centerPeek/` - 中央预览
- `background` - 背景色
- `buttonBackground` - 按钮背景
- `icon` - 图标颜色
- `overlay` - 遮罩颜色

#### `chatBlock/` - 聊天块
- `chatBlockBg` - 背景色
- `chatBlockBoder` - 边框颜色
- `chatBlockIcon` - 图标颜色
- `chatBlockText` - 文本颜色

#### `database/` - 数据库
- `border` - 边框颜色
- `buttonBackground` - 按钮背景
- `cardHover` - 卡片悬停
- `filterHeaderFadeIn` - 筛选器头部淡入
- `filterHeaderFadeOut` - 筛选器头部淡出
- `focusBackground` - 聚焦背景
- `textSecondary` - 次要文本
- `attachment/fileSolidBackground` - 附件文件实心背景

#### `dialog/` - 对话框
- `background/primary` - 主背景色

#### `integrations/` - 集成
- `background/iconSolid` - 图标实心背景

#### `loading/` - 加载状态
- `background` - 背景色
- `backgroundLayer` - 背景层
- `foreground` - 前景色
- `imageLoadingBackground` - 图片加载背景
- `imageLoadingLayer` - 图片加载层

#### `others/` - 其他
- `warnLabel/` - 警告标签（black/yellow）

#### `pagelist/` - 页面列表
- `hoverBorder` - 悬停边框

#### `portrait/` - 头像
- `localPortrait` - 本地头像
- `localPortraitBackground` - 本地头像背景

#### `radio/` - 单选按钮
- `disable` - 禁用状态
- `active/chekced` - 选中状态
- `active/default` - 默认状态

#### `readwise/` - Readwise集成
- `quoteBackground` - 引用背景
- `quoteDivider` - 引用分割线

#### `segment/` - 分段
- `background` - 背景色
- `button` - 按钮颜色

#### `selfhost/` - 自托管版本
- 包含完整的按钮、图标、图层、文本、切换等样式配置

#### `skeleton/` - 骨架屏
- `skeleton` - 骨架屏颜色

#### `slashMenu/` - 斜杠菜单
- `background` - 背景色

#### `status/` - 状态
- `error` - 错误状态
- `success` - 成功状态

#### `toast/` - 提示消息
- `cardLayer/second` - 第二层卡片
- `cardLayer/third` - 第三层卡片
- `iconState/error` - 错误图标
- `iconState/regular` - 常规图标
- `iconState/success` - 成功图标
- `overlay/secondary` - 次遮罩
- `overlay/tertiary` - 第三级遮罩

#### `tooltips/` - 工具提示
- `background` - 背景色
- `foreground` - 前景色
- `secondaryBackground` - 次背景色

#### `workspacePicker/` - 工作区选择器
- `border` - 边框颜色
- `secondaryBackground` - 次背景色

#### `tableOfContent/` - 目录
- `background` - 背景色

## 颜色命名约定

主题变量支持多种颜色变体，常见的颜色包括：
- `black` - 黑色
- `white` - 白色
- `blue` - 蓝色
- `green` - 绿色
- `grey` / `gray` - 灰色
- `magenta` - 洋红色
- `orange` - 橙色
- `purple` - 紫色
- `red` - 红色
- `teal` - 青绿色
- `yellow` - 黄色

## 状态命名约定

常见的状态后缀：
- `active` - 激活状态
- `default` - 默认状态
- `hover` - 悬停状态
- `disable` / `disabled` - 禁用状态
- `error` - 错误状态
- `success` - 成功状态
- `warning` - 警告状态

## 版本说明

- **v1**: 旧版本主题变量
- **v2**: 新版本主题变量（推荐使用）

## 使用建议

1. **颜色变量**: 如果变量名包含 `color`、`background`、`bg`、`border` 等关键词，通常使用颜色选择器
2. **文本变量**: 文本相关的变量通常使用文本输入框
3. **复杂组件**: 某些组件（如 `edgelessToolbar`）包含复杂的渐变和阴影效果，需要谨慎修改

## 注意事项

- 修改主题变量会影响整个应用的视觉外观
- 建议在修改前先备份当前主题
- 某些变量之间有依赖关系，修改一个可能影响其他相关元素
- 暗黑模式和明亮模式需要分别配置

