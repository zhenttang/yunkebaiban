//import {
//   OAuthProviderType,
//   ServerDeploymentType,
//   ServerFeature,
//} from '@yunke/graphql';

// import { environment } from '@yunke/env/constant';
import { getBaseUrl } from '@yunke/config';

/**
 * 获取配置的基础URL（不含 /api 路径）
 * 使用@yunke/config统一管理网络配置
 * 支持环境变量覆盖
 */
function getConfiguredBaseUrl(): string {
  // 使用 getBaseUrl() 获取不带 /api 的基础 URL
  // 避免在 server.baseUrl 中重复添加 /api 路径
  return getBaseUrl();
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

// 🔧 延迟初始化：每次都重新获取baseUrl（不缓存，确保生产环境正确）
let _cachedServers: (ServerMetadata & { config: ServerConfig })[] | null = null;

function getBuildInServers(): (ServerMetadata & { config: ServerConfig })[] {
  // 🔥 禁用缓存：生产环境每次都重新获取baseUrl
  // 这样可以确保部署到服务器后使用正确的域名
  const isProduction = typeof window !== 'undefined' && 
                      window.location.hostname !== 'localhost' && 
                      window.location.hostname !== '127.0.0.1';
  
  if (_cachedServers && !isProduction) {
    // 只在开发环境使用缓存
    return _cachedServers;
  }
  
  const baseUrl = getConfiguredBaseUrl();
  console.log('📍 [BUILD_IN_SERVERS] 动态获取baseUrl:', baseUrl);
  console.log('📍 [BUILD_IN_SERVERS] hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
  console.log('📍 [BUILD_IN_SERVERS] isProduction:', isProduction);
  
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
