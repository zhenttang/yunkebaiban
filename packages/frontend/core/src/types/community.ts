// 社区功能相关的TypeScript类型定义
export enum CommunityPermission {
  PUBLIC = 'PUBLIC',
  COLLABORATOR = 'COLLABORATOR', 
  ADMIN = 'ADMIN',
  CUSTOM = 'CUSTOM'
}

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

export interface ShareToCommunityRequest {
  title: string;
  description: string;
  permission: CommunityPermission;
}

export interface GetCommunityDocsParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface CommunityDocsResponse {
  success: boolean;
  docs: CommunityDoc[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface CommunityApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}