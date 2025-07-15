import { Store } from '@toeverything/infra';

// 临时替代serverConfig的类型定义，直到REST API就位
export interface ServerConfigType {
  initialized: boolean;
  version: string;
  name: string;
  flavor: string;
  deployment: string;
  features: string[];
  credentialsRequirement: any;
  oauthProviders: any[];
  type: string;
}

export class ServerConfigStore extends Store {
  constructor() {
    super();
  }

  async fetchServerConfig(
    serverBaseUrl: string,
    abortSignal?: AbortSignal
  ): Promise<ServerConfigType> {
    console.log('🌐 [ServerConfigStore.fetchServerConfig] 开始获取服务器配置');
    console.log('🌐 [ServerConfigStore.fetchServerConfig] 服务器URL:', serverBaseUrl);
    
    // 使用HTTP REST API替代GraphQL
    try {
      const url = `${serverBaseUrl}/health/detailed`;
      console.log('🌐 [ServerConfigStore.fetchServerConfig] 请求URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: abortSignal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🌐 [ServerConfigStore.fetchServerConfig] 响应状态:', response.status);
      console.log('🌐 [ServerConfigStore.fetchServerConfig] 响应头:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ServerConfigStore.fetchServerConfig] 响应错误:', errorText);
        throw new Error(`服务器配置获取失败: ${response.status}`);
      }

      const healthData = await response.json();
      console.log('🌐 [ServerConfigStore.fetchServerConfig] 健康检查数据:', healthData);
      
      // 返回兼容的服务器配置格式
      const config = {
        initialized: true,
        version: healthData.version || '1.0.0',
        name: healthData.serverName || 'AFFiNE',
        flavor: healthData.flavor || 'allinone',
        deployment: healthData.deployment || 'selfhosted',
        features: healthData.features || [],
        credentialsRequirement: {
          password: { minLength: 8, maxLength: 256 },
          oauth: false
        },
        oauthProviders: [],
        type: 'selfhosted'
      };
      
      console.log('✅ [ServerConfigStore.fetchServerConfig] 成功获取配置:', config);
      return config;
    } catch (error) {
      console.error('❌ [ServerConfigStore.fetchServerConfig] 获取服务器配置失败:', error);
      // 返回默认配置以确保应用能正常运行
      const defaultConfig = {
        initialized: true,
        version: '1.0.0',
        name: 'AFFiNE',
        flavor: 'allinone',
        deployment: 'selfhosted',
        features: ['copilot'],
        credentialsRequirement: {
          password: { minLength: 8, maxLength: 256 },
          oauth: false
        },
        oauthProviders: [],
        type: 'selfhosted'
      };
      
      console.warn('⚠️ [ServerConfigStore.fetchServerConfig] 使用默认配置:', defaultConfig);
      return defaultConfig;
    }
  }
}
