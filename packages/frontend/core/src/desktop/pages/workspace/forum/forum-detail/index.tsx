import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getForum, getForumPosts, getForumStats } from '../forum-api';
import type { ForumDTO, PostDTO, ForumStatsDTO, PaginatedResponse } from '../types';

export function Component() {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate = useNavigate();
  const [forum, setForum] = useState<ForumDTO | null>(null);
  const [stats, setStats] = useState<ForumStatsDTO | null>(null);
  const [posts, setPosts] = useState<PaginatedResponse<PostDTO>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
  });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!forumId) return;
    const id = parseInt(forumId);

    Promise.all([getForum(id), getForumStats(id), getForumPosts(id, page, 20)])
      .then(([forumData, statsData, postsData]) => {
        setForum(forumData);
        setStats(statsData);
        setPosts(postsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [forumId, page]);

  if (loading) return <div>加载中...</div>;
  if (!forum) return <div>板块不存在</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{forum.name}</h1>
          {forum.description && <p style={{ color: '#666' }}>{forum.description}</p>}
        </div>
        <button
          onClick={() => navigate(`/forum/${forumId}/create-post`)}
          style={{ padding: '10px 20px', fontSize: 16, cursor: 'pointer' }}
        >
          发帖
        </button>
      </div>

      {stats && (
        <div
          style={{
            display: 'flex',
            gap: 30,
            marginTop: 20,
            padding: 15,
            background: '#f5f5f5',
            borderRadius: 4,
          }}
        >
          <span>帖子数: {stats.postCount}</span>
          <span>主题数: {stats.topicCount}</span>
          <span>今日发帖: {stats.todayPostCount}</span>
          <span>活跃用户: {stats.activeUserCount}</span>
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        {posts.content.map(post => (
          <div
            key={post.id}
            onClick={() => navigate(`/forum/${forumId}/post/${post.id}`)}
            style={{ padding: 15, borderBottom: '1px solid #eee', cursor: 'pointer' }}
          >
            <h3 style={{ margin: 0 }}>
              {post.isSticky && <span style={{ color: '#ff4d4f' }}>[置顶] </span>}
              {post.isEssence && <span style={{ color: '#faad14' }}>[精华] </span>}
              {post.title}
            </h3>
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

