import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostsByTag, getPopularTags } from '../forum-api';
import type { PostDTO, PaginatedResponse, TagDTO } from '../types';

export function Component() {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const [tagName, setTagName] = useState<string>('');
  const [posts, setPosts] = useState<PaginatedResponse<PostDTO>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
  });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tagId) return;
    setLoading(true);
    Promise.all([
      getPostsByTag(parseInt(tagId, 10), page, 20),
      getPopularTags().catch(() => [] as TagDTO[]),
    ])
      .then(([postsData, tags]) => {
        setPosts(postsData);
        const t = tags.find(x => String(x.id) === String(tagId));
        setTagName(t?.name || `标签 #${tagId}`);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tagId, page]);

  if (loading) return <div style={{ padding: 20 }}>加载中...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>
          标签：
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              background: '#eef5ff',
              border: '1px solid #d6e4ff',
              color: '#1d39c4',
              borderRadius: 12,
              fontSize: 14,
              marginLeft: 8,
            }}
          >
            #{tagName}
          </span>
        </h2>
      </div>

      <div style={{ marginTop: 10 }}>
        {posts.content.map(post => (
          <div
            key={post.id}
            onClick={() => navigate(`/forum/${post.forumId}/post/${post.id}`)}
            style={{ padding: 15, borderBottom: '1px solid #eee', cursor: 'pointer' }}
          >
            <h3 style={{ margin: 0 }}>
              {post.isSticky && <span style={{ color: '#ff4d4f' }}>[置顶] </span>}
              {post.isEssence && <span style={{ color: '#faad14' }}>[精华] </span>}
              {post.title}
            </h3>
            <div style={{ marginTop: 8, color: '#666' }}>
              {(post.content || '').replace(/\n/g, ' ').slice(0, 200)}
              {(post.content || '').length > 200 ? '...' : ''}
            </div>
            <div style={{ marginTop: 8, color: '#999', fontSize: 14 }}>
              {post.authorName} · {new Date(post.createdAt).toLocaleDateString()} · {post.viewCount} 浏览 · {post.replyCount} 回复
            </div>
          </div>
        ))}
      </div>

      {posts.totalPages > 1 && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            上一页
          </button>
          <span style={{ margin: '0 15px' }}>第 {page + 1} / {posts.totalPages} 页</span>
          <button disabled={page >= posts.totalPages - 1} onClick={() => setPage(p => p + 1)}>
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
