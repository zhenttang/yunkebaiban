import { DebugLogger } from '@yunke/debug';
import { UserFriendlyError } from '@yunke/error';
import { fromPromise, Service } from '@toeverything/infra';
import { DEFAULT_TIMEOUT, DEFAULT_RETRY } from '@yunke/request';
import { getBaseUrl, getApiBaseUrl } from '@yunke/config';

import type { ServerService } from './server';

const logger = new DebugLogger('yunke:fetch');

/**
 * 检测是否为 Android 环境
 */
function isAndroidEnvironment(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // 检查 BUILD_CONFIG
  const buildConfig = (window as any).BUILD_CONFIG;
  if (buildConfig?.isAndroid || buildConfig?.platform === 'android') {
    return true;
  }
  
  // 检查 Capacitor
  try {
    const Capacitor = (window as any).Capacitor;
    if (Capacitor?.getPlatform?.() === 'android') {
      return true;
    }
  } catch {
    // Capacitor 可能不可用
  }
  
  return false;
}

/**
 * 动态导入 CapacitorHttp（如果可用）
 */
function getCapacitorHttp() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    // 先检查 Capacitor 全局对象
    const Capacitor = (window as any).Capacitor;
    if (!Capacitor) {
      return null;
    }
    
    // 方式1: 从 Capacitor.Plugins 获取（Capacitor 7 内置插件）
    if (Capacitor.Plugins?.Http) {
      return Capacitor.Plugins.Http;
    }
    
    // 方式2: 从 Capacitor.Plugins.CapacitorHttp 获取（可能的命名）
    if (Capacitor.Plugins?.CapacitorHttp) {
      return Capacitor.Plugins.CapacitorHttp;
    }
    
    return null;
  } catch {
    return null;
  }
}

export type FetchInit = RequestInit & { 
  timeout?: number;
  retry?: {
    maxRetries?: number;
    retryDelay?: number;
    retryableStatusCodes?: number[];
  };
};

/**
 * 网络请求重试配置
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
}

/**
 * 判断错误是否可重试
 */
function isRetryableError(error: any, statusCode?: number): boolean {
  // 网络错误（超时、连接失败等）可重试
  if (error?.name === 'AbortError' || error?.code === 'NETWORK_ERROR') {
    return true;
  }
  
  // 特定状态码可重试
  if (statusCode) {
    const retryableCodes = [408, 429, 500, 502, 503, 504];
    return retryableCodes.includes(statusCode);
  }
  
  return false;
}

