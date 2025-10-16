import type { WorkspaceServerService } from '@affine/core/modules/cloud';
// import { workspaceQuotaQuery } from '@affine/graphql';
import { Store } from '@toeverything/infra';

export class WorkspaceQuotaStore extends Store {
  constructor(
    private readonly workspaceServerService: WorkspaceServerService
  ) {
    super();
  }

  async fetchWorkspaceQuota(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }

    // 使用 server.fetch() 进行请求
    try {
      const response = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/quota`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal,
        }
      );

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
      // 期望后端返回: { storageQuota, usedStorageQuota, memberLimit, memberCount, ... }
      return {
        storageQuota: data.storageQuota || 0,
        usedStorageQuota: data.usedStorageQuota || 0,
        historyPeriod: data.historyPeriod,
        memberLimit: data.memberLimit || 10,
        memberCount: data.memberCount || 0,
        copilotActionLimit: data.copilotActionLimit,
        // 兼容旧的 GraphQL humanReadable 格式
        humanReadable: data.humanReadable,
      };
    } catch (error) {
      console.error('获取工作区配额失败:', error);
      throw error;
    }
  }
}
