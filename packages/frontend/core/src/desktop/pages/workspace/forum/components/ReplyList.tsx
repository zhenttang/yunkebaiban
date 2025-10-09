import type { ReplyDTO, PaginatedResponse } from '../types';
import { sanitizeText } from '../utils/sanitize';

interface ReplyListProps {
  replies: PaginatedResponse<ReplyDTO>;
  page: number;
  onPageChange: (newPage: number) => void;
  onLike: (reply: ReplyDTO) => void;
  onMarkBest: (replyId: number) => void;
  replyLikeLoading: Record<number, boolean>;
}

export function ReplyList({
  replies,
  page,
  onPageChange,
  onLike,
  onMarkBest,
  replyLikeLoading,
}: ReplyListProps) {
  return (
    <div style={{ marginTop: 30 }}>
      <h3>{replies.totalElements} 条回复</h3>
      {replies.content.map(reply => (
        <div key={reply.id} style={{ padding: 15, borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <strong>{reply.username}</strong>
              <span style={{ marginLeft: 10, color: '#999' }}>#{reply.floor}楼</span>
              {reply.isBestAnswer && (
                <span style={{ marginLeft: 10, color: '#52c41a' }}>✓ 最佳答案</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onLike(reply)}
                disabled={!!replyLikeLoading[reply.id]}
                style={{ fontSize: 12 }}
                title={reply.isLiked ? '取消点赞' : '点赞'}
              >
                <span style={{ marginRight: 6 }}>{reply.isLiked ? '❤️' : '🤍'}</span>
                <span>{reply.likeCount ?? 0}</span>
              </button>

              {!reply.isBestAnswer && (
                <button onClick={() => onMarkBest(reply.id)} style={{ fontSize: 12 }}>
                  设为最佳
                </button>
              )}
            </div>
          </div>
          <div style={{ marginTop: 10 }} dangerouslySetInnerHTML={{ __html: sanitizeText(reply.content) }} />
          <div style={{ marginTop: 5, color: '#999', fontSize: 12 }}>
            {new Date(reply.createdAt).toLocaleString()}
          </div>
        </div>
      ))}

      {replies.totalPages > 1 && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button disabled={page === 0} onClick={() => onPageChange(page - 1)}>
            上一页
          </button>
          <span style={{ margin: '0 15px' }}>
            第 {page + 1} / {replies.totalPages} 页
          </span>
          <button disabled={page >= replies.totalPages - 1} onClick={() => onPageChange(page + 1)}>
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

