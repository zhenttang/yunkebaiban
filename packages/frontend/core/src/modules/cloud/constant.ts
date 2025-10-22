//import {
//   OAuthProviderType,
//   ServerDeploymentType,
//   ServerFeature,
//} from '@yunke/graphql';

// import { environment } from '@yunke/env/constant';

/**
 * 获取配置的基础URL
 * 统一的配置获取逻辑，支持环境变量覆盖
 * 🔥 性能优化：自动适配当前端口，避免跨域CORS预检请求
 */
function getConfiguredBaseUrl(): string {
  // 优先使用环境变量
  const envApiUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // 根据环境自动检测
  if (typeof window !== 'undefined') {
    const buildConfig = (window as any).BUILD_CONFIG;
    if (buildConfig?.isAndroid || buildConfig?.platform === 'android') {
      // Android环境：使用实际开发服务器地址
      return 'http://192.168.2.4:8080';
    }
    
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // 检测局域网IP（Android开发环境）
    if (hostname.match(/^192\.168\.\d+\.\d+$/) || 
        hostname.match(/^10\.\d+\.\d+\.\d+$/) ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+$/)) {
      return 'http://192.168.2.4:8080';
    }
    
    // 🔥 开发环境：自动使用当前访问的端口（避免8080/8081跨域问题）
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // 使用当前端口，避免跨域
      return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
    }
    
    // 生产环境：使用 window.location.origin 自动适配
    return window.location.origin;
  }
  
  // 后备方案（SSR或Node环境）
  return 'http://localhost:8080';
}

// 使用全局的 environment 变量
// Environment 类型已在全局类型定义中声明

// 如果 environment 未定义，提供默认值
const env = globalThis.environment || {
  isSelfHosted: false,
  isLinux: false,
  isMacOs: false,
  isSafari: false,
  isWindows: false,
  isFireFox: false,
  isChrome: false,
  isIOS: false,
  isPwa: false,
  isMobile: false,
  publicPath: '/',
  subPath: '',
};

// 临时 BUILD_CONFIG 定义，因为原始配置可能不可用
const BUILD_CONFIG = (globalThis as any).BUILD_CONFIG || {
  debug: true,  // 强制开发模式
  isElectron: false,
  appBuildType: 'debug',  // 使用debug模式而不是canary
  appVersion: '1.0.0',
};

// 直接定义枚举以避免循环依赖问题
enum OAuthProviderType {
  Google = 'google',
}

enum ServerDeploymentType {
  Selfhosted = 'selfhosted',
  Yunke = 'yunke',
}

enum ServerFeature {
  Captcha = 'captcha',
  Copilot = 'copilot',
  OAuth = 'oauth',
  Payment = 'payment',
}

import type { 
  ServerConfig, 
  ServerMetadata
} from './types';

// 🔧 延迟初始化：第一次访问时才获取baseUrl
let _cachedServers: (ServerMetadata & { config: ServerConfig })[] | null = null;

function getBuildInServers(): (ServerMetadata & { config: ServerConfig })[] {
  if (_cachedServers) {
    return _cachedServers;
  }
  
  const baseUrl = getConfiguredBaseUrl();
  // console.log('📍 [BUILD_IN_SERVERS] 首次动态获取baseUrl:', baseUrl);
  // console.log('📍 [BUILD_IN_SERVERS] BUILD_CONFIG:', (globalThis as any).BUILD_CONFIG);
  // console.log('📍 [BUILD_IN_SERVERS] window.BUILD_CONFIG:', typeof window !== 'undefined' ? (window as any).BUILD_CONFIG : 'window未定义');
  
  _cachedServers = [
    {
      id: 'yunke-cloud',
      baseUrl: baseUrl,  // ← 运行时动态获取
      config: {
        serverName: '云科 Local Java Backend',
        features: [
          ServerFeature.Captcha,
          ServerFeature.Copilot,
          ServerFeature.OAuth,
          ServerFeature.Payment,
        ],
        oauthProviders: [OAuthProviderType.Google],
        type: ServerDeploymentType.Yunke,
        credentialsRequirement: {
          password: {
            minLength: 8,
            maxLength: 32,
          },
        },
      },
    },
  ];
  
  return _cachedServers;
}

// 使用Proxy来延迟初始化
export const BUILD_IN_SERVERS = new Proxy([] as (ServerMetadata & { config: ServerConfig })[], {
  get(target, prop) {
    const servers = getBuildInServers();
    return Reflect.get(servers, prop);
  },
  has(target, prop) {
    const servers = getBuildInServers();
    return Reflect.has(servers, prop);
  },
  ownKeys(target) {
    const servers = getBuildInServers();
    return Reflect.ownKeys(servers);
  },
  getOwnPropertyDescriptor(target, prop) {
    const servers = getBuildInServers();
    return Reflect.getOwnPropertyDescriptor(servers, prop);
  }
});

// 原始的复杂配置逻辑已简化，现在使用统一配置管理
