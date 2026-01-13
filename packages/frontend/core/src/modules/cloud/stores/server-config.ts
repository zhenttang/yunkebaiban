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
    
    // 使用HTTP REST API替代GraphQL
    try {
      const url = `${serverBaseUrl}/health/detailed`;
      
      const response = await fetch(url, {
        method: 'GET',
        signal: abortSignal,
        headers: {
          'Content-Type': 'application/json',
        },
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ServerConfigStore.fetchServerConfig] 响应错误:', errorText);
        throw new Error(`服务器配置获取失败: ${response.status}`);
      }

      const healthData = await response.json();
      
      // 返回兼容的服务器配置格式
      const config = {
        initialized: true,
        version: healthData.version || '1.0.0',
        name: healthData.serverName || 'YUNKE',
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
      
      return config;
    } catch (error) {
      console.error('❌ [ServerConfigStore.fetchServerConfig] 获取服务器配置失败:', error);
      // 返回默认配置以确保应用能正常运行
      const defaultConfig = {
        initialized: true,
        version: '1.0.0',
        name: 'YUNKE',
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
      
      return defaultConfig;
    }
  }
}
