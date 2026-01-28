import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { YunkeOtherPageLayout } from '@yunke/component/yunke-other-page-layout';
import { Button } from '@yunke/component';
import { ArrowLeftSmallIcon } from '@blocksuite/icons/rc';
import { DocumentCard } from '@yunke/core/components/community-ui';
import type { CommunityDocument } from '@yunke/core/components/community-ui/types';

import { useCommunityDocuments } from './community/hooks/use-community-documents';
import { useCommunityDocument } from './community/hooks/use-community-document';
import { mapDocToUiDocument } from './community/utils';
import { recordView } from './community/api';

const PAGE_SIZE = 20;

const StandaloneCommunityList = ({ workspaceId }: { workspaceId: string }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { docs, total, totalPages, loading, error, refresh } = useCommunityDocuments({
    page,
    size: PAGE_SIZE,
    search: debouncedSearch,
  });

  const documents = useMemo<CommunityDocument[]>(() => {
    return docs.map(mapDocToUiDocument);
  }, [docs]);

  const handleNavigate = async (docId: string) => {
    try {
      await recordView(docId, { userAgent: navigator.userAgent });
    } catch (err) {
      console.warn('记录浏览失败', err);
    }
    navigate(`/workspace/${workspaceId}/community/${docId}`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700 }}>社区</h1>
          <p style={{ margin: 0, color: 'var(--yunke-text-secondary-color)', fontSize: '14px' }}>
            浏览和发现社区分享的文档
          </p>
        </div>
        <input
          style={{
            width: '260px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--yunke-border-color)',
            backgroundColor: 'var(--yunke-background-secondary-color)',
            color: 'var(--yunke-text-primary-color)',
          }}
          placeholder="搜索文档标题..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      {loading && documents.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--yunke-text-secondary-color)' }}>
          加载中...
        </div>
      )}

      {error && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--yunke-error-color)' }}>
          <div style={{ marginBottom: '12px' }}>加载社区内容失败：{error}</div>
          <Button onClick={() => refresh()}>重试</Button>
        </div>
      )}

      {!loading && !error && documents.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--yunke-text-secondary-color)' }}>
          暂无社区文档
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {documents.map(doc => (
          <DocumentCard key={doc.id} document={doc} onClick={handleNavigate} onView={handleNavigate} />
        ))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: '24px',
          }}
        >
          <Button disabled={page === 0} onClick={() => setPage(prev => Math.max(prev - 1, 0))}>
            上一页
          </Button>
          <span style={{ color: 'var(--yunke-text-secondary-color)', fontSize: '14px' }}>
            第 {page + 1} / {totalPages} 页 · 共 {total} 篇文档
          </span>
          <Button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(prev => (prev + 1 >= totalPages ? prev : prev + 1))}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};

const StandaloneCommunityDetail = ({ workspaceId, docId }: { workspaceId: string; docId: string }) => {
  const navigate = useNavigate();
  const { doc, loading, error, refresh } = useCommunityDocument({ docId });
  const uiDoc = useMemo(() => (doc ? mapDocToUiDocument(doc) : null), [doc]);

  useEffect(() => {
    void recordView(docId, { userAgent: navigator.userAgent }).catch(err => {
      console.warn('记录浏览失败', err);
    });
  }, [docId]);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px' }}>
      <Button
        variant="plain"
        size="default"
        onClick={() => navigate(`/workspace/${workspaceId}/community`)}
        style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        <ArrowLeftSmallIcon /> 返回社区
      </Button>

      {loading && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--yunke-text-secondary-color)' }}>
          文档加载中...
        </div>
      )}

      {error && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--yunke-error-color)' }}>
          <div style={{ marginBottom: '12px' }}>加载失败：{error}</div>
          <Button onClick={() => refresh()}>重试</Button>
        </div>
      )}

      {!loading && !error && !uiDoc && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--yunke-text-secondary-color)' }}>
          未找到该社区文档
        </div>
      )}

      {uiDoc && <DocumentCard document={uiDoc} showActions={false} />}
    </div>
  );
};

/**
 * 独立的社区页面入口
 * 当工作空间受限时提供社区访问能力
 */
export const StandaloneCommunityPage = () => {
  const { workspaceId, docId } = useParams<{ workspaceId: string; docId?: string }>();
  const navigate = useNavigate();

  if (!workspaceId) {
    return (
      <YunkeOtherPageLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ marginBottom: '16px' }}>工作空间ID不存在</h2>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </YunkeOtherPageLayout>
    );
  }

  return (
    <YunkeOtherPageLayout>
      {docId ? (
        <StandaloneCommunityDetail workspaceId={workspaceId} docId={docId} />
      ) : (
        <StandaloneCommunityList workspaceId={workspaceId} />
      )}
    </YunkeOtherPageLayout>
  );
};
