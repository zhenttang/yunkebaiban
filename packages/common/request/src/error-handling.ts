import type { RequestError } from './types';

/**
 * 请求错误代码
 */
export enum ErrorCode {
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  // 请求超时
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  // 请求取消
  REQUEST_CANCELED = 'REQUEST_CANCELED',
  // 认证失败
  AUTH_FAILED = 'AUTH_FAILED',
  // 认证过期
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  // 无权限
  FORBIDDEN = 'FORBIDDEN',
  // 资源不存在
  NOT_FOUND = 'NOT_FOUND',
  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  // 服务器错误
  SERVER_ERROR = 'SERVER_ERROR',
  // 请求失败
  REQUEST_FAILED = 'REQUEST_FAILED',
  // 未知错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  private static errorListeners: Array<(error: RequestError) => void> = [];

  /**
   * 添加错误监听器
   * @param listener 错误监听函数
   */
  static addErrorListener(listener: (error: RequestError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * 移除错误监听器
   * @param listener 要移除的监听器
   */
  static removeErrorListener(listener: (error: RequestError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index !== -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * 处理错误
   * @param error 请求错误
   */
  static handleError(error: RequestError): void {
    // 记录错误日志
    console.error('[Request Error]', error);
    
    // 触发错误监听器
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
    
    // 对特定错误进行特殊处理
    switch (error.code) {
      case ErrorCode.AUTH_EXPIRED:
        // 认证过期，可以触发重定向到登录页
        window.location.href = '/login';
        break;
      
      case ErrorCode.NETWORK_ERROR:
        // 网络错误，可以显示重试按钮
        break;
      
      case ErrorCode.TIMEOUT_ERROR:
        // 超时错误，可以显示重试按钮
        break;
    }
  }

  /**
   * 创建一个标准错误对象
   * @param code 错误代码
   * @param message 错误消息
   * @param details 错误详情
   * @param request 请求信息
   * @param response 响应信息
   */
  static createError(
    code: string,
    message: string,
    details?: unknown,
    request?: { url: string; method: string; data?: unknown },
    response?: { status: number; data: unknown }
  ): RequestError {
    return {
      code,
      message,
      details,
      request,
      response
    };
  }
  
  /**
   * 从异常创建错误对象
   * @param error 异常对象
   */
  static fromError(error: any): RequestError {
    // 已经是标准错误格式
    if (error.code && error.message) {
      return error;
    }
    
    // Axios错误
    if (error.isAxiosError) {
      return this.createError(
        ErrorCode.REQUEST_FAILED,
        error.message,
        error,
        {
          url: error.config?.url || '',
          method: error.config?.method || '',
          data: error.config?.data
        },
        error.response
          ? {
              status: error.response.status,
              data: error.response.data
            }
          : undefined
      );
    }
    
    // 其他错误
    return this.createError(
      ErrorCode.UNKNOWN_ERROR,
      error.message || '未知错误',
      error
    );
  }
} 