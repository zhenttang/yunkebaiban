import { Button } from '@affine/component';
import { useState, useEffect } from 'react';
import type { DocumentComment } from '../types';
import * as api from '../api';
import { CommentItem } from './CommentItem';

interface CommentSectionProps {
  documentId: string;
}

export const CommentSection = ({ documentId }: CommentSectionProps) => {
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [documentId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await api.getDocumentComments(documentId, {
        page: 0,
        size: 50,
      });
      setComments(response.content);
    } catch (err) {
      console.error('加载评论失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await api.addComment(documentId, {
        content: newComment,
        parentId: replyTo || undefined,
      });
      setNewComment('');
      setReplyTo(null);
      await loadComments();
    } catch (err) {
      console.error('发表评论失败:', err);
      alert('发表评论失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: number) => {
    setReplyTo(commentId);
    // Scroll to input
    document.querySelector('#comment-input')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{
      marginTop: '32px',
      padding: '24px',
      backgroundColor: 'var(--affine-background-primary-color)',
      border: '1px solid var(--affine-border-color)',
      borderRadius: '8px',
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--affine-text-primary-color)',
      }}>
        评论 ({comments.length})
      </h3>

      {/* Comment input */}
      <div style={{ marginBottom: '24px' }}>
        {replyTo && (
          <div style={{
            fontSize: '13px',
            color: 'var(--affine-text-secondary-color)',
            marginBottom: '8px',
          }}>
            回复评论 #{replyTo}
            <button
              onClick={() => setReplyTo(null)}
              style={{
                marginLeft: '8px',
                background: 'none',
                border: 'none',
                color: 'var(--affine-primary-color)',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
        )}
        <textarea
          id="comment-input"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="写下你的评论..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '12px',
            fontSize: '14px',
            border: '1px solid var(--affine-border-color)',
            borderRadius: '6px',
            resize: 'vertical',
            fontFamily: 'inherit',
            backgroundColor: 'var(--affine-background-primary-color)',
            color: 'var(--affine-text-primary-color)',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '8px',
        }}>
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            variant="primary"
            size="default"
          >
            {submitting ? '发表中...' : '发表评论'}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--affine-text-secondary-color)',
        }}>
          加载评论中...
        </div>
      ) : comments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--affine-text-secondary-color)',
        }}>
          暂无评论，来发表第一条评论吧！
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
