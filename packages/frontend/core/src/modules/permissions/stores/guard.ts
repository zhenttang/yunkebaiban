//import {
//   type GetDocRolePermissionsQuery,
//   getDocRolePermissionsQuery,
//   type GetWorkspaceRolePermissionsQuery,
//   getWorkspaceRolePermissionsQuery,
//} from '@affine/graphql';
import { Store } from '@toeverything/infra';

import type { WorkspaceServerService } from '../../cloud';
import type { WorkspaceService } from '../../workspace';

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
    console.log('🛡️ [GuardStore.getWorkspacePermissions] 开始获取工作空间权限');
    
    if (!this.workspaceServerService.server) {
      console.error('❌ [GuardStore.getWorkspacePermissions] 无服务器连接');
      throw new Error('无服务器');
    }

    const workspaceId = this.workspaceService.workspace.id;
    console.log('🛡️ [GuardStore.getWorkspacePermissions] 工作空间ID:', workspaceId);

    try {
      // 尝试使用新的 REST API
      const response = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/permissions`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const permissions = await response.json();
        console.log('✅ [GuardStore.getWorkspacePermissions] REST API 成功获取权限:', permissions);
        return permissions;
      } else {
        console.warn('⚠️ [GuardStore.getWorkspacePermissions] REST API 失败:', response.status);
      }
    } catch (restError) {
      console.warn('⚠️ [GuardStore.getWorkspacePermissions] REST API 请求失败:', restError);
    }

    // 尝试使用 GraphQL 作为后备
    try {
      console.log('🛡️ [GuardStore.getWorkspacePermissions] 尝试使用 GraphQL 后备');
      
      const getWorkspaceRolePermissionsQuery = `
        query getWorkspaceRolePermissions($id: String!) {
          workspaceRolePermissions(id: $id) {
            permissions {
              Workspace_Properties_Update
              Doc_Read
              Doc_Write
              Doc_Delete
              Doc_Create
              Doc_Update
              Workspace_Manage_Users
              Workspace_Delete
            }
          }
        }
      `;

      const data = await this.workspaceServerService.server.gql({
        query: getWorkspaceRolePermissionsQuery,
        variables: {
          id: workspaceId,
        },
      });

      console.log('✅ [GuardStore.getWorkspacePermissions] GraphQL 成功获取权限');
      return data.workspaceRolePermissions.permissions;
    } catch (gqlError) {
      console.error('❌ [GuardStore.getWorkspacePermissions] GraphQL 也失败:', gqlError);
      
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

      console.warn('⚠️ [GuardStore.getWorkspacePermissions] 使用默认权限:', defaultPermissions);
      return defaultPermissions;
    }
  }

  async getDocPermissions(
    docId: string
  ): Promise<Record<DocPermissionActions, boolean>> {
    console.log('🛡️ [GuardStore.getDocPermissions] 开始获取文档权限, docId:', docId);
    
    if (!this.workspaceServerService.server) {
      console.error('❌ [GuardStore.getDocPermissions] 无服务器连接');
      throw new Error('无服务器');
    }

    const workspaceId = this.workspaceService.workspace.id;
    console.log('🛡️ [GuardStore.getDocPermissions] 工作空间ID:', workspaceId);

    try {
      // 尝试使用新的 REST API
      const response = await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/docs/${docId}/permissions`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const permissions = await response.json();
        console.log('✅ [GuardStore.getDocPermissions] REST API 成功获取文档权限:', permissions);
        return permissions;
      } else {
        console.warn('⚠️ [GuardStore.getDocPermissions] REST API 失败:', response.status);
      }
    } catch (restError) {
      console.warn('⚠️ [GuardStore.getDocPermissions] REST API 请求失败:', restError);
    }

    // 尝试使用 GraphQL 作为后备
    try {
      console.log('🛡️ [GuardStore.getDocPermissions] 尝试使用 GraphQL 后备');
      
      const getDocRolePermissionsQuery = `
        query getDocRolePermissions($workspaceId: String!, $docId: String!) {
          workspace(id: $workspaceId) {
            doc(id: $docId) {
              permissions {
                Doc_Read
                Doc_Write
                Doc_Delete
                Doc_Update
                Doc_Create
                Doc_Comment
              }
            }
          }
        }
      `;

      const data = await this.workspaceServerService.server.gql({
        query: getDocRolePermissionsQuery,
        variables: {
          workspaceId,
          docId,
        },
      });

      console.log('✅ [GuardStore.getDocPermissions] GraphQL 成功获取文档权限');
      return data.workspace.doc.permissions;
    } catch (gqlError) {
      console.error('❌ [GuardStore.getDocPermissions] GraphQL 也失败:', gqlError);
      
      // 返回默认文档权限，避免应用崩溃
      const defaultPermissions = {
        'Doc_Read': true,
        'Doc_Write': true,
        'Doc_Delete': true,
        'Doc_Update': true,
        'Doc_Create': true,
        'Doc_Comment': true,
      } as Record<DocPermissionActions, boolean>;

      console.warn('⚠️ [GuardStore.getDocPermissions] 使用默认文档权限:', defaultPermissions);
      return defaultPermissions;
    }
  }
}
