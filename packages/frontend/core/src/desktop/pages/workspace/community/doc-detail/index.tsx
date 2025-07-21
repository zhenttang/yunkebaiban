import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@affine/component';
import { ArrowLeftSmallIcon } from '@blocksuite/icons/rc';

import { ViewBody, ViewHeader, ViewTitle } from '../../../../../modules/workbench';
import { useCommunityDocDetail } from '../hooks/use-community';
import { formatDate } from '../utils';
import * as styles from '../community.css';

export const CommunityDocDetailPage = () => {
  const { workspaceId, docId } = useParams<{ workspaceId: string; docId: string }>();
  const navigate = useNavigate();

  // 使用新的详情页Hook
  const { doc, loading, error, refresh } = useCommunityDocDetail(
    workspaceId || '', 
    docId || ''
  );

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}/community`);
  };

  const handleRefresh = () => {
    console.log('🔄 手动刷新文档详情');
    refresh();
  };

  if (loading) {
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
          <ViewTitle title="加载中..." />
        </ViewHeader>
        <ViewBody>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: 'var(--affine-text-secondary-color)'
          }}>
            正在加载文档详情...
          </div>
        </ViewBody>
      </div>
    );
  }

  if (error) {
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
          <ViewTitle title="加载失败" />
        </ViewHeader>
        <ViewBody>
          <div className={styles.communityContent}>
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--affine-text-secondary-color)'
            }}>
              <div style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--affine-error-color)' }}>
                {error}
              </div>
              <div style={{ marginBottom: '24px' }}>
                该文档可能已被删除或您没有访问权限
              </div>
              <Button onClick={handleRefresh} style={{ marginRight: '12px' }}>
                重试
              </Button>
              <Button variant="plain" onClick={handleBack}>
                返回列表
              </Button>
            </div>
          </div>
        </ViewBody>
      </div>
    );
  }

  if (!doc) {
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
          <ViewTitle title="文档不存在" />
        </ViewHeader>
        <ViewBody>
          <div className={styles.communityContent}>
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--affine-text-secondary-color)'
            }}>
              <div style={{ marginBottom: '24px' }}>
                找不到指定的文档
              </div>
              <Button variant="plain" onClick={handleBack}>
                返回列表
              </Button>
            </div>
          </div>
        </ViewBody>
      </div>
    );
  }

  const PERMISSION_LABELS = {
    PUBLIC: '公开',
    COLLABORATOR: '协作者',
    ADMIN: '管理员',
    CUSTOM: '自定义',
  } as const;

  const permissionLabel = PERMISSION_LABELS[doc.permission] || '未知';

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
          {/* 文档信息头部 */}
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px',
            backgroundColor: 'var(--affine-background-secondary-color)',
            borderRadius: '8px',
            border: '1px solid var(--affine-border-color)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px' 
            }}>
              <div>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--affine-text-secondary-color)',
                  marginBottom: '4px' 
                }}>
                  作者: {doc.authorName}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--affine-text-secondary-color)' 
                }}>
                  发布时间: {formatDate(new Date(doc.sharedAt))}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: doc.permission === 'PUBLIC' ? 'var(--affine-tag-green)' : 'var(--affine-tag-blue)',
                  color: 'white',
                  fontSize: '12px',
                  borderRadius: '4px',
                  fontWeight: 500
                }}>
                  {permissionLabel}
                </span>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--affine-text-secondary-color)' 
                }}>
                  浏览 {doc.viewCount} 次
                </div>
              </div>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--affine-text-primary-color)',
              lineHeight: '1.5' 
            }}>
              {doc.description}
            </div>
          </div>
          
          {/* 文档内容区域 */}
          <div style={{
            border: '1px solid var(--affine-border-color)',
            borderRadius: '8px',
            padding: '24px',
            backgroundColor: 'var(--affine-background-primary-color)',
            minHeight: '400px'
          }}>
            <div style={{
              borderBottom: '1px solid var(--affine-border-color)',
              paddingBottom: '16px',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--affine-text-primary-color)'
              }}>
                {doc.title}
              </h3>
            </div>
            
            <div style={{
              color: 'var(--affine-text-primary-color)',
              lineHeight: '1.6',
              fontSize: '14px'
            }}>
              <p>这里将显示实际的文档内容。在真实实现中，这里会集成BlockSuite编辑器来显示文档内容。</p>
              <p>文档内容会以只读模式展示，用户可以查看但不能编辑。内容将包括:</p>
              <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
                <li>完整的文档结构和格式</li>
                <li>图片、表格等富媒体内容</li>
                <li>代码块和公式等特殊内容</li>
                <li>文档的所有原始样式</li>
              </ul>
              <p>当前显示的是模拟内容，确保在开发阶段不会遇到权限问题。</p>
              
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: 'var(--affine-background-secondary-color)',
                borderRadius: '6px',
                border: '1px solid var(--affine-border-color)'
              }}>
                <strong>开发说明：</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--affine-text-secondary-color)' }}>
                  此页面现已使用模拟数据，避免了权限验证问题。列表和详情页面现在使用相同的数据源，
                  确保用户体验的一致性。
                </p>
              </div>
            </div>
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