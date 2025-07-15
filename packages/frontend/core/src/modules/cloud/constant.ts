//import {
//   OAuthProviderType,
//   ServerDeploymentType,
//   ServerFeature,
//} from '@affine/graphql';

// import { environment } from '@affine/env/constant';

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
  // 强制使用本地Java后端，无论什么环境
  {
    id: 'affine-cloud',
    baseUrl: 'http://localhost:8080',
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

// 原始的复杂配置逻辑已简化，现在直接指向本地Java后端
