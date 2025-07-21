import React, { useCallback } from 'react';
import type { CommunityDocument } from '../types';
import { paidBadge, followBadge, publicBadge } from '../styles.css';
import * as styles from './styles.css';

interface DocumentCardProps {
  document: CommunityDocument;
  showActions?: boolean;
  onLike?: (docId: string) => void;
  onCollect?: (docId: string) => void;
  onView?: (docId: string) => void;
  onClick?: (docId: string) => void;
  className?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  showActions = true,
  onLike,
  onCollect,
  onView,
  onClick,
  className,
}) => {
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // 阻止在点击操作按钮时触发卡片点击
    if ((e.target as HTMLElement).closest('[data-action-button]')) {
      return;
    }
    onClick?.(document.id);
  }, [onClick, document.id]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(document.id);
  }, [onLike, document.id]);

  const handleCollect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCollect?.(document.id);
  }, [onCollect, document.id]);

  const handleView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(document.id);
  }, [onView, document.id]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getAuthorInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const shouldShowLock = !document.canAccess && (document.isPaid || document.requireFollow);

  return (
    <div 
      className={`${styles.cardContainer} ${className || ''}`}
      onClick={handleCardClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{document.title}</h3>
          <div className={styles.badges}>
            {document.isPaid && (
              <span className={paidBadge}>¥{document.price}</span>
            )}
            {document.requireFollow && (
              <span className={followBadge}>需关注</span>
            )}
            {document.isPublic && !document.isPaid && !document.requireFollow && (
              <span className={publicBadge}>公开</span>
            )}
          </div>
        </div>
      </div>

      <p className={styles.description}>{document.description}</p>

      {document.tags && document.tags.length > 0 && (
        <div className={styles.tagsContainer}>
          {document.tags.slice(0, 5).map(tag => (
            <span 
              key={tag.id} 
              className={styles.tag}
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {document.tags.length > 5 && (
            <span className={styles.tag} style={{ backgroundColor: '#666' }}>
              +{document.tags.length - 5}
            </span>
          )}
        </div>
      )}

      <div className={styles.authorSection}>
        {document.author.avatar ? (
          <img 
            src={document.author.avatar} 
            alt={document.author.name}
            className={styles.authorAvatar}
          />
        ) : (
          <div className={styles.authorAvatar}>
            {getAuthorInitials(document.author.name)}
          </div>
        )}
        <span className={styles.authorName}>{document.author.name}</span>
        <span className={styles.categoryInfo}>{document.category.name}</span>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span>👁️</span>
            <span>{formatNumber(document.viewCount)}</span>
          </div>
          <div className={styles.statItem}>
            <span>👍</span>
            <span>{formatNumber(document.likeCount)}</span>
          </div>
          <div className={styles.statItem}>
            <span>⭐</span>
            <span>{formatNumber(document.collectCount)}</span>
          </div>
        </div>
        <div className={styles.publishTime}>
          {formatTime(document.createdAt)}
        </div>
      </div>

      {showActions && (
        <div className={styles.actionsRow}>
          <button 
            className={styles.likeButton}
            onClick={handleLike}
            data-action-button
            data-liked={document.isLiked}
            title={document.isLiked ? '取消点赞' : '点赞'}
          >
            <span>{document.isLiked ? '❤️' : '🤍'}</span>
            <span>{formatNumber(document.likeCount)}</span>
          </button>

          <button 
            className={styles.collectButton}
            onClick={handleCollect}
            data-action-button
            data-collected={document.isCollected}
            title={document.isCollected ? '取消收藏' : '收藏'}
          >
            <span>{document.isCollected ? '⭐' : '☆'}</span>
            <span>{formatNumber(document.collectCount)}</span>
          </button>

          <button 
            className={styles.viewButton}
            onClick={handleView}
            data-action-button
            title="查看详情"
          >
            <span>📖</span>
            <span>查看</span>
          </button>
        </div>
      )}

      {shouldShowLock && (
        <div className={styles.lockOverlay}>
          <div className={styles.lockContent}>
            <div className={styles.lockIcon}>🔒</div>
            <div className={styles.lockText}>内容已锁定</div>
            <div className={styles.lockSubtext}>
              {document.isPaid && `需要支付 ¥${document.price}`}
              {document.requireFollow && '需要关注作者'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCard;