# 环境变量配置指南

## 概述

本项目使用环境变量来管理不同环境的服务器配置，避免硬编码。所有网络配置通过以下环境变量控制：

- `VITE_API_BASE_URL` - API 服务器基础 URL
- `VITE_SOCKETIO_PORT` - Socket.IO 服务端口
- `VITE_DEV_SERVER_PORT` - 前端开发服务器端口

## 环境变量配置

### 1. 创建环境配置文件

在项目根目录创建以下文件：

#### `.env.local` (本地开发环境)
```bash
# 本地开发服务器
VITE_API_BASE_URL=http://localhost:8080
VITE_SOCKETIO_PORT=9092
VITE_DEV_SERVER_PORT=8082
```

#### `.env.development` (开发环境 - 局域网测试)
```bash
# 局域网开发服务器
VITE_API_BASE_URL=http://192.168.2.4:8080
VITE_SOCKETIO_PORT=9092
VITE_DEV_SERVER_PORT=8082
```

#### `.env.production` (生产环境)
```bash
# 在线生产服务器
VITE_API_BASE_URL=http://ykbaiban.yckeji0316.cn
VITE_SOCKETIO_PORT=9092
VITE_DEV_SERVER_PORT=8082
```

### 2. Android 应用配置

Android 应用需要在构建时指定环境：

#### 开发环境（连接局域网服务器）
```bash
# 构建开发版本
VITE_API_BASE_URL=http://192.168.2.4:8080 yarn workspace @yunke/app-android build --mode development

# 或者先设置环境变量再构建
export VITE_API_BASE_URL=http://192.168.2.4:8080
yarn workspace @yunke/app-android build
```

#### 生产环境（连接在线服务器）
```bash
# 构建生产版本
VITE_API_BASE_URL=http://ykbaiban.yckeji0316.cn yarn workspace @yunke/app-android build --mode production

# 或者先设置环境变量再构建
export VITE_API_BASE_URL=http://ykbaiban.yckeji0316.cn
yarn workspace @yunke/app-android build --mode production
```

### 3. Web 应用配置

Web 应用会自动读取对应的 `.env` 文件：

```bash
# 开发模式（使用 .env.local 或 .env.development）
yarn dev

# 生产构建（使用 .env.production）
yarn build
```

## 环境检测逻辑

系统会自动检测当前环境：

1. **Android 环境**: 
   - 检测 `BUILD_CONFIG.isAndroid` 或 `BUILD_CONFIG.platform === 'android'`
   - 使用环境变量配置的服务器地址

2. **局域网环境**:
   - 检测 hostname 是否为局域网 IP（192.168.x.x, 10.x.x.x, 172.x.x.x）
   - 判定为 Android 或开发环境

3. **生产环境**:
   - hostname 不是 localhost 也不是局域网 IP
   - 使用生产配置

4. **默认环境**:
   - 其他情况默认为开发环境

## 配置文件位置

- 环境变量: 项目根目录的 `.env.*` 文件
- 网络配置代码: `packages/common/config/src/network-config.ts`
- 服务器常量: `packages/frontend/core/src/modules/cloud/constant.ts`

## 验证配置

启动应用后，在控制台查看以下日志确认配置是否正确：

```
🔧 [NetworkConfig] 检测到Android环境
📍 [NetworkConfig] getBaseUrl返回: http://ykbaiban.yckeji0316.cn, 环境: android
🔧 [Android配置] 服务器配置信息
  当前baseUrl: http://ykbaiban.yckeji0316.cn
  环境变量 VITE_API_BASE_URL: http://ykbaiban.yckeji0316.cn
```

## 常见问题

### Q: 修改了环境变量但没有生效？

A: 需要重新构建应用：
- Web: 重启开发服务器 `yarn dev`
- Android: 重新构建 `yarn workspace @yunke/app-android build`

### Q: Android 应用还是连接到本地地址？

A: 检查以下几点：
1. 确认构建时指定了正确的 `VITE_API_BASE_URL`
2. 清理构建缓存: `yarn workspace @yunke/app-android clean`
3. 完全重新构建应用

### Q: 如何临时切换服务器地址？

A: 可以在构建命令前设置环境变量：
```bash
VITE_API_BASE_URL=http://新地址 yarn build
```

## 注意事项

⚠️ **重要**: 
- `.env.local` 和 `.env.*.local` 文件应该添加到 `.gitignore`，不要提交到代码仓库
- 生产环境的配置信息不要包含敏感信息
- Android 应用每次切换服务器地址都需要重新构建
- 修改环境变量后必须重启开发服务器或重新构建应用才能生效

