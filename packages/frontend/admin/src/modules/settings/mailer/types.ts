export interface MailerConfigDto {
  enabled: boolean;
  host: string;
  port: number;
  username?: string;
  password?: string;
  sender: string;
  senderName?: string;
  ssl?: boolean;
  startTls?: boolean;
  ignoreTls?: boolean;
  connectionTimeout?: number;
  readTimeout?: number;
  debug?: boolean;
  provider?: string;
  maxQueueSize?: number;
  maxRetries?: number;
  retryInterval?: number;
  queueEnabled?: boolean;
}

export interface MailerProviderDto {
  id: string;
  name: string;
  description?: string;
  defaultHost: string;
  defaultPort: number;
  defaultSsl: boolean;
  defaultStartTls: boolean;
  supportedAuthMethods: string[];
  documentationUrl?: string;
}

export interface MailerTestResultDto {
  success: boolean;
  message: string;
  details?: string;
  duration?: number;
  timestamp?: string;
}

export interface SendTestMailRequestDto {
  toEmail: string;
  subject?: string;
  content?: string;
  useCurrentConfig?: boolean;
  config?: MailerConfigDto;
}

export interface ValidationResultDto {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MailerStatsDto {
  totalSent: number;
  totalFailed: number;
  successRate: number;
  queueSize: number;
  dailyStats: {
    sent: number;
    failed: number;
    date: string;
  }[];
  recentFailures: {
    error: string;
    count: number;
    lastOccurred: string;
  }[];
  averageDeliveryTime: number;
  enabled: boolean;
  lastTestTime?: string;
  lastTestResult?: boolean;
}

export interface MailTemplateDto {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'reset_password' | 'invitation' | 'notification' | 'custom';
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailStatisticsDto {
  totalSent: number;
  totalSuccess: number;
  totalFailed: number;
  successRate: number;
  failureRate: number;
  todaySent: number;
  weekSent: number;
  monthSent: number;
  averageDeliveryTime: number;
  peakHour: number;
  mostUsedTemplate: string;
}

export interface EmailLogDto {
  id: string;
  toEmail: string;
  subject: string;
  templateId?: string;
  status: 'success' | 'failed' | 'pending';
  sentAt: string;
  deliveryTime?: number;
  errorMessage?: string;
  retryCount?: number;
}

export interface TemplateUsageDto {
  templateId: string;
  templateName: string;
  templateType: string;
  usageCount: number;
  successCount: number;
  failureCount: number;
  lastUsed: string;
  averageDeliveryTime?: number;
}