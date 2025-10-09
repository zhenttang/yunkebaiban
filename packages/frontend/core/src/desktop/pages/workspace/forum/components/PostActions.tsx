import { useState } from 'react';
import type { PostDTO } from '../types';
import { collectPost, likePost, uncollectPost, unlikePost } from '../forum-api';
import { useToast } from '../hooks/useToast';

export interface PostActionsProps {
  post: PostDTO;
  onLikeChange: () => void;
  onCollectChange: () => void;
}

export function PostActions({ post, onLikeChange, onCollectChange }: PostActionsProps) {
  const [likeLoading, setLikeLoading] = useState(false);
  const [collectLoading, setCollectLoading] = useState(false);
  const { showError, ToastContainer } = useToast();

  const handleToggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (post.isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
      onLikeChange();
    } catch (err: any) {
      console.error(err);
      showError(err?.message || '操作失败');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleToggleCollect = async () => {
    if (collectLoading) return;
    setCollectLoading(true);
    try {
      if (post.isCollected) {
        await uncollectPost(post.id);
      } else {
        await collectPost(post.id);
      }
      onCollectChange();
    } catch (err: any) {
      console.error(err);
      showError(err?.message || '操作失败');
    } finally {
      setCollectLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <button
        onClick={handleToggleLike}
        disabled={likeLoading}
        style={{
          padding: '6px 12px',
          cursor: likeLoading ? 'not-allowed' : 'pointer',
          opacity: likeLoading ? 0.7 : 1,
        }}
        title={post.isLiked ? '取消点赞' : '点赞'}
      >
        <span style={{ marginRight: 6 }}>{post.isLiked ? '❤️' : '🤍'}</span>
        <span>{post.likeCount ?? 0}</span>
      </button>

      <button
        onClick={handleToggleCollect}
        disabled={collectLoading}
        style={{
          padding: '6px 12px',
          cursor: collectLoading ? 'not-allowed' : 'pointer',
          opacity: collectLoading ? 0.7 : 1,
        }}
        title={post.isCollected ? '取消收藏' : '收藏'}
      >
        <span style={{ marginRight: 6 }}>{post.isCollected ? '⭐' : '☆'}</span>
        <span>{post.collectCount ?? 0}</span>
      </button>
      <ToastContainer />
    </div>
  );
}

export default PostActions;
