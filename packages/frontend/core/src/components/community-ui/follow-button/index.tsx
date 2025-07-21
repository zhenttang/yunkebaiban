import React, { useState, useCallback, useMemo } from 'react';
import type { UserInfo } from '../types';
import * as styles from './styles.css';

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'card';
  className?: string;
}

interface FollowCardProps extends Omit<FollowButtonProps, 'targetUserId'> {
  user: UserInfo;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  isFollowing,
  onFollowChange,
  disabled = false,
  size = 'medium',
  className,
}) => {
  const [loading, setLoading] = useState(false);

  const handleFollow = useCallback(async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      await onFollowChange(!isFollowing);
    } catch (error) {
      console.error('Follow operation failed:', error);
    } finally {
      setLoading(false);
    }
  }, [isFollowing, onFollowChange, loading, disabled]);

  const buttonText = useMemo(() => {
    if (loading) return '';
    if (isFollowing) return '已关注';
    return '关注';
  }, [isFollowing, loading]);

  const hoverText = useMemo(() => {
    if (isFollowing) return '取消关注';
    return '关注';
  }, [isFollowing]);

  return (
    <button
      className={`${styles.followButton} ${className || ''}`}
      onClick={handleFollow}
      disabled={disabled || loading}
      data-following={isFollowing}
      data-loading={loading}
      title={hoverText}
      aria-label={hoverText}
    >
      <span className={styles.followButtonText}>
        <span className={styles.followButtonIcon}>
          {isFollowing ? '✓' : '+'}
        </span>
        {buttonText}
      </span>
      <div className={styles.followButtonLoading} />
    </button>
  );
};

export const FollowCard: React.FC<FollowCardProps> = ({
  user,
  isFollowing,
  onFollowChange,
  disabled = false,
  className,
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className={`${styles.followCard} ${className || ''}`}>
      <div className={styles.userAvatar}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          getInitials(user.name)
        )}
      </div>

      <div className={styles.userInfo}>
        <div className={styles.userName}>{user.name}</div>
        {user.bio && (
          <div className={styles.userBio}>{user.bio}</div>
        )}
      </div>

      {(user.followerCount !== undefined || user.followingCount !== undefined) && (
        <div className={styles.userStats}>
          {user.followerCount !== undefined && (
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{formatNumber(user.followerCount)}</div>
              <div className={styles.statLabel}>粉丝</div>
            </div>
          )}
          {user.followingCount !== undefined && (
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{formatNumber(user.followingCount)}</div>
              <div className={styles.statLabel}>关注</div>
            </div>
          )}
        </div>
      )}

      <FollowButton
        targetUserId={user.id}
        isFollowing={isFollowing}
        onFollowChange={onFollowChange}
        disabled={disabled}
      />
    </div>
  );
};

export default FollowButton;