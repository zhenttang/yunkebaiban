import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, getPostReplies, createReply, stickyPost, essencePost, lockPost, markBestAnswer, likeReply, unlikeReply, getPostAttachments, getPostTags } from '../forum-api';
import { PostActions } from '../components/PostActions';
import { AttachmentList } from '../components/AttachmentList';
import { ReplyList } from '../components/ReplyList';
import { usePermission } from '../hooks/usePermission';
import { useToast } from '../hooks/useToast';
import { sanitizeText } from '../utils/sanitize';
import type { PostDTO, ReplyDTO, PaginatedResponse, AttachmentDTO, TagDTO } from '../types';

export function Component() {
  const { showError, ToastContainer } = useToast();
  const { forumId, postId } = useParams<{ forumId: string; postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDTO | null>(null),
    [replies, setReplies] = useState<PaginatedResponse<ReplyDTO>>({ content: [], totalElements: 0, totalPages: 0, number: 0 }),
    [page, setPage] = useState(0),
    [replyContent, setReplyContent] = useState(''),
    [loading, setLoading] = useState(true),
    [replyLikeLoading, setReplyLikeLoading] = useState<Record<number, boolean>>({}),
    [attachments, setAttachments] = useState<AttachmentDTO[]>([]),
    [tags, setTags] = useState<TagDTO[]>([]);
  const forumNumericId = forumId ? parseInt(forumId, 10) : undefined;
  const { hasPermission: canSticky } = usePermission(forumNumericId, 'STICKY');
  const { hasPermission: canEssence } = usePermission(forumNumericId, 'ESSENCE');
  const { hasPermission: canLock } = usePermission(forumNumericId, 'LOCK');

  useEffect(() => {
    if (!postId) return;

    setLoading(true);
    Promise.all([
      getPost(postId),
      getPostReplies(postId, page, 50),
      getPostAttachments(postId),
      getPostTags(postId),
    ])
      .then(([postData, repliesData, attachData, tagsData]) => {
        setPost(postData);
        setReplies(repliesData);
        setAttachments(attachData || []);
        setTags(tagsData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId, page]);

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

  if (loading) return <div>加载中...</div>;
  if (!post) return <div>帖子不存在</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <div style={{ padding: 20, background: '#f9f9f9', borderRadius: 4 }}>
        <h1>{post.title}</h1>
        <div style={{ marginTop: 10, color: '#999', fontSize: 14 }}>
          {post.authorName} · {new Date(post.createdAt).toLocaleDateString()} · {post.viewCount} 浏览 · {post.replyCount} 回复
        </div>
        <div style={{ marginTop: 20 }} dangerouslySetInnerHTML={{ __html: sanitizeText(post.content) }} />

        {/* 标签列表 */}
        {tags.length > 0 && (
          <div style={{ marginTop: 15, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tags.map(t => (
              <span
                key={t.id}
                onClick={() => navigate(`/forum/tags/${t.id}`)}
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: '#eef5ff',
                  border: '1px solid #d6e4ff',
                  color: '#1d39c4',
                  borderRadius: 12,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                #{t.name}
              </span>
            ))}
          </div>
        )}

        {/* 附件列表 */}
        <AttachmentList attachments={attachments} />

        {/* 帖子操作：点赞/收藏 */}
        <div style={{ marginTop: 16 }}>
          <PostActions post={post} onLikeChange={refreshPost} onCollectChange={refreshPost} />
        </div>

        {/* 版主操作 */}
        <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          {canSticky && (
            <button onClick={() => handleModAction('sticky')} disabled={post.isSticky}>
              {post.isSticky ? '已置顶' : '置顶'}
            </button>
          )}
          {canEssence && (
            <button onClick={() => handleModAction('essence')} disabled={post.isEssence}>
              {post.isEssence ? '已加精' : '加精'}
            </button>
          )}
          {canLock && (
            <button onClick={() => handleModAction('lock')} disabled={post.isLocked}>
              {post.isLocked ? '已锁定' : '锁定'}
            </button>
          )}
          <button onClick={() => navigate(`/forum/posts/${post.id}/history`)}>编辑历史</button>
        </div>
      </div>

      <ReplyList
        replies={replies}
        page={page}
        onPageChange={setPage}
        onLike={handleToggleReplyLike}
        onMarkBest={handleMarkBest}
        replyLikeLoading={replyLikeLoading}
      />

      {!post.isLocked && (
        <div style={{ marginTop: 30, padding: 20, background: '#f9f9f9', borderRadius: 4 }}>
          <h3>发表回复</h3>
          <textarea
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="输入回复内容..."
            style={{ width: '100%', minHeight: 120, padding: 10, fontSize: 14 }}
          />
          <button onClick={handleReply} style={{ marginTop: 10, padding: '8px 20px' }}>
            提交回复
          </button>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
