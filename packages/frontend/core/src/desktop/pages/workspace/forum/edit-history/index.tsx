import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostHistory, getHistoryDetail, getPost } from '../forum-api';
import type { EditHistoryDTO, PaginatedResponse, PostDTO } from '../types';

export function Component() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDTO | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [histories, setHistories] = useState<PaginatedResponse<EditHistoryDTO>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    Promise.all([getPost(postId), getPostHistory(postId, page, 20)])
      .then(([p, h]) => {
        setPost(p);
        // 假设后端已按时间倒序返回，如果没有则可在前端排序
        const content = (h?.content || []).slice().sort((a, b) => {
          const ta = (a as any).editedAt || (a as any).createdAt;
          const tb = (b as any).editedAt || (b as any).createdAt;
          return new Date(tb).getTime() - new Date(ta).getTime();
        });
        setHistories({ ...h, content });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId, page]);

  const toggleDetail = async (h: EditHistoryDTO) => {
    const id = String((h as any).id);
    const next = !expanded[id];
    setExpanded(prev => ({ ...prev, [id]: next }));
    if (next && !(h as any).content && (h as any).id) {
      try {
        const detail = await getHistoryDetail((h as any).id);
        // 更新对应项的完整内容
        setHistories(prev => ({
          ...prev,
          content: prev.content.map(item => (String((item as any).id) === id ? { ...item, ...detail } : item)),
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <div style={{ padding: 20 }}>加载中...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>编辑历史 {post ? `· ${post.title}` : ''}</h2>
        {post && (
          <button onClick={() => navigate(`/forum/${post.forumId}/post/${post.id}`)}>
            返回帖子
          </button>
        )}
      </div>
      <div style={{ marginTop: 10, color: '#999', fontSize: 14 }}>按时间倒序显示</div>

      <div style={{ marginTop: 20 }}>
        {histories.content.map(h => {
          const id = String((h as any).id);
          const time = (h as any).editedAt || (h as any).createdAt;
          const editor = (h as any).editorName || (h as any).editorId;
          const title = (h as any).oldTitle || (h as any).title || '';
          const content = (h as any).oldContent || (h as any).content || '';
          const version = (h as any).version;
          const opened = !!expanded[id];
          const titleChanged = Boolean((h as any).oldTitle);
          const contentChanged = Boolean((h as any).oldContent || (h as any).content);
          return (
            <div key={id} style={{ padding: 12, borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {typeof version !== 'undefined' && (
                      <span style={{
                        fontSize: 12,
                        background: '#f0f5ff',
                        color: '#2f54eb',
                        border: '1px solid #d6e4ff',
                        borderRadius: 3,
                        padding: '2px 6px',
                      }}>v{version}</span>
                    )}
                    <div style={{ fontWeight: 'bold' }}>{new Date(time).toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>编辑人：{editor}</div>
                </div>
                <button onClick={() => toggleDetail(h)} style={{ fontSize: 12 }}>
                  {opened ? '收起' : '查看详情'}
                </button>
              </div>
              {(titleChanged || contentChanged) && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {titleChanged && (
                    <span style={{ fontSize: 12, color: '#fa541c', background: '#fff2e8', border: '1px solid #ffd8bf', borderRadius: 3, padding: '2px 6px' }}>
                      标题变更
                    </span>
                  )}
                  {contentChanged && (
                    <span style={{ fontSize: 12, color: '#52c41a', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 3, padding: '2px 6px' }}>
                      内容变更
                    </span>
                  )}
                </div>
              )}
              {title && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontWeight: 'bold' }}>旧标题：</span>
                  <span>{title}</span>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6 }}>旧内容：</div>
                <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
                  {opened ? content : String(content).slice(0, 100) + (String(content).length > 100 ? '...' : '')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {histories.totalPages > 1 && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            上一页
          </button>
          <span style={{ margin: '0 15px' }}>
            第 {page + 1} / {histories.totalPages} 页
          </span>
          <button disabled={page >= histories.totalPages - 1} onClick={() => setPage(p => p + 1)}>
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
