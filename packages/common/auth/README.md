# 统一JWT认证系统使用说明

## 概述

这个统一的JWT认证系统整合了原有的双重HTTP请求架构（Axios + Fetch），提供了一个简单、统一的认证解决方案。

## 主要特性

✅ **统一Token管理** - 整合GlobalState和localStorage的双重存储
✅ **自动JWT注入** - 所有HTTP请求自动添加JWT token
✅ **自动Token刷新** - 无感知的token续期机制
✅ **React集成** - 提供丰富的Hooks和组件
✅ **类型安全** - 完整的TypeScript类型定义
✅ **错误处理** - 统一的错误处理和用户友好的错误提示
✅ **可扩展性** - 支持自定义存储和配置

## 快速开始

### 1. 基本使用

```typescript
import { initializeAuth, httpClient } from '@/packages/common/auth';

// 初始化认证系统
initializeAuth({
  baseURL: 'https://api.example.com',
  enableLogging: true,
  autoRefresh: true
});

// 使用HTTP客户端（自动处理JWT）
const data = await httpClient.get('/api/workspaces');
```

### 2. React组件中使用

```typescript
import React from 'react';
import { useAuth, AuthGuard, UserInfo } from '@/packages/common/auth';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  return (
    <AuthGuard requireAuth={true}>
      <div>
        <UserInfo showAvatar={true} showEmail={true} />
        <button onClick={logout}>注销</button>
      </div>
    </AuthGuard>
  );
}
```

### 3. 快速集成

```typescript
import { quickSetup } from '@/packages/common/auth';

// 快速设置认证系统
const auth = quickSetup({
  onLoginSuccess: (user) => {
    console.log('用户登录成功:', user.name);
  },
  onLogout: () => {
    console.log('用户已注销');
  },
  onAuthError: (error) => {
    console.error('认证错误:', error);
  }
});

// 使用认证功能
await auth.login({ email: 'user@example.com', password: 'password', type: 'password' });
```

## 详细使用指南

### Token管理

```typescript
import { tokenManager } from '@/packages/common/auth';

// 获取token
const accessToken = tokenManager.getAccessToken();
const refreshToken = tokenManager.getRefreshToken();

// 设置token
tokenManager.setTokens({
  accessToken: 'jwt-token',
  refreshToken: 'refresh-token',
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天后过期
  userId: 'user-id'
});

// 清除token
tokenManager.clearTokens();

// 检查token状态
const isExpired = tokenManager.isTokenExpired();
const isExpiringSoon = tokenManager.isTokenExpiringSoon();
```

### 认证状态管理

```typescript
import { authStateManager } from '@/packages/common/auth';

// 获取认证状态
const state = authStateManager.getState();
console.log(state.isAuthenticated, state.user);

// 监听状态变化
authStateManager.addListener((state) => {
  console.log('认证状态变化:', state);
});

// 用户登录
await authStateManager.login({
  email: 'user@example.com',
  password: 'password',
  type: 'password'
});

// 用户注销
await authStateManager.logout();
```

### HTTP客户端使用

```typescript
import { httpClient, fetchClient } from '@/packages/common/auth';

// 使用Axios客户端
const workspaces = await httpClient.get('/api/workspaces');
const newWorkspace = await httpClient.post('/api/workspaces', { name: '新工作区' });

// 使用Fetch客户端
const response = await fetchClient.fetch('/api/docs/123');
const doc = await fetchClient.get('/api/docs/123');
```

### React Hooks

```typescript
import { useAuth, useUser, useAuthState, useApi } from '@/packages/common/auth';

function MyComponent() {
  // 完整的认证状态和方法
  const { isAuthenticated, user, login, logout, loading, error } = useAuth();
  
  // 仅用户信息
  const user = useUser();
  
  // 仅认证状态
  const { isAuthenticated, loading, error } = useAuthState();
  
  // API请求Hook
  const { request, loading: apiLoading, error: apiError } = useApi();
  
  const loadData = async () => {
    const data = await request(() => httpClient.get('/api/data'));
    if (data) {
      console.log('数据加载成功:', data);
    }
  };
}
```

### 认证组件

