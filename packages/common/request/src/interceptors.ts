import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * 认证令牌管理
 */
export const tokenManager = {
  get: (): string | null => {
    return localStorage.getItem('auth_token') || null;
  },
  set: (token: string): void => {
    localStorage.setItem('auth_token', token);
  },
  remove: (): void => {
    localStorage.removeItem('auth_token');
  }
};

/**
 * 设置请求拦截器
 * @param instance Axios实例
 */
export const setupRequestInterceptors = (instance: AxiosInstance): void => {
  // 请求前添加认证头
  instance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      const token = tokenManager.get();
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );
};

/**
 * 设置响应拦截器
 * @param instance Axios实例
 */
export const setupResponseInterceptors = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 处理成功响应，直接返回数据部分
      return response;
    },
    async (error: AxiosError) => {
      if (!error.response) {
        // 网络错误或请求被取消
        return Promise.reject({
          code: 'NETWORK_ERROR',
          message: '网络连接失败，请检查您的网络连接',
          details: error
        });
      }

      const originalRequest = error.config;
      
      // 处理401错误 - 令牌过期
      if (error.response.status === 401) {
        try {
          // 尝试刷新令牌
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken && originalRequest) {
            // 防止无限循环
            if (originalRequest.url?.includes('/api/auth/refresh')) {
              tokenManager.remove();
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
              return Promise.reject({
                code: 'AUTH_EXPIRED',
                message: '登录已过期，请重新登录',
                response: error.response
              });
            }

            // 刷新令牌
            const response = await axios.post('/api/auth/refresh', {
              refreshToken
            });

            if (response.data.accessToken) {
              tokenManager.set(response.data.accessToken);
              
              // 更新header重试原始请求
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;
              
              return instance(originalRequest);
            }
          }
        } catch (refreshError) {
          // 刷新令牌失败
          tokenManager.remove();
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          
          return Promise.reject({
            code: 'AUTH_FAILED',
            message: '认证失败，请重新登录',
            response: error.response
          });
        }
      }
      
      // 处理403错误 - 权限不足
      if (error.response.status === 403) {
        return Promise.reject({
          code: 'FORBIDDEN',
          message: '您没有权限执行此操作',
          response: error.response
        });
      }
      
      // 处理404错误 - 资源不存在
      if (error.response.status === 404) {
        return Promise.reject({
          code: 'NOT_FOUND',
          message: '请求的资源不存在',
          response: error.response
        });
      }
      
      // 处理422错误 - 验证错误
      if (error.response.status === 422) {
        return Promise.reject({
          code: 'VALIDATION_ERROR',
          message: '输入验证失败',
          details: error.response.data.errors || error.response.data,
          response: error.response
        });
      }
      
      // 处理500错误 - 服务器错误
      if (error.response.status >= 500) {
        return Promise.reject({
          code: 'SERVER_ERROR',
          message: '服务器处理请求时出现错误',
          response: error.response
        });
      }
      
      // 默认错误处理
      return Promise.reject({
        code: 'REQUEST_FAILED',
        message: error.response.data?.message || '请求失败',
        response: error.response
      });
    }
  );
}; 