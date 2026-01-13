import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@yunke/component';
import { ViewBody } from '../../../../../modules/workbench';
import { listForums } from '../forum-api';
import type { ForumDTO } from '../types';
import * as styles from './forum-home.css';
// import { NotificationBadge } from '../components/NotificationBadge'; // 暂时注释，避免500错误
// import { getForumPosts } from '../forum-api'; // 暂时注释，避免500错误
// import type { PostDTO } from '../types'; // 暂时注释

// 递归渲染板块树
function formatLastActivity(updatedAt?: string): string {
  if (!updatedAt) return '';
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  return updated.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function getForumIcon(forum: ForumDTO): string {
  // 优先使用后端提供的图标（若存在）
  const maybeIcon = (forum as unknown as { icon?: string }).icon;
  if (maybeIcon) return String(maybeIcon);
  const name = forum.name || '';
  if (name.includes('公告') || name.includes('通知')) return '📌';
  if (name.includes('讨论') || name.includes('交流')) return '💬';
  if (name.includes('技术') || name.includes('开发')) return '🛠️';
  if (name.includes('新手') || name.includes('报到')) return '👋';
  if (name.includes('灌水') || name.includes('闲聊')) return '💭';
  return '📁';
}

const HighlightText = memo(function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  const parts = useMemo(() => {
    if (!highlight.trim()) return [text];
    return text.split(new RegExp(`(${highlight})`, 'gi'));
  }, [text, highlight]);
  if (!highlight.trim()) return <>{text}</>;
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={index} className={styles.highlight}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
});

