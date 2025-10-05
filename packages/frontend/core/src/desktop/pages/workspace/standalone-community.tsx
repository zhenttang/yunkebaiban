import { useParams, useNavigate } from 'react-router-dom';
import { AffineOtherPageLayout } from '@affine/component/affine-other-page-layout';
import { Button } from '@affine/component';
import { ArrowLeftSmallIcon } from '@blocksuite/icons/rc';

import { CommunityDocDetailPage } from './community/detail';
import { CommunityDocList } from './community/components/community-doc-list';

/**
 * 独立的社区详情页面组件
 * 用于处理工作空间权限不足时的社区访问
 */
export const StandaloneCommunityPage = () => {
  const { workspaceId, docId } = useParams<{ 
    workspaceId: string; 
    docId?: string; 
  }>();
  const navigate = useNavigate();

  console.log('🏛️ 独立社区页面加载:', { workspaceId, docId });

  if (!workspaceId) {
    return (
      <AffineOtherPageLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>工作空间ID不存在</h2>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </AffineOtherPageLayout>
    );
  }

  if (docId) {
    // 使用新的详情页组件
    return <CommunityDocDetailPage />;
  }

  // 社区列表页
  return (
    <AffineOtherPageLayout>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* 社区头部 */}
        <div style={{
          marginBottom: '32px',
          borderBottom: '1px solid var(--affine-border-color)',
          paddingBottom: '20px'
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--affine-text-primary-color)'
          }}>
            社区
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: 'var(--affine-text-secondary-color)'
          }}>
            浏览和发现社区分享的文档
          </p>
        </div>

        {/* 动态导入社区列表组件 */}
        <CommunityDocList workspaceId={workspaceId!} />
      </div>
    </AffineOtherPageLayout>
  );
};