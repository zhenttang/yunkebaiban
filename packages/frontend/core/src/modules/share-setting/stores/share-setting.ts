import type { WorkspaceServerService } from '@yunke/core/modules/cloud';
//import {
//   getWorkspaceConfigQuery,
//   setEnableAiMutation,
//   setEnableUrlPreviewMutation,
//} from '@yunke/graphql';
import { Store } from '@toeverything/infra';

export class WorkspaceShareSettingStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async fetchWorkspaceConfig(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}`,
      { method: 'GET', signal }
    );
    const data = await res.json();
    // 后端返回格式: { success: true, workspace: {...} } 或直接返回 workspace 对象
    return data.workspace ?? data;
  }

  async updateWorkspaceEnableAi(
    workspaceId: string,
    enableAi: boolean,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableAi }),
        signal,
      }
    );
  }

  async updateWorkspaceEnableUrlPreview(
    workspaceId: string,
    enableUrlPreview: boolean,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableUrlPreview }),
        signal,
      }
    );
  }
}
