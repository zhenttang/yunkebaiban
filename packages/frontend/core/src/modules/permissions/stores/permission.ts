import type { WorkspaceServerService } from '@yunke/core/modules/cloud';
// import { getWorkspaceInfoQuery, leaveWorkspaceMutation } from '@yunke/graphql';
import { Store } from '@toeverything/infra';

import type { WorkspaceLocalState } from '../../workspace';

export class WorkspacePermissionStore extends Store {
  constructor(
    private readonly workspaceServerService: WorkspaceServerService,
    private readonly workspaceLocalState: WorkspaceLocalState
  ) {
    super();
  }

  async fetchWorkspaceInfo(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/permissions`,
      { method: 'GET', signal }
    );
    const data = await res.json();
    // 规范化返回数据结构，兼容上层 WorkspacePermission 实体
    return {
      workspace: {
        role: (data.role || '').toUpperCase(),
        team: false,
      },
    } as any;
  }

  /**
   * @param workspaceName for send email
   */
  async leaveWorkspace(workspaceId: string) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/leave`,
      { method: 'POST' }
    );
  }

  watchWorkspacePermissionCache() {
    return this.workspaceLocalState.watch<{
      isOwner: boolean;
      isAdmin: boolean;
      isTeam: boolean;
    }>('permission');
  }

  setWorkspacePermissionCache(permission: {
    isOwner: boolean;
    isAdmin: boolean;
    isTeam: boolean;
  }) {
    this.workspaceLocalState.set('permission', permission);
  }
}
