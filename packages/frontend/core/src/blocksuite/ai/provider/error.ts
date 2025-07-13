abstract class BaseAIError extends Error {
  abstract readonly type: AIErrorType;
}

export enum AIErrorType {
  GeneralNetworkError = 'GeneralNetworkError',
  PaymentRequired = 'PaymentRequired',
  Unauthorized = 'Unauthorized',
  RequestTimeout = 'RequestTimeout',
}

export class UnauthorizedError extends BaseAIError {
  readonly type = AIErrorType.Unauthorized;

  constructor() {
    super('未授权');
  }
}

// user has used up the quota
export class PaymentRequiredError extends BaseAIError {
  readonly type = AIErrorType.PaymentRequired;

  constructor() {
    super('需要付费');
  }
}

// general 500x error
export class GeneralNetworkError extends BaseAIError {
  readonly type = AIErrorType.GeneralNetworkError;

  constructor(message: string = '网络错误') {
    super(message);
  }
}

// request timeout
export class RequestTimeoutError extends BaseAIError {
  readonly type = AIErrorType.RequestTimeout;

  constructor(message: string = '请求超时') {
    super(message);
  }
}

export type AIError =
  | UnauthorizedError
  | PaymentRequiredError
  | GeneralNetworkError
  | RequestTimeoutError;
