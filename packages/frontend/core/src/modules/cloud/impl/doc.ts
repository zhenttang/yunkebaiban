import type { Framework } from '@toeverything/infra';

import { FetchService } from '../services/fetch';
import { ServerScope } from '../scopes/server';
import { DocProvider } from '../provider/doc';
import type {
  DocInfo,
  DocCollaborator,
  CreateDocRequest,
  UpdateDocRequest,
  DocSearchRequest,
  DocStats,
} from '../provider/doc';

export function configureDocProvider(framework: Framework) {
  framework.scope(ServerScope).override(DocProvider, resolver => {
    const fetchService = resolver.get(FetchService);
    
    return {
      async getDocs(workspaceId: string): Promise<DocInfo[]> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs`, {
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
        
        // Java后端分页响应格式: { docs: [...], totalElements: number, totalPages: number, ... }
        if (data.docs) {
          return data.docs;
        }
        
        throw new Error(data.error || 'Failed to get docs');
      },

      async getDoc(workspaceId: string, docId: string): Promise<DocInfo> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/${docId}`, {
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
        
        // Java后端响应格式: { doc: {...} }
        if (data.doc) {
          return data.doc;
        }
        
        throw new Error(data.error || 'Failed to get doc');
      },

      async createDoc(workspaceId: string, request: CreateDocRequest): Promise<DocInfo> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...request }),
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
          throw new Error(data.error || 'Failed to create doc');
        }

        return data.doc;
      },

      async updateDoc(workspaceId: string, docId: string, request: UpdateDocRequest): Promise<DocInfo> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/${docId}`, {
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
        if (!data.success) {
          throw new Error(data.error || 'Failed to update doc');
        }

        return data.doc;
      },

      async deleteDoc(workspaceId: string, docId: string): Promise<void> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/${docId}`, {
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
          throw new Error(data.error || 'Failed to delete doc');
        }
      },

      async searchDocs(workspaceId: string, request: DocSearchRequest): Promise<DocInfo[]> {
        const url = new URL(`/api/workspaces/${workspaceId}/docs/search`, window.location.origin);
        url.searchParams.set('query', request.query);
        if (request.limit) url.searchParams.set('limit', request.limit.toString());
        if (request.offset) url.searchParams.set('offset', request.offset.toString());

        const res = await fetchService.fetch(url.pathname + url.search, {
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
          throw new Error(data.error || 'Failed to search docs');
        }

        return data.docs;
      },

      async getRecentDocs(workspaceId: string, limit = 10): Promise<DocInfo[]> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/recent?limit=${limit}`, {
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
          throw new Error(data.error || 'Failed to get recent docs');
        }

        return data.docs;
      },

      async getCollaborators(workspaceId: string, docId: string): Promise<DocCollaborator[]> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/${docId}/collaborators`, {
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
          throw new Error(data.error || 'Failed to get collaborators');
        }

        return data.collaborators;
      },

      async setDocTitle(workspaceId: string, docId: string, title: string): Promise<void> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/${docId}/title`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
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
          throw new Error(data.error || 'Failed to set doc title');
        }
      },

      async setDocPublic(workspaceId: string, docId: string, isPublic: boolean): Promise<void> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/${docId}/public`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public: isPublic }),
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
          throw new Error(data.error || 'Failed to set doc public status');
        }
      },

      async getDocStats(workspaceId: string, docId: string): Promise<DocStats> {
        const res = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/${docId}/stats`, {
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
          throw new Error(data.error || 'Failed to get doc stats');
        }

        return data.stats;
      },
    };
  });
}
