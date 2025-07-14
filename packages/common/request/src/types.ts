/**
 * 服务器环境类型
 */
export enum EnvironmentType {
  DEV = 'development',
  TEST = 'test',
  PROD = 'production',
}

/**
 * 请求方法
 */
export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

/**
 * 请求优先级
 */
export enum RequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟时间(ms) */
  retryDelay: number;
  /** 需要重试的HTTP状态码 */
  statusCodesToRetry: number[];
}

/**
 * 超时配置
 */
export interface TimeoutConfig {
  /** 请求超时时间(ms) */
  request: number;
  /** 响应超时时间(ms) */
  response: number;
}

/**
 * API端点配置
 */
export interface ApiEndpoints {
  /** 用户认证相关 */
  auth: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
  };
  
  /** 工作区相关 */
  workspaces: {
    list: string;
    create: string;
    get: string;
    update: string;
    delete: string;
    invite: string;
    createInviteLink: string;
  };
  
  /** 文档相关 */
  docs: {
    list: string;
    create: string;
    get: string;
    update: string;
    delete: string;
  };

  /** 用户相关 */
  users: {
    profile: string;
    update: string;
  };
}

/**
 * 环境配置
 */
export interface EnvironmentConfig {
  /** 环境名称 */
  env: EnvironmentType;
  /** 基础URL */
  baseUrl: string;
  /** API版本 */
  apiVersion: string;
  /** 是否启用日志 */
  enableLogging: boolean;
  /** 是否启用API请求缓存 */
  enableCache: boolean;
  /** 是否启用模拟数据 */
  enableMock: boolean;
}

/**
 * 统一请求配置
 */
export interface RequestConfig {
  /** 环境配置 */
  environment: EnvironmentConfig;
  /** 超时配置 */
  timeout: TimeoutConfig;
  /** 重试配置 */
  retry: RetryConfig;
  /** 接口端点 */
  endpoints: ApiEndpoints;
  /** 默认请求头 */
  headers: Record<string, string>;
  /** 代理配置 */
  proxy?: {
    target: string;
    changeOrigin: boolean;
    pathRewrite?: Record<string, string>;
    timeout?: number;
  };
}

/**
 * 请求选项
 */
export interface RequestOptions {
  /** 请求方法 */
  method?: RequestMethod;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求体 */
  data?: unknown;
  /** URL参数 */
  params?: Record<string, string | number>;
  /** 超时设置(ms) */
  timeout?: number;
  /** 优先级 */
  priority?: RequestPriority;
  /** 是否取消之前的相同请求 */
  cancelPrevious?: boolean;
  /** 失败后是否重试 */
  retry?: boolean | number;
  /** 是否缓存响应 */
  cache?: boolean;
  /** 缓存时间(ms) */
  cacheTime?: number;
}

/**
 * 请求响应
 */
export interface RequestResponse<T = any> {
  /** 响应数据 */
  data: T;
  /** 状态码 */
  status: number;
  /** 状态文本 */
  statusText: string;
  /** 响应头 */
  headers: Record<string, string>;
}

/**
 * 请求错误
 */
export interface RequestError {
  /** 错误码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: unknown;
  /** 请求信息 */
  request?: {
    url: string;
    method: string;
    data?: unknown;
  };
  /** 响应信息 */
  response?: {
    status: number;
    data: unknown;
  };
}

/**
 * HTTP客户端接口
 */
export interface HttpClient {
  /**
   * 发送请求
   * @param url 请求URL
   * @param options 请求选项
   */
  request<T>(url: string, options?: RequestOptions): Promise<RequestResponse<T>>;
  
  /**
   * GET请求
   * @param url 请求URL
   * @param params URL参数
   * @param options 请求选项
   */
  get<T>(url: string, params?: Record<string, string | number>, options?: RequestOptions): Promise<T>;
  
  /**
   * POST请求
   * @param url 请求URL
   * @param data 请求体
   * @param options 请求选项
   */
  post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>;
  
  /**
   * PUT请求
   * @param url 请求URL
   * @param data 请求体
   * @param options 请求选项
   */
  put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>;
  
  /**
   * DELETE请求
   * @param url 请求URL
   * @param data 请求体
   * @param options 请求选项
   */
  delete<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T>;
  
  /**
   * 取消所有请求
   * @param reason 取消原因
   */
  cancelAll(reason?: string): void;
} 