import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@yunke/component';

import { ViewBody } from '../../../../modules/workbench';
import { DocumentCard } from '@yunke/core/components/community-ui';
import type { CommunityDocument as CommunityUiDocument } from '@yunke/core/components/community-ui/types';

import * as styles from './community.css';
import { useCommunityDocuments } from './hooks/use-community-documents';
import { mapDocToUiDocument } from './utils';
import { recordView } from './api';

const PAGE_SIZE = 20;

export const CommunityPage = () => {
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

  const documents = useMemo<CommunityUiDocument[]>(() => {
    return docs.map(mapDocToUiDocument);
  }, [docs]);

  const resolveWorkspacePath = () => {
    const match = window.location.pathname.match(/\/workspace\/([^/]+)/);
    return match ? match[1] : null;
  };

  const handleView = async (docId: string) => {
    try {
      await recordView(docId, { userAgent: navigator.userAgent });
    } catch (err) {
      console.warn('记录浏览量失败', err);
    }

    const workspaceId = resolveWorkspacePath();
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/community/${docId}`);
    } else {
      navigate(`/community/${docId}`);
    }
  };

  const handlePrev = () => {
    setPage(prev => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setPage(prev => (prev + 1 >= totalPages ? prev : prev + 1));
  };

  const renderContent = () => {
    if (loading && documents.length === 0) {
      return <div className={styles.status}>加载中...</div>;
    }

    if (error) {
      return (
        <div className={styles.status}>
          <div style={{ marginBottom: '12px' }}>加载社区内容失败：{error}</div>
          <Button onClick={() => refresh()}>重试</Button>
        </div>
      );
    }

    if (!loading && documents.length === 0) {
      return <div className={styles.empty}>暂无社区文档</div>;
    }

    return (
      <>
        <div className={styles.grid}>
          {documents.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onClick={handleView}
              onView={handleView}
            />
          ))}
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button disabled={page === 0} onClick={handlePrev}>
              上一页
            </Button>
            <span className={styles.pageInfo}>
              第 {page + 1} / {totalPages} 页 · 共 {total} 篇文档
            </span>
            <Button disabled={page + 1 >= totalPages} onClick={handleNext}>
              下一页
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <ViewBody>
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>社区</h1>
              <p className={styles.subtitle}>发现团队共享的精彩文档</p>
            </div>
            <input
              className={styles.searchInput}
              placeholder="搜索文档标题..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          {renderContent()}
        </div>
      </div>
    </ViewBody>
  );
};

export const Component = () => <CommunityPage />;

export default CommunityPage;
