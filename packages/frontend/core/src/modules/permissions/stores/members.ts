//import {
//   approveWorkspaceTeamMemberMutation,
//   createInviteLinkMutation,
//   getMembersByWorkspaceIdQuery,
//   grantWorkspaceTeamMemberMutation,
//   inviteByEmailsMutation,
//   type Permission,
//   revokeInviteLinkMutation,
//   revokeMemberPermissionMutation,
//   type WorkspaceInviteLinkExpireTime,
//} from '@yunke/graphql';
import { Store } from '@toeverything/infra';

import type { WorkspaceServerService } from '../../cloud';

// 简化后的本地类型，替代 GraphQL
type Permission = 'OWNER' | 'ADMIN' | 'COLLABORATOR';
type WorkspaceInviteLinkExpireTime = 'ONE_HOUR' | 'ONE_DAY' | 'ONE_WEEK' | 'NEVER';

export class WorkspaceMembersStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async fetchMembers(
    workspaceId: string,
    skip: number,
    take: number,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const page = Math.floor((skip ?? 0) / (take || 20));
    const size = take || 20;
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/members?page=${page}&size=${size}`,
      { method: 'GET', signal }
    );
    const data = await res.json();
    return {
      members: data.members ?? [],
      memberCount: data.totalElements ?? (data.members?.length ?? 0),
    };
  }

  async inviteBatch(workspaceId: string, emails: string[]) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/invite`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, role: 'COLLABORATOR' }),
      }
    );
    const data = await res.json();
    return data;
  }

  async generateInviteLink(
    workspaceId: string,
    expireTime: WorkspaceInviteLinkExpireTime
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/invite-link`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expireTime }),
      }
    );
    return await res.json();
  }

  async revokeInviteLink(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/invite-link`,
      { method: 'DELETE', signal }
    );
    return (await res.json()).success ?? true;
  }

  async revokeMemberPermission(
    workspaceId: string,
    userId: string,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/members/${userId}`,
      { method: 'DELETE', signal }
    );
    return (await res.json()).success ?? true;
  }

  async approveMember(workspaceId: string, userId: string) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/members/${userId}/approve`,
      { method: 'POST' }
    );
    return (await res.json()).success ?? true;
  }

  async adjustMemberPermission(
    workspaceId: string,
    userId: string,
    permission: Permission
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/members/${userId}/permission`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission }),
      }
    );
    return (await res.json()).success ?? true;
  }
}
