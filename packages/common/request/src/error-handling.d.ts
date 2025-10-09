import type { RequestError } from './types';
/**
 * 请求错误代码
 */
export declare enum ErrorCode {
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    REQUEST_CANCELED = "REQUEST_CANCELED",
    AUTH_FAILED = "AUTH_FAILED",
    AUTH_EXPIRED = "AUTH_EXPIRED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    SERVER_ERROR = "SERVER_ERROR",
    REQUEST_FAILED = "REQUEST_FAILED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
/**
 * 错误处理器
 */
export declare class ErrorHandler {
    private static errorListeners;
    /**
     * 添加错误监听器
     * @param listener 错误监听函数
     */
    static addErrorListener(listener: (error: RequestError) => void): void;
    /**
     * 移除错误监听器
     * @param listener 要移除的监听器
     */
    static removeErrorListener(listener: (error: RequestError) => void): void;
    /**
     * 处理错误
     * @param error 请求错误
     */
    static handleError(error: RequestError): void;
    /**
     * 创建一个标准错误对象
     * @param code 错误代码
     * @param message 错误消息
     * @param details 错误详情
     * @param request 请求信息
     * @param response 响应信息
     */
    static createError(code: string, message: string, details?: unknown, request?: {
        url: string;
        method: string;
        data?: unknown;
    }, response?: {
        status: number;
        data: unknown;
    }): RequestError;
    /**
     * 从异常创建错误对象
     * @param error 异常对象
     */
    static fromError(error: any): RequestError;
}
//# sourceMappingURL=error-handling.d.ts.map