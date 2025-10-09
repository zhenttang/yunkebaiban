import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { quickSearch } from '../forum-api';
import type { SearchResultDTO } from '../types';

export function Component() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResultDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const keyword = searchParams.get('keyword') || '';

  useEffect(() => {
    if (!keyword) return;
    setLoading(true);
    quickSearch(keyword, 'ALL')
      .then(setResults)
      .catch(err => {
        console.error(err);
        alert('搜索失败');
      })
      .finally(() => setLoading(false));
  }, [keyword]);

  const { postResults, forumResults } = useMemo(() => {
    const postResults = results.filter(r => r.type === 'POST');
    const forumResults = results.filter(r => r.type === 'FORUM');
    return { postResults, forumResults };
  }, [results]);

  const highlightHtml = (fallback: string, highlight?: string) => {
    return { __html: highlight || fallback };
  };

  if (!keyword) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <h2>请输入搜索关键词</h2>
      </div>
    );
  }

  if (loading) {
    return <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>搜索中...</div>;
  }

  const empty = postResults.length === 0 && forumResults.length === 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h2>搜索结果: "{keyword}"</h2>

      {empty ? (
        <div style={{ marginTop: 20, color: '#999' }}>未找到相关内容</div>
      ) : (
        <div style={{ marginTop: 10 }}>
          {postResults.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '10px 0' }}>帖子</h3>
              {postResults.map(p => (
                <div
                  key={`post-${p.id}`}
                  onClick={() => navigate(`/forum/${p.forumId}/post/${p.id}`)}
                  style={{ padding: 16, borderBottom: '1px solid #eee', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, padding: '2px 6px', background: '#e6f4ff', color: '#1677ff', borderRadius: 2 }}>帖子</span>
                    <strong>{p.title}</strong>
                  </div>
                  {p.highlight ? (
                    <div
                      style={{ marginTop: 6, color: '#666', background: '#fffbe6', borderLeft: '3px solid #faad14', padding: 8 }}
                      dangerouslySetInnerHTML={highlightHtml('', p.highlight)}
                    />
                  ) : p.content ? (
                    <div style={{ marginTop: 6, color: '#666' }}>{p.content.slice(0, 150)}{(p.content.length > 150) ? '...' : ''}</div>
                  ) : null}
                  <div style={{ marginTop: 6, color: '#999', fontSize: 12 }}>
                    {p.forumName ? `板块: ${p.forumName} · ` : ''}
                    {p.authorName ? `作者: ${p.authorName} · ` : ''}
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {forumResults.length > 0 && (
            <div>
              <h3 style={{ margin: '10px 0' }}>板块</h3>
              {forumResults.map(f => (
                <div
                  key={`forum-${f.id}`}
                  onClick={() => navigate(`/forum/${String(f.forumId ?? f.id)}`)}
                  style={{ padding: 16, borderBottom: '1px solid #eee', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, padding: '2px 6px', background: '#f6ffed', color: '#52c41a', borderRadius: 2 }}>板块</span>
                    <strong>{f.title}</strong>
                  </div>
                  {f.highlight ? (
                    <div
                      style={{ marginTop: 6, color: '#666' }}
                      dangerouslySetInnerHTML={highlightHtml('', f.highlight)}
                    />
                  ) : f.content ? (
                    <div style={{ marginTop: 6, color: '#666' }}>{f.content}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
