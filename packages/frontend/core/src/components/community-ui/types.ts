// 社区功能相关的TypeScript类型定义

export interface CommunityDocument {
  id: string;
  title: string;
  description: string;
  contentUrl?: string;
  author: UserInfo;
  category: CategoryInfo;
  tags: TagInfo[];
  isPaid: boolean;
  price: number;
  isPublic: boolean;
  requireFollow: boolean;
  viewCount: number;
  likeCount: number;
  collectCount: number;
  isLiked: boolean;
  isCollected: boolean;
  canAccess: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
}

export interface CategoryInfo {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  documentCount?: number;
}

export interface TagInfo {
  id: number;
  name: string;
  color: string;
  usageCount: number;
  isSelected?: boolean;
}

export interface SearchParams {
  keyword?: string;
  author?: string;
  categoryId?: number;
  tags?: number[];
  sortBy?: 'created_at' | 'view_count' | 'like_count' | 'collect_count';
  page?: number;
  size?: number;
}

export interface CollectRequest {
  collectionName?: string;
}

export interface PaymentOrderRequest {
  documentId: string;
  paymentMethod: 'WECHAT' | 'ALIPAY';
}

export interface PaymentOrderResponse {
  orderId: string;
  paymentUrl: string;
  qrCode?: string;
  amount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: number;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export type SortOption = {
  value: string;
  label: string;
};

export const SORT_OPTIONS: SortOption[] = [
  { value: 'created_at', label: '最新发布' },
  { value: 'view_count', label: '最多浏览' },
  { value: 'like_count', label: '最多点赞' },
  { value: 'collect_count', label: '最多收藏' },
];

export const PAYMENT_METHODS = [
  { value: 'WECHAT', label: '微信支付', icon: '💬' },
  { value: 'ALIPAY', label: '支付宝', icon: '🅰️' },
] as const;