```typescript
import { 
  AuthGuard, 
  UserInfo, 
  LoginButton, 
  LogoutButton, 
  AuthStatus, 
  AuthForm 
} from '@/packages/common/auth';

function App() {
  return (
    <div>
      {/* 认证守卫 */}
      <AuthGuard 
        requireAuth={true}
        fallback={<div>请先登录</div>}
        redirectTo="/login"
      >
        <ProtectedContent />
      </AuthGuard>
      
      {/* 用户信息显示 */}
      <UserInfo showAvatar={true} showEmail={true} avatarSize={50} />
      
      {/* 认证状态 */}
      <AuthStatus showIcon={true} />
      
      {/* 登录/注销按钮 */}
      <LoginButton onClick={() => navigate('/login')}>登录</LoginButton>
      <LogoutButton onLogout={() => navigate('/home')}>注销</LogoutButton>
      
      {/* 登录表单 */}
      <AuthForm 
        onSuccess={(user) => console.log('登录成功:', user)}
        onError={(error) => console.error('登录失败:', error)}
        showRegisterLink={true}
        showForgotPassword={true}
      />
    </div>
  );
}
```

## 迁移指南

### 从现有Axios拦截器迁移

```typescript
// 之前
import { setupRequestInterceptors } from '@/packages/common/request';
const axiosInstance = axios.create();
setupRequestInterceptors(axiosInstance);

// 现在
import { httpClient } from '@/packages/common/auth';
// 直接使用，无需额外配置
const data = await httpClient.get('/api/data');
```

### 从现有Fetch服务迁移

```typescript
// 之前
import { FetchService } from '@/packages/frontend/core/src/modules/cloud/services/fetch';
const fetchService = new FetchService(serverService, authStore);

// 现在
import { fetchClient } from '@/packages/common/auth';
// 直接使用，无需额外配置
const data = await fetchClient.get('/api/data');
```

## 配置选项

### 初始化配置

```typescript
initializeAuth({
  baseURL: 'https://api.example.com',  // API基础URL
  timeout: 15000,                      // 请求超时时间
  enableLogging: true,                 // 启用日志
  autoRefresh: true,                   // 自动刷新token
  customStorage: myStorage             // 自定义存储
});
```

### 自定义存储

```typescript
import { TokenStorage } from '@/packages/common/auth';

const customStorage: TokenStorage = {
  get: (key: string) => myStorage.getItem(key),
  set: (key: string, value: string) => myStorage.setItem(key, value),
  remove: (key: string) => myStorage.removeItem(key)
};
```

## 最佳实践

1. **应用初始化时设置认证系统**
```typescript
// 在应用启动时初始化
initializeAuth({
  baseURL: process.env.REACT_APP_API_URL,
  enableLogging: process.env.NODE_ENV === 'development'
});
```

2. **使用AuthGuard保护路由**
```typescript
<Route path="/dashboard" element={
  <AuthGuard requireAuth={true}>
    <Dashboard />
  </AuthGuard>
} />
```

3. **统一错误处理**
```typescript
const { request, error } = useApi();

useEffect(() => {
  if (error) {
    // 统一处理错误
    showNotification(error, 'error');
  }
}, [error]);
```

4. **避免混用旧的HTTP客户端**
```typescript
// ❌ 不要这样做
import axios from 'axios';
const data = await axios.get('/api/data'); // 缺少JWT

// ✅ 应该这样做
import { httpClient } from '@/packages/common/auth';
const data = await httpClient.get('/api/data'); // 自动添加JWT
```

## 故障排除

### 常见问题

1. **Token获取失败**
   - 检查localStorage和GlobalState中是否有token
   - 确认token格式正确
   - 检查token是否过期

2. **请求未携带Authorization头**
   - 确认使用的是统一的HTTP客户端
   - 检查请求URL是否在认证端点列表中
   - 启用日志查看请求详情

3. **Token刷新失败**
   - 检查refresh token是否有效
   - 确认后端刷新接口可用
   - 检查网络连接

### 调试技巧

```typescript
// 启用详细日志
initializeAuth({
  enableLogging: true
});

// 手动检查认证状态
console.log('Auth State:', authStateManager.getState());
console.log('Token Info:', tokenManager.getTokenInfo());
```

## 总结

这个统一的JWT认证系统解决了原有双重架构的问题，提供了：

- 🔧 **简单易用** - 一键集成，无需复杂配置
- 🔄 **自动化** - 自动JWT注入和token刷新
- 📦 **完整性** - 提供完整的React集成
- 🛡️ **可靠性** - 统一的错误处理和状态管理
- 🔧 **可扩展** - 支持自定义配置和存储

现在你可以专注于业务逻辑，而不用担心认证问题！