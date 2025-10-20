/**
 * YUNKE管理面板的自定义fetch工具
 * 现在使用统一的httpClient，而不是独立的fetch实现
 */

import { httpClient } from '../../../common/request/src';

// 获取应用版本，如果未定义则使用默认值
const getAppVersion = () => {
  if (typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.appVersion) {
    return BUILD_CONFIG.appVersion;
  }
  return '0.21.0'; // 默认版本
};

/**
 * 管理面板统一httpClient的包装器
 * 使用统一的httpClient，自动包含JWT认证
 * @param input 请求URL
 * @param init 请求初始化选项
 * @returns 返回fetch Response的Promise
 */
export const yunkeFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.toString();
  const method = init?.method || 'GET';
  
  // 使用统一的httpClient发送请求
  try {
    const headers = {
      'x-yunke-version': getAppVersion(),
      ...init?.headers,
    };

    const response = await httpClient.request(url, {
      method: method as any,
      headers,
      data: init?.body ? JSON.parse(init.body as string) : undefined,
    });

    // 将httpClient的响应转换为fetch Response格式
    return new Response(JSON.stringify(response.data), {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers as any),
    });
  } catch (error: any) {
    // 处理httpClient的错误格式
    if (error.response) {
      return new Response(JSON.stringify(error.response.data || {}), {
        status: error.response.status,
        statusText: error.response.statusText || 'Error',
        headers: new Headers(error.response.headers as any),
      });
    }
    
    // 网络错误或其他错误
    throw error;
  }
};
