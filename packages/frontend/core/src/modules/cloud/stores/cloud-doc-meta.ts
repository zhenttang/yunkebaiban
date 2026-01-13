// import { getWorkspacePageMetaByIdQuery } from '@yunke/graphql';
import { Store } from '@toeverything/infra';

import { type CloudDocMetaType } from '../entities/cloud-doc-meta';
import type { WorkspaceServerService } from '../services/workspace-server';

export class CloudDocMetaStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async fetchCloudDocMeta(
    workspaceId: string,
    docId: string,
    abortSignal?: AbortSignal
  ): Promise<CloudDocMetaType> {
    if (!this.workspaceServerService.server) {
      throw new Error('服务器未找到');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/docs/${docId}/meta`,
      { method: 'GET', signal: abortSignal }
    );
    const data = await res.json();
    return data.meta as CloudDocMetaType;
  }
}
