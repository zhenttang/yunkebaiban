// 通用分页响应
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

// 统一的字符串字面量类型（补充定义，便于复用）
export type ModeratorRole = 'CHIEF' | 'DEPUTY';
export type PostStatus = 'NORMAL' | 'LOCKED' | 'DELETED' | 'HIDDEN';
export type ReportTargetType = 'POST' | 'REPLY' | 'USER';
export type ReportHandleStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';
export type SearchType = 'POST' | 'FORUM' | 'ALL';

// 板块相关
export interface ForumDTO {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  banner?: string;
  parentId?: number;
  displayOrder: number;
  postCount: number;
  topicCount: number;
  isActive: boolean;
  isPrivate: boolean;
  announcement?: string;
  createdAt: string;
  updatedAt?: string;
  children: ForumDTO[]; // 树形结构
}

export interface CreateForumRequest {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  banner?: string;
  parentId?: number;
  displayOrder?: number;
  isPrivate?: boolean;
  announcement?: string;
}

export interface UpdateForumRequest {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  banner?: string;
  displayOrder?: number;
  isPrivate?: boolean;
  announcement?: string;
}

export interface ForumStatsDTO {
  postCount: number;
  topicCount: number;
  todayPostCount: number;
  activeUserCount: number;
}

// 版主相关
export interface ModeratorDTO {
  id: number;
  forumId: number;
  forumName?: string;
  userId: number;
  username?: string;
  role: ModeratorRole;
  permissions: string[];
  appointedAt?: string;
  createdAt: string;
}

export interface AppointModeratorRequest {
  forumId: number;
  userId: number;
  role: ModeratorRole;
  permissions?: string[];
}

export interface UpdatePermissionsRequest {
  permissions: string[];
}

// 帖子相关
export interface PostDTO {
  id: string;
  forumId: number;
  forumName?: string;
  authorId: number;
  authorName?: string;
  title: string;
  content: string;
  status: PostStatus;
  isSticky: boolean;
  isEssence: boolean;
  isLocked: boolean;
  isHot: boolean;
  viewCount: number;
  replyCount: number;
  likeCount: number;
  collectCount: number;
  hotScore: number;
  lastReplyAt?: string;
  createdAt: string;
  updatedAt?: string;
  // 扩展字段
  isLiked?: boolean;
  isCollected?: boolean;
  tags?: TagDTO[];
  attachments?: AttachmentDTO[];
}

export interface CreatePostRequest {
  forumId: number;
  title: string;
  content: string;
  tags?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  tags?: string;
}

// 回复相关
export interface ReplyDTO {
  id: number;
  postId: string;
  userId: number;
  username?: string;
  floor: number;
  parentId?: number;
  content: string;
  likeCount: number;
  isBestAnswer: boolean;
  createdAt: string;
  updatedAt?: string;
  // 扩展字段
  isLiked?: boolean;
}

export interface CreateReplyRequest {
  postId: string;
  content: string;
  parentId?: number;
}

// 积分相关
export interface UserPointDTO {
  id: number;
  userId: number;
  username?: string;
  totalPoints: number;
  level: number;
  postCount: number;
  replyCount: number;
  reputation: number;
  lastSignInDate?: string;
  continuousSignInDays: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PointOperationRequest {
  userId: number;
  points: number;
  reason?: string;
}

// 举报相关
export interface ReportDTO {
  id: number;
  targetType: ReportTargetType;
  targetId: string;
  reporterId: number;
  reporterName?: string;
  reason: string;
  description?: string;
  status: ReportHandleStatus;
  handlerId?: number;
  handlerName?: string;
  handleNote?: string;
  handledAt?: string;
  createdAt: string;
}

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string;
}

export interface HandleReportRequest {
  status: Exclude<ReportHandleStatus, 'PENDING'>; // 仅处理为 RESOLVED/REJECTED
  handleNote?: string;
}

// 搜索相关
export interface SearchResultDTO {
  type: Exclude<SearchType, 'ALL'>;
  id: string;
  title: string;
  content?: string;
  highlight?: string;
  forumId?: number;
  forumName?: string;
  authorId?: number;
  authorName?: string;
  replyCount?: number;
  createdAt: string;
}

export interface SearchRequest {
  keyword: string;
  type?: SearchType;
  forumId?: number;
}

// 附件相关
// 附件/标签/历史类型定义见文件下方统一区域

// 点赞相关
export interface LikeDTO {
  id: number;
  targetType: 'POST' | 'REPLY';
  targetId: string;
  userId: number;
  createdAt: string;
}

// 草稿相关
export interface DraftDTO {
  id: string;
  authorId: number;
  forumId?: number;
  title?: string;
  content: string;
  tags?: TagDTO[];
  publishedPostId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDraftRequest {
  forumId?: number;
  title?: string;
  content: string;
  tagIds?: number[];
}

// 编辑历史相关
export interface EditHistoryDTO {
  id: string;
  postId: string;
  editorId: number;
  title?: string;
  content: string;
  version: number;
  createdAt: string;
}

// 附件相关
export interface AttachmentDTO {
  id: string;
  postId: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
  uploaderId?: number;
  createdAt: string;
}

// 标签相关
export interface TagDTO {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  usageCount: number;
  createdAt: string;
}

// 通知相关
export interface NotificationDTO {
  id: string;
  type:
    | 'ForumMention'
    | 'ForumPostReplied'
    | 'ForumReplyLiked'
    | 'ForumPostLiked'
    | 'ForumPostModerated';
  isRead: boolean;
  createdAt: string;
  actorId?: number;
  actorName?: string;
  forumId?: number;
  postId?: string;
  replyId?: number;
  title?: string;
  excerpt?: string;
  metadata?: Record<string, unknown>;
}

// 草稿相关
export interface DraftDTO {
  id: string;
  forumId: number;
  forumName?: string;
  authorId: number;
  authorName?: string;
  title: string;
  content: string;
  tags?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDraftRequest {
  forumId: number;
  title: string;
  content: string;
  tags?: string;
  // 当存在 id 时，表示保存已存在草稿（更新）
  id?: string;
}
