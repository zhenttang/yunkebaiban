// 服务器配置相关类型定义

export interface ServerConfigDto {
  serverName: string;
  externalUrl?: string;
  host?: string;
  port?: number;
  httpsEnabled?: boolean;
  maxUploadSize?: number; // MB
  sessionTimeout?: number; // minutes
  enableSignup?: boolean;
  enableInviteCode?: boolean;
  defaultLanguage?: string;
  timezone?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  extensions?: Record<string, any>;
}

export interface SystemInfoDto {
  config: ServerConfigDto;
  version: {
    version: string;
    buildTime: string;
    gitCommit?: string;
    environment: string;
  };
  runtime: {
    uptime: number;
    startTime: string;
    javaVersion: string;
    maxMemory: number;
    totalMemory: number;
    freeMemory: number;
  };
  system: {
    osName: string;
    osVersion: string;
    osArch: string;
    availableProcessors: number;
    memory: {
      total: number;
      used: number;
      free: number;
    };
  };
  status: ServiceStatus;
}

export interface ServiceStatus {
  overall: 'UP' | 'DOWN' | 'WARNING';
  database: ComponentStatus;
  redis: ComponentStatus;
  storage: ComponentStatus;
  email: ComponentStatus;
}

export interface ComponentStatus {
  status: 'UP' | 'DOWN' | 'WARNING';
  message?: string;
  details?: Record<string, any>;
}

export interface ServerStatusDto {
  status: 'running' | 'stopped' | 'maintenance';
  uptime: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  health: ServiceStatus;
}

export interface ConfigValidationResult {
  valid: boolean;
  message: string;
  errors?: string[];
}