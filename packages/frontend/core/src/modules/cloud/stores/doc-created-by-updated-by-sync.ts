// import { getDocCreatedByUpdatedByListQuery } from '@yunke/graphql';
import { Store, yjsGetPath } from '@toeverything/infra';
import type { Observable } from 'rxjs';

import type { WorkspaceService } from '../../workspace';
import type { WorkspaceServerService } from '../services/workspace-server';

export class DocCreatedByUpdatedBySyncStore extends Store {
  constructor(
    private readonly workspaceServerService: WorkspaceServerService,
    private readonly workspaceService: WorkspaceService
  ) {
    super();
  }

  async getDocCreatedByUpdatedByList(afterCursor?: string | null) {
    if (!this.workspaceServerService.server) {
      throw new Error('服务器未找到');
    }

    try {
      const url = `/api/workspaces/${this.workspaceService.workspace.id}/docs/created-updated?first=100${afterCursor ? `&after=${encodeURIComponent(afterCursor)}` : ''}`;
      const res = await this.workspaceServerService.server.fetch(url, {
        method: 'GET',
      });
      return await res.json();
    } catch {
      return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
    }
  }

  watchDocCreatedByUpdatedBySynced() {
    const rootYDoc = this.workspaceService.workspace.rootYDoc;
    return yjsGetPath(
      rootYDoc.getMap('yunke:workspace-properties'),
      'docCreatedByUpdatedBySynced'
    ) as Observable<boolean>;
  }

  setDocCreatedByUpdatedBySynced(synced: boolean) {
    const rootYDoc = this.workspaceService.workspace.rootYDoc;
    rootYDoc
      .getMap('yunke:workspace-properties')
      .set('docCreatedByUpdatedBySynced', synced);
  }
}
