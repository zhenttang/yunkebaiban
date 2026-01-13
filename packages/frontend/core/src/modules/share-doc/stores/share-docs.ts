import type { WorkspaceServerService } from '@yunke/core/modules/cloud';
// import { getWorkspacePublicPagesQuery } from '@yunke/graphql';
import { Store } from '@toeverything/infra';

export class ShareDocsStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async getWorkspacesShareDocs(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/docs?sortBy=updatedAt&sortDir=desc`,
      { method: 'GET', signal }
    );
    const data = await res.json();
    const docs = (data.docs ?? []).filter((d: any) => d.public === true);
    return docs;
  }
}
