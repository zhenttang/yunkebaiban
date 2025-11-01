/**
 * 统一网络配置管理
 * 集中管理所有网络地址和端点配置
 */

export interface NetworkEndpoints {
  api: string;
  websocket: string;
  socketio: string;
  auth: string;
  uploads: string;
  static: string;
}

export interface NetworkConfig {
  host: string;
  port: number;
  socketioPort: number; // Socket.IO专用端口
  devServerPort?: number; // 前端开发服务器端口（Webpack Dev Server）
  protocol: 'http' | 'https';
  endpoints: NetworkEndpoints;
}

export interface Environment {
  name: string;
  config: NetworkConfig;
  description: string;
}

/**
 * 从环境变量获取配置值（必需项）
 * 如果未配置则抛出错误
 */
function getRequiredEnvValue(key: string): string {
  const buildTimeValue = import.meta.env?.[key];
  if (buildTimeValue && buildTimeValue.trim() !== '') {
    return buildTimeValue.trim();
  }
  throw new Error(`❌ 环境变量配置缺失：请在 .env 文件中配置 ${key}`);
}

/**
 * 从环境变量获取配置值（必需项）
 * 如果未配置则抛出错误
 * 统一要求：所有配置必须从env文件读取，不允许默认值
 */
function getRequiredEnvValueOrEmpty(key: string): string {
  const buildTimeValue = import.meta.env?.[key];
  if (buildTimeValue && buildTimeValue.trim() !== '') {
    return buildTimeValue.trim();
  }
  return '';
}

/**
 * 解析 URL 并提取主机、端口和协议
 */
function parseBaseUrl(baseUrl: string): { host: string; port: number; protocol: 'http' | 'https' } {
  try {
    const url = new URL(baseUrl);
    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80),
      protocol: url.protocol === 'https:' ? 'https' : 'http'
    };
  } catch (error) {
    throw new Error(`❌ 解析 VITE_API_BASE_URL 失败: ${String(error)}`);
  }
}

// 环境配置定义
function createEnvironments(): Record<string, Environment> {
  const apiBaseUrl = getRequiredEnvValue('VITE_API_BASE_URL');
  const devServerPortStr = getRequiredEnvValueOrEmpty('VITE_DEV_SERVER_PORT');
  const devServerPort = devServerPortStr ? parseInt(devServerPortStr) : undefined;
  const parsed = parseBaseUrl(apiBaseUrl);
  const socketioPortStr = getRequiredEnvValueOrEmpty('VITE_SOCKETIO_PORT');
  const socketioPort = socketioPortStr ? parseInt(socketioPortStr) : parsed.port;

  const common: NetworkConfig = {
    host: parsed.host,
    port: parsed.port,
    socketioPort,
    devServerPort,
    protocol: parsed.protocol,
    endpoints: {
      api: '/api',
      websocket: '/ws',
      socketio: '/socket.io',
      auth: '/api/auth',
      uploads: '/api/uploads',
      static: '/static',
    },
  };

  return {
    development: { name: 'development', description: 'env-only', config: common },
    production: { name: 'production', description: 'env-only', config: common },
    android: { name: 'android', description: 'env-only', config: common },
  };
}

const environments = createEnvironments();

class NetworkConfigManager {
  private currentEnvironment: string = 'development';
  
  constructor() {
    // 自动检测环境
    this.detectEnvironment();
  }

  private detectEnvironment(): void {
    // 优先使用编译期 BUILD_CONFIG 常量（在主线程与 Worker 中都可用）
    try {
      // @ts-ignore 由 DefinePlugin 注入
      if (typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.isElectron) {
        this.currentEnvironment = 'production';
        console.log('🔧 [NetworkConfig] 检测到Electron环境（BUILD_CONFIG）');
        return;
      }
      // @ts-ignore 由 DefinePlugin 注入
      if (typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.isAndroid) {
        this.currentEnvironment = 'android';
        console.log('🔧 [NetworkConfig] 检测到Android环境（BUILD_CONFIG）');
        return;
      }
    } catch {}

    if (typeof window !== 'undefined') {
      const buildConfig = (window as any).BUILD_CONFIG;
      
      // 优先检测 Electron 环境
      if (buildConfig?.isElectron || window.location.protocol === 'file:') {
        this.currentEnvironment = 'production';
        console.log('🔧 [NetworkConfig] 检测到Electron环境，判定为生产环境');
        return;
      }
      
      // 检测Android环境
      if (buildConfig?.isAndroid || buildConfig?.platform === 'android') {
        this.currentEnvironment = 'android';
        console.log('🔧 [NetworkConfig] 检测到Android环境');
        return;
      }
      
      // 检测局域网IP（开发服务器）
      const hostname = window.location.hostname;
      if (hostname.match(/^192\.168\.\d+\.\d+$/) || 
          hostname.match(/^10\.\d+\.\d+\.\d+$/) ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+$/)) {
        // 局域网IP，可能是Android开发环境
        console.log('🔧 [NetworkConfig] 检测到局域网IP，判定为Android环境');
        this.currentEnvironment = 'android';
        return;
      }
      
      // 检测生产环境
      if (hostname !== 'localhost' && 
          hostname !== '127.0.0.1' &&
          !hostname.includes('192.168.') &&
          !hostname.includes('10.0.') &&
          !hostname.includes('172.')) {
        this.currentEnvironment = 'production';
        console.log('🔧 [NetworkConfig] 检测到生产环境');
        return;
      }
    }
    
