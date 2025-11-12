# 服务器配置重构总结

## 修改时间
2025-10-30

## 问题描述

Android 应用启动时总是使用硬编码的本地开发服务器地址 `http://192.168.2.4:8080`，而不是配置的在线服务器地址。

### 根本原因

1. **硬编码配置**: `network-config.ts` 中 Android 环境的 host 硬编码为 `192.168.2.4`
2. **强制修改逻辑**: `app.tsx` 启动时强制将服务器 baseUrl 修改为 `http://192.168.2.4:8080`
3. **缺乏环境区分**: 没有区分开发环境和生产环境

## 修改内容

### 1. 修改 `network-config.ts`

**文件位置**: `packages/common/config/src/network-config.ts`

**修改内容**:
- ✅ 删除硬编码的服务器地址
- ✅ 添加环境变量读取函数 `getEnvValue()`
- ✅ 添加 URL 解析函数 `parseBaseUrl()`
- ✅ 修改 `createEnvironments()` 函数，从环境变量读取配置
- ✅ Android 和 Production 环境都使用 `VITE_API_BASE_URL` 环境变量

**关键代码**:
```typescript
// 从环境变量获取配置
const apiBaseUrl = getEnvValue('VITE_API_BASE_URL', 'http://localhost:8080');
const socketioPort = parseInt(getEnvValue('VITE_SOCKETIO_PORT', '9092'));
const devServerPort = parseInt(getEnvValue('VITE_DEV_SERVER_PORT', '8082'));

const parsed = parseBaseUrl(apiBaseUrl);

// Android 环境配置
android: {
  config: {
    host: parsed.host,        // 从环境变量解析
    port: parsed.port,        // 从环境变量解析
    protocol: parsed.protocol // 从环境变量解析
  }
}
```

### 2. 修改 `app.tsx`

**文件位置**: `packages/frontend/apps/android/src/app.tsx`

**修改内容**:
- ✅ 移除强制修改服务器配置的代码（第 317-356 行）
- ✅ 改为仅输出配置验证信息
- ✅ 删除硬编码的 `ANDROID_SERVER_HOST` 常量
- ✅ 移除 fetch 拦截器中的 localhost 替换逻辑
- ✅ 移除 baseUrl 验证中的硬编码检查

**修改前**:
```typescript
// 强制修改服务器配置
const newBaseUrl = 'http://192.168.2.4:8080';
Object.defineProperty(server, 'baseUrl', { value: newBaseUrl, ... });
```

**修改后**:
```typescript
// 仅输出配置信息用于验证
console.log('🔧 [Android配置] 服务器配置信息');
console.log('  当前baseUrl:', server.baseUrl);
console.log('  环境变量 VITE_API_BASE_URL:', import.meta.env?.VITE_API_BASE_URL);
```

### 3. 创建配置文档

**文件位置**: `ENV_CONFIGURATION.md`

**内容**:
- ✅ 环境变量配置说明
- ✅ 不同环境的配置示例
- ✅ Android 应用构建命令
- ✅ 常见问题解答

## 使用方法

### 本地开发（连接本地服务器）

创建 `.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:8080
```

### 局域网测试（Android 连接开发服务器）

创建 `.env.development`:
```bash
VITE_API_BASE_URL=http://192.168.2.4:8080
```

构建 Android 应用:
```bash
VITE_API_BASE_URL=http://192.168.2.4:8080 yarn workspace @yunke/app-android build
```

### 生产环境（Android 连接在线服务器）

创建 `.env.production`:
```bash
VITE_API_BASE_URL=http://ykbaiban.yckeji0316.cn
```

构建 Android 应用:
```bash
VITE_API_BASE_URL=http://ykbaiban.yckeji0316.cn yarn workspace @yunke/app-android build --mode production
```

## 配置流程

修改后的配置流程:

```
1. 环境变量 (VITE_API_BASE_URL)
   ↓
2. network-config.ts → getEnvValue() → parseBaseUrl()
   ↓
3. createEnvironments() → 生成配置
   ↓
4. NetworkConfigManager.getBaseUrl()
   ↓
5. constant.ts → BUILD_IN_SERVERS.yunke-cloud.baseUrl
   ↓
6. ServersService → 创建 Server 实例
   ↓
7. app.tsx → 仅验证配置（不再强制修改）
   ↓
8. ✅ 使用环境变量配置的地址
```

## 验证方法

启动应用后，检查控制台日志:

```
📍 [NetworkConfig] getBaseUrl返回: http://ykbaiban.yckeji0316.cn, 环境: android
🔧 [Android配置] 服务器配置信息
  当前baseUrl: http://ykbaiban.yckeji0316.cn
  环境变量 VITE_API_BASE_URL: http://ykbaiban.yckeji0316.cn
✅ BaseURL已配置: http://ykbaiban.yckeji0316.cn
```

## 优势

✅ **灵活配置**: 通过环境变量轻松切换服务器地址  
✅ **环境分离**: 开发和生产环境配置分离  
✅ **消除硬编码**: 删除所有硬编码的服务器地址  
✅ **易于维护**: 集中管理网络配置  
✅ **构建时配置**: 支持构建时指定服务器地址  

## 注意事项

⚠️ **重要**:
1. 修改环境变量后必须重新构建应用
2. `.env.local` 等本地配置文件不要提交到代码仓库
3. Android 应用每次切换服务器都需要重新构建
4. 环境变量在构建时注入，运行时无法修改

## 相关文件

- `packages/common/config/src/network-config.ts` - 网络配置管理
- `packages/frontend/apps/android/src/app.tsx` - Android 应用入口
- `packages/frontend/core/src/modules/cloud/constant.ts` - 服务器常量
- `ENV_CONFIGURATION.md` - 环境变量配置指南
- `.env.*` - 环境变量配置文件（需自行创建）

