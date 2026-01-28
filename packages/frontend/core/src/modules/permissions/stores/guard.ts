//import {
//   type GetDocRolePermissionsQuery,
//   getDocRolePermissionsQuery,
//   type GetWorkspaceRolePermissionsQuery,
//   getWorkspaceRolePermissionsQuery,
//} from '@yunke/graphql';
import { Store } from '@toeverything/infra';

import type { WorkspaceServerService } from '../../cloud';
import type { WorkspaceService } from '../../workspace';
import { maskToDocPermissionMap } from '../../share-doc/types';

// 临时类型定义，替代GraphQL类型
export interface WorkspacePermissions {
  'Workspace_Properties_Update': boolean;
  'Doc_Read': boolean;
  'Doc_Write': boolean;
  'Doc_Delete': boolean;
  'Doc_Create': boolean;
  'Doc_Update': boolean;
  'Workspace_Manage_Users': boolean;
  'Workspace_Delete': boolean;
}

export interface DocPermissions {
  'Doc_Read': boolean;
  'Doc_Write': boolean;
  'Doc_Delete': boolean;
  'Doc_Update': boolean;
  'Doc_Create': boolean;
  'Doc_Comment': boolean;
}

export type WorkspacePermissionActions = keyof WorkspacePermissions;
export type DocPermissionActions = keyof DocPermissions;

export class GuardStore extends Store {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceServerService: WorkspaceServerService
  ) {
    super();
  }

  async getWorkspacePermissions(): Promise<
    Record<WorkspacePermissionActions, boolean>
  > {
    
    if (!this.workspaceServerService.server) {
      console.error('❌ [GuardStore.getWorkspacePermissions] 无服务器连接');
      throw new Error('无服务器');
    }

    const workspaceId = this.workspaceService.workspace.id;

    try {
      const response = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/permissions`,
        { method: 'GET' }
      );
      if (response.ok) {
        const permissions = await response.json();
        return permissions as Record<WorkspacePermissionActions, boolean>;
      }
      // 🔧 Bug #9 修复：记录非 ok 响应状态
      console.warn('⚠️ [GuardStore.getWorkspacePermissions] 非正常响应:', response.status);
    } catch (error) {
      // 🔧 Bug #9 修复：记录错误而不是静默吞掉
      console.warn('⚠️ [GuardStore.getWorkspacePermissions] 获取权限失败，使用默认权限:', error);
    }

    // 返回默认权限，避免应用崩溃
    const defaultPermissions = {
      'Workspace_Properties_Update': true,
      'Doc_Read': true,
      'Doc_Write': true,
      'Doc_Delete': true,
      'Doc_Create': true,
      'Doc_Update': true,
      'Workspace_Manage_Users': false,
      'Workspace_Delete': false,
    } as Record<WorkspacePermissionActions, boolean>;

    return defaultPermissions;
  }

  async getDocPermissions(
    docId: string
  ): Promise<Record<DocPermissionActions, boolean>> {
    
    if (!this.workspaceServerService.server) {
      console.error('❌ [GuardStore.getDocPermissions] 无服务器连接');
      throw new Error('无服务器');
    }

    const workspaceId = this.workspaceService.workspace.id;

    try {
      const response = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/docs/${docId}/permissions`,
        { method: 'GET' }
      );
      if (response.ok) {
        const body = await response.json();
        // Prefer new model: { effectiveMask: number, permissions?: map }
        if (typeof body?.effectiveMask === 'number') {
          const mapped = maskToDocPermissionMap(body.effectiveMask);
          return mapped as Record<DocPermissionActions, boolean>;
        }
        // Backward compatibility: some endpoints return { permissions: {...} }
        const maybeMap = body?.permissions || body;
        return maybeMap as Record<DocPermissionActions, boolean>;
      }
      // 🔧 Bug #9 修复：记录非 ok 响应状态
      console.warn('⚠️ [GuardStore.getDocPermissions] 非正常响应:', response.status);
    } catch (error) {
      // 🔧 Bug #9 修复：记录错误而不是静默吞掉
      console.warn('⚠️ [GuardStore.getDocPermissions] 获取权限失败，使用默认权限:', error);
    }

    // 返回默认文档权限，避免应用崩溃
    const defaultPermissions = {
      'Doc_Read': true,
      'Doc_Write': true,
      'Doc_Delete': true,
      'Doc_Update': true,
      'Doc_Create': true,
      'Doc_Comment': true,
    } as Record<DocPermissionActions, boolean>;

    return defaultPermissions;
  }
}
