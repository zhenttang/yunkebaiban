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
        console.log('=== 前端 WorkspaceProvider.createWorkspace 开始 ===');
        console.log('创建工作空间请求参数:', request);
        console.log('当前页面URL:', window.location.href);
        console.log('当前Cookie:', document.cookie);
        console.log('localStorage中的token:', localStorage.getItem('affine-admin-token'));
        
        console.log('开始创建工作空间请求', {
          url: '/api/workspaces',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          cookies: document.cookie,
          requestBody: request
        });
        
        try {
          const res = await fetchService.fetch('/api/workspaces', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          });
          
          console.log('创建工作空间响应状态', {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries([...res.headers.entries()]),
            cookies: document.cookie
          });
          
          // 克隆响应以便可以多次读取body
          const resClone = res.clone();
          
          // 记录原始响应内容
          resClone.text().then(text => {
            console.log('创建工作空间响应原始内容:', text);
            try {
              const jsonData = JSON.parse(text);
              console.log('创建工作空间响应JSON数据:', jsonData);
            } catch (e) {
              console.error('响应内容不是有效JSON:', e);
            }
          }).catch(err => {
            console.error('读取响应内容失败:', err);
          });

          if (!res.ok) {
            let errorMessage = `HTTP ${res.status}`;
            try {
              const errorData = await res.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
              console.error('创建工作空间失败，错误详情:', errorData);
            } catch (e) {
              errorMessage = res.statusText || errorMessage;
              console.error('解析错误响应失败:', e);
            }
            throw new Error(errorMessage);
          }

          const data = await res.json();
          console.log('创建工作空间成功，返回数据:', data);
          
          if (data.success && data.workspace) {
            return data.workspace;
          }
          
          throw new Error(data.error || 'Failed to create workspace');
        } catch (error) {
          console.error('创建工作空间请求异常:', error);
          throw error;
        }
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