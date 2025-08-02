import type { WorkspaceServerService } from '@affine/core/modules/cloud';
// import { workspaceQuotaQuery } from '@affine/graphql';
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
      return 'http://localhost:8082';
    }
    
    if (window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      return 'https://your-domain.com:8082';
    }
  }
  
  return 'http://localhost:8082';
}

export class WorkspaceQuotaStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async fetchWorkspaceQuota(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    
    // 使用REST API代替GraphQL查询
    try {
      const baseUrl = getConfiguredBaseUrl();
      const response = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/quota`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal,
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('工作区配额API未实现');
        }
        if (response.status === 401) {
          throw new Error('未授权访问工作区配额');
        }
        throw new Error(`获取工作区配额失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 适配后端返回的数据结构
      // 期望后端返回: { storageQuota, usedStorageQuota, ... }
      return {
        storageQuota: data.storageQuota,
        usedStorageQuota: data.usedStorageQuota || 0,
        historyPeriod: data.historyPeriod,
        memberLimit: data.memberLimit,
        copilotActionLimit: data.copilotActionLimit,
      };
    } catch (error) {
      console.error('获取工作区配额失败:', error);
      throw error;
    }
  }
}
