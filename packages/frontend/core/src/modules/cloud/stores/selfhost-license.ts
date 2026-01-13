//import {
//   activateLicenseMutation,
//   deactivateLicenseMutation,
//   getLicenseQuery,
//   installLicenseMutation,
//} from '@yunke/graphql';
import { Store } from '@toeverything/infra';

import type { WorkspaceServerService } from '../services/workspace-server';

export class SelfhostLicenseStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async getLicense(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    try {
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/license`,
        { method: 'GET', signal }
      );
      return await res.json();
    } catch {
      return null;
    }
  }

  async activate(workspaceId: string, license: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/license/activate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license }),
        signal,
      }
    );
    return (await res.json()).success ?? true;
  }

  async deactivate(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/license/deactivate`,
      { method: 'POST', signal }
    );
    return (await res.json()).success ?? true;
  }

  async installLicense(
    workspaceId: string,
    license: File,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const form = new FormData();
    form.append('license', license);
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/license`,
      { method: 'PUT', body: form, signal }
    );
    return (await res.json()).success ?? true;
  }
}
