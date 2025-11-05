import { Store } from '@toeverything/infra';
import type { WorkspaceServerService } from '../../cloud';
import type { PublicDocMode, ShareInfoType } from '../types';

export class ShareStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async getShareInfoByDocId(
    workspaceId: string,
    docId: string,
    signal?: AbortSignal
  ): Promise<ShareInfoType | undefined> {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    // 调用Java后端：通过HEAD读取文档权限与模式
    const res = await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/docs/${docId}`,
      {
        method: 'HEAD',
        signal,
      } as RequestInit
    );
    // 兼容部分服务器不支持HEAD：回退GET但不取body
    let permissionMode = res.headers.get('permission-mode');
    let publishMode = res.headers.get('publish-mode');
    if (!permissionMode || !publishMode) {
      try {
        const resGet = await this.workspaceServerService.server.fetch(
          `/api/workspaces/${workspaceId}/docs/${docId}`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/octet-stream' },
            signal,
          } as RequestInit
        );
        permissionMode = permissionMode || resGet.headers.get('permission-mode');
        publishMode = publishMode || resGet.headers.get('publish-mode');
      } catch {}
    }

    // 解析为ShareInfoType
    const isPrivate = permissionMode === 'private' || permissionMode == null;
    const isAppendOnly = permissionMode === 'append-only';
    const info: ShareInfoType = {
      public: !isPrivate,
      // 将后端header映射为前端模式（仅关心公开时的权限模式）
      mode: isAppendOnly ? ('append-only' as PublicDocMode) : ('page' as PublicDocMode),
      defaultRole: isPrivate
        ? 'none'
        : isAppendOnly
        ? 'editor'
        : 'reader',
    };
    return info;
  }

  async enableSharePage(
    workspaceId: string,
    pageId: string,
    docMode: PublicDocMode = 'page',
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    
    // 统一通过一个接口设置所有字段
    const publicPermission = docMode === 'append-only' ? 'append-only' : 'read-only';
    const publicMode = docMode === 'edgeless' ? 'edgeless' : 'page';
    
    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/docs/${pageId}/public`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: true,
          publicPermission,
          publicMode,
        }),
        signal,
      }
    );
  }

  async disableSharePage(
    workspaceId: string,
    pageId: string,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('无服务器');
    }
    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/docs/${pageId}/public`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: false }),
        signal,
      }
    );
  }
}
