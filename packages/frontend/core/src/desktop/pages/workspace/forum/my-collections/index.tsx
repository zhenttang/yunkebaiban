import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaginatedResponse, PostDTO } from '../types';
import { getMyCollections, type MyCollectionItemDTO, uncollectPost } from '../forum-api';
import collectionIllustration from './collection_ly06.svg';

export function Component() {
  const [collections, setCollections] = useState<PaginatedResponse<MyCollectionItemDTO>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [uncollectLoadingIds, setUncollectLoadingIds] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    getMyCollections(page, pageSize)
      .then(data => setCollections(data))
      .catch(err => {
        console.error(err);
        alert(err?.message || '加载失败');
      })
      .finally(() => setLoading(false));
  }, [page]);

  const handleUncollect = async (post: PostDTO) => {
    if (!post?.id) return;
    if (uncollectLoadingIds[post.id]) return;
    setUncollectLoadingIds(prev => ({ ...prev, [post.id]: true }));
    try {
      await uncollectPost(post.id);
      // 刷新当前页
      const data = await getMyCollections(page, pageSize);
      setCollections(data);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || '取消收藏失败');
    } finally {
      setUncollectLoadingIds(prev => ({ ...prev, [post.id]: false }));
    }
  };

  if (loading) return <div style={{ padding: 20 }}>加载中...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>我的收藏</h1>

      <div style={{ marginTop: 20 }}>
        {collections.content.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 60,
            gap: 20
          }}>
            <img
              src={collectionIllustration}
              alt="No collections"
              style={{ width: 300, height: 'auto' }}
              draggable={false}
            />
            <div style={{ color: '#999', fontSize: 16 }}>还没有收藏任何内容</div>
            <div style={{ color: '#bbb', fontSize: 14 }}>浏览帖子时点击收藏按钮吧</div>
          </div>
        ) : (
          collections.content.map(item => (
            <div
              key={item.post.id}
              onClick={() => navigate(`/forum/${item.post.forumId}/post/${item.post.id}`)}
              style={{
                padding: 15,
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.post.title}
                </h3>
                <p style={{ margin: '6px 0 0', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(item.post.content || '').replace(/\n/g, ' ').slice(0, 200)}{(item.post.content || '').length > 200 ? '...' : ''}
                </p>
                <div style={{ marginTop: 6, color: '#999', fontSize: 12 }}>
                  {item.post.authorName} · {new Date(item.post.createdAt).toLocaleDateString()}
                </div>
                <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                  收藏时间：{new Date(item.collectedAt).toLocaleString()}
                </div>
              </div>
              <div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleUncollect(item.post);
                  }}
                  disabled={!!uncollectLoadingIds[item.post.id]}
                  style={{ marginLeft: 12 }}
                >
                  取消收藏
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {collections.totalPages > 1 && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            上一页
          </button>
          <span style={{ margin: '0 15px' }}>
            第 {page + 1} / {collections.totalPages} 页
          </span>
          <button disabled={page >= collections.totalPages - 1} onClick={() => setPage(p => p + 1)}>
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
