import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@yunke/component';
import { ArrowLeftSmallIcon } from '@blocksuite/icons/rc';

import { ViewBody, ViewHeader, ViewTitle } from '../../../../../modules/workbench';
import { DocumentCard } from '@yunke/core/components/community-ui';

import * as styles from '../community.css';
import { useCommunityDocument } from '../hooks/use-community-document';
import { mapDocToUiDocument } from '../utils';
import { recordView } from '../api';

const resolveWorkspaceFromPath = () => {
  const match = window.location.pathname.match(/\/workspace\/([^/]+)/);
  return match ? match[1] : null;
};

export const CommunityDocDetailPage = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { doc, loading, error, refresh } = useCommunityDocument({ docId });

  useEffect(() => {
    if (!docId) {
      return;
    }
    void recordView(docId, { userAgent: navigator.userAgent }).catch(err => {
      console.warn('记录文档浏览失败', err);
    });
  }, [docId]);

  const uiDoc = useMemo(() => {
    return doc ? mapDocToUiDocument(doc) : null;
  }, [doc]);

  const handleBack = () => {
    const workspaceId = doc?.workspaceId ?? resolveWorkspaceFromPath();
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/community`);
    } else {
      navigate('/community');
    }
  };

  const renderBody = () => {
    if (loading) {
      return <div className={styles.status}>文档加载中...</div>;
    }

    if (error) {
      return (
        <div className={styles.status}>
          <div style={{ marginBottom: '12px' }}>加载失败：{error}</div>
          <Button onClick={() => refresh()}>重试</Button>
        </div>
      );
    }

    if (!uiDoc) {
      return <div className={styles.empty}>未找到该社区文档</div>;
    }

    return (
      <div className={styles.grid} style={{ gridTemplateColumns: 'minmax(320px, 1fr)' }}>
        <DocumentCard document={uiDoc} showActions={false} />
      </div>
    );
  };

  return (
    <>
      <ViewHeader>
        <Button
          variant="plain"
          size="small"
          onClick={handleBack}
          style={{ marginRight: '8px' }}
        >
          <ArrowLeftSmallIcon />
        </Button>
        <ViewTitle title={uiDoc?.title ?? '社区文档详情'} />
      </ViewHeader>
      <ViewBody>
        <div className={styles.page}>
          <div className={styles.content}>{renderBody()}</div>
        </div>
      </ViewBody>
    </>
  );
};

export const Component = () => <CommunityDocDetailPage />;

export default CommunityDocDetailPage;
