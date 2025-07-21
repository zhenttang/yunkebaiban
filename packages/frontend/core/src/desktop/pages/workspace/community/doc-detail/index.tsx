import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@affine/component';
import { ArrowLeftSmallIcon } from '@blocksuite/icons/rc';
import { useEffect, useState } from 'react';

import { ViewBody, ViewHeader, ViewTitle } from '../../../../../modules/workbench';
import type { CommunityDoc } from '../types';
import * as styles from '../community.css';

export const CommunityDocDetailPage = () => {
  const { workspaceId, docId } = useParams<{ workspaceId: string; docId: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<CommunityDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载文档详情
    const loadDocDetail = async () => {
      setLoading(true);
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟文档数据
      const mockDoc: CommunityDoc = {
        id: docId!,
        title: '项目开发指南',
        description: '这是一个详细的项目开发指南，包含了从环境搭建到部署上线的全流程说明。',
        authorId: 'user1',
        authorName: '张三',
        sharedAt: new Date().toISOString(),
        viewCount: 25,
        permission: 'PUBLIC' as const,
        workspaceId: workspaceId!,
      };
      
      setDoc(mockDoc);
      setLoading(false);
    };

    if (docId && workspaceId) {
      loadDocDetail();
    }
  }, [docId, workspaceId]);

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}/community`);
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!doc) {
    return <div>文档不存在</div>;
  }

  return (
    <div className={styles.communityContainer}>
      <ViewHeader>
        <Button 
          variant="plain" 
          size="small" 
          onClick={handleBack}
          style={{ marginRight: '8px' }}
        >
          <ArrowLeftSmallIcon />
        </Button>
        <ViewTitle title={doc.title} />
      </ViewHeader>
      <ViewBody>
        <div className={styles.communityContent}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--affine-text-secondary-color)',
              marginBottom: '8px' 
            }}>
              作者: {doc.authorName} | 浏览: {doc.viewCount} 次
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--affine-text-secondary-color)' 
            }}>
              {doc.description}
            </div>
          </div>
          
          <div style={{
            border: '1px solid var(--affine-border-color)',
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: 'var(--affine-background-secondary-color)',
            minHeight: '400px'
          }}>
            <h3>文档内容</h3>
            <p>这里将显示实际的文档内容。在真实实现中，这里会集成BlockSuite编辑器来显示文档内容。</p>
            <p>文档内容会以只读模式展示，用户可以查看但不能编辑。</p>
          </div>
        </div>
      </ViewBody>
    </div>
  );
};

export const Component = () => {
  return <CommunityDocDetailPage />;
};

export default CommunityDocDetailPage;