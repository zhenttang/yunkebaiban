import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

import { defaultRequestConfig } from './config';
import { ErrorCode, ErrorHandler } from './error-handling';
import { setupRequestInterceptors, setupResponseInterceptors } from './interceptors';
import { HttpClient, RequestMethod, RequestOptions, RequestResponse } from './types';

/**
 * 请求缓存接口
 */
interface CacheItem {
  timestamp: number;
  response: any;
}

/**
 * Axios HTTP客户端实现
 */
export class AxiosHttpClient implements HttpClient {
  private readonly axios: AxiosInstance;
  private readonly pendingRequests: Map<string, CancelTokenSource> = new Map();
  private readonly cache: Map<string, CacheItem> = new Map();

  /**
   * 构造函数
   */
  constructor() {
    // 创建axios实例
    this.axios = axios.create({
      baseURL: defaultRequestConfig.environment.baseUrl,
      timeout: defaultRequestConfig.timeout.request,
      headers: defaultRequestConfig.headers
    });

    // 设置拦截器
    setupRequestInterceptors(this.axios);
    setupResponseInterceptors(this.axios);
  }

  /**
   * 构建缓存键
   * @param url 请求URL
   * @param method 请求方法
   * @param params URL参数
   * @param data 请求体
   */
  private createCacheKey(url: string, method: string, params?: any, data?: any): string {
    return `${method}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
  }

  /**
   * 从缓存获取响应
   * @param cacheKey 缓存键
   * @param cacheTime 缓存时间
   */
  private getFromCache(cacheKey: string, cacheTime: number): any | undefined {
    const cachedItem = this.cache.get(cacheKey);
    
    if (cachedItem) {
      const now = Date.now();
      if (now - cachedItem.timestamp < cacheTime) {
        return cachedItem.response;
      } else {
        // 缓存已过期
        this.cache.delete(cacheKey);
      }
    }
    
    return undefined;
  }

  /**
   * 设置缓存
   * @param cacheKey 缓存键
   * @param response 响应数据
   */
  private setCache(cacheKey: string, response: any): void {
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      response
    });
  }

  /**
   * 取消之前的相同请求
   * @param requestKey 请求键
   */
  private cancelPreviousRequest(requestKey: string): void {
    const previousRequest = this.pendingRequests.get(requestKey);
    if (previousRequest) {
      previousRequest.cancel('Request superseded by new request');
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * 处理URL中的路径参数
   * @param url URL
   * @param params 参数
   */
  private processUrl(url: string, params?: Record<string, any>): string {
    let processedUrl = url;
    
    // 处理URL中的路径参数，如/api/workspaces/:id
    if (params) {
      Object.keys(params).forEach(key => {
        const placeholder = `:${key}`;
        if (processedUrl.includes(placeholder)) {
          processedUrl = processedUrl.replace(placeholder, encodeURIComponent(params[key]));
          delete params[key]; // 从参数中移除已处理的路径参数
        }
      });
    }
    
    return processedUrl;
  }

  /**
   * 发送请求
   * @param url 请求URL
   * @param options 请求选项
   */
  async request<T>(url: string, options: RequestOptions = {}): Promise<RequestResponse<T>> {
    const {
      method = RequestMethod.GET,
      headers,
      data,
      params,
      timeout,
      cancelPrevious = false,
      retry = defaultRequestConfig.retry.maxRetries,
      cache = false,
      cacheTime = 60000 // 默认缓存1分钟
    } = options;

    const processedUrl = this.processUrl(url, params);
    const requestKey = this.createCacheKey(processedUrl, method, params, data);

    try {
      // 检查缓存
      if (cache && method === RequestMethod.GET) {
        const cachedResponse = this.getFromCache(requestKey, cacheTime);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      // 取消之前的相同请求
      if (cancelPrevious) {
        this.cancelPreviousRequest(requestKey);
      }

      // 创建取消令牌
      const cancelTokenSource = axios.CancelToken.source();
      this.pendingRequests.set(requestKey, cancelTokenSource);

      // 准备请求配置
      const requestConfig: AxiosRequestConfig = {
        url: processedUrl,
        method,
        headers,
        params,
        data,
        timeout: timeout || defaultRequestConfig.timeout.request,
        cancelToken: cancelTokenSource.token
      };

      // 发送请求
      const response: AxiosResponse<T> = await this.axios.request(requestConfig);

      // 请求完成，从挂起列表中移除
      this.pendingRequests.delete(requestKey);

      // 构建响应对象
      const responseData: RequestResponse<T> = {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>
      };

      // 缓存响应
      if (cache && method === RequestMethod.GET) {
        this.setCache(requestKey, responseData);
      }

      return responseData;
    } catch (error: any) {
      // 请求完成，从挂起列表中移除
      this.pendingRequests.delete(requestKey);

      // 请求被取消
      if (axios.isCancel(error)) {
        throw ErrorHandler.createError(
          ErrorCode.REQUEST_CANCELED,
          '请求已取消',
          error
        );
      }

      // 尝试重试
      const maxRetries = typeof retry === 'boolean' ? (retry ? defaultRequestConfig.retry.maxRetries : 0) : retry;
      
      if (maxRetries > 0 && this.shouldRetry(error)) {
        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, defaultRequestConfig.retry.retryDelay));
        
        // 递减重试次数
        options.retry = maxRetries - 1;
        
        // 重试请求
        return this.request<T>(url, options);
      }

      // 处理错误
      const requestError = ErrorHandler.fromError(error);
      ErrorHandler.handleError(requestError);
      
      throw requestError;
    }
  }

  /**
   * 判断是否应该重试请求
   * @param error 错误对象
   */
  private shouldRetry(error: any): boolean {
    // 网络错误应该重试
    if (!error.response) {
      return true;
    }
    
    // 检查状态码是否在可重试列表中
    const statusCode = error.response.status;
    return defaultRequestConfig.retry.statusCodesToRetry.includes(statusCode);
  }

  /**
   * GET请求
   * @param url 请求URL
   * @param params URL参数
   * @param options 请求选项
   */
  async get<T>(
    url: string,
    params?: Record<string, string | number>,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.request<T>(url, {
      method: RequestMethod.GET,
      params,
      ...options
    });
    return response.data;
  }

  /**
   * POST请求
   * @param url 请求URL
   * @param data 请求体
   * @param options 请求选项
   */
  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(url, {
      method: RequestMethod.POST,
      data,
      ...options
    });
    return response.data;
  }

  /**
   * PUT请求
   * @param url 请求URL
   * @param data 请求体
   * @param options 请求选项
   */
  async put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(url, {
      method: RequestMethod.PUT,
      data,
      ...options
    });
    return response.data;
  }

  /**
   * DELETE请求
   * @param url 请求URL
   * @param data 请求体
   * @param options 请求选项
   */
  async delete<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(url, {
      method: RequestMethod.DELETE,
      data,
      ...options
    });
    return response.data;
  }

  /**
   * 取消所有请求
   * @param reason 取消原因
   */
  cancelAll(reason = '用户取消请求'): void {
    for (const source of this.pendingRequests.values()) {
      source.cancel(reason);
    }
    this.pendingRequests.clear();
  }
} 