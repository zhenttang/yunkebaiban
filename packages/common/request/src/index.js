// 导出类型定义
export * from './types';
// 导出配置
export * from './config';
// 导出客户端
export * from './client';
// 导出错误处理
export * from './error-handling';
// 导出拦截器
export * from './interceptors';
// 导出API服务
export * from './api-services';
// 创建默认HTTP客户端实例
import { AxiosHttpClient } from './client';
/**
 * 默认HTTP客户端实例
 */
export const httpClient = new AxiosHttpClient();
/**
 * 重新配置HTTP客户端
 * @param config 新的配置
 */
export const configureHttpClient = (config) => {
    // 当前AxiosHttpClient不支持直接重新配置
    // 重新创建一个实例替换现有的（未来可以优化）
    return new AxiosHttpClient();
};
// 简化使用的请求工具函数
export default {
    /**
     * GET请求
     * @param url 请求地址
     * @param params URL参数
     * @param options 请求选项
     */
    get: httpClient.get.bind(httpClient),
    /**
     * POST请求
     * @param url 请求地址
     * @param data 请求体
     * @param options 请求选项
     */
    post: httpClient.post.bind(httpClient),
    /**
     * PUT请求
     * @param url 请求地址
     * @param data 请求体
     * @param options 请求选项
     */
    put: httpClient.put.bind(httpClient),
    /**
     * DELETE请求
     * @param url 请求地址
     * @param data 请求体
     * @param options 请求选项
     */
    delete: httpClient.delete.bind(httpClient),
    /**
     * 发送自定义请求
     * @param url 请求地址
     * @param options 请求选项
     */
    request: httpClient.request.bind(httpClient),
    /**
     * 取消所有请求
     * @param reason 取消原因
     */
    cancelAll: httpClient.cancelAll.bind(httpClient)
};
//# sourceMappingURL=index.js.map