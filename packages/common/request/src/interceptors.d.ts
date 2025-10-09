import { AxiosInstance } from 'axios';
/**
 * 认证令牌管理
 */
export declare const tokenManager: {
    get: () => string | null;
    set: (token: string) => void;
    remove: () => void;
};
/**
 * 设置请求拦截器
 * @param instance Axios实例
 */
export declare const setupRequestInterceptors: (instance: AxiosInstance) => void;
/**
 * 设置响应拦截器
 * @param instance Axios实例
 */
export declare const setupResponseInterceptors: (instance: AxiosInstance) => void;
//# sourceMappingURL=interceptors.d.ts.map