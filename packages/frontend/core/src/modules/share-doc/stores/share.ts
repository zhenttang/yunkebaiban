import { Store } from '@toeverything/infra';
import type { WorkspaceServerService } from '../../cloud';
import type { PublicDocMode, ShareInfoType } from '../types';
import { DocRole } from '../types';

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
    
    try {
      // 直接使用 GET 请求（HEAD 请求在某些权限检查场景下会返回 403）
      // 只读取 headers，不读取 body，避免下载大文件
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/docs/${docId}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/octet-stream' },
          signal,
        } as RequestInit
      );
      
      // 检查状态码：403 或 404 表示文档未公开或不存在
      if (res.status === 403 || res.status === 404) {
        return {
          public: false,
          mode: 'page' as PublicDocMode,
          defaultRole: DocRole.None,
        };
      }
      
      // 从响应头读取权限信息
      const permissionMode = res.headers.get('permission-mode');

      // 解析为ShareInfoType
      const isPrivate = permissionMode === 'private' || permissionMode == null;
      const isAppendOnly = permissionMode === 'append-only';
      const info: ShareInfoType = {
        public: !isPrivate,
        // 将后端header映射为前端模式（仅关心公开时的权限模式）
        mode: isAppendOnly ? ('append-only' as PublicDocMode) : ('page' as PublicDocMode),
        defaultRole: isPrivate
          ? DocRole.None
          : isAppendOnly
          ? DocRole.Editor
          : DocRole.Reader,
      };
      
      return info;
    } catch (error: any) {
      // 检查是否是网络错误（403/404）
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('403') || errorMessage.includes('404')) {
        return {
          public: false,
          mode: 'page' as PublicDocMode,
          defaultRole: DocRole.None,
        };
      }
      
      // 过滤掉手动取消的错误（manually-stop），这些不是真正的错误
      if (errorMessage !== 'manually-stop') {
        console.error('[ShareStore] 获取分享信息失败:', error);
      }
      // 发生其他错误时返回未公开状态，而不是抛出错误（避免触发重试）
      return {
        public: false,
        mode: 'page' as PublicDocMode,
        defaultRole: DocRole.None,
      };
    }
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
    // 不设置publicMode，允许用户在分享页面中自由切换page和edgeless模式
    // publicMode设为null表示支持两种模式
    
    await this.workspaceServerService.server.fetch(
      `/api/workspaces/${workspaceId}/docs/${pageId}/public`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: true,
          publicPermission,
          publicMode: null, // 设置为null表示支持两种模式
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
