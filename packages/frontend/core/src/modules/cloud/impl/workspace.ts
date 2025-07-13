import type { Framework } from '@toeverything/infra';

import { FetchService } from '../services/fetch';
import { ServerScope } from '../scopes/server';
import { WorkspaceProvider } from '../provider/workspace';
import type {
  WorkspaceInfo,
  WorkspaceMember, 
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  InviteRequest,
} from '../provider/workspace';

export function configureWorkspaceProvider(framework: Framework) {
  framework.scope(ServerScope).override(WorkspaceProvider, resolver => {
    const fetchService = resolver.get(FetchService);
    
    return {
      async getWorkspaces(): Promise<WorkspaceInfo[]> {
        const res = await fetchService.fetch('/api/workspaces', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        
        // Java后端返回格式: { workspaces: [...], count: number }
        if (data.workspaces) {
          return data.workspaces;
        }
        
        throw new Error('Failed to get workspaces');
      },

      async getWorkspace(workspaceId: string): Promise<WorkspaceInfo> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        
        // Java后端直接返回工作空间对象或有success字段
        if (data.workspace) {
          return data.workspace;
        } else if (data.id) {
          // 直接返回工作空间对象的情况
          return data;
        }
        
        throw new Error('Failed to get workspace');
      },

      async createWorkspace(request: CreateWorkspaceRequest): Promise<WorkspaceInfo> {
        const res = await fetchService.fetch('/api/workspaces', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (data.success && data.workspace) {
          return data.workspace;
        }
        
        throw new Error(data.error || 'Failed to create workspace');
      },

      async updateWorkspace(workspaceId: string, request: UpdateWorkspaceRequest): Promise<WorkspaceInfo> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (data.success && data.workspace) {
          return data.workspace;
        }
        
        throw new Error(data.error || 'Failed to update workspace');
      },

      async deleteWorkspace(workspaceId: string): Promise<void> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to delete workspace');
        }
      },

      async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/members`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to get members');
        }

        return data.members;
      },

      async inviteMember(workspaceId: string, request: InviteRequest): Promise<void> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to invite member');
        }
      },

      async removeMember(workspaceId: string, memberId: string): Promise<void> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to remove member');
        }
      },

      async updateMemberRole(workspaceId: string, memberId: string, role: 'admin' | 'member'): Promise<void> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/members/${memberId}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to update member role');
        }
      },

      async createInviteLink(workspaceId: string): Promise<{ link: string; expires: string }> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/invite-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to create invite link');
        }

        return {
          link: data.link,
          expires: data.expires,
        };
      },

      async revokeInviteLink(workspaceId: string): Promise<void> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/invite-link`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to revoke invite link');
        }
      },

      async getPendingInvitations(workspaceId: string): Promise<any[]> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/pending-invitations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to get pending invitations');
        }

        return data.invitations;
      },
    };
  });
}