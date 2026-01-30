# 云科白板 (Yunke Whiteboard)

基于 [AFFiNE](https://github.com/toeverything/AFFiNE) 开源项目进行二次开发的现代化协作白板应用。

## 关于 AFFiNE

[AFFiNE](https://affine.pro/) 是由 Toeverything 团队开发的下一代知识库和协作平台，它将文档、白板和数据库融为一体。云科白板基于 AFFiNE 的核心框架 [BlockSuite](https://blocksuite.io/) 进行定制开发，继承了其强大的编辑能力和协作特性，同时针对企业场景进行了功能扩展和优化。

**致谢**: 感谢 AFFiNE 团队的开源贡献，让我们能够在此基础上构建更好的产品。

## 特性

- **丰富编辑** - 支持文档、白板、数据表格、流程图等多种内容类型
- **多平台** - Web、Windows/macOS 桌面端、Android、iOS 全平台覆盖
- **离线模式** - 桌面端支持完全离线使用，无需后端服务（离线模式下不支持实时协作）
- **自定义存储位置** - 支持用户自定义数据保存目录，数据文件完全由用户掌控
- **数据透明化** - 数据以标准 SQLite 格式存储，用户可直接访问、备份、迁移自己的数据，无供应商锁定
- **插件系统** - 可扩展的插件架构

## 开发状态

> ⚠️ **注意**: 本项目仍在积极开发中，部分功能尚未完成。

### ✅ 已实现

- [x] 桌面端离线模式
- [x] 自定义数据存储位置
- [x] SQLite 本地数据存储
- [x] 基础文档编辑
- [x] 白板绘图功能

### 🚧 开发中 / 待实现

- [ ] 实时多人协作（需要后端支持）
- [ ] 云端同步功能
- [ ] 用户认证系统
- [ ] Android 应用完善
- [ ] iOS 应用完善
- [ ] 插件市场
- [ ] 数据导入/导出（Markdown、PDF 等格式）
- [ ] 版本历史与回滚
- [ ] 团队协作与权限管理
- [ ] AI 辅助功能

### ❌ 暂不支持

- 离线模式下的实时协作
- 移动端离线存储

## 项目结构

```
baibanfront/
├── blocksuite/           # BlockSuite 编辑器框架
│   ├── framework/        # 核心框架（global, store, sync）
│   └── yunke/            # 云科定制组件
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

# Android 构建
yarn build:android

# iOS 构建
yarn build:ios
```

### 桌面端构建（重点）

桌面端基于 Electron，采用 **Web 封装** 架构：

```
┌─────────────────────────────────────────────────────┐
│                   Electron 主进程                    │
│              (packages/frontend/apps/electron)       │
├─────────────────────────────────────────────────────┤
│                   渲染进程 (Chromium)                │
│          (packages/frontend/apps/electron-renderer)  │
│  ┌───────────────────────────────────────────────┐  │
│  │              Web 应用 (封装)                   │  │
│  │         - React 组件                          │  │
│  │         - BlockSuite 编辑器                   │  │
│  │         - 核心业务逻辑                        │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│                   Node.js 原生能力                   │
│         - 文件系统访问 (SQLite 存储)                │
│         - 系统托盘、窗口管理                        │
│         - 本地数据库 (better-sqlite3)               │
└─────────────────────────────────────────────────────┘
```

#### 构建步骤

完整构建流程（6 步）：

```bash
# 方式一：使用脚本（推荐）
./build-electron.bat    # Windows

# 方式二：手动执行
# 1. 清理旧构建
rmdir /s /q packages\frontend\apps\electron\dist
rmdir /s /q packages\frontend\apps\electron-renderer\dist

# 2. 安装依赖
yarn install

# 3. 构建渲染进程（Web 封装层）
yarn yunke bundle --package @yunke/electron-renderer

# 4. 构建主进程
yarn workspace @yunke/electron build

# 5. 打包 Electron 应用
yarn workspace @yunke/electron package

# 6. 生成安装程序 (NSIS)
yarn workspace @yunke/electron make-nsis
```

#### 离线版本构建

构建不依赖后端的纯离线版本：

```bash
./desktop-offline-build-and-run.bat    # Windows
```

此脚本会自动清空后端配置，构建完成后直接启动应用。

#### 产物位置

```
packages/frontend/apps/electron/out/
├── canary/                          # 测试版
│   └── make/
│       ├── nsis.windows/x64/        # NSIS 安装程序
│       │   └── YUNKE-canary-Setup.exe
│       └── zip/win32/x64/           # 便携版 ZIP
│           └── YUNKE-canary-win32-x64.zip
└── stable/                          # 稳定版 (BUILD_TYPE=stable)
    └── make/...
```

#### 网络问题处理

如果 Electron 下载超时，使用镜像：

```bash
# CMD
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
yarn workspace @yunke/electron make

# 或配置代理
set HTTP_PROXY=http://127.0.0.1:7890
set HTTPS_PROXY=http://127.0.0.1:7890
yarn workspace @yunke/electron make
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

## 许可证

MIT License