    // Worker 环境下的简易检测
    if (typeof self !== 'undefined' && (self as any).location) {
      const hostname = (self as any).location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        this.currentEnvironment = 'production';
        console.log('🔧 [NetworkConfig] Worker环境检测到生产域名');
        return;
      }
    }
    
    // 默认开发环境
    console.log('🔧 [NetworkConfig] 使用默认开发环境');
    this.currentEnvironment = 'development';
  }

  /**
   * 获取当前环境配置
   */
  getCurrentConfig(): NetworkConfig {
    return environments[this.currentEnvironment].config;
  }

  /**
   * 获取当前环境名称
   */
  getCurrentEnvironment(): string {
    return this.currentEnvironment;
  }

  /**
   * 手动设置环境
   */
  setEnvironment(env: string): void {
    if (environments[env]) {
      this.currentEnvironment = env;
    } else {
      console.warn(`未知环境: ${env}`);
    }
  }

  /**
   * 获取基础URL
   */
  getBaseUrl(): string {
    const config = this.getCurrentConfig();
    // 标准端口（80/443）不拼接端口号
    const isStandardPort = (config.protocol === 'http' && config.port === 80) ||
                          (config.protocol === 'https' && config.port === 443);
    const baseUrl = isStandardPort
      ? `${config.protocol}://${config.host}`
      : `${config.protocol}://${config.host}:${config.port}`;
    console.log(`📍 [NetworkConfig] getBaseUrl返回: ${baseUrl}, 环境: ${this.currentEnvironment}`);
    return baseUrl;
  }

  /**
   * 获取API基础URL
   */
  getApiBaseUrl(): string {
    const base = this.getBaseUrl();
    return `${base}${this.getCurrentConfig().endpoints.api}`;
  }

  /**
   * 获取WebSocket URL
   */
  getWebSocketUrl(): string {
    const config = this.getCurrentConfig();
    const protocol = config.protocol === 'https' ? 'wss' : 'ws';
    return `${protocol}://${config.host}:${config.port}${config.endpoints.websocket}`;
  }

  /**
   * 获取Socket.IO URL
   */
  getSocketIOUrl(): string {
    const envUrl = getRequiredEnvValueOrEmpty('VITE_SOCKETIO_URL');
    if (envUrl) return envUrl;
    return this.getBaseUrl();
  }

  /**
   * 获取Draw.io服务URL
   */
  getDrawioUrl(): string {
    return getRequiredEnvValue('VITE_DRAWIO_URL');
  }

  /**
   * 获取Decker服务URL
   */
  getDeckerUrl(): string {
    return getRequiredEnvValue('VITE_DECKER_URL');
  }

  /**
   * 获取支付API基础URL
   */
  getPaymentApiBase(): string {
    const paymentBase = getRequiredEnvValueOrEmpty('VITE_PAYMENT_API_BASE');
    if (paymentBase) return paymentBase;
    return getRequiredEnvValue('VITE_API_BASE_URL');
  }

  /**
   * 获取Electron开发服务器URL
   */
  getElectronDevServerUrl(): string {
    return getRequiredEnvValue('VITE_DEV_SERVER_URL');
  }

  /**
   * 获取认证URL
   */
  getAuthUrl(): string {
    const config = this.getCurrentConfig();
    return `${config.protocol}://${config.host}:${config.port}${config.endpoints.auth}`;
  }

  /**
   * 获取上传URL
   */
  getUploadUrl(): string {
    const config = this.getCurrentConfig();
    return `${config.protocol}://${config.host}:${config.port}${config.endpoints.uploads}`;
  }

  /**
   * 获取静态资源URL
   */
  getStaticUrl(): string {
    const config = this.getCurrentConfig();
    return `${config.protocol}://${config.host}:${config.port}${config.endpoints.static}`;
  }

  /**
   * 获取完整的端点URL
   */
  getEndpointUrl(endpoint: keyof NetworkEndpoints): string {
    const config = this.getCurrentConfig();
    if (endpoint === 'socketio') {
      return this.getSocketIOUrl();
    }
    return `${config.protocol}://${config.host}:${config.port}${config.endpoints[endpoint]}`;
  }

  /**
   * 获取Socket.IO端口
   */
  getSocketIOPort(): number {
    return this.getCurrentConfig().socketioPort;
  }

  /**
   * 获取前端开发服务器URL（用于Capacitor等）
   */
  getDevServerUrl(): string {
    const config = this.getCurrentConfig();
    if (!config.devServerPort) {
      throw new Error('❌ 环境变量配置缺失：请在 .env 文件中配置 VITE_DEV_SERVER_PORT');
    }
    return `${config.protocol}://${config.host}:${config.devServerPort}`;
  }

  /**
   * 获取前端开发服务器端口
   */
  getDevServerPort(): number {
    const config = this.getCurrentConfig();
    if (!config.devServerPort) {
      throw new Error('❌ 环境变量配置缺失：请在 .env 文件中配置 VITE_DEV_SERVER_PORT');
    }
    return config.devServerPort;
  }

  /**
   * 根据基础URL生成Socket.IO URL
   * 用于兼容现有代码中的URL转换逻辑
   */
  convertToSocketIOUrl(baseUrl: string): string {
    const config = this.getCurrentConfig();
    const url = new URL(baseUrl);
    url.port = config.socketioPort.toString();
    return url.toString();
  }

  /**
   * 调试信息
   */
  debug(): void {
    console.log('=== 网络配置调试信息 ===');
    console.log('当前环境:', this.currentEnvironment);
    console.log('环境配置:', environments[this.currentEnvironment]);
    console.log('基础URL:', this.getBaseUrl());
    console.log('API URL:', this.getApiBaseUrl());
    console.log('Socket.IO URL:', this.getSocketIOUrl());
    console.log('开发服务器URL:', this.getDevServerUrl());
  }
}

