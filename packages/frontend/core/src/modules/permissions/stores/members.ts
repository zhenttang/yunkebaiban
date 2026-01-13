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
      memberCount:
        data.count ?? data.totalElements ?? (data.members?.length ?? 0),
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

    // 兼容多种后端返回格式:
    // 1) Go/Java: { success: true, results: [ { email, success, sentSuccess?, ... } ], ... }
    // 2) 直接返回数组: [ { email, sentSuccess, ... } ]
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.results)) {
      return data.results.map((item: any) => ({
        // 保留原始字段，方便调试
        ...item,
        email: item.email,
        // 标准化 sentSuccess 字段，供 UI 统计使用
        sentSuccess:
          typeof item.sentSuccess === 'boolean'
            ? item.sentSuccess
            : !!item.success,
      }));
    }

    // 无法识别的格式时，返回空数组避免前端崩溃
    return [];
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
