/**
 * 社区权限枚举
 */
export enum CommunityPermission {
  PUBLIC = 'PUBLIC',
  COLLABORATOR = 'COLLABORATOR', 
  ADMIN = 'ADMIN',
  CUSTOM = 'CUSTOM'
}

/**
 * 社区文档接口
 */
export interface CommunityDoc {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  sharedAt: string;
  viewCount: number;
  permission: CommunityPermission;
  workspaceId: string;
}

/**
 * 分享文档到社区请求参数
 */
export interface ShareToCommunityRequest {
  title: string;
  description: string;
  permission: CommunityPermission;
}

/**
 * 获取社区文档列表参数
 */
export interface GetCommunityDocsParams {
  page?: number;
  size?: number;
  search?: string;
}

/**
 * 社区文档列表响应
 */
export interface CommunityDocsResponse {
  success: boolean;
  docs: CommunityDoc[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/**
 * 社区API统一响应格式
 */
export interface CommunityApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * 更新社区权限请求参数
 */
export interface UpdateCommunityPermissionRequest {
  permission: CommunityPermission;
}