// 创建全局单例
export const networkConfig = new NetworkConfigManager();

// 导出常用的配置获取函数
export function getBaseUrl(): string {
  return networkConfig.getBaseUrl();
}

export function getApiBaseUrl(): string {
  return networkConfig.getApiBaseUrl();
}

export function getSocketIOUrl(): string {
  return networkConfig.getSocketIOUrl();
}

export function getWebSocketUrl(): string {
  return networkConfig.getWebSocketUrl();
}

export function getAuthUrl(): string {
  return networkConfig.getAuthUrl();
}

export function getUploadUrl(): string {
  return networkConfig.getUploadUrl();
}

export function getStaticUrl(): string {
  return networkConfig.getStaticUrl();
}

export function getSocketIOPort(): number {
  return networkConfig.getSocketIOPort();
}

export function getDevServerUrl(): string {
  return networkConfig.getDevServerUrl();
}

export function getDevServerPort(): number {
  return networkConfig.getDevServerPort();
}

export function convertToSocketIOUrl(baseUrl: string): string {
  return networkConfig.convertToSocketIOUrl(baseUrl);
}

export function getDrawioUrl(): string {
  return networkConfig.getDrawioUrl();
}

export function getDeckerUrl(): string {
  return networkConfig.getDeckerUrl();
}

export function getPaymentApiBase(): string {
  return networkConfig.getPaymentApiBase();
}

export function getElectronDevServerUrl(): string {
  return networkConfig.getElectronDevServerUrl();
}

// 环境检测和配置工具
export function isAndroidEnvironment(): boolean {
  return networkConfig.getCurrentEnvironment() === 'android';
}

export function isProductionEnvironment(): boolean {
  return networkConfig.getCurrentEnvironment() === 'production';
}

export function isDevelopmentEnvironment(): boolean {
  return networkConfig.getCurrentEnvironment() === 'development';
}

// 调试工具
export function debugNetworkConfig(): void {
  networkConfig.debug();
}

// 默认导出配置管理器
export default networkConfig;
