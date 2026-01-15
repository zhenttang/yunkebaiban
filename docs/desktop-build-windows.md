# Windows 桌面端打包与启动（Electron）

本文档用于 Windows 环境下打包并启动桌面端（Electron）。包含无代理/有代理的打包流程、常见报错处理，以及产物路径说明。

## 前置条件

- Node.js 版本 < 23（项目要求）
- Yarn 4.x
- 在仓库根目录执行命令：`D:\Documents\yunkebaiban\baibanfront`

## 无代理（直连）打包

**CMD**
```
yarn workspace @yunke/electron make
```

**PowerShell**
```
yarn workspace @yunke/electron make
```

如果直连下载 Electron 失败，可加镜像：

**CMD**
```
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
yarn workspace @yunke/electron make
```

## 有代理（HTTP/SOCKS）打包

> 代理地址示例：`127.0.0.1:33175`

**HTTP 代理（CMD）**
```
set HTTP_PROXY=http://127.0.0.1:33175
set HTTPS_PROXY=http://127.0.0.1:33175
yarn workspace @yunke/electron make
```

**SOCKS5 代理（CMD）**
```
set HTTP_PROXY=socks5://127.0.0.1:33175
set HTTPS_PROXY=socks5://127.0.0.1:33175
yarn workspace @yunke/electron make
```

## 使用本地 Electron ZIP 缓存（可选）

当你设置了 `ELECTRON_FORGE_ELECTRON_ZIP_DIR`，Forge 不会自动下载 ZIP，需要你手动准备对应版本的 zip。

**CMD**
```
mkdir %USERPROFILE%\.electron-zips
set ELECTRON_FORGE_ELECTRON_ZIP_DIR=%USERPROFILE%\.electron-zips
```

如果缺少 ZIP 文件（例如 `electron-v36.9.5-win32-x64.zip`），可手动下载：

**镜像下载（推荐）**
```
set HTTP_PROXY=http://127.0.0.1:33175
set HTTPS_PROXY=http://127.0.0.1:33175
set ZIP=%USERPROFILE%\.electron-zips\electron-v36.9.5-win32-x64.zip
curl -L -o "%ZIP%" https://npmmirror.com/mirrors/electron/v36.9.5/electron-v36.9.5-win32-x64.zip
```

**官方源下载（配合美国代理）**
```
set HTTP_PROXY=http://127.0.0.1:33175
set HTTPS_PROXY=http://127.0.0.1:33175
set ZIP=%USERPROFILE%\.electron-zips\electron-v36.9.5-win32-x64.zip
curl -L -o "%ZIP%" https://github.com/electron/electron/releases/download/v36.9.5/electron-v36.9.5-win32-x64.zip
```

下载完成后执行：
```
yarn workspace @yunke/electron make
```

## 产物位置与启动方式

默认 `BUILD_TYPE` 为 `canary`，产物目录示例：
- `packages/frontend/apps/electron/out/canary/make/squirrel.windows/x64/YUNKE-canary-0.21.0 Setup.exe`
- `packages/frontend/apps/electron/out/canary/make/zip/win32/x64/YUNKE-canary-win32-x64-0.21.0.zip`

如果你要稳定版，先设置：
```
set BUILD_TYPE=stable
```
对应产物路径会变为：
- `packages/frontend/apps/electron/out/stable/make/squirrel.windows/x64/YUNKE-<version> Setup.exe`

## 常见报错处理

**1) connect ETIMEDOUT 20.205.243.166:443**
- 原因：Forge 下载 Electron 产物超时（网络被拦或直连慢）。
- 解决：配置代理（HTTP/SOCKS）或使用镜像下载。

**2) The specified Electron ZIP directory does not exist**
- 原因：`ELECTRON_FORGE_ELECTRON_ZIP_DIR` 指向目录不存在。
- 解决：先 `mkdir %USERPROFILE%\.electron-zips`。

**3) The specified Electron ZIP file does not exist**
- 原因：设置了 ZIP 缓存目录但未放入对应版本的 ZIP。
- 解决：按上面的下载命令补齐 zip 文件。

**4) DeprecationWarning: fs.rmdir(..., { recursive: true })**
- 原因：Node.js 未来版本的 API 弃用提示。
- 影响：不影响打包结果，可暂时忽略。
