import type { WorkspaceServerService } from '@affine/core/modules/cloud';
//import {
//   getWorkspaceConfigQuery,
//   setEnableAiMutation,
//   setEnableUrlPreviewMutation,
//} from '@affine/graphql';
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
    return await res.json();
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
