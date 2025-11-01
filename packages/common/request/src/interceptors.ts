import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * 认证令牌管理
 */
export const tokenManager = {
  get: (): string | null => {
    return localStorage.getItem('yunke-admin-token') || null;
  },
  set: (token: string): void => {
    localStorage.setItem('yunke-admin-token', token);
  },
  remove: (): void => {
    localStorage.removeItem('yunke-admin-token');
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
      console.log('=== 🚀 发起请求 ===');
      console.log('完整URL:', `${config.baseURL}${config.url}`);
      console.log('请求方法:', config.method?.toUpperCase());
      console.log('BaseURL:', config.baseURL);
      console.log('相对URL:', config.url);
      console.log('请求头:', config.headers);
      console.log('请求参数:', config.params);
      console.log('请求体:', config.data);
      console.log('超时设置:', config.timeout);
      console.log('跨域设置:', config.withCredentials);
      
      const token = tokenManager.get();
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ 添加认证头:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.log('⚠️  未找到认证令牌');
      }
      
      console.log('=== 📡 最终请求配置 ===');
      console.log('完整请求配置:', {
        url: `${config.baseURL}${config.url}`,
        method: config.method,
        headers: config.headers,
        timeout: config.timeout,
        withCredentials: config.withCredentials
      });
      
      return config;
    },
    (error: AxiosError) => {
      console.error('❌ 请求拦截器错误:', error);
      return Promise.reject(error);
    }
  );
};

/**
 * 设置响应拦截器
 * @param instance Axios实例
 */
export const setupResponseInterceptors = (instance: AxiosInstance): void => {
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    failedQueue = [];
  };

  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log('=== 🟢 响应成功 ===');
      console.log('响应URL:', response.config.url);
      console.log('响应状态:', response.status);
      console.log('响应头:', response.headers);
      console.log('响应数据:', response.data);
      
      // 处理成功响应，直接返回数据部分
      return response;
    },
    async (error: AxiosError) => {
      console.log('=== 🔴 响应失败 ===');
      console.log('错误类型:', error.code);
      console.log('错误消息:', error.message);
      console.log('请求URL:', error.config?.url);
      console.log('请求方法:', error.config?.method);
      console.log('错误详情:', error);
      
      if (!error.response) {
        console.log('=== 🌐 网络错误详情 ===');
        console.log('没有响应对象，可能是网络连接问题');
        console.log('Error Code:', error.code);
        console.log('Error Message:', error.message);
        console.log('是否连接超时:', error.code === 'ECONNABORTED');
        console.log('是否网络不可达:', error.code === 'ENOTFOUND');
        
        // 网络错误或请求被取消
        const errorMessage = error?.message || error?.toString() || String(error) || '网络连接失败';
        return Promise.reject({
          code: 'NETWORK_ERROR',
          message: `网络错误: ${errorMessage}`,
          details: error,
          networkError: true
        });
      }

      const originalRequest = error.config;
      
      // 处理401错误 - 令牌过期
      if (error.response.status === 401 && originalRequest) {
        // 对于登录接口的401错误，直接返回，不当作令牌过期处理
        if (originalRequest.url?.includes('/api/auth/sign-in')) {
          return Promise.reject({
            code: 'AUTH_FAILED',
            message: error.response.data?.message || '用户名或密码错误',
            response: error.response
          });
        }
        
        // 防止无限循环刷新
        if (originalRequest.url?.includes('/api/auth/refresh')) {
          tokenManager.remove();
          localStorage.removeItem('yunke-admin-refresh-token');
          
          return Promise.reject({
            code: 'AUTH_EXPIRED',
            message: '登录已过期，请重新登录',
            response: error.response
          });
        }

        // 如果正在刷新令牌，将请求加入队列
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            if (token && originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return instance(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        // 开始刷新令牌
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('yunke-admin-refresh-token');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // 刷新令牌
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });

          if (response.data.token) {
            const newToken = response.data.token;
            tokenManager.set(newToken);
            
            if (response.data.refreshToken) {
              localStorage.setItem('yunke-admin-refresh-token', response.data.refreshToken);
            }
            
            // 处理队列中的请求
            processQueue(null, newToken);
            
            // 更新header重试原始请求
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            }
            
            isRefreshing = false;
            return instance(originalRequest);
          } else {
            throw new Error('No token in refresh response');
          }
        } catch (refreshError) {
          // 刷新令牌失败
          processQueue(refreshError, null);
          tokenManager.remove();
          localStorage.removeItem('yunke-admin-refresh-token');
          isRefreshing = false;
          
          // 不要自动跳转，让组件处理
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