import type { CommunityDocument } from './types';
import type { CommunityDocument as CommunityUiDocument } from '@affine/core/components/community-ui/types';

const fallbackCategory = {
  id: 0,
  name: '社区文档',
  description: undefined,
  icon: undefined,
  sortOrder: 0,
  isActive: true,
} as const;

export const mapDocToUiDocument = (doc: CommunityDocument): CommunityUiDocument => {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description ?? '',
    contentUrl: `/community/${doc.id}`,
    author: {
      id: doc.authorId ?? 'unknown-author',
      name: doc.authorName ?? '未知作者',
    },
    category: fallbackCategory,
    tags:
      doc.tags?.map(tag => ({
        id: String(tag.id),
        name: tag.name,
        color: tag.color ?? '#999999',
        usageCount: 0,
      })) ?? [],
    isPaid: !!doc.isPaid,
    price: doc.price ?? 0,
    isPublic: true,
    requireFollow: false,
    viewCount: doc.viewCount ?? 0,
    likeCount: doc.likeCount ?? 0,
    collectCount: doc.collectCount ?? 0,
    isLiked: !!doc.isLiked,
    isCollected: !!doc.isCollected,
    canAccess: true,
    createdAt: doc.publishedAt,
    updatedAt: doc.updatedAt ?? doc.publishedAt,
  };
};
