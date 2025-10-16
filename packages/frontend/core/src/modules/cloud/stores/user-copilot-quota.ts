import { Store } from '@toeverything/infra';

/**
 * 获取配置的基础URL
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
      return 'http://192.168.2.4:8080';
    }
    
    const hostname = window.location.hostname;
    // 检测局域网IP（Android开发环境）
    if (hostname.match(/^192\.168\.\d+\.\d+$/) || 
        hostname.match(/^10\.\d+\.\d+\.\d+$/) ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+$/)) {
      return 'http://192.168.2.4:8080';
    }
    
    // 生产环境
    if (hostname !== 'localhost' && 
        hostname !== '127.0.0.1' &&
        !hostname.includes('192.168.') &&
        !hostname.includes('10.0.') &&
        !hostname.includes('172.')) {
      return 'https://your-domain.com:443';
    }
  }
  
  return 'http://localhost:8080';
}

// Copilot配额数据结构
interface CopilotQuotaDto {
  userId?: string;
  workspaceId?: string;
  feature?: string;
  limitPerDay?: number;
  limitPerMonth?: number;
  usedToday?: number;
  usedThisMonth?: number;
  tokenLimitPerDay?: number;
  tokenLimitPerMonth?: number;
  tokensUsedToday?: number;
  tokensUsedThisMonth?: number;
  canUse?: boolean;
  requestUsagePercent?: number;
  tokenUsagePercent?: number;
  remainingRequests?: number;
  remainingTokens?: number;
}

export class UserCopilotQuotaStore extends Store {
  constructor() {
    super();
  }

  async fetchUserCopilotQuota(abortSignal?: AbortSignal) {
    try {
      const baseUrl = getConfiguredBaseUrl();
      // 获取用户的所有Copilot配额信息
      const response = await fetch(`${baseUrl}/api/copilot/quota`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: abortSignal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('未登录');
        }
        if (response.status === 404) {
          throw new Error('Copilot配额API未实现');
        }
        throw new Error(`获取Copilot配额失败: ${response.status}`);
      }

      const quotas: CopilotQuotaDto[] = await response.json();
      
      // 聚合所有feature的配额数据
      if (quotas.length === 0) {
        throw new Error('未找到Copilot配额信息');
      }

      // 计算总的使用量和限制
      const totalUsed = quotas.reduce((sum, quota) => {
        return sum + (quota.usedToday || 0);
      }, 0);

      const totalLimit = quotas.reduce((sum, quota) => {
        return sum + (quota.limitPerDay || 0);
      }, 0);

      if (totalLimit === 0) {
        throw new Error('Copilot配额限制为0');
      }

      return {
        used: totalUsed,
        limit: totalLimit,
      };
    } catch (error) {
      console.error('获取Copilot配额失败:', error);
      throw error;
    }
  }
}