const ForumTreeNode = memo(function ForumTreeNode({ forum, level = 0, searchQuery = '' }: { forum: ForumDTO; level?: number; searchQuery?: string }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = useMemo(() => forum.children && forum.children.length > 0, [forum.children]);
  const icon = useMemo(() => getForumIcon(forum), [forum]);
  const lastActivity = useMemo(() => formatLastActivity((forum as any).updatedAt), [(forum as any).updatedAt]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) setCollapsed(s => !s);
  }, [hasChildren]);

  const handleNavigate = useCallback(() => {
    navigate(`/forum/${forum.id}`);
  }, [navigate, forum.id]);

  return (
    <div className={styles.forumItem} data-level={level}>
      <div className={styles.forumRow} onClick={handleNavigate} role="button" tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavigate(); } }}>
        <div className={styles.forumMain}>
          {hasChildren ? (
            <button className={styles.collapseBtn} onClick={handleToggle} data-collapsed={collapsed} aria-label={collapsed ? '展开子板块' : '折叠子板块'} aria-expanded={!collapsed}>
              <span className={styles.collapseIcon} />
            </button>
          ) : (
            <div className={styles.collapsePlaceholder} />
          )}
          <span className={styles.forumIcon} role="img" aria-label="板块图标">{icon}</span>
          <div className={styles.forumInfo}>
            <h3 className={styles.forumName}><HighlightText text={forum.name} highlight={searchQuery} /></h3>
            {forum.description && (
              <p className={styles.forumDesc}><HighlightText text={forum.description} highlight={searchQuery} /></p>
            )}
          </div>
        </div>
        <div className={styles.forumStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{forum.postCount}</span>
            <span className={styles.statLabel}>帖子</span>
          </div>
          <div className={styles.statDivider}>·</div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{forum.topicCount}</span>
            <span className={styles.statLabel}>主题</span>
          </div>
        </div>
        <div className={styles.forumActivity}>
          <time className={styles.activityTime} dateTime={(forum as any).updatedAt}>{lastActivity}</time>
        </div>
      </div>
      {hasChildren && !collapsed && (
        <div className={styles.forumChildren}>
          {forum.children!.map(child => (
            <ForumTreeNode key={child.id} forum={child} level={level + 1} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
});

export function Component() {
  const [forums, setForums] = useState<ForumDTO[]>([]);
  // const [hotPosts, setHotPosts] = useState<PostDTO[]>([]); // 暂时注释
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // const navigate = useNavigate(); // 暂时不需要

  useEffect(() => {
    console.log('🏛️ [论坛主页] 开始加载板块列表...');
    
    // 添加超时控制
    const timeout = setTimeout(() => {
      console.error('❌ [论坛主页] 加载超时');
      setError('加载超时，请检查网络连接或刷新页面');
      setLoading(false);
    }, 10000); // 10秒超时

    listForums()
      .then(data => {
        console.log('✅ [论坛主页] 板块列表加载成功:', data?.length, '个板块');
        setForums(data);
        clearTimeout(timeout);
      })
      .catch(err => {
        console.error('❌ [论坛主页] 加载板块失败:', err);
        setError(err instanceof Error ? err.message : String(err));
        clearTimeout(timeout);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => clearTimeout(timeout);
  }, []);

  // Ctrl/Cmd + K 聚焦搜索
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input.' + styles.search);
        input?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (loading) {
    return (
      <ViewBody>
        <div className={styles.page}>
          <div className={styles.content}>
            <div className={styles.container}>
            <div className={styles.skeletonList}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.skeletonRow}>
                  <div className={styles.collapsePlaceholder} />
                  <div className={styles.skeletonBlock} style={{ width: 24, height: 24, borderRadius: 6 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.skeletonBlock} style={{ width: '30%', marginBottom: 8 }} />
                    <div className={styles.skeletonBlock} style={{ width: '60%' }} />
                  </div>
                  <div className={styles.skeletonBlock} style={{ width: 80 }} />
                  <div className={styles.skeletonBlock} style={{ width: 60 }} />
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </ViewBody>
    );
  }

  if (error) {
    return (
      <ViewBody>
        <div className={styles.page}>
          <div className={styles.content}>
            <div className={styles.container}>
            <div className={styles.status}>
              <h2 style={{ marginTop: 0 }}>加载失败</h2>
              <p>错误信息: {error}</p>
              <p>请检查：</p>
              <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                <li>后端服务是否正常运行 (http://localhost:8080)</li>
                <li>数据库是否已初始化</li>
                <li>网络连接是否正常</li>
              </ul>
              <div style={{ marginTop: 12 }}>
                <Button onClick={() => window.location.reload()}>重新加载</Button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </ViewBody>
    );
  }

  if (forums.length === 0) {
    return (
      <ViewBody>
        <div className={styles.page}>
          <div className={styles.content}>
            <div className={styles.container}>
            <div className={styles.status}>
              <h2 style={{ marginTop: 0 }}>暂无板块</h2>
              <p>论坛还没有创建任何板块，请联系管理员创建板块。</p>
            </div>
            </div>
          </div>
        </div>
      </ViewBody>
    );
  }

  return (
    <ViewBody>
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>社区论坛</h1>
              <p className={styles.subtitle}>官方公告、讨论与交流</p>
            </div>
            <div className={styles.searchContainer}>
              <div className={styles.searchInputWrapper}>
                <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input
                  className={styles.search}
                  placeholder="搜索板块... (Ctrl+K)"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label="搜索板块"
                  aria-describedby="search-hint"
                />
                <span id="search-hint" className={styles.srOnly}>输入关键词搜索板块名称或描述</span>
                {query && (
                  <span className={styles.matchCount}>{
                    forums.filter(f => (f.name + (f.description || '')).toLowerCase().includes(query.toLowerCase())).length
                  } / {forums.length}</span>
                )}
                {query && (
                  <button className={styles.clearBtn} onClick={() => setQuery('')} aria-label="清除搜索">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {(() => {
            const filteredForums = forums.filter(f =>
              (f.name + (f.description || '')).toLowerCase().includes(query.toLowerCase())
            );
            if (query && filteredForums.length === 0) {
              return (
                <div className={styles.forumList}>
                  <div className={styles.emptySearch}>
                    <span className={styles.emptyIcon}>🔍</span>
                    <p className={styles.emptyText}>未找到匹配"{query}"的板块</p>
                    <button className={styles.clearSearch} onClick={() => setQuery('')}>
                      清除搜索
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <main id="main-content" className={styles.forumList} role="main">
                {filteredForums.map(forum => (
                  <ForumTreeNode key={forum.id} forum={forum} level={0} searchQuery={query} />
                ))}
              </main>
            );
          })()}
          </div>
        </div>
      </div>
    </ViewBody>
  );
}
