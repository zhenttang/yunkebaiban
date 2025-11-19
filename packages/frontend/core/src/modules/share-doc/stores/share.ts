import { Store } from '@toeverything/infra';
import type { WorkspaceServerService } from '../../cloud';
import {
  DocPermission,
  DocRole,
  type PublicDocMode,
  type ShareInfoType,
  hasPermission,
  RolePresetsMask,
} from '../types';

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
      // 1. 通过 HEAD 读取 share header，避免下载正文
      const res = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/docs/${docId}`,
        {
          method: 'HEAD',
          headers: { Accept: 'application/octet-stream' },
          signal,
        } as RequestInit
      );

      if (res.status === 403 || res.status === 404) {
        return {
          public: false,
          mode: 'page' as PublicDocMode,
          defaultRole: DocRole.None,
        };
      }

      const permissionMode = (res.headers.get('permission-mode') || 'private').toLowerCase();
      const isPrivate = permissionMode === 'private';
      const isAppendOnly = permissionMode === 'append-only';
      let info: ShareInfoType = {
        public: !isPrivate,
        mode: isAppendOnly ? ('append-only' as PublicDocMode) : ('page' as PublicDocMode),
        defaultRole: isPrivate
          ? DocRole.None
          : isAppendOnly
          ? DocRole.Editor
          : DocRole.Reader,
      };

      // 2. 再请求默认角色，覆盖 defaultRole
      try {
        const defaultRoleRes = await this.workspaceServerService.server.fetch(
          `/api/workspaces/${workspaceId}/docs/${docId}/default-role`,
          {
            method: 'GET',
            signal,
          } as RequestInit
        );

        if (defaultRoleRes.ok) {
          const payload = await defaultRoleRes.json();
          const roleDto = (payload?.defaultRole ?? payload) as {
            role?: string;
            permissionMask?: number;
            legacyDefaultRole?: number;
          };

          const maskRole = (mask?: number): DocRole | undefined => {
            if (typeof mask !== 'number') return undefined;
            if (hasPermission(mask, DocPermission.Manage)) return DocRole.Manager;
            if (hasPermission(mask, DocPermission.Modify) || hasPermission(mask, DocPermission.Add)) {
              return DocRole.Editor;
            }
            if (hasPermission(mask, DocPermission.Read)) return DocRole.Reader;
            return DocRole.None;
          };

          const nameRole = (role?: string): DocRole | undefined => {
            switch (role?.toLowerCase()) {
              case 'owner':
              case 'manager':
              case 'admin':
                return DocRole.Manager;
              case 'editor':
                return DocRole.Editor;
              case 'reader':
              case 'viewer':
                return DocRole.Reader;
              case 'none':
                return DocRole.None;
              default:
                return undefined;
            }
          };

          const resolvedRole =
            nameRole(roleDto?.role) ??
            maskRole(roleDto?.permissionMask) ??
            (roleDto?.legacyDefaultRole === RolePresetsMask.manager
              ? DocRole.Manager
              : roleDto?.legacyDefaultRole === RolePresetsMask.editor
              ? DocRole.Editor
              : roleDto?.legacyDefaultRole === RolePresetsMask.reader
              ? DocRole.Reader
              : undefined);

          if (resolvedRole !== undefined) {
            info = { ...info, defaultRole: resolvedRole };
          }
        }
      } catch (err) {
        console.warn('[ShareStore] 获取默认角色失败，使用header推测值', err);
      }

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
