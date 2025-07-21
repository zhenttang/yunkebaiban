// 社区UI组件库主入口文件

// 组件导出
export { default as DocumentCard } from './document-card';
export { default as SearchFilter } from './search-filter';
export { default as FollowButton, FollowCard } from './follow-button';
export { default as PaymentModal } from './payment-modal';
export { default as TagSelector } from './tag-selector';
export { default as CategoryFilter } from './category-filter';

// 类型定义导出
export type {
  CommunityDocument,
  UserInfo,
  CategoryInfo,
  TagInfo,
  SearchParams,
  CollectRequest,
  PaymentOrderRequest,
  PaymentOrderResponse,
  ApiResponse,
  PageResponse,
  SortOption,
} from './types';

// 常量导出
export { SORT_OPTIONS, PAYMENT_METHODS } from './types';

// 样式主题导出
export { communityTheme } from './styles.css';

// 工具函数
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return `${Math.floor(diffInHours * 60)}分钟前`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}小时前`;
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}天前`;
  } else if (diffInHours < 24 * 30) {
    return `${Math.floor(diffInHours / 24 / 7)}周前`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getAuthorInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const generateTagColor = (): string => {
  const colors = [
    '#f50', '#2db7f5', '#87d068', '#108ee9', '#f04134',
    '#00a2ae', '#fa8c16', '#722ed1', '#eb2f96', '#52c41a',
    '#fa541c', '#13c2c2', '#1890ff', '#722ed1', '#eb2f96',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 组件Props类型导出（用于外部组件开发）
export interface DocumentCardProps {
  document: CommunityDocument;
  showActions?: boolean;
  onLike?: (docId: string) => void;
  onCollect?: (docId: string) => void;
  onView?: (docId: string) => void;
  onClick?: (docId: string) => void;
  className?: string;
}

export interface SearchFilterProps {
  onSearch: (params: SearchParams) => void;
  categories: CategoryInfo[];
  tags: TagInfo[];
  loading?: boolean;
  resultCount?: number;
  defaultParams?: Partial<SearchParams>;
  showAdvanced?: boolean;
}

export interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'card';
  className?: string;
}

export interface PaymentModalProps {
  document: CommunityDocument;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onCreateOrder?: (request: PaymentOrderRequest) => Promise<PaymentOrderResponse>;
  onCheckPaymentStatus?: (orderId: string) => Promise<boolean>;
}

export interface TagSelectorProps {
  selectedTags: TagInfo[];
  availableTags: TagInfo[];
  onTagsChange: (tags: TagInfo[]) => void;
  onCreateTag?: (name: string, color: string) => Promise<TagInfo>;
  maxTags?: number;
  placeholder?: string;
  allowCreate?: boolean;
  className?: string;
}

export interface CategoryFilterProps {
  categories: CategoryInfo[];
  selectedCategoryId?: number;
  onCategoryChange: (categoryId?: number) => void;
  loading?: boolean;
  showSearch?: boolean;
  view?: 'grid' | 'list' | 'compact';
  allowViewToggle?: boolean;
  className?: string;
}