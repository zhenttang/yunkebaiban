import { HttpClient, RequestOptions, RequestResponse } from './types';
/**
 * Axios HTTP客户端实现
 */
export declare class AxiosHttpClient implements HttpClient {
    private readonly axios;
    private readonly pendingRequests;
    private readonly cache;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 构建缓存键
     * @param url 请求URL
     * @param method 请求方法
     * @param params URL参数
     * @param data 请求体
     */
    private createCacheKey;
    /**
     * 从缓存获取响应
     * @param cacheKey 缓存键
     * @param cacheTime 缓存时间
     */
    private getFromCache;
    /**
     * 设置缓存
     * @param cacheKey 缓存键
     * @param response 响应数据
     */
    private setCache;
    /**
     * 取消之前的相同请求
     * @param requestKey 请求键
     */
    private cancelPreviousRequest;
    /**
     * 处理URL中的路径参数
     * @param url URL
     * @param params 参数
     */
    private processUrl;
    /**
     * 发送请求
     * @param url 请求URL
     * @param options 请求选项
     */
    request<T>(url: string, options?: RequestOptions): Promise<RequestResponse<T>>;
    /**
     * 判断是否应该重试请求
     * @param error 错误对象
     */
    private shouldRetry;
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
//# sourceMappingURL=client.d.ts.map