export interface ThrottlerConfig {
  ttl: number; // 时间窗口 (秒)
  limit: number; // 最大请求数
  ignoreUserAgents?: string[]; // 忽略的用户代理
  skipIf?: string; // 跳过条件
  blockDuration?: number; // 阻断时长 (秒)
}

export interface ThrottleConfig {
  enabled: boolean;
  throttlers: {
    default: ThrottlerConfig;
    strict: ThrottlerConfig;
  };
}

export interface ThrottleStatsDto {
  enabled: boolean;
  activeThrottlers: number;
  totalRequests: number;
  blockedRequests: number;
  requestsPerMinute: number;
}

export interface ThrottleTestResultDto {
  success: boolean;
  message: string;
  details?: string;
  testRequests?: number;
  blockedRequests?: number;
}

export interface ValidationResultDto {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ThrottlePresetDto {
  id: string;
  name: string;
  description: string;
  config: ThrottlerConfig;
}