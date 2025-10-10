import type { ReplyDTO, PaginatedResponse } from '../types';
import { sanitizeText } from '../utils/sanitize';
import * as styles from './reply-list.css';

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
    <div className={styles.wrapper}>
      <h3 className={styles.count}>{replies.totalElements} 条回复</h3>
      {replies.content.map(reply => (
        <div key={reply.id} className={styles.reply}>
          <div className={styles.replyHeader}>
            <div className={styles.authorRow}>
              <strong className={styles.author}>{reply.username}</strong>
              <span className={styles.floor}>#{reply.floor}楼</span>
              {reply.isBestAnswer && (
                <span className={styles.bestBadge}>✓ 最佳答案</span>
              )}
            </div>
            <div className={styles.actionRow}>
              <button
                onClick={() => onLike(reply)}
                disabled={!!replyLikeLoading[reply.id]}
                className={styles.likeBtn}
                title={reply.isLiked ? '取消点赞' : '点赞'}
              >
                <span className={styles.likeHeart}>{reply.isLiked ? '❤️' : '🤍'}</span>
                <span>{reply.likeCount ?? 0}</span>
              </button>

              {!reply.isBestAnswer && (
                <button onClick={() => onMarkBest(reply.id)} className={styles.markBtn}>
                  设为最佳
                </button>
              )}
            </div>
          </div>
          <div
            className={styles.replyContent}
            dangerouslySetInnerHTML={{ __html: sanitizeText(reply.content) }}
          />
          <div className={styles.replyMeta}>{new Date(reply.createdAt).toLocaleString()}</div>
        </div>
      ))}

      {replies.totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 0} onClick={() => onPageChange(page - 1)}>
            上一页
          </button>
          <span>
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

