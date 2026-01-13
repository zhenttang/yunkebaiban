# YUNKE 统一请求配置模块

这个模块提供了统一的HTTP请求处理机制，解决了项目中API请求相关的配置分散、请求超时等问题。

## 特性

- **统一配置管理**：集中管理API端点、超时设置、重试策略等
- **环境适配**：支持开发、测试、生产环境不同配置
- **请求拦截**：统一处理认证令牌、请求日志等
- **响应拦截**：统一处理错误、刷新令牌等
- **智能重试**：支持特定错误码的自动重试
- **缓存机制**：支持请求结果缓存，提高性能
- **错误处理**：统一的错误处理和上报机制
- **服务封装**：针对不同业务模块提供封装好的服务类

## 使用方法

### 1. 基本用法

```typescript
import request from '@yunke/request';

// 简单GET请求
const getData = async () => {
  try {
    const response = await request.get('/api/data');
    return response;
  } catch (error) {
    console.error('请求失败', error);
  }
};

// 带参数的POST请求
const createItem = async (data: any) => {
  try {
    const response = await request.post('/api/items', data);
    return response;
  } catch (error) {
    console.error('创建失败', error);
  }
};
```

### 2. 使用封装好的服务类

```typescript
import { WorkspaceService } from '@yunke/request';

// 获取工作区列表
const getWorkspaces = async () => {
  try {
    const { workspaces } = await WorkspaceService.getWorkspaces();
    return workspaces;
  } catch (error) {
    console.error('获取工作区列表失败', error);
  }
};

// 创建工作区
const createWorkspace = async (workspace: any) => {
  try {
    const result = await WorkspaceService.createWorkspace(workspace);
    return result;
  } catch (error) {
    console.error('创建工作区失败', error);
  }
};
```

### 3. 高级用法

```typescript
import { httpClient, RequestMethod } from '@yunke/request';

// 自定义配置的请求
const customRequest = async () => {
  try {
    const response = await httpClient.request('/api/custom', {
      method: RequestMethod.POST,
      data: { /* 请求数据 */ },
      headers: { 'Custom-Header': 'Value' },
      timeout: 30000, // 30秒超时
      retry: 2, // 失败后重试2次
      cache: true, // 缓存响应
      cancelPrevious: true // 取消之前的相同请求
    });
    return response.data;
  } catch (error) {
    console.error('请求失败', error);
  }
};
```

## 配置说明

本模块已预置了三种环境的配置：

1. **开发环境**：本地开发使用，针对localhost:8080的请求
2. **测试环境**：用于测试阶段
3. **生产环境**：用于正式环境

在开发环境中，已经配置了代理超时设置为120秒，解决了工作区创建504超时问题。

## 错误处理

模块提供了统一的错误处理机制：

```typescript
import { ErrorHandler } from '@yunke/request';

// 添加全局错误监听
ErrorHandler.addErrorListener((error) => {
  // 处理错误，例如显示通知或记录日志
  console.error('API请求错误:', error.code, error.message);
});
```

## 自定义配置

如需自定义配置，可以使用：

```typescript
import { configureHttpClient } from '@yunke/request';

// 配置客户端
const client = configureHttpClient({
  baseUrl: 'https://custom-api.example.com',
  timeout: 5000,
  headers: {
    'X-Custom-Header': 'Value'
  }
});
``` 