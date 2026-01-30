# 云客白板 (Yunke Whiteboard)

基于 [BlockSuite](https://blocksuite.io/) 框架二次开发的现代化协作白板应用，支持多平台部署。

## 特性

- **实时协作** - 基于 Yjs CRDT 的多人实时协作编辑
- **丰富编辑** - 支持文档、白板、数据表格、流程图等多种内容类型
- **多平台** - Web、Windows/macOS 桌面端、Android、iOS 全平台覆盖
- **离线支持** - 桌面端支持离线模式，数据本地 SQLite 存储
- **插件系统** - 可扩展的插件架构

## 项目结构

```
baibanfront/
├── blocksuite/           # BlockSuite 编辑器框架
│   ├── framework/        # 核心框架（global, store, sync）
│   └── yunke/            # 云客定制组件
│       ├── blocks/       # 内容块（文本、图片、表格等）
│       ├── widgets/      # UI 组件（工具栏、菜单等）
│       └── gfx/          # 图形渲染
├── packages/
│   ├── frontend/
│   │   ├── apps/         # 应用入口
│   │   │   ├── web/      # Web 应用
│   │   │   ├── electron/ # 桌面端
│   │   │   ├── android/  # Android 应用
│   │   │   ├── ios/      # iOS 应用
│   │   │   └── mobile/   # 移动端 Web
│   │   └── core/         # 核心模块
│   └── common/           # 公共库
├── tools/                # 构建工具
└── docs/                 # 文档
```

## 快速开始

### 环境要求

- Node.js < 23.0.0
- Yarn 4.x（通过 corepack 启用）

### 安装依赖

```bash
# 启用 corepack（如未启用）
corepack enable

# 安装依赖
yarn install
```

### 开发模式

```bash
# Web 开发
yarn dev

# 桌面端开发
yarn yunke dev electron
# 或使用脚本
./dev-electron.bat      # Windows
```

### 构建

```bash
# Web 构建
yarn build:web

# 桌面端构建
yarn yunke build electron
# 或使用脚本
./build-electron.bat    # Windows

# Android 构建
yarn build:android

# iOS 构建
yarn build:ios
```

## 配置

### 环境变量

复制环境配置文件并修改：

```bash
cp .env.development .env.local
```

主要配置项：
- 后端 API 地址
- WebSocket 服务地址
- 云存储配置

### 离线模式（桌面端）

1. 打开「设置」→「离线」
2. 开启「离线模式」
3. 选择数据保存目录
4. 重启应用生效

离线模式下数据存储为本地 SQLite 文件，不依赖后端服务。

## 测试

```bash
# 单元测试
yarn test

# E2E 测试
yarn test:e2e

# 测试覆盖率
yarn test:coverage
```

## 文档

- [桌面端构建指南](docs/desktop-build-windows.md)
- [桌面端离线模式](docs/desktop-offline.md)
- [生产部署指南](docs/deployment/PRODUCTION_DEPLOY.md)
- [插件系统](docs/plugin-system.md)

## 技术栈

- **前端框架**: React 18 + TypeScript
- **编辑器**: BlockSuite
- **状态管理**: Yjs (CRDT)
- **样式**: Vanilla Extract
- **构建工具**: Vite + Webpack
- **桌面端**: Electron
- **移动端**: Capacitor

## 相关仓库

- 后端服务: [yunke-go-backend](../baibanhouduan/yunke-go-backend)
- Java 服务: [yunke-java-backend](../baibanhouduan/yunke-java-backend)

## 许可证

MIT License
