import type { WorkspaceServerService } from '@affine/core/modules/cloud';
// import { workspaceQuotaQuery } from '@affine/graphql';
import { Store } from '@toeverything/infra';

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
      const baseUrl = 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/workspaces/${workspaceId}/quota`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal,
      });
      
      if (!response.ok) {
        // 如果API不存在，返回默认配额信息
        console.log(`工作区配额API未实现，返回默认配额，状态码: ${response.status}`);
        return {
          storage: {
            limit: 10 * 1024 * 1024 * 1024, // 10GB
            used: 0,
          }
        };
      }
      
      const data = await response.json();
      return data.quota;
    } catch (error) {
      console.error('获取工作区配额失败:', error);
      // 出错时返回默认配额
      return {
        storage: {
          limit: 10 * 1024 * 1024 * 1024, // 10GB
          used: 0,
        }
      };
    }
  }
}
