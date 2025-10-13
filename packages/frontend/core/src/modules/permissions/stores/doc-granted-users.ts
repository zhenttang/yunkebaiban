import type { WorkspaceServerService } from '@affine/core/modules/cloud';
import { Store } from '@toeverything/infra';
import type { DocRole } from '../../share-doc/types';

export class DocGrantedUsersStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async fetchDocGrantedUsersList(
    workspaceId: string,
    docId: string,
    pagination: { first: number; after?: string },
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    try {
      const url = `/api/workspaces/${workspaceId}/docs/${docId}/roles?first=${pagination.first}${pagination.after ? `&after=${encodeURIComponent(pagination.after)}` : ''}`;
      const res = await this.workspaceServerService.server.fetch(url, {
        method: 'GET',
        signal,
      });
      const data = await res.json();
      // 期望后端返回 { edges: [{ node: { user: {id,name,avatarUrl}, role: 'reader' } }], pageInfo: {...}, totalCount: number }
      return data;
    } catch {
      // 兜底返回空列表，避免UI崩溃
      return {
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
        totalCount: 0,
      };
    }
  }

  async grantDocUserRoles(input: {
    workspaceId: string;
    docId: string;
    userIds: string[];
    role: DocRole;
  }) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    try {
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${input.workspaceId}/docs/${input.docId}/roles/grant`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: input.userIds, role: input.role }),
        }
      );
      const data = await res.json();
      return data.success ?? true;
    } catch {
      return false;
    }
  }

  async revokeDocUserRoles(workspaceId: string, docId: string, userId: string) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    try {
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/docs/${docId}/roles/${userId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      return data.success ?? true;
    } catch {
      return false;
    }
  }

  async updateDocUserRole(
    workspaceId: string,
    docId: string,
    userId: string,
    role: DocRole,
    permissionMask?: number
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    try {
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/docs/${docId}/roles/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            permissionMask != null ? { role, permissionMask } : { role }
          ),
        }
      );
      const data = await res.json();
      return data.success ?? true;
    } catch {
      return false;
    }
  }

  async updateDocDefaultRole(input: {
    workspaceId: string;
    docId: string;
    role: DocRole;
  }) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    try {
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${input.workspaceId}/docs/${input.docId}/default-role`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: input.role }),
        }
      );
      const data = await res.json();
      return data.success ?? true;
    } catch {
      return false;
    }
  }

  async updateDocDefaultPermissionMask(input: {
    workspaceId: string;
    docId: string;
    permissionMask: number;
  }) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    try {
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${input.workspaceId}/docs/${input.docId}/default-role`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissionMask: input.permissionMask }),
        }
      );
      const data = await res.json();
      return data.success ?? true;
    } catch {
      return false;
    }
  }
}
