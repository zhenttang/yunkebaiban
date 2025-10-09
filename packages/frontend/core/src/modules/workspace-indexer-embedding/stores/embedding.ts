import type { WorkspaceServerService } from '@affine/core/modules/cloud';
//import {
//   addWorkspaceEmbeddingFilesMutation,
//   addWorkspaceEmbeddingIgnoredDocsMutation,
//   getAllWorkspaceEmbeddingIgnoredDocsQuery,
//   getWorkspaceConfigQuery,
//   getWorkspaceEmbeddingFilesQuery,
//   getWorkspaceEmbeddingStatusQuery,
//   type PaginationInput,
//   removeWorkspaceEmbeddingFilesMutation,
//   removeWorkspaceEmbeddingIgnoredDocsMutation,
//   setEnableDocEmbeddingMutation,
//} from '@affine/graphql';
import { Store } from '@toeverything/infra';

export class EmbeddingStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async getEnabled(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('未找到服务器');
    }
    try {
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/embedding/config`,
        { method: 'GET', signal }
      );
      const data = await res.json();
      return !!data.enableDocEmbedding;
    } catch {
      return false;
    }
  }

  async updateEnabled(
    workspaceId: string,
    enabled: boolean,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('未找到服务器');
    }
    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/embedding/config`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableDocEmbedding: enabled }),
        signal,
      }
    );
  }

  async getIgnoredDocs(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('未找到服务器');
    }

    try {
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/embedding/ignored-docs`,
        { method: 'GET', signal }
      );
      const data = await res.json();
      return data.ignoredDocs ?? [];
    } catch {
      return [] as string[];
    }
  }

  async updateIgnoredDocs(
    workspaceId: string,
    add: string[],
    remove: string[],
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('未找到服务器');
    }

    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/embedding/ignored-docs`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add, remove }),
        signal,
      }
    );
  }

  async addEmbeddingFile(
    workspaceId: string,
    blob: File,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('未找到服务器');
    }

    const form = new FormData();
    form.append('file', blob);
    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/embedding/files`,
      { method: 'POST', body: form, signal }
    );
  }

  async addEmbeddingFiles(
    workspaceId: string,
    files: File[],
    signal?: AbortSignal
  ) {
    for (const file of files) {
      await this.addEmbeddingFile(workspaceId, file, signal);
    }
  }

  async removeEmbeddingFile(
    workspaceId: string,
    fileId: string,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('未找到服务器');
    }

    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/embedding/files/${fileId}`,
      { method: 'DELETE', signal }
    );
  }

  async removeEmbeddingFiles(
    workspaceId: string,
    fileIds: string[],
    signal?: AbortSignal
  ) {
    for (const fileId of fileIds) {
      await this.removeEmbeddingFile(workspaceId, fileId, signal);
    }
  }

  async getEmbeddingFiles(
    workspaceId: string,
    pagination: { first: number; after?: string },
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
              throw new Error('未找到服务器');
    }

    try {
      const url = `/api/workspaces/${workspaceId}/embedding/files?first=${pagination.first}${pagination.after ? `&after=${encodeURIComponent(pagination.after)}` : ''}`;
      const res = await this.workspaceServerService.server.fetch(url, {
        method: 'GET',
        signal,
      });
      const data = await res.json();
      return data.files ?? [];
    } catch {
      return [] as any[];
    }
  }

  async getEmbeddingProgress(workspaceId: string, signal?: AbortSignal) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }

    try {
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/embedding/status`,
        { method: 'GET', signal }
      );
      const data = await res.json();
      return data;
    } catch {
      return { status: 'idle' } as any;
    }
  }
}
