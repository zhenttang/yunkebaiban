# @yunke/config - 统一网络配置管理

这个包提供了YUNKE项目的统一网络配置管理，避免了在多个文件中硬编码服务器地址的问题。

## 📋 功能特性

- ✅ 统一管理API和Socket.IO服务器地址
- ✅ 支持多环境配置（开发/生产/Android）
- ✅ 自动环境检测
- ✅ 环境变量覆盖支持
- ✅ TypeScript类型安全

## 🚀 快速开始

### 基本使用

```typescript
import { 
  getApiBaseUrl, 
  getSocketIOUrl, 
  networkConfig 
} from '@yunke/config';

// 获取API基础URL
const apiUrl = getApiBaseUrl();
// 结果: http://localhost:8080 (开发环境)

// 获取Socket.IO URL  
const socketUrl = getSocketIOUrl();
// 结果: http://localhost:9092 (开发环境)

// 获取完整配置
const config = networkConfig.getCurrentConfig();
console.log(config);
```

### 环境变量配置

在 `.env` 文件中设置：

```bash
# API服务器地址
VITE_API_BASE_URL=http://localhost:8080

# Socket.IO服务器地址
VITE_SOCKETIO_URL=http://localhost:9092

# 生产环境配置
VITE_PROD_HOST=your-domain.com
VITE_PROD_PORT=443
VITE_PROD_SOCKETIO_PORT=9092
```

## 🔧 API参考

### 主要函数

- `getBaseUrl()`: 获取基础URL
- `getApiBaseUrl()`: 获取API基础URL  
- `getSocketIOUrl()`: 获取Socket.IO URL
- `getWebSocketUrl()`: 获取WebSocket URL
- `convertToSocketIOUrl(baseUrl)`: 将API URL转换为Socket.IO URL

### 环境检测

- `isDevelopmentEnvironment()`: 是否为开发环境
- `isProductionEnvironment()`: 是否为生产环境  
- `isAndroidEnvironment()`: 是否为Android环境

### 配置管理器

```typescript
import networkConfig from '@yunke/config';

// 手动设置环境
networkConfig.setEnvironment('production');

// 获取当前环境
const env = networkConfig.getCurrentEnvironment();

// 调试信息
networkConfig.debug();
```

## 🌍 环境配置

### 开发环境 (development)
- API服务器: `http://localhost:8080`
- Socket.IO服务器: `http://localhost:9092`

### 生产环境 (production)  
- API服务器: `https://your-domain.com:443`
- Socket.IO服务器: `https://your-domain.com:9092`

### Android环境 (android)
- API服务器: `http://localhost:8080` 
- Socket.IO服务器: `http://localhost:9092`

## 🔄 迁移指南

### 从硬编码迁移

**之前:**
```typescript
// ❌ 硬编码
const apiUrl = 'http://localhost:8080';
const socketUrl = 'http://localhost:9092';
```

**现在:**
```typescript  
// ✅ 使用配置
import { getApiBaseUrl, getSocketIOUrl } from '@yunke/config';

const apiUrl = getApiBaseUrl();
const socketUrl = getSocketIOUrl();
```

### 从URL替换迁移

**之前:**
```typescript
// ❌ 字符串替换
const socketUrl = baseUrl.replace(':8080', ':9092');
```

**现在:**
```typescript
// ✅ 使用转换函数
import { convertToSocketIOUrl } from '@yunke/config';

const socketUrl = convertToSocketIOUrl(baseUrl);
```

## 📦 打包部署

### 1. 本地开发
使用默认的 `.env` 配置即可。

### 2. 生产环境打包
修改 `.env` 文件：

```bash
VITE_API_BASE_URL=https://your-domain.com
VITE_SOCKETIO_URL=https://your-domain.com:9092
```

或者在构建命令中覆盖：

```bash
VITE_API_BASE_URL=https://your-domain.com npm run build
```

### 3. 运行时配置
配置会自动检测运行环境，无需额外配置。

## 🐛 故障排除

### 调试配置
```typescript
import { debugNetworkConfig } from '@yunke/config';

// 打印当前配置信息
debugNetworkConfig();
```

### 常见问题

1. **端口连接失败**: 检查 `.env` 文件中的端口配置
2. **生产环境配置不生效**: 确保环境变量已正确设置
3. **Socket.IO连接问题**: 使用 `convertToSocketIOUrl()` 确保端口正确

## 🔗 相关文件

- `src/network-config.ts` - 主配置文件
- `src/index.ts` - 导出文件
- `../../.env` - 环境变量配置

## 📝 注意事项

1. 所有网络相关配置都应该通过这个包管理
2. 不要在代码中硬编码服务器地址
3. 生产环境部署前务必检查配置是否正确
4. 使用TypeScript以获得最佳的类型安全体验

---

## 📊 实现总结

### 已解决的问题
- ✅ 消除了所有硬编码的8080和9092端口
- ✅ 统一了Socket.IO URL生成逻辑
- ✅ 添加了环境变量覆盖支持
- ✅ 提供了类型安全的配置API

### 修改的文件
1. `packages/common/config/src/network-config.ts` - 优化配置管理
2. `packages/common/nbstore/src/impls/cloud/doc.ts` - 修复硬编码
3. `packages/common/nbstore/src/impls/cloud/awareness.ts` - 修复硬编码
4. `packages/frontend/apps/web/src/cloud-storage-manager.tsx` - 支持环境变量
5. `packages/common/request/src/config.ts` - 支持环境变量
6. `packages/frontend/core/src/modules/cloud/constant.ts` - 支持环境变量
7. `.env` - 添加Socket.IO配置

### 使用建议
- 开发环境：使用默认配置
- 生产环境：修改 `.env` 文件中的URL为实际域名
- 打包部署：确保环境变量正确设置