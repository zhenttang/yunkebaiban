import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPost,
  getPostReplies,
  createReply,
  stickyPost,
  essencePost,
  lockPost,
  markBestAnswer,
  likeReply,
  unlikeReply,
  getPostAttachments,
  getPostTags,
} from '../forum-api';
import { PostActions } from '../components/PostActions';
import { AttachmentList } from '../components/AttachmentList';
import { ReplyList } from '../components/ReplyList';
import { usePermission } from '../hooks/usePermission';
import { useToast } from '../hooks/useToast';
import { sanitizeText } from '../utils/sanitize';
import * as styles from './post-detail.css';
import type {
  PostDTO,
  ReplyDTO,
  PaginatedResponse,
  AttachmentDTO,
  TagDTO,
} from '../types';

export function Component() {
  const { showError, ToastContainer } = useToast();
  const { forumId, postId } = useParams<{ forumId: string; postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDTO | null>(null),
    [replies, setReplies] = useState<PaginatedResponse<ReplyDTO>>({ content: [], totalElements: 0, totalPages: 0, number: 0 }),
    [page, setPage] = useState(0),
    [replyContent, setReplyContent] = useState(''),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [replyLikeLoading, setReplyLikeLoading] = useState<Record<number, boolean>>({}),
    [attachments, setAttachments] = useState<AttachmentDTO[]>([]),
    [tags, setTags] = useState<TagDTO[]>([]);
  const forumNumericId = forumId ? parseInt(forumId, 10) : undefined;
  const { hasPermission: canSticky } = usePermission(forumNumericId, 'STICKY');
  const { hasPermission: canEssence } = usePermission(forumNumericId, 'ESSENCE');
  const { hasPermission: canLock } = usePermission(forumNumericId, 'LOCK');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPostData = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    setError(null);
    try {
      const [postData, repliesData, attachData, tagsData] = await Promise.all([
        getPost(postId),
        getPostReplies(postId, page, 50),
        getPostAttachments(postId),
        getPostTags(postId),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      setPost(postData);
      setReplies(repliesData);
      setAttachments(attachData || []);
      setTags(tagsData || []);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      console.error('加载帖子详情失败:', err);
      setError(err instanceof Error ? err.message : '加载失败，请稍后重试');
      showError('加载帖子失败，请稍后重试');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, postId, showError]);

  useEffect(() => {
    void loadPostData();
  }, [loadPostData]);

  const handleReply = async () => {
    if (!postId || !replyContent.trim()) return;
    try {
      await createReply({ postId, content: replyContent });
      setReplyContent('');
      const repliesData = await getPostReplies(postId, page, 50);
      setReplies(repliesData);
    } catch (error) { console.error(error); showError('回复失败'); }
  };

  const refreshPost = async () => {
    if (!postId) return;
    try { setPost(await getPost(postId)); } catch (error) { console.error(error); }
  };

  const refreshReplies = async () => {
    if (!postId) return;
    try { setReplies(await getPostReplies(postId, page, 50)); } catch (error) { console.error(error); }
  };

  const handleToggleReplyLike = async (reply: ReplyDTO) => {
    if (!reply?.id || replyLikeLoading[reply.id]) return;
    setReplyLikeLoading(prev => ({ ...prev, [reply.id]: true }));
    try { reply.isLiked ? await unlikeReply(reply.id) : await likeReply(reply.id); await refreshReplies(); }
    catch (error: any) { console.error(error); showError(error?.message || '操作失败'); }
    finally { setReplyLikeLoading(prev => ({ ...prev, [reply.id]: false })); }
  };

  const handleModAction = async (action: 'sticky' | 'essence' | 'lock') => {
    if (!postId) return;
    try {
      const updated: PostDTO = action === 'sticky' ? await stickyPost(postId) : action === 'essence' ? await essencePost(postId) : await lockPost(postId);
      setPost(updated);
    } catch (error) { console.error(error); showError('操作失败'); }
  };

  const handleMarkBest = async (replyId: number) => {
    try { await markBestAnswer(replyId); setReplies(await getPostReplies(postId!, page, 50)); }
    catch (error) { console.error(error); }
  };

  if (loading) return <div className={styles.loading}>加载中...</div>;

  if (error) {
    return (
      <div className={styles.loading}>
        <p>加载帖子失败：{error}</p>
        <button onClick={() => void loadPostData()} className={styles.ghostBtn}>
          重新加载
        </button>
      </div>
    );
  }

  if (!post) return <div className={styles.loading}>帖子不存在</div>;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.main}>
          <header className={styles.header}>
            <h1 className={styles.title}>{post.title}</h1>
            <div className={styles.meta}>
              <span>{post.authorName}</span>
              <span>· {new Date(post.createdAt).toLocaleString()}</span>
              <span>· {post.viewCount} 浏览</span>
              <span>· {post.replyCount} 回复</span>
            </div>
          </header>
          <article
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: sanitizeText(post.content) }}
          />

          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/forum/tags/${t.id}`)}
                  className={styles.tag}
                  title={t.name}
                >
                  #{t.name}
                </button>
              ))}
            </div>
          )}

          <AttachmentList attachments={attachments} />

          <div className={styles.actionsRow}>
            <PostActions
              post={post}
              onLikeChange={refreshPost}
              onCollectChange={refreshPost}
            />
          </div>

          <div className={styles.moderatorRow}>
            {canSticky && (
              <button
                className={styles.ghostBtn}
                onClick={() => handleModAction('sticky')}
                disabled={post.isSticky}
              >
                {post.isSticky ? '已置顶' : '置顶'}
              </button>
            )}
            {canEssence && (
              <button
                className={styles.ghostBtn}
                onClick={() => handleModAction('essence')}
                disabled={post.isEssence}
              >
                {post.isEssence ? '已加精' : '加精'}
              </button>
            )}
            {canLock && (
              <button
                className={styles.ghostBtn}
                onClick={() => handleModAction('lock')}
                disabled={post.isLocked}
              >
                {post.isLocked ? '已锁定' : '锁定'}
              </button>
            )}
            <button
              className={styles.ghostBtn}
              onClick={() => navigate(`/forum/posts/${post.id}/history`)}
            >
              编辑历史
            </button>
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.timelineCard}>
            <div className={styles.timelineHeader}>时间线</div>
            <ul className={styles.timelineList}>
              <li>
                创建于 {new Date(post.createdAt).toLocaleString()}
              </li>
              {post.lastReplyAt && (
                <li>最后回复于 {new Date(post.lastReplyAt).toLocaleString()}</li>
              )}
              <li>浏览 {post.viewCount}</li>
              <li>回复 {post.replyCount}</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className={styles.container}>
        <ReplyList
          replies={replies}
          page={page}
          onPageChange={setPage}
          onLike={handleToggleReplyLike}
          onMarkBest={handleMarkBest}
          replyLikeLoading={replyLikeLoading}
        />
      </div>

      {!post.isLocked && (
        <div className={styles.container}>
          <div className={styles.replyEditor}>
            <h3 className={styles.sectionTitle}>发表回复</h3>
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="输入回复内容..."
              className={styles.textarea}
            />
            <button onClick={handleReply} className={styles.primaryBtn}>
              提交回复
            </button>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
