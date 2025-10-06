export enum CommunityPermission {
  PUBLIC = 'PUBLIC',
  COLLABORATOR = 'COLLABORATOR',
  ADMIN = 'ADMIN',
  CUSTOM = 'CUSTOM',
}

export interface CommunityTag {
  id: string;
  name: string;
  color?: string;
}

export interface CommunityDocument {
  id: string;
  workspaceId: string;
  sourceDocId?: string;
  title: string;
  description?: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  publishedAt: string;
  updatedAt?: string;
  viewCount: number;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  isPaid?: boolean;
  price?: number;
  discountPrice?: number;
  tags?: CommunityTag[];
  isLiked?: boolean;
  isCollected?: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface GetDocumentsParams {
  page?: number;
  size?: number;
  categoryId?: number;
  isPaid?: boolean;
  sort?: string;
}

export interface SearchDocumentsParams extends GetDocumentsParams {
  keyword: string;
}

export interface RecordViewRequest {
  userAgent?: string;
}

export interface ShareToCommunityRequest {
  title: string;
  description?: string;
  permission: CommunityPermission;
}

export interface CommunityDocStatusResponse {
  success: boolean;
  data?: CommunityDocument;
}

export const COMMUNITY_PERMISSION_OPTIONS = [
  {
    value: CommunityPermission.PUBLIC,
    label: '公开',
    description: '所有成员可见',
  },
  {
    value: CommunityPermission.COLLABORATOR,
    label: '协作者',
    description: '协作者及以上可见',
  },
  {
    value: CommunityPermission.ADMIN,
    label: '管理员',
    description: '仅管理员可见',
  },
  {
    value: CommunityPermission.CUSTOM,
    label: '自定义',
    description: '按自定义规则可见',
  },
];
