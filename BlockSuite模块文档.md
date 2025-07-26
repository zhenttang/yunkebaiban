# BlockSuite 模块详细文档

## 模块概述

BlockSuite 是项目的核心模块，提供了白板应用的基础框架和所有块类型的实现。它采用模块化设计，分为多个子模块。

## 核心架构

### 1. Framework 框架层 (`blocksuite/framework/`)

框架层提供了 BlockSuite 的基础设施：

#### Global (`framework/global/`)
- **功能**: 全局工具和类型定义
- **主要文件**: `src/index.ts`
- **作用**: 提供全局共享的工具函数和类型

#### Std (`framework/std/`)
- **功能**: 标准化组件和效果
- **主要文件**: 
  - `src/effects.ts` - 标准效果
  - `src/identifier.ts` - 标识符管理
  - `src/index.ts` - 标准组件入口
- **作用**: 定义标准化的组件接口和行为

#### Store (`framework/store/`)
- **功能**: 数据存储管理
- **主要文件**:
  - `src/consts.ts` - 存储常量
  - `src/index.ts` - 存储接口
- **作用**: 管理应用状态和数据持久化

#### Sync (`framework/sync/`)
- **功能**: 数据同步机制
- **主要文件**: `src/index.ts`
- **作用**: 处理多用户协作和数据同步

### 2. Affine 应用层 (`blocksuite/affine/`)

#### All (`affine/all/`)
- **功能**: 统一入口和全局配置
- **主要目录**:
  - `src/blocks/` - 块引用
  - `src/components/` - UI 组件
  - `src/global/` - 全局配置
  - `src/shared/` - 共享工具

#### Blocks (`affine/blocks/`)
块是 BlockSuite 的核心概念，每种块类型提供特定功能：

