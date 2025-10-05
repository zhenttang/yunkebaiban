import { Button } from '@affine/component';
import { useState } from 'react';
import * as api from '../api';

interface AuthorInfoProps {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  publishedAt: string;
  isFollowing?: boolean;
  onFollowChange?: () => void;
}

export const AuthorInfo = ({
  authorId,
  authorName,
  authorAvatar,
  publishedAt,
  isFollowing = false,
  onFollowChange,
}: AuthorInfoProps) => {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      if (following) {
        await api.unfollowAuthor(authorId);
      } else {
        await api.followAuthor(authorId);
      }
      setFollowing(!following);
      onFollowChange?.();
    } catch (err) {
      console.error('关注操作失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: 'var(--affine-background-secondary-color)',
      borderRadius: '8px',
      border: '1px solid var(--affine-border-color)',
      marginBottom: '24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--affine-primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
          }}>
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--affine-text-primary-color)',
              marginBottom: '4px',
            }}>
              {authorName}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--affine-text-secondary-color)',
            }}>
              发布于 {new Date(publishedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <Button
          onClick={handleFollow}
          disabled={loading}
          variant={following ? 'secondary' : 'primary'}
          size="default"
        >
          {following ? '已关注' : '关注'}
        </Button>
      </div>
    </div>
  );
};
