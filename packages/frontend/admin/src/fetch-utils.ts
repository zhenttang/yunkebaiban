/**
 * Custom fetch utility for AFFiNE admin panel
 * Automatically adds headers and handles Java backend integration
 */

// 获取应用版本，如果未定义则使用默认值
const getAppVersion = () => {
  if (typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.appVersion) {
    return BUILD_CONFIG.appVersion;
  }
  return '0.21.0'; // 默认版本号
};

/**
 * Wrapper around fetch that automatically adds required headers for Java backend
 * @param input Request URL
 * @param init Request initialization options
 * @returns Promise with the fetch Response
 */
export const affineFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  // 获取存储的认证token
  const token = localStorage.getItem('affine-admin-token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-affine-version': getAppVersion(),
    ...init?.headers,
  };

  // 如果有认证token，添加到请求头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(input, {
    ...init,
    headers,
  });
};
