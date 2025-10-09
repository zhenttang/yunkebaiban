export * from './types';
export * from './config';
export * from './client';
export * from './error-handling';
export * from './interceptors';
export * from './api-services';
import { AxiosHttpClient } from './client';
/**
 * 默认HTTP客户端实例
 */
export declare const httpClient: AxiosHttpClient;
/**
 * 重新配置HTTP客户端
 * @param config 新的配置
 */
export declare const configureHttpClient: (config: {
    baseUrl?: string;
    timeout?: number;
    headers?: Record<string, string>;
}) => AxiosHttpClient;
declare const _default: {
    /**
     * GET请求
     * @param url 请求地址
     * @param params URL参数
     * @param options 请求选项
     */
    get: <T>(url: string, params?: Record<string, string | number>, options?: import("./types").RequestOptions) => Promise<T>;
    /**
     * POST请求
     * @param url 请求地址
     * @param data 请求体
     * @param options 请求选项
     */
    post: <T>(url: string, data?: unknown, options?: import("./types").RequestOptions) => Promise<T>;
    /**
     * PUT请求
     * @param url 请求地址
     * @param data 请求体
     * @param options 请求选项
     */
    put: <T>(url: string, data?: unknown, options?: import("./types").RequestOptions) => Promise<T>;
    /**
     * DELETE请求
     * @param url 请求地址
     * @param data 请求体
     * @param options 请求选项
     */
    delete: <T>(url: string, data?: unknown, options?: import("./types").RequestOptions) => Promise<T>;
    /**
     * 发送自定义请求
     * @param url 请求地址
     * @param options 请求选项
     */
    request: <T>(url: string, options?: import("./types").RequestOptions) => Promise<import("./types").RequestResponse<T>>;
    /**
     * 取消所有请求
     * @param reason 取消原因
     */
    cancelAll: (reason?: string) => void;
};
export default _default;
//# sourceMappingURL=index.d.ts.map