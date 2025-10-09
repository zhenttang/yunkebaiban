import { ApiEndpoints, EnvironmentConfig, EnvironmentType, RequestConfig, RetryConfig, TimeoutConfig } from './types';
/**
 * 默认超时配置
 */
export declare const DEFAULT_TIMEOUT: TimeoutConfig;
/**
 * 默认重试配置
 */
export declare const DEFAULT_RETRY: RetryConfig;
/**
 * API端点配置
 */
export declare const API_ENDPOINTS: ApiEndpoints;
/**
 * 环境配置 - 使用统一配置管理
 */
export declare const environments: Record<EnvironmentType, EnvironmentConfig>;
/**
 * 获取当前环境
 */
export declare const getCurrentEnvironment: () => EnvironmentType;
/**
 * 创建请求配置
 */
export declare const createRequestConfig: (env?: EnvironmentType) => RequestConfig;
/**
 * 默认请求配置
 */
export declare const defaultRequestConfig: RequestConfig;
//# sourceMappingURL=config.d.ts.map