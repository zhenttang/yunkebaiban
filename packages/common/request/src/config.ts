import { 
  ApiEndpoints,
  EnvironmentConfig, 
  EnvironmentType, 
  RequestConfig, 
  RetryConfig, 
  TimeoutConfig 
} from './types';
import { getBaseUrl } from '@yunke/config';

/**
 * 获取配置的基础URL
 * 使用统一的网络配置管理，支持环境变量覆盖
 */
function getConfiguredBaseUrl(): string {
  // 统一通过配置模块获取基础 Origin（不包含 /api）
  return getBaseUrl();
}

/**
 * 默认超时配置
 */
export const DEFAULT_TIMEOUT: TimeoutConfig = {
  request: 60000, // 60秒请求超时
  response: 60000 // 60秒响应超时
};

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3, // 最多重试3次
  retryDelay: 1000, // 1秒后重试
  statusCodesToRetry: [408, 429, 500, 502, 503, 504] // 这些状态码会触发重试
};

/**
 * API端点配置
 */
export const API_ENDPOINTS: ApiEndpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh'
  },
  workspaces: {
    list: '/api/workspaces',
    create: '/api/workspaces',
    get: '/api/workspaces/:id',
    update: '/api/workspaces/:id',
    delete: '/api/workspaces/:id',
    invite: '/api/workspaces/:id/invite',
    createInviteLink: '/api/workspaces/:id/invite-link'
  },
  docs: {
    list: '/api/workspaces/:workspaceId/docs',
    create: '/api/workspaces/:workspaceId/docs',
    get: '/api/workspaces/:workspaceId/docs/:id',
    update: '/api/workspaces/:workspaceId/docs/:id',
    delete: '/api/workspaces/:workspaceId/docs/:id'
  },
  users: {
    profile: '/api/users/profile',
    update: '/api/users/profile'
  }
};

/**
 * 环境配置 - 使用统一配置管理
 */
export const environments: Record<EnvironmentType, EnvironmentConfig> = {
  [EnvironmentType.DEV]: {
    env: EnvironmentType.DEV,
    baseUrl: getConfiguredBaseUrl(),
    apiVersion: 'v1',
    enableLogging: true,
    enableCache: false,
    enableMock: false
  },
  [EnvironmentType.TEST]: {
    env: EnvironmentType.TEST,
    baseUrl: getConfiguredBaseUrl(),
    apiVersion: 'v1',
    enableLogging: true,
    enableCache: true,
    enableMock: false
  },
  [EnvironmentType.PROD]: {
    env: EnvironmentType.PROD,
    baseUrl: getConfiguredBaseUrl(),
    apiVersion: 'v1',
    enableLogging: false,
    enableCache: true,
    enableMock: false
  }
};

/**
 * 获取当前环境
 */
export const getCurrentEnvironment = (): EnvironmentType => {
  // 检测环境
  if (typeof window !== 'undefined') {
    const buildConfig = (window as any).BUILD_CONFIG;
    if (buildConfig?.isAndroid || buildConfig?.platform === 'android') {
      return EnvironmentType.DEV;
    }
    
    const hostname = window.location.hostname;
    // 检测局域网IP（Android开发环境）
    if (hostname.match(/^192\.168\.\d+\.\d+$/) || 
        hostname.match(/^10\.\d+\.\d+\.\d+$/) ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+$/)) {
      return EnvironmentType.DEV;
    }
    
    // 生产环境
    if (hostname !== 'localhost' && 
        hostname !== '127.0.0.1' &&
        !hostname.includes('192.168.') &&
        !hostname.includes('10.0.') &&
        !hostname.includes('172.')) {
      return EnvironmentType.PROD;
    }
  }
  
  // 在Node环境下，从process.env中获取
  if (typeof process !== 'undefined' && process.env) {
    return (process.env.NODE_ENV as EnvironmentType) || EnvironmentType.DEV;
  }

  // 默认开发环境
  return EnvironmentType.DEV;
};

/**
 * 创建请求配置
 */
export const createRequestConfig = (env = getCurrentEnvironment()): RequestConfig => {
  const environment = environments[env];

  // 开发环境使用代理配置
  const proxyConfig = env === EnvironmentType.DEV ? {
    target: getConfiguredBaseUrl(),
    changeOrigin: true,
    timeout: 120000 // 120秒代理超时，解决创建工作区504问题
  } : undefined;

  return {
    environment,
    timeout: DEFAULT_TIMEOUT,
    retry: DEFAULT_RETRY,
    endpoints: API_ENDPOINTS,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    proxy: proxyConfig
  };
};

/**
 * 默认请求配置
 */
export const defaultRequestConfig = createRequestConfig(); 
