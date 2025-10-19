// import { getMembersByWorkspaceIdQuery } from '@yunke/graphql';
import { Store } from '@toeverything/infra';

import type { WorkspaceServerService } from '../../cloud';

export class MemberSearchStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async getMembersByEmailOrName(
    workspaceId: string,
    query?: string,
    skip?: number,
    take?: number,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('未找到服务器');
    }
    const page = Math.floor((skip ?? 0) / (take || 20));
    const size = take || 20;
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/members?page=${page}&size=${size}&q=${encodeURIComponent(query ?? '')}`,
      { method: 'GET', signal }
    );
    return await res.json();
  }
}