##### 文本块类型
- **paragraph/** - 段落块
  - `paragraph-block.ts` - 段落块实现
  - `paragraph-keymap.ts` - 键盘映射
- **list/** - 列表块
  - `list-block.ts` - 列表块实现
  - `list-keymap.ts` - 列表键盘操作
- **code/** - 代码块
  - `code-block.ts` - 代码块实现
  - `code-preview-extension.ts` - 代码预览
- **latex/** - LaTeX 公式块
  - `latex-block.ts` - LaTeX 渲染

##### 媒体块类型
- **image/** - 图片块
  - `image-block.ts` - 图片块实现
  - `image-resize-manager.ts` - 图片调整
  - `image-service.ts` - 图片服务
- **attachment/** - 附件块
  - `attachment-block.ts` - 附件处理
  - `attachment-service.ts` - 附件服务

##### 交互块类型
- **bookmark/** - 书签块
- **callout/** - 标注块
- **divider/** - 分隔线块
- **table/** - 表格块
  - `table-block.ts` - 表格实现
  - `table-cell.ts` - 表格单元格
  - `selection-controller.ts` - 选择控制

##### 容器块类型
- **note/** - 笔记容器
- **frame/** - 框架容器
- **database/** - 数据库块
- **data-view/** - 数据视图块

##### 特殊块类型
- **root/** - 根块
- **surface/** - 画布块
- **surface-ref/** - 画布引用块
- **edgeless-text/** - 无边界文本块
- **embed/** - 嵌入块
- **embed-doc/** - 文档嵌入块

#### Components (`affine/components/`)
UI 组件库：

##### 基础组件
- **block-selection/** - 块选择
- **color-picker/** - 颜色选择器
- **context-menu/** - 上下文菜单
- **toolbar/** - 工具栏
- **tooltip-content-with-shortcut/** - 带快捷键的提示

##### 输入组件
- **date-picker/** - 日期选择器
- **filterable-list/** - 可过滤列表
- **toggle-button/** - 切换按钮
- **toggle-switch/** - 开关

##### 显示组件
- **icons/** - 图标集
- **notification/** - 通知
- **toast/** - 提示消息
- **smooth-corner/** - 圆角处理

##### 交互组件
- **hover/** - 悬停效果
- **peek/** - 预览
- **portal/** - 传送门
- **drop-indicator/** - 拖拽指示器

#### Widgets (`affine/widgets/`)
小部件组件：

##### 编辑器小部件
- **drag-handle/** - 拖拽手柄
- **slash-menu/** - 斜杠菜单
- **toolbar/** - 编辑器工具栏
- **keyboard-toolbar/** - 键盘工具栏

##### 无边界画布小部件
- **edgeless-toolbar/** - 无边界工具栏
- **edgeless-zoom-toolbar/** - 缩放工具栏
- **edgeless-auto-connect/** - 自动连接
- **edgeless-dragging-area/** - 拖拽区域
- **edgeless-selected-rect/** - 选择矩形

##### 布局小部件
- **frame-title/** - 框架标题
- **linked-doc/** - 链接文档
- **note-slicer/** - 笔记切片器
- **page-dragging-area/** - 页面拖拽区域
- **scroll-anchoring/** - 滚动锚定
- **viewport-overlay/** - 视口覆盖层
- **remote-selection/** - 远程选择

#### GFX (`affine/gfx/`)
图形处理模块：

##### 绘图工具
- **brush/** - 画笔工具
- **shape/** - 形状工具
- **text/** - 文本工具
- **pointer/** - 指针工具

##### 连接工具
- **connector/** - 连接器
- **link/** - 链接
- **group/** - 分组

##### 特殊功能
- **mindmap/** - 思维导图
- **template/** - 模板
- **turbo-renderer/** - 快速渲染器
- **note/** - 笔记图形

#### Inlines (`affine/inlines/`)
内联元素：

- **link/** - 链接内联
- **reference/** - 引用内联
- **mention/** - 提及内联
- **footnote/** - 脚注内联
- **latex/** - LaTeX 内联
- **preset/** - 预设内联

#### Fragments (`affine/fragments/`)
片段组件：

- **doc-title/** - 文档标题
- **outline/** - 大纲
- **frame-panel/** - 框架面板
- **adapter-panel/** - 适配器面板

#### 其他核心模块

##### Model (`affine/model/`)
- **功能**: 数据模型定义
- **作用**: 定义各种块的数据结构

##### Rich Text (`affine/rich-text/`)
- **功能**: 富文本处理
- **主要文件**:
  - `rich-text.ts` - 富文本组件
  - `conversion.ts` - 格式转换
  - `dom.ts` - DOM 操作

##### Shared (`affine/shared/`)
- **功能**: 共享工具和服务
- **主要文件**:
  - `adapters.ts` - 适配器
  - `commands.ts` - 命令系统
  - `services.ts` - 服务
  - `utils.ts` - 工具函数

##### Foundation (`affine/foundation/`)
- **功能**: 基础功能
- **主要文件**:
  - `clipboard.ts` - 剪贴板处理
  - `store.ts` - 基础存储
  - `view.ts` - 基础视图

##### Data View (`affine/data-view/`)
- **功能**: 数据视图处理
- **作用**: 处理数据展示和交互

##### Ext Loader (`affine/ext-loader/`)
- **功能**: 扩展加载器
- **主要文件**:
  - `manager.ts` - 扩展管理
  - `store-provider.ts` - 存储提供者
  - `view-provider.ts` - 视图提供者

### 3. 测试和开发

#### Integration Test (`blocksuite/integration-test/`)
- **功能**: 集成测试
- **主要目录**:
  - `src/__tests__/` - 测试用例
  - `src/editors/` - 编辑器测试

#### Playground (`blocksuite/playground/`)
- **功能**: 开发环境和演示
- **主要目录**:
  - `apps/` - 示例应用
  - `scripts/` - 构建脚本

## 技术特点

1. **模块化设计**: 每个功能都是独立的包，便于维护和测试
2. **类型安全**: 完全使用 TypeScript 编写
3. **组件化**: UI 组件和业务逻辑分离
4. **扩展性**: 支持插件和扩展机制
5. **协作支持**: 内置多用户协作功能
6. **跨平台**: 支持多种渲染环境

## 开发指南

### 添加新块类型
1. 在 `affine/blocks/` 下创建新目录
2. 实现 `*-block.ts` 文件
3. 添加 `store.ts` 和 `view.ts`
4. 在 `affine/all/` 中注册新块

### 添加新组件
1. 在 `affine/components/` 下创建组件
2. 实现组件逻辑和样式
3. 导出到 `index.ts`

### 添加新小部件
1. 在 `affine/widgets/` 下创建小部件
2. 实现小部件功能
3. 注册到相应的编辑器中

这个模块化的设计使得 BlockSuite 具有很强的扩展性和维护性，每个模块都有明确的职责和接口。