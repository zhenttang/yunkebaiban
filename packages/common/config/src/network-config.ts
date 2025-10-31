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
 * 从环境变量获取配置值
 * 支持运行时环境变量和构建时环境变量
 */
function getEnvValue(key: string, defaultValue: string): string {
  // 优先使用构建时环境变量
  const buildTimeValue = import.meta.env?.[key];
  if (buildTimeValue && buildTimeValue.trim() !== '') {
    return buildTimeValue.trim();
  }
  
  // 尝试从 window 获取运行时环境变量（Android 原生注入）
  if (typeof window !== 'undefined') {
    const windowEnv = (window as any).__ENV__?.[key];
    if (windowEnv && windowEnv.trim() !== '') {
      return windowEnv.trim();
    }
  }
  
  return defaultValue;
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
    console.error('解析 BASE_URL 失败:', error);
    // 返回默认本地开发配置
    return {
      host: 'localhost',
      port: 80,
      protocol: 'http'
    };
  }
}

// 环境配置定义
function createEnvironments(): Record<string, Environment> {
  // 从环境变量获取基础配置
  const apiBaseUrl = getEnvValue('VITE_API_BASE_URL', 'http://ykbaiban.yckeji0316.cn');
  const socketioPort = parseInt(getEnvValue('VITE_SOCKETIO_PORT', '9092'));
  const devServerPort = parseInt(getEnvValue('VITE_DEV_SERVER_PORT', '8082'));
  
  const parsed = parseBaseUrl(apiBaseUrl);
  
  return {
    development: {
      name: 'development',
      description: '本地开发环境',
      config: {
        host: 'localhost',
        port: 8080,
        socketioPort: 9092,
        devServerPort: 8082,
        protocol: 'http',
        endpoints: {
          api: '/api',
          websocket: '/ws',
          socketio: '',
          auth: '/api/auth',
          uploads: '/api/uploads',
          static: '/static'
        }
      }
    },
    production: {
      name: 'production', 
      description: '生产环境',
      config: {
        host: parsed.host,
        port: parsed.port,
        socketioPort: socketioPort,
        devServerPort: devServerPort,
        protocol: parsed.protocol,
        endpoints: {
          api: '/api',
          websocket: '/ws', 
          socketio: '',
          auth: '/api/auth',
          uploads: '/api/uploads',
          static: '/static'
        }
      }
    },
    android: {
      name: 'android',
      description: 'Android应用环境',
      config: {
        host: parsed.host,
        port: parsed.port,
        socketioPort: socketioPort,
        devServerPort: devServerPort,
        protocol: parsed.protocol,
        endpoints: {
          api: '/api',
          websocket: '/ws',
          socketio: '/socket.io', 
          auth: '/api/auth',
          uploads: '/api/uploads',
          static: '/static'
        }
      }
    }
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
    // 检测Android环境
    if (typeof window !== 'undefined') {
      const buildConfig = (window as any).BUILD_CONFIG;
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
    const baseUrl = `${config.protocol}://${config.host}:${config.port}`;
    console.log(`📍 [NetworkConfig] getBaseUrl返回: ${baseUrl}, 环境: ${this.currentEnvironment}`);
    return baseUrl;
  }

  /**
   * 获取API基础URL
   */
  getApiBaseUrl(): string {
    const config = this.getCurrentConfig();
    return `${config.protocol}://${config.host}:${config.port}${config.endpoints.api}`;
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
    const config = this.getCurrentConfig();
    return `${config.protocol}://${config.host}:${config.socketioPort}`;
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
    const port = config.devServerPort || config.port;
    return `${config.protocol}://${config.host}:${port}`;
  }

  /**
   * 获取前端开发服务器端口
   */
  getDevServerPort(): number {
    const config = this.getCurrentConfig();
    return config.devServerPort || config.port;
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