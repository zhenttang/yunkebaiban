/**
 * 统一JWT认证系统 - 主入口文件
 */

// 核心管理器
export { tokenManager, UnifiedTokenManager } from './token-manager';
export { authStateManager, AuthStateManager } from './auth-state-manager';

// HTTP客户端
export { 
  UnifiedHttpClient, 
  UnifiedFetchClient, 
  httpClient, 
  fetchClient 
} from './http-client';

// React Hooks
export {
  useAuth,
  useUser,
  useAuthState,
  useHttpClient,
  useApi,
  useAuthenticatedRequest
} from './hooks';

// React组件
export {
  AuthGuard,
  UserInfo,
  LoginButton,
  LogoutButton,
  AuthStatus,
  AuthForm
} from './components';

// 类型定义
export type { TokenStorage, TokenInfo } from './token-manager';
export type { User, AuthState, AuthStateListener } from './auth-state-manager';
export type { UnifiedRequestConfig } from './http-client';

/**
 * 初始化认证系统
 * @param config 配置选项
 */
export function initializeAuth(config?: {
  baseURL?: string;
  timeout?: number;
  enableLogging?: boolean;
  autoRefresh?: boolean;
  customStorage?: TokenStorage;
}) {
  // 添加自定义存储
  if (config?.customStorage) {
    tokenManager.addStorage(config.customStorage);
  }

  // 配置HTTP客户端
  if (config?.baseURL) {
    // 可以在这里配置全局baseURL
    console.log('Auth system initialized with baseURL:', config.baseURL);
  }

  if (config?.enableLogging) {
    console.log('Auth system initialized with logging enabled');
  }

  return {
    tokenManager,
    authStateManager,
    httpClient,
    fetchClient
  };
}

/**
 * 快速设置认证系统
 * 用于快速集成到现有项目中
 */
export function quickSetup(options?: {
  onLoginSuccess?: (user: User) => void;
  onLogout?: () => void;
  onAuthError?: (error: string) => void;
}) {
  // 监听认证状态变化
  authStateManager.addListener((state) => {
    if (state.isAuthenticated && state.user && options?.onLoginSuccess) {
      options.onLoginSuccess(state.user);
    }
    
    if (!state.isAuthenticated && !state.loading && options?.onLogout) {
      options.onLogout();
    }
    
    if (state.error && options?.onAuthError) {
      options.onAuthError(state.error);
    }
  });

  return {
    login: authStateManager.login.bind(authStateManager),
    logout: authStateManager.logout.bind(authStateManager),
    getUser: () => authStateManager.getState().user,
    isAuthenticated: () => authStateManager.getState().isAuthenticated,
    httpClient,
    fetchClient
  };
}