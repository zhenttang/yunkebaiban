# YUNKE 桌面端 (Electron)

## 开发模式

```bash
# 在 baibanfront 根目录
yarn dev:electron
```

## 打包流程

**重要**：必须按顺序执行以下步骤，否则打包后的应用可能使用旧代码！

### 完整打包流程（推荐）

```bash
# 在 baibanfront 根目录执行

# 1. 构建前端 renderer 代码（包含 UI 组件、工作区逻辑等）
yarn workspace @yunke/electron-renderer build

# 2. 构建 Electron 层代码（main 进程、preload 脚本）
yarn workspace @yunke/electron build

# 3. 复制前端资源到打包目录（关键步骤！）
# 进入 electron 目录
cd packages/frontend/apps/electron

# 复制最新前端资源
Copy-Item -Path "../electron-renderer/dist/*" -Destination "resources/web-static/" -Recurse -Force

# 4. 重新打包应用（包含最新前端资源）
npx electron-forge package --platform win32 --arch x64

# 5. 生成 NSIS 安装程序
yarn make-nsis
```

### 快速打包（如果已构建过前端）

```bash
cd packages/frontend/apps/electron

# 复制前端资源 + 打包 + 生成安装程序
Copy-Item -Path "../electron-renderer/dist/*" -Destination "resources/web-static/" -Recurse -Force
npx electron-forge package --platform win32 --arch x64
yarn make-nsis
```

### 常见问题

#### Q: 开发模式正常，打包后功能缺失/UI 不对？

**根因分析**：打包流程存在**资源同步断裂**

```
开发模式：Webpack Dev Server 实时编译 → 直接加载最新代码 ✓

打包模式：
  electron-renderer/dist (最新前端代码)
       ↓ 
  resources/web-static (打包读取的资源) ← 不会自动更新！
       ↓
  electron-forge package (打包应用)
       ↓
  make-nsis (生成安装程序)
```

`resources/web-static` 是**静态目录**，不会在打包时自动从 `electron-renderer/dist` 同步。

**解决方案**：必须手动复制前端资源：
```bash
Copy-Item -Path "../electron-renderer/dist/*" -Destination "resources/web-static/" -Recurse -Force
```

#### Q: 为什么开发模式没问题？

开发模式使用 Webpack Dev Server 直接实时编译源代码，不经过 `resources/web-static` 中间目录。

#### Q: 安装程序在哪里？

**NSIS 安装程序路径**：
```
packages/frontend/apps/electron/out/canary/make/nsis.windows/x64/YUNKE-canary Setup x.x.x.exe
```

#### Q: Squirrel 安装程序闪退？

使用 NSIS 安装程序代替，更稳定：
```bash
yarn make-nsis
```

### 构建脚本说明

| 脚本 | 作用 |
|------|------|
| `yarn workspace @yunke/electron-renderer build` | 构建前端 React/BlockSuite 代码 |
| `yarn workspace @yunke/electron build` | 构建 Electron main/preload 层 |
| `yarn make-nsis` | 生成 Windows NSIS 安装程序 |
| `yarn generate-assets` | 自动执行前两步并复制资源 |

### 一键打包

如果不想分步执行，可以使用：
```bash
cd packages/frontend/apps/electron
yarn generate-assets && yarn make-nsis
```

## 目录结构

```
electron/
├── src/
│   ├── main/          # 主进程代码
│   ├── preload/       # 预加载脚本
│   └── helper/        # 辅助进程
├── resources/
│   └── web-static/    # 打包时的前端资源（由构建生成）
├── scripts/
│   ├── build-layers.ts      # 构建 Electron 层
│   ├── generate-assets.ts   # 生成打包资源
│   └── make-nsis.ts         # NSIS 打包脚本
└── dist/              # 构建输出
```
