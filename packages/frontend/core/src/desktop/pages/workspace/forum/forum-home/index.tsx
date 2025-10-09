import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getForumPosts, listForums } from '../forum-api';
import type { ForumDTO, PostDTO } from '../types';
import { NotificationBadge } from '../components/NotificationBadge';

// 递归渲染板块树
function ForumTreeNode({ forum }: { forum: ForumDTO }) {
  const navigate = useNavigate();

  return (
    <div style={{ marginLeft: forum.parentId ? 20 : 0 }}>
      <div
        onClick={() => navigate(`/forum/${forum.id}`)}
        style={{
          padding: 12,
          cursor: 'pointer',
          borderBottom: '1px solid #eee',
          background: forum.parentId ? '#f9f9f9' : '#fff',
        }}
      >
        <strong>{forum.name}</strong>
        <span style={{ marginLeft: 10, color: '#999' }}>
          {forum.postCount} 帖子 | {forum.topicCount} 主题
        </span>
        {forum.description && (
          <p style={{ margin: '5px 0 0', color: '#666' }}>{forum.description}</p>
        )}
      </div>
      {forum.children?.map(child => (
        <ForumTreeNode key={child.id} forum={child} />
      ))}
    </div>
  );
}

export function Component() {
  const [forums, setForums] = useState<ForumDTO[]>([]);
  const [hotPosts, setHotPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 先加载板块，再基于第一个板块加载热门帖子
    listForums()
      .then(async forumsData => {
        setForums(forumsData);
        if (forumsData && forumsData.length > 0) {
          try {
            const postsData = await getForumPosts(forumsData[0].id, 0, 5);
            setHotPosts(postsData?.content || []);
          } catch (err) {
            console.error(err);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: 20 }}>加载中...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>社区论坛</h1>
        <div>
          <NotificationBadge />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h2>板块分区</h2>
        <div style={{ border: '1px solid #ddd', borderRadius: 4 }}>
          {forums.map(forum => (
            <ForumTreeNode key={forum.id} forum={forum} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h2>热门帖子</h2>
        <div>
          {hotPosts.map(post => (
            <div
              key={post.id}
              onClick={() => navigate(`/forum/${post.forumId}/post/${post.id}`)}
              style={{
                padding: 15,
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <h3 style={{ margin: 0 }}>{post.title}</h3>
              <div style={{ marginTop: 8, color: '#999', fontSize: 14 }}>
                {post.authorName} · {post.viewCount} 浏览 · {post.replyCount} 回复
                {post.isSticky && (
                  <span style={{ color: '#ff4d4f', marginLeft: 10 }}>【置顶】</span>
                )}
                {post.isEssence && (
                  <span style={{ color: '#faad14', marginLeft: 5 }}>【精华】</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
