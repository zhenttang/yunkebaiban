import type { DocumentComment } from '../types';

interface CommentItemProps {
  comment: DocumentComment;
  onReply?: (commentId: number) => void;
  onDelete?: (commentId: number) => void;
  level?: number;
}

export const CommentItem = ({
  comment,
  onReply,
  onDelete,
  level = 0,
}: CommentItemProps) => {
  const marginLeft = level * 40;

  return (
    <div style={{
      marginLeft: `${marginLeft}px`,
      paddingBottom: '16px',
      borderBottom: level === 0 ? '1px solid var(--affine-border-color)' : 'none',
      marginBottom: '16px',
    }}>
      <div style={{
        display: 'flex',
        gap: '12px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'var(--affine-primary-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          flexShrink: 0,
        }}>
          {comment.userAvatar ? (
            <img
              src={comment.userAvatar}
              alt={comment.userName}
              style={{ width: '100%', height: '100%', borderRadius: '50%' }}
            />
          ) : (
            comment.userName.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--affine-text-primary-color)',
            }}>
              {comment.userName}
            </span>
            {comment.isAuthor && (
              <span style={{
                fontSize: '12px',
                padding: '2px 6px',
                backgroundColor: 'var(--affine-tag-blue)',
                color: 'white',
                borderRadius: '4px',
              }}>
                作者
              </span>
            )}
            <span style={{
              fontSize: '13px',
              color: 'var(--affine-text-secondary-color)',
            }}>
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <div style={{
            fontSize: '14px',
            color: 'var(--affine-text-primary-color)',
            lineHeight: '1.6',
            marginBottom: '8px',
          }}>
            {comment.content}
          </div>
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '13px',
          }}>
            <button
              onClick={() => onReply?.(comment.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--affine-text-secondary-color)',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              回复
            </button>
            <span style={{ color: 'var(--affine-text-secondary-color)' }}>
              {comment.isLiked ? '❤️' : '🤍'} {comment.likeCount}
            </span>
            {/* TODO: Add delete button for own comments */}
          </div>
        </div>
      </div>
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
