//import {
//   OAuthProviderType,
//   ServerDeploymentType,
//   ServerFeature,
//} from '@affine/graphql';

// import { environment } from '@affine/env/constant';

/**
 * 获取配置的基础URL
 * 统一的配置获取逻辑，支持环境变量覆盖
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
      return 'http://localhost:8080';
    }
    
    if (window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      return 'https://your-domain.com:443';
    }
  }
  
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
  Affine = 'affine',
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

export const BUILD_IN_SERVERS: (ServerMetadata & { config: ServerConfig })[] = [
  // 使用统一配置管理的服务器地址
  {
    id: 'affine-cloud',
    baseUrl: getConfiguredBaseUrl(),
    config: {
      serverName: '云科 Local Java Backend',
      features: [
        ServerFeature.Captcha,
        ServerFeature.Copilot,
        ServerFeature.OAuth,
        ServerFeature.Payment,
      ],
      oauthProviders: [OAuthProviderType.Google],
      type: ServerDeploymentType.Affine,
      credentialsRequirement: {
        password: {
          minLength: 8,
          maxLength: 32,
        },
      },
    },
  },
];

// 原始的复杂配置逻辑已简化，现在使用统一配置管理
