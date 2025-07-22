// T4: 认证授权模块 - TypeScript 类型定义

// 现有的前端类型
export interface AuthConfigDto {
  enableLoginLocking: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableTwoFactor: boolean;
  forceTwoFactor: boolean;
  totpValidityMinutes: number;
  enableRememberMe: boolean;
  rememberMeDays: number;
  enableSso: boolean;
  limitConcurrentSessions: boolean;
  maxConcurrentSessions: number;
  enableIpWhitelist: boolean;
  ipWhitelist: string;
  enableLoginCaptcha: boolean;
  captchaThreshold: number;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  lastUpdated?: string;
  lastUpdatedBy?: string;
}

export interface PasswordPolicyDto {
  enablePasswordPolicy: boolean;
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  allowedSpecialChars: string;
  forbidCommonPasswords: boolean;
  forbidUserInfo: boolean;
  passwordHistory: number;
  passwordExpireDays: number;
  passwordExpireWarningDays: number;
  forceChangeOnFirstLogin: boolean;
  passwordRetryDelay: number;
  lastUpdated?: string;
  lastUpdatedBy?: string;
}

export interface SecurityEventDto {
  id?: string;
  userId?: string;
  userEmail?: string;
  eventType: SecurityEventType;
  description: string;
  ipAddress: string;
  userAgent: string;
  success?: boolean;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type SecurityEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'PERMISSION_DENIED'
  | 'SESSION_EXPIRED'
  | 'TWO_FACTOR_ENABLED'
  | 'TWO_FACTOR_DISABLED';

export interface SecurityEventsResponse {
  content: SecurityEventDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SessionDto {
  id: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
}

export interface SessionStatsDto {
  totalActiveSessions: number;
  uniqueActiveUsers: number;
  averageSessionDuration: number;
  sessionsLast24h: number;
}

// 后端SecurityConfigDto结构（用于新的认证授权API）
export interface SecurityConfigDto {
  enabled: boolean;
  loginSecurity: LoginSecurityConfig;
  ipAccess: IpAccessConfig;
  passwordPolicy: PasswordPolicyConfig;
  sessionSecurity: SessionSecurityConfig;
  apiSecurity: ApiSecurityConfig;
  monitoring: SecurityMonitoringConfig;
}

export interface LoginSecurityConfig {
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  enableCaptcha: boolean;
  captchaThreshold: number;
  enableTwoFactor: boolean;
  enableIpRestriction: boolean;
  forceSingleSession: boolean;
}

export interface IpAccessConfig {
  enableWhitelist: boolean;
  whitelist: string[];
  enableBlacklist: boolean;
  blacklist: string[];
  allowPrivateNetworks: boolean;
  allowedCountries: string[];
}

export interface PasswordPolicyConfig {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordHistory: number;
  expirationDays: number;
  bannedPasswords: string[];
}

export interface SessionSecurityConfig {
  timeoutMinutes: number;
  enableSessionFixationProtection: boolean;
  enableConcurrencyControl: boolean;
  maxConcurrentSessions: number;
  enableSecureCookies: boolean;
  cookieSameSite: string;
}

export interface ApiSecurityConfig {
  rateLimitPerMinute: number;
  enableApiKeyAuth: boolean;
  enableCorsProtection: boolean;
  allowedOrigins: string[];
  enableCsrfProtection: boolean;
  enableRequestSigning: boolean;
}

export interface SecurityMonitoringConfig {
  enableEventMonitoring: boolean;
  enableAnomalyDetection: boolean;
  enableRealTimeAlerts: boolean;
  alertEmails: string[];
  logRetentionDays: number;
  logSuccessfulLogins: boolean;
  logFailedLogins: boolean;
  logApiCalls: boolean;
}

// 简化的配置接口（用于组件）
export interface SimpleSecurityConfigDto {
  allowSignup: boolean;
  passwordPolicy: SimplePasswordPolicyDto;
  sessionTimeout: number; // 秒
  maxLoginAttempts: number;
  lockoutDuration: number; // 秒
  twoFactorEnabled: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
  lastUpdated?: string;
}

export interface SimplePasswordPolicyDto {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  passwordHistorySize: number;
}

export type SecurityEventSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// 后端SecurityEventDto结构（完整版）
export interface BackendSecurityEventDto {
  id: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  description: string;
  userId?: string;
  username?: string;
  sourceIp: string;
  userAgent?: string;
  eventTime: string;
  requestPath?: string;
  requestMethod?: string;
  geoLocation?: GeoLocationInfo;
  details?: Record<string, any>;
  handled?: boolean;
  resolution?: string;
}

export interface GeoLocationInfo {
  country?: string;
  region?: string;
  city?: string;
  isp?: string;
  longitude?: number;
  latitude?: number;
}

// 后端SessionDto结构（完整版）
export interface BackendSessionDto {
  id: string;
  userId?: string;
  userEmail: string;
  username?: string;
  isActive: boolean;
  createdAt?: string;
  lastActivity: string;
  expiresAt?: string;
  ipAddress: string;
  userAgent: string;
  deviceType?: string;
  browserType?: string;
  operatingSystem?: string;
  geoLocation?: GeoLocationInfo;
  tokenHash?: string;
  rememberMe?: boolean;
}

// 后端SessionStatsDto结构（完整版）
export interface BackendSessionStatsDto {
  totalActiveSessions: number;
  uniqueActiveUsers: number;
  sessionsLast24h: number;
  averageSessionDuration: number; // 秒
  maxSessionDuration?: number;
  expiredSessions?: number;
  todayNewSessions?: number;
  weeklyNewSessions?: number;
  mobileSessions?: number;
  desktopSessions?: number;
  averageConcurrentSessions?: number;
  peakConcurrentSessions?: number;
  peakTime?: string;
  generatedAt?: string;
}