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
  protocol: 'http' | 'https';
  endpoints: NetworkEndpoints;
}

export interface Environment {
  name: string;
  config: NetworkConfig;
  description: string;
}

// 环境配置定义
const environments: Record<string, Environment> = {
  development: {
    name: 'development',
    description: '本地开发环境',
    config: {
      host: 'localhost',
      port: 8080,
      protocol: 'http',
      endpoints: {
        api: '/api',
        websocket: '/ws',
        socketio: ':9092',
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
      host: 'your-domain.com',
      port: 443,
      protocol: 'https',
      endpoints: {
        api: '/api',
        websocket: '/ws', 
        socketio: ':9092',
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
      host: 'localhost',
      port: 8080,
      protocol: 'http',
      endpoints: {
        api: '/api',
        websocket: '/ws',
        socketio: ':9092', 
        auth: '/api/auth',
        uploads: '/api/uploads',
        static: '/static'
      }
    }
  }
};

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
        return;
      }
      
      // 检测生产环境
      if (window.location.hostname !== 'localhost' && 
          window.location.hostname !== '127.0.0.1') {
        this.currentEnvironment = 'production';
        return;
      }
    }
    
    // 默认开发环境
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
    return `${config.protocol}://${config.host}:${config.port}`;
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
    return `${config.protocol}://${config.host}${config.endpoints.socketio}`;
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
   * 调试信息
   */
  debug(): void {
    console.log('=== 网络配置调试信息 ===');
    console.log('当前环境:', this.currentEnvironment);
    console.log('环境配置:', environments[this.currentEnvironment]);
    console.log('基础URL:', this.getBaseUrl());
    console.log('API URL:', this.getApiBaseUrl());
    console.log('Socket.IO URL:', this.getSocketIOUrl());
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