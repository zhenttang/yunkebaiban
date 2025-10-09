/**
 * 请求错误代码
 */
export var ErrorCode;
(function (ErrorCode) {
    // 网络错误
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    // 请求超时
    ErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    // 请求取消
    ErrorCode["REQUEST_CANCELED"] = "REQUEST_CANCELED";
    // 认证失败
    ErrorCode["AUTH_FAILED"] = "AUTH_FAILED";
    // 认证过期
    ErrorCode["AUTH_EXPIRED"] = "AUTH_EXPIRED";
    // 无权限
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    // 资源不存在
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    // 验证错误
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    // 服务器错误
    ErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
    // 请求失败
    ErrorCode["REQUEST_FAILED"] = "REQUEST_FAILED";
    // 未知错误
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ErrorCode || (ErrorCode = {}));
/**
 * 错误处理器
 */
export class ErrorHandler {
    static { this.errorListeners = []; }
    /**
     * 添加错误监听器
     * @param listener 错误监听函数
     */
    static addErrorListener(listener) {
        this.errorListeners.push(listener);
    }
    /**
     * 移除错误监听器
     * @param listener 要移除的监听器
     */
    static removeErrorListener(listener) {
        const index = this.errorListeners.indexOf(listener);
        if (index !== -1) {
            this.errorListeners.splice(index, 1);
        }
    }
    /**
     * 处理错误
     * @param error 请求错误
     */
    static handleError(error) {
        // 记录错误日志
        console.error('[Request Error]', error);
        // 触发错误监听器
        this.errorListeners.forEach(listener => {
            try {
                listener(error);
            }
            catch (e) {
                console.error('Error in error listener:', e);
            }
        });
        // 对特定错误进行特殊处理
        switch (error.code) {
            case ErrorCode.AUTH_EXPIRED:
                // 认证过期，根据当前页面重定向到相应登录页
                const currentPath = window.location.pathname;
                console.warn('AUTH_EXPIRED错误，当前路径:', currentPath);
                // 临时禁用自动重定向，用于调试
                if (currentPath.startsWith('/admin/auth')) {
                    console.warn('在admin登录页面，不执行重定向避免循环');
                    break;
                }
                if (currentPath.startsWith('/admin')) {
                    // 如果在admin页面，重定向到admin登录页
                    console.warn('重定向到admin登录页');
                    window.location.href = '/admin/auth';
                }
                else {
                    // 其他页面重定向到默认登录页
                    console.warn('重定向到默认登录页');
                    window.location.href = '/login';
                }
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
    static createError(code, message, details, request, response) {
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
    static fromError(error) {
        // 已经是标准错误格式
        if (error.code && error.message) {
            return error;
        }
        // Axios错误
        if (error.isAxiosError) {
            return this.createError(ErrorCode.REQUEST_FAILED, error.message, error, {
                url: error.config?.url || '',
                method: error.config?.method || '',
                data: error.config?.data
            }, error.response
                ? {
                    status: error.response.status,
                    data: error.response.data
                }
                : undefined);
        }
        // 其他错误
        return this.createError(ErrorCode.UNKNOWN_ERROR, error.message || '未知错误', error);
    }
}
//# sourceMappingURL=error-handling.js.map