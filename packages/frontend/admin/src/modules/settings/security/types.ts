/**
 * 安全监控类型定义
 */

// 安全级别
export type SecurityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// 安全事件类型
export type SecurityEventType =
  | 'DDOS'
  | 'BRUTE_FORCE'
  | 'SQL_INJECTION'
  | 'XSS_ATTACK'
  | 'BOT'
  | 'API_ABUSE'
  | 'SUSPICIOUS_LOGIN'
  | 'UNAUTHORIZED_ACCESS';

// 安全事件
export interface SecurityEvent {
  type: SecurityEventType;
  level: SecurityLevel;
  ip: string;
  userId?: string;
  requestPath?: string;
  requestMethod?: string;
  userAgent?: string;
  details: string;
  action: string;
  timestamp: string;
}

// 安全统计
export interface SecurityStats {
  todayEvents: number;
  attacksByType: Record<string, number>;
  blockedIpCount: number;
  todayBlockedIps?: number; // 可选字段
  lastHourEvents: number;
}

// 被封禁的IP
export interface BlockedIp {
  ip: string;
  reason: string;
  remainingMinutes: number;
  blockedAt?: string; // 可选字段
}

// 封禁IP请求
export interface BlockIpRequest {
  ip: string;
  reason: string;
  durationMinutes: number;
}

// 事件类型标签
export const EVENT_TYPE_LABELS: Record<SecurityEventType, string> = {
  DDOS: 'DDoS攻击',
  BRUTE_FORCE: '暴力破解',
  SQL_INJECTION: 'SQL注入',
  XSS_ATTACK: 'XSS攻击',
  BOT: '恶意爬虫',
  API_ABUSE: 'API滥用',
  SUSPICIOUS_LOGIN: '异常登录',
  UNAUTHORIZED_ACCESS: '越权访问',
};

// 安全级别标签和样式
export const SECURITY_LEVEL_META: Record<
  SecurityLevel,
  { label: string; className: string; color: string }
> = {
  LOW: {
    label: '低危',
    className: 'bg-blue-500/10 text-blue-600 border-blue-200',
    color: 'text-blue-600',
  },
  MEDIUM: {
    label: '中危',
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    color: 'text-yellow-600',
  },
  HIGH: {
    label: '高危',
    className: 'bg-orange-500/10 text-orange-600 border-orange-200',
    color: 'text-orange-600',
  },
  CRITICAL: {
    label: '严重',
    className: 'bg-red-500/10 text-red-600 border-red-200',
    color: 'text-red-600',
  },
};