/**
 * 延迟函数（用于重试）
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class FetchService extends Service {
  constructor(
    private readonly _serverService: ServerService
  ) {
    super();
  }
  
  rxFetch = (
    input: string,
    init?: RequestInit & {
      // https://github.com/microsoft/TypeScript/issues/54472
      priority?: 'auto' | 'low' | 'high';
    } & {
      traceEvent?: string;
    }
  ) => {
    return fromPromise(signal => {
      return this.fetch(input, { signal, ...init });
    });
  };

  /**
   * 构建完整的请求URL
   * 统一使用 network-config.ts 的配置管理
   * 智能处理 /api 前缀，避免重复
   */
  private buildRequestUrl(input: string): string {
    try {
      // 如果已经是完整URL，直接返回
      if (input.startsWith('http://') || input.startsWith('https://')) {
        return input;
      }
      
      // 统一使用 network-config.ts 的配置
      // 智能判断：如果路径已经包含 /api 前缀，使用 getBaseUrl()；否则使用 getApiBaseUrl()
      const baseUrl = input.startsWith('/api') ? getBaseUrl() : getApiBaseUrl();
      
      if (!baseUrl) {
        throw new Error('API baseUrl未配置，请检查环境变量 VITE_API_BASE_URL');
      }
      
      // 构建完整URL
      const url = new URL(input, baseUrl);
      return url.toString();
    } catch (error) {
      logger.error('构建请求URL失败', { input, error });
      throw new UserFriendlyError({
        status: 500,
        code: 'INVALID_URL',
        type: 'INVALID_URL',
        name: 'NETWORK_ERROR' as any,
        message: `无效的请求URL: ${input}`,
      });
    }
  }

  /**
   * 准备请求headers，包含JWT token
   */
  private prepareHeaders(input: string, initHeaders?: HeadersInit): Record<string, string> {
    const headers: Record<string, string> = {
      'x-yunke-version': BUILD_CONFIG.appVersion,
      ...(initHeaders as Record<string, string> || {}),
    };

    // 如果不是登录接口，尝试添加JWT token
    if (!this.isAuthEndpoint(input)) {
      try {
        const token = globalThis.localStorage?.getItem('yunke-admin-token') || 
                     globalThis.localStorage?.getItem('yunke-access-token');
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        // 如果无法获取token，继续执行
        logger.warn('获取JWT token失败', error);
      }
    }

    return headers;
  }

  /**
   * 执行单次fetch请求（内部方法）
   * Android 环境下优先使用 CapacitorHttp 绕过 CORS 限制
   */
  private async executeFetch(
    url: string, 
    init: FetchInit, 
    abortController: AbortController
  ): Promise<Response> {
    const timeout = init?.timeout ?? DEFAULT_TIMEOUT.request;
    const isAndroid = isAndroidEnvironment();
    
    // Android 环境下强制使用 CapacitorHttp，不允许降级
    if (isAndroid) {
      const CapacitorHttp = getCapacitorHttp();
      
      if (!CapacitorHttp) {
        throw new UserFriendlyError({
          status: 500,
          code: 'CAPACITOR_HTTP_UNAVAILABLE',
          type: 'NETWORK_ERROR',
          name: 'NETWORK_ERROR',
          message: 'CapacitorHttp 插件不可用，请确保已安装 @capacitor/http 并正确配置',
        });
      }
      const headers = this.prepareHeaders(url, init.headers);
      
      // 转换请求方法
      const method = (init.method || 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      
      // 处理请求体
      let data: any = undefined;
      if (init.body) {
        if (typeof init.body === 'string') {
          try {
            data = JSON.parse(init.body);
          } catch {
            data = init.body;
          }
        } else if (init.body instanceof FormData) {
          // FormData 需要特殊处理
          data = Object.fromEntries(init.body.entries());
        } else {
          data = init.body;
        }
      }
      
      // 使用 Promise.race 实现超时，避免 CapacitorHttp 悬挂
      try {
        const requestOptions = { 
          url, 
          headers, 
          data: data as any,
          // 指定 dataType 为 json，让 CapacitorHttp 自动解析 JSON 响应
          dataType: 'json' as const
        };
        
        // 根据 HTTP 方法选择对应的 CapacitorHttp 方法
        let capPromise: Promise<any>;
        
        try {
          let result: any;
          
          // 检查是否支持 request 方法（通用方法）
          if (typeof CapacitorHttp.request === 'function') {
            result = CapacitorHttp.request({
              method,
              url,
              headers,
              data: data as any,
              dataType: 'json' as const
            });
          } else {
            // 使用特定方法
            switch (method) {
              case 'GET':
                if (typeof CapacitorHttp.get === 'function') {
                  result = CapacitorHttp.get(requestOptions);
                } else {
                  throw new Error('CapacitorHttp.get 方法不存在');
                }
                break;
              case 'POST':
                if (typeof CapacitorHttp.post === 'function') {
                  result = CapacitorHttp.post(requestOptions);
                } else {
                  throw new Error('CapacitorHttp.post 方法不存在');
                }
                break;
              case 'PUT':
                if (typeof CapacitorHttp.put === 'function') {
                  result = CapacitorHttp.put(requestOptions);
                } else {
                  throw new Error('CapacitorHttp.put 方法不存在');
                }
                break;
              case 'DELETE':
                if (typeof CapacitorHttp.delete === 'function') {
                  result = CapacitorHttp.delete(requestOptions);
                } else {
                  throw new Error('CapacitorHttp.delete 方法不存在');
                }
                break;
              case 'PATCH':
                if (typeof CapacitorHttp.patch === 'function') {
                  result = CapacitorHttp.patch(requestOptions);
                } else {
                  throw new Error('CapacitorHttp.patch 方法不存在');
                }
                break;
              default:
                throw new Error(`不支持的 HTTP 方法: ${method}`);
            }
          }
          
          // 如果返回的是 Promise，直接使用
          if (result instanceof Promise) {
            capPromise = result;
          } else {
            // 如果不是 Promise，Capacitor 的桥接调用应该会自动处理
            // 但这里我们需要手动创建一个 Promise 来等待原生回调
            // 直接包装为 Promise，虽然不支持 .then()，但我们可以等待
            // 实际上，Capacitor 的桥接调用是异步的，需要等待原生回调
            // 这里我们只能先 resolve，然后等待实际的响应
            capPromise = Promise.resolve(result);
          }
        } catch (syncError: any) {
          capPromise = Promise.reject(syncError);
        }
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('请求超时'));
          }, timeout);
        });
        
        const response = await Promise.race([capPromise, timeoutPromise]) as any;
        
        // 将 CapacitorHttp 响应转换为标准 Response
        // CapacitorHttp 返回的 data 可能是字符串或对象
        let responseBody: string;
        if (typeof response.data === 'string') {
          responseBody = response.data;
        } else if (response.data) {
          responseBody = JSON.stringify(response.data);
        } else {
          responseBody = '';
        }
        
        // 确保响应头包含 Content-Type
        const responseHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(response.headers as Record<string, string> || {}),
        };
        
        const standardResponse = new Response(
          responseBody,
          {
            status: response.status,
            statusText: response.statusText || 'OK',
            headers: new Headers(responseHeaders),
          }
        );
        
        return standardResponse;
      } catch (httpError: any) {
        
        // Android 环境下不允许降级，直接抛出错误
        const errorMessage = httpError.message || 'CapacitorHttp 请求失败';
        const isTimeout = errorMessage.includes('请求超时') || errorMessage.includes('timeout');
        
        throw new UserFriendlyError({
          status: isTimeout ? 504 : 500,
          code: 'NETWORK_ERROR',
          type: 'NETWORK_ERROR',
          name: 'NETWORK_ERROR',
          message: isTimeout ? `请求超时（${timeout}ms）` : `网络错误: ${errorMessage}`,
          stacktrace: httpError.stack,
        });
      }
    }
    
    // 非 Android 环境使用原生 fetch
    
    const timeoutId = setTimeout(() => {
      abortController.abort('timeout');
    }, timeout);

    try {
      const headers = this.prepareHeaders(url, init.headers);
      
      const response = await globalThis.fetch(url, {
        ...init,
        signal: abortController.signal,
        headers,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      const errorMessage = err?.message || err?.toString() || String(err) || '网络连接失败';
      const errorStack = err?.stack || '';
      
      const isTimeout = errorMessage === 'timeout' || 
                       errorMessage.includes('timeout') ||
                       err?.name === 'AbortError';
      
      throw new UserFriendlyError({
        status: isTimeout ? 504 : 500,
        code: 'NETWORK_ERROR',
        type: 'NETWORK_ERROR',
        name: 'NETWORK_ERROR',
        message: isTimeout ? `请求超时（${timeout}ms）` : `网络错误: ${errorMessage}`,
        stacktrace: errorStack,
      });
    }
  }

  /**
   * fetch with custom timeout, retry logic and error handling.
   * 商用级网络请求实现，包含重试机制和完整错误处理
   */
  fetch = async (input: string, init?: FetchInit): Promise<Response> => {
    const externalSignal = init?.signal;
    if (externalSignal?.aborted) {
      throw externalSignal.reason;
    }

    // 构建完整URL
    const url = this.buildRequestUrl(input);
    
    // 配置重试逻辑
    const retryConfig: RetryConfig = {
      maxRetries: init?.retry?.maxRetries ?? DEFAULT_RETRY.maxRetries,
      retryDelay: init?.retry?.retryDelay ?? DEFAULT_RETRY.retryDelay,
      retryableStatusCodes: init?.retry?.retryableStatusCodes ?? DEFAULT_RETRY.statusCodesToRetry,
    };

    // 创建AbortController用于超时控制
    const abortController = new AbortController();
    externalSignal?.addEventListener('abort', reason => {
      abortController.abort(reason);
    });

    let lastError: any;
    let lastResponse: Response | null = null;

    // 重试循环
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // 如果不是第一次尝试，等待后重试
        if (attempt > 0) {
          const delayMs = retryConfig.retryDelay * Math.pow(2, attempt - 1); // 指数退避
          logger.info(`请求重试 (${attempt}/${retryConfig.maxRetries}): ${url}`, { delayMs });
          await delay(delayMs);
          
          // 检查是否已被外部取消
          if (externalSignal?.aborted || abortController.signal.aborted) {
            throw externalSignal?.reason || new Error('请求已取消');
          }
        }

        // 执行请求
        const response = await this.executeFetch(url, init || {}, abortController);
        lastResponse = response;

        // 检查响应状态
        if (!response.ok) {
          const statusCode = response.status;
          
          // 判断是否可重试
          if (attempt < retryConfig.maxRetries && 
              isRetryableError(null, statusCode) &&
              retryConfig.retryableStatusCodes.includes(statusCode)) {
            logger.warn(`请求失败，准备重试: ${url}`, { statusCode, attempt });
            lastError = new UserFriendlyError({
              status: statusCode,
              code: 'HTTP_ERROR',
              type: 'HTTP_ERROR',
              name: 'NETWORK_ERROR' as any,
              message: `HTTP ${statusCode}: ${response.statusText}`,
            });
            continue; // 继续重试
          }

          // 不可重试或已达到最大重试次数，处理错误响应
          // 注意：response.body只能读取一次，需要先克隆
          const responseClone = response.clone();
          try {
            if (response.headers.get('Content-Type')?.startsWith('application/json')) {
              throw UserFriendlyError.fromAny(await responseClone.json());
            } else {
              const text = await responseClone.text();
              throw UserFriendlyError.fromAny(text || {
                status: statusCode,
                message: response.statusText || `HTTP ${statusCode}`,
              });
            }
          } catch (parseError) {
            // 如果解析失败，使用基本错误信息
            throw new UserFriendlyError({
              status: statusCode,
              code: 'HTTP_ERROR',
              type: 'HTTP_ERROR',
              name: 'NETWORK_ERROR' as any,
              message: response.statusText || `HTTP ${statusCode}`,
            });
          }
        }

        // 请求成功
        if (attempt > 0) {
          logger.info(`请求重试成功: ${url}`, { attempt });
        }
        return response;

      } catch (err: any) {
        lastError = err;
        
        // 判断是否可重试
        const isRetryable = isRetryableError(err, lastResponse?.status);
        
        if (attempt < retryConfig.maxRetries && isRetryable) {
          // 继续重试
          continue;
        }
        
        // 不可重试或已达到最大重试次数，抛出错误
        if (attempt > 0) {
          logger.error(`请求重试失败: ${url}`, { 
            attempt, 
            maxRetries: retryConfig.maxRetries,
            error: err 
          });
        }
        throw err;
      }
    }

    // 所有重试都失败
    throw lastError || new UserFriendlyError({
      status: 500,
      code: 'NETWORK_ERROR',
      type: 'NETWORK_ERROR',
      name: 'NETWORK_ERROR',
      message: '网络请求失败，已重试所有次数',
    });
  };

  /**
   * 检查是否为认证相关的端点（这些端点不需要JWT token）
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = [
      '/api/auth/sign-in',
      '/api/auth/sign-in-with-code',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/magic-link',
      '/api/auth/send-verification-code',
      '/api/auth/preflight',
    ];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}

