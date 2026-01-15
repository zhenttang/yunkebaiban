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
function isElectronOfflineMode(): boolean {
  const apiBase = import.meta.env?.VITE_API_BASE_URL;
  if (apiBase && apiBase.trim() !== '') {
    return false;
  }
  try {
    // @ts-ignore 由 DefinePlugin 注入
    if (typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.isElectron) {
      return true;
    }
  } catch {}
  if (typeof process !== 'undefined' && process.versions?.electron) {
    return true;
  }
  return false;
}

function getRequiredEnvValue(key: string): string {
  const buildTimeValue = import.meta.env?.[key];
  if (buildTimeValue && buildTimeValue.trim() !== '') {
    return buildTimeValue.trim();
  }
  if (key === 'VITE_API_BASE_URL' && isElectronOfflineMode()) {
    return '';
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
  const offlineMode = apiBaseUrl.trim() === '';
  const devServerPortStr = getRequiredEnvValueOrEmpty('VITE_DEV_SERVER_PORT');
  const devServerPort = devServerPortStr ? parseInt(devServerPortStr) : undefined;
  const parsed = offlineMode
    ? { host: 'localhost', port: 0, protocol: 'http' as const }
    : parseBaseUrl(apiBaseUrl);
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

// 彻底关闭 NetworkConfig 的控制台输出（需要调试时再改为条件输出）
function dlog(..._args: any[]) { /* no-op */ }

class NetworkConfigManager {
  private currentEnvironment: string = 'development';
  
  // ✅ 添加缓存机制，避免重复计算和日志输出
  private _baseUrlCache: string | null = null;
  private _apiBaseUrlCache: string | null = null;
  private _socketIOUrlCache: string | null = null;
  
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
        dlog('🔧 [NetworkConfig] 检测到Electron环境（BUILD_CONFIG）');
        return;
      }
      // @ts-ignore 由 DefinePlugin 注入
      if (typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.isAndroid) {
        this.currentEnvironment = 'android';
        dlog('🔧 [NetworkConfig] 检测到Android环境（BUILD_CONFIG）');
        return;
      }
    } catch {}

    if (typeof window !== 'undefined') {
      const buildConfig = (window as any).BUILD_CONFIG;
      
      // 优先检测 Electron 环境
      if (buildConfig?.isElectron || window.location.protocol === 'file:') {
        this.currentEnvironment = 'production';
        dlog('🔧 [NetworkConfig] 检测到Electron环境，判定为生产环境');
        return;
      }
      
      // 检测Android环境
      if (buildConfig?.isAndroid || buildConfig?.platform === 'android') {
        this.currentEnvironment = 'android';
        dlog('🔧 [NetworkConfig] 检测到Android环境');
        return;
      }
      
      // 检测局域网IP（开发服务器）
      const hostname = window.location.hostname;
      if (hostname.match(/^192\.168\.\d+\.\d+$/) || 
          hostname.match(/^10\.\d+\.\d+\.\d+$/) ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+$/)) {
        // 局域网IP，可能是Android开发环境
        dlog('🔧 [NetworkConfig] 检测到局域网IP，判定为Android环境');
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
        dlog('🔧 [NetworkConfig] 检测到生产环境');
        return;
      }
    }
    
    // Worker 环境下的简易检测
    if (typeof self !== 'undefined' && (self as any).location) {
      const hostname = (self as any).location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        this.currentEnvironment = 'production';
        dlog('🔧 [NetworkConfig] Worker环境检测到生产域名');
        return;
      }
    }
    
    // 默认开发环境
    dlog('🔧 [NetworkConfig] 使用默认开发环境');
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
   * ✅ 清除缓存，确保配置更新生效
   */
  setEnvironment(env: string): void {
    if (environments[env]) {
      this.currentEnvironment = env;
      // ✅ 清除缓存，确保新环境的配置生效
      this._baseUrlCache = null;
      this._apiBaseUrlCache = null;
      this._socketIOUrlCache = null;
    } else {
      console.warn(`未知环境: ${env}`);
    }
  }

  /**
   * 获取基础URL
   * ✅ 使用缓存机制，避免重复计算
   */
  getBaseUrl(): string {
    // ✅ 如果缓存存在，直接返回
    if (this._baseUrlCache !== null) {
      return this._baseUrlCache;
    }
    
    const config = this.getCurrentConfig();
    // 标准端口（80/443）不拼接端口号
    const isStandardPort = (config.protocol === 'http' && config.port === 80) ||
                          (config.protocol === 'https' && config.port === 443);
    this._baseUrlCache = isStandardPort
      ? `${config.protocol}://${config.host}`
      : `${config.protocol}://${config.host}:${config.port}`;
    
    return this._baseUrlCache;
  }

  /**
   * 获取API基础URL
   * ✅ 使用缓存机制，避免重复计算
   */
  getApiBaseUrl(): string {
    // ✅ 如果缓存存在，直接返回
    if (this._apiBaseUrlCache !== null) {
      return this._apiBaseUrlCache;
    }
    
    const base = this.getBaseUrl();
    this._apiBaseUrlCache = `${base}${this.getCurrentConfig().endpoints.api}`;
    
    return this._apiBaseUrlCache;
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
   * ✅ 使用缓存机制，避免重复计算
   */
  getSocketIOUrl(): string {
    // ✅ 如果缓存存在，直接返回
    if (this._socketIOUrlCache !== null) {
      return this._socketIOUrlCache;
    }
    
    const envUrl = getRequiredEnvValueOrEmpty('VITE_SOCKETIO_URL');
    if (envUrl) {
      dlog('🔍 [Socket.IO] 使用环境变量 VITE_SOCKETIO_URL:', envUrl);
      this._socketIOUrlCache = envUrl;
      return this._socketIOUrlCache;
    }
    
    // 如果没有配置 VITE_SOCKETIO_URL，使用 socketioPort 构建 URL
    const config = this.getCurrentConfig();
    const isStandardPort = (config.protocol === 'http' && config.socketioPort === 80) ||
                          (config.protocol === 'https' && config.socketioPort === 443);
    this._socketIOUrlCache = isStandardPort
      ? `${config.protocol}://${config.host}`
      : `${config.protocol}://${config.host}:${config.socketioPort}`;
    
    // 🔍 调试日志：仅在开发环境或调试模式下输出，避免生产环境刷屏
    if (import.meta.env?.DEV || import.meta.env?.MODE === 'development') {
      dlog('🔍 [Socket.IO配置] VITE_SOCKETIO_URL 未配置，使用 socketioPort 构建 URL');
      dlog('🔍 [Socket.IO配置] socketioPort:', config.socketioPort);
      dlog('🔍 [Socket.IO配置] 构建的 Socket.IO URL:', this._socketIOUrlCache);
      dlog('🔍 [Socket.IO配置] 环境变量 VITE_SOCKETIO_PORT:', import.meta.env?.VITE_SOCKETIO_PORT);
    }
    
    return this._socketIOUrlCache;
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
    dlog('=== 网络配置调试信息 ===');
    dlog('当前环境:', this.currentEnvironment);
    dlog('环境配置:', environments[this.currentEnvironment]);
    dlog('基础URL:', this.getBaseUrl());
    dlog('API URL:', this.getApiBaseUrl());
    dlog('Socket.IO URL:', this.getSocketIOUrl());
    dlog('开发服务器URL:', this.getDevServerUrl());
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
