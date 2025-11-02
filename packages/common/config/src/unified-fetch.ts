/**
 * 统一的网络请求工具函数
 * 供无法使用FetchService的场景使用，确保至少使用统一配置
 * 
 * 注意：如果可以使用FetchService，优先使用FetchService以获得重试、超时等功能
 */

import { getBaseUrl, getApiBaseUrl } from './network-config';

/**
 * 统一的fetch wrapper，使用统一配置构建URL
 * 用于无法使用FetchService的场景（如服务器初始化阶段）
 * 
 * @param path API路径（相对路径，如 '/api/users' 或 '/users'）
 * @param options fetch选项
 * @returns Promise<Response>
 */
export async function unifiedFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  // 如果已经是完整URL，直接使用
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return await fetch(path, options);
  }

  // 统一使用 network-config.ts 的配置
  // 如果路径以 /api 开头，使用 getBaseUrl()；否则使用 getApiBaseUrl()
  const baseUrl = path.startsWith('/api') ? getBaseUrl() : getApiBaseUrl();
  const fullUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  return await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * 构建完整的API URL
 * @param path API路径
 * @returns 完整的URL
 */
export function buildApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const baseUrl = path.startsWith('/api') ? getBaseUrl() : getApiBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

