import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyDrafts, deleteDraft, publishDraft } from '../forum-api';
import type { DraftDTO, PaginatedResponse } from '../types';
import creationIllustration from './creation_4036.svg';
import { notify } from '@yunke/component';

export function Component() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<PaginatedResponse<DraftDTO>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
  });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    getMyDrafts(page, pageSize)
      .then(data => setDrafts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const handleDelete = async (id: string) => {
    const ok = confirm('确定删除该草稿吗？');
    if (!ok) return;
    try {
      await deleteDraft(id);
      const data = await getMyDrafts(page, pageSize);
      setDrafts(data);
    } catch (err) {
      console.error(err);
      notify.error({ title: '删除失败' });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const post = await publishDraft(id);
      navigate(`/forum/${post.forumId}/post/${post.id}`);
    } catch (err) {
      console.error(err);
      notify.error({ title: '发布失败' });
    }
  };

  if (loading) return <div style={{ padding: 20 }}>加载中...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>我的草稿</h1>
      </div>

      {drafts.content.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 60,
          gap: 20
        }}>
          <img
            src={creationIllustration}
            alt="No drafts"
            style={{ width: 300, height: 'auto' }}
            draggable={false}
          />
          <div style={{ color: '#999', fontSize: 16 }}>还没有草稿</div>
          <div style={{ color: '#bbb', fontSize: 14 }}>开始创作你的第一篇帖子吧</div>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          {drafts.content.map(draft => (
            <div key={draft.id} style={{ padding: 15, borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{draft.title || '(无标题)'}</h3>
                  <div style={{ marginTop: 6, color: '#666', whiteSpace: 'pre-wrap' }}>
                    {(draft.content || '').slice(0, 200)}{(draft.content || '').length > 200 ? '...' : ''}
                  </div>
                  <div style={{ marginTop: 6, color: '#999', fontSize: 12 }}>
                    {draft.forumName ? `板块: ${draft.forumName} · ` : ''}
                    更新: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : new Date(draft.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => navigate(`/forum/${draft.forumId}/create-post?draftId=${draft.id}`)}
                    style={{ padding: '6px 12px', cursor: 'pointer' }}
                  >
                    继续编辑
                  </button>
                  <button
                    onClick={() => handlePublish(draft.id)}
                    style={{ padding: '6px 12px', cursor: 'pointer' }}
                  >
                    发布
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    style={{ padding: '6px 12px', cursor: 'pointer', color: '#ff4d4f', borderColor: '#ffccc7' }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {drafts.totalPages > 1 && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            上一页
          </button>
          <span style={{ margin: '0 15px' }}>第 {page + 1} / {drafts.totalPages} 页</span>
          <button disabled={page >= drafts.totalPages - 1} onClick={() => setPage(p => p + 1)}>
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
