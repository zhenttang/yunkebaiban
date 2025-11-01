# 桌面应用构建指南

## 🚀 快速构建（推荐）

### 方法1：使用脚本（最简单）

```cmd
@REM 清理 + 完整构建
rebuild-desktop.bat

@REM 或者快速构建（不清理）
quick-rebuild.bat
```

### 方法2：手动执行2个命令

```cmd
@REM 1. 生成资源（图标等）
yarn workspace @yunke/electron generate-assets

@REM 2. 打包应用
yarn workspace @yunke/electron package
```

就这么简单！✨

---

## 📋 详细说明

### 完整构建流程

```cmd
@REM 步骤1：清理旧的构建产物（可选）
rmdir /s /q packages\frontend\apps\electron-renderer\dist
rmdir /s /q packages\frontend\apps\electron\dist
rmdir /s /q packages\frontend\apps\electron\out

@REM 步骤2：生成应用资源
yarn workspace @yunke/electron generate-assets

@REM 步骤3：打包应用
yarn workspace @yunke/electron package
```

### 构建产物位置

打包完成后，可执行文件在：
```
packages\frontend\apps\electron\out\canary\YUNKE-canary-win32-x64\YUNKE.exe
```

---

## 🧪 开发模式

如果只是开发测试，不需要打包，使用开发模式更快：

```cmd
cd packages\frontend\apps\electron
yarn dev
```

---

## ⚡ 可用脚本

| 脚本 | 说明 | 时间 |
|------|------|------|
| `rebuild-desktop.bat` | 清理 + 生成资源 + 打包 | 5-15分钟 |
| `quick-rebuild.bat` | 生成资源 + 打包（不清理） | 3-10分钟 |
| `clean-build.bat` | 仅清理构建产物 | 30秒 |

---

## 🔍 验证构建

```cmd
@REM 检查是否生成了可执行文件
dir packages\frontend\apps\electron\out\canary\YUNKE-canary-win32-x64\YUNKE.exe

@REM 直接运行
.\packages\frontend\apps\electron\out\canary\YUNKE-canary-win32-x64\YUNKE.exe
```

---

## ⚠️ 常见问题

### Q: 为什么不需要构建 Core 模块？

A: Core 模块使用 TypeScript 源码，通过 workspace 直接引用，打包时会自动编译，无需单独构建。

### Q: 为什么不需要构建 Electron Renderer？

A: `yarn workspace @yunke/electron package` 会自动构建所有依赖，包括 renderer 和 main 进程。

### Q: 如何只构建不打包？

A: 使用 `yarn workspace @yunke/electron build`（更快，但不生成安装包）

### Q: 打包失败怎么办？

A: 
1. 清理构建产物：`clean-build.bat`
2. 删除 node_modules 重新安装：`rmdir /s /q node_modules && yarn install`
3. 检查 Node.js 版本是否 < 23.0.0

---

## 📦 构建命令对比

| 命令 | 作用 | 输出 |
|------|------|------|
| `yarn workspace @yunke/electron generate-assets` | 生成图标等资源 | 图标文件 |
| `yarn workspace @yunke/electron build` | 构建（不打包） | dist/ 目录 |
| `yarn workspace @yunke/electron package` | 打包为应用 | out/ 目录 |
| `yarn workspace @yunke/electron make` | 制作安装包 | installers/ |
| `yarn workspace @yunke/electron dev` | 开发模式 | 无 |

---

## 🎯 推荐工作流

### 日常开发
```cmd
cd packages\frontend\apps\electron
yarn dev
```

### 测试打包版本
```cmd
@REM 在根目录
quick-rebuild.bat
```

### 发布前完整构建
```cmd
@REM 在根目录
clean-build.bat
rebuild-desktop.bat
```

---

## 📊 构建时间参考

| 任务 | 时间 |
|------|------|
| generate-assets | 30秒 |
| package | 5-10分钟 |
| 总计（不清理） | 5-10分钟 |
| 总计（含清理） | 5-15分钟 |

---

## 💡 提示

- ✅ 代码修改后，运行 `quick-rebuild.bat` 即可
- ✅ 构建失败时，先运行 `clean-build.bat`
- ✅ 开发调试用 `yarn dev`，不要每次都打包
- ✅ Node.js 版本必须 < 23.0.0

---

**最后更新：** 2025-11-01  
**适用版本：** YUNKE Desktop v0.21.0

