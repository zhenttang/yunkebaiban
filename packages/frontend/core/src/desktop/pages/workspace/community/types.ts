/**
 * 社区功能 - TypeScript 类型定义
 * 与后端 API 完全对应
 */

// ==================== 枚举类型 ====================

export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum CommentStatus {
  NORMAL = 'normal',
  HIDDEN = 'hidden',
  DELETED = 'deleted'
}

export enum PurchaseStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded'
}

// ==================== 核心实体类型 ====================

export interface CommunityDocument {
  id: string;
  workspaceId: string;
  sourceDocId: string;

  // 文档内容
  title: string;
  description?: string;
  coverImage?: string;
  contentSnapshot?: string;

  // 作者信息
  authorId: string;
  authorName: string;
  authorAvatar?: string;

  // 分类和标签
  categoryId?: number;
  subcategoryId?: number;

  // 权限和可见性
  isPublic: boolean;
  requireFollow: boolean;
  requirePurchase: boolean;

  // 付费信息
  isPaid: boolean;
  price: number;
  discountPrice?: number;
  freePreviewLength: number;

  // 统计数据
  viewCount: number;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  shareCount: number;
  purchaseCount: number;

  // 质量评分
  qualityScore: number;
  avgRating: number;
  ratingCount: number;

  // 状态控制
  status: DocumentStatus;
  isFeatured: boolean;
  isSticky: boolean;

  // 时间戳
  publishedAt: string;
  updatedAt: string;
  deletedAt?: string;

  // 前端扩展字段（来自API）
  isLiked?: boolean;
  isCollected?: boolean;
  isFollowing?: boolean;
  canAccess?: boolean;
  category?: DocumentCategory;
  tags?: DocumentTag[];

  // 权限详细信息
  hasFullAccess?: boolean;
  needFollow?: boolean;
  needPurchase?: boolean;
  previewLength?: number;
}

export interface DocumentCategory {
  id: number;
  parentId: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface DocumentTag {
  id: number;
  name: string;
  slug: string;
  color: string;
  useCount: number;
  createdAt: string;
}

export interface DocumentComment {
  id: number;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  parentId: number;
  content: string;
  likeCount: number;
  isAuthor: boolean;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;

  // 前端扩展
  replies?: DocumentComment[];
  isLiked?: boolean;
}

export interface DocumentPurchase {
  id: number;
  documentId: string;
  userId: string;
  price: number;
  paymentMethod: string;
  paymentId: string;
  status: PurchaseStatus;
  purchasedAt: string;
  refundedAt?: string;
}

export interface DocumentStatistics {
  viewCount: number;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  shareCount: number;
  purchaseCount: number;
  qualityScore: number;
  avgRating: number;
  ratingCount: number;
  uniqueViewers: number;
  avgViewDuration: number;
}

export interface UserFollow {
  id: number;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface DocumentCollection {
  id: number;
  documentId: string;
  userId: string;
  folderId?: number;
  notes?: string;
  createdAt: string;
}

// ==================== API 请求类型 ====================

export interface PublishDocumentRequest {
  workspaceId: string;
  sourceDocId: string;
  title: string;
  description?: string;
  coverImage?: string;
  categoryId?: number;
  tagIds?: number[];
  isPaid?: boolean;
  price?: number;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  coverImage?: string;
  categoryId?: number;
  tagIds?: number[];
  isPaid?: boolean;
  price?: number;
}

export interface CollectDocumentRequest {
  folderId?: number;
  notes?: string;
}

export interface AddCommentRequest {
  content: string;
  parentId?: number;
}

export interface PurchaseDocumentRequest {
  paymentMethod: string;
}

export interface RecordViewRequest {
  ipAddress?: string;
  userAgent?: string;
  viewDuration?: number;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  parentId?: number;
  description?: string;
  icon?: string;
}

export interface CreateTagRequest {
  name: string;
  slug: string;
  color?: string;
}

// ==================== API 响应类型 ====================

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

// ==================== 查询参数类型 ====================

export interface GetDocumentsParams {
  page?: number;
  size?: number;
  categoryId?: number;
  isPaid?: boolean;
  sort?: 'latest' | 'popular' | 'trending';
}

export interface SearchDocumentsParams {
  keyword: string;
  categoryId?: number;
  isPaid?: boolean;
  page?: number;
  size?: number;
}

export interface GetCommentsParams {
  parentId?: number;
  page?: number;
  size?: number;
}

export interface GetCollectedDocumentsParams {
  folderId?: number;
  page?: number;
  size?: number;
}

// ==================== UI 辅助类型 ====================

export interface DocumentCardProps {
  document: CommunityDocument;
  showAuthor?: boolean;
  showStats?: boolean;
  onClick?: () => void;
  onLike?: () => void;
  onCollect?: () => void;
}

export interface CategoryTreeNode extends DocumentCategory {
  children?: CategoryTreeNode[];
}

export interface CommentTreeNode extends DocumentComment {
  replies?: CommentTreeNode[];
}

// ==================== 过滤器类型 ====================

export interface DocumentFilter {
  categoryId?: number;
  tagIds?: number[];
  isPaid?: boolean;
  minPrice?: number;
  maxPrice?: number;
  authorId?: string;
  status?: DocumentStatus[];
  isFeatured?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface DocumentSort {
  field: 'publishedAt' | 'viewCount' | 'likeCount' | 'collectCount';
  order: 'asc' | 'desc';
}

// ==================== 状态管理类型 ====================

export interface CommunityState {
  documents: CommunityDocument[];
  currentDocument?: CommunityDocument;
  categories: DocumentCategory[];
  tags: DocumentTag[];
  filter: DocumentFilter;
  sort: DocumentSort;
  loading: boolean;
  error?: string;
}

export interface UserCommunityState {
  likedDocuments: Set<string>;
  collectedDocuments: Set<string>;
  followingAuthors: Set<string>;
  purchasedDocuments: Set<string>;
}
