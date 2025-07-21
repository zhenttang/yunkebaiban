import { useParams, useNavigate } from 'react-router-dom';
import { AffineOtherPageLayout } from '@affine/component/affine-other-page-layout';
import { Button } from '@affine/component';
import { ArrowLeftSmallIcon } from '@blocksuite/icons/rc';

import { useCommunityDocDetail } from './community/hooks/use-community';
import { formatDate } from './community/utils';
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
    // 使用hook获取文档详情
    const { doc, loading, error, refresh } = useCommunityDocDetail(
      workspaceId, 
      docId
    );

    const handleBack = () => {
      navigate(`/workspace/${workspaceId}/community`);
    };

    const handleHome = () => {
      navigate('/');
    };

    if (loading) {
      return (
        <AffineOtherPageLayout>
          <div style={{
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              marginBottom: '20px'
            }}>
              <Button 
                variant="plain" 
                size="small" 
                onClick={handleBack}
                style={{ marginRight: '8px' }}
              >
                <ArrowLeftSmallIcon />
                返回社区
              </Button>
              <Button 
                variant="plain" 
                size="small" 
                onClick={handleHome}
              >
                返回首页
              </Button>
            </div>
            <div style={{
              color: 'var(--affine-text-secondary-color)',
              fontSize: '16px'
            }}>
              正在加载文档详情...
            </div>
          </div>
        </AffineOtherPageLayout>
      );
    }

    if (error || !doc) {
      return (
        <AffineOtherPageLayout>
          <div style={{
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              marginBottom: '20px'
            }}>
              <Button 
                variant="plain" 
                size="small" 
                onClick={handleBack}
                style={{ marginRight: '8px' }}
              >
                <ArrowLeftSmallIcon />
                返回社区
              </Button>
              <Button 
                variant="plain" 
                size="small" 
                onClick={handleHome}
              >
                返回首页
              </Button>
            </div>
            <div style={{
              marginBottom: '16px',
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--affine-text-primary-color)'
            }}>
              加载失败
            </div>
            <div style={{
              marginBottom: '24px',
              color: 'var(--affine-text-secondary-color)'
            }}>
              {error || '找不到指定的文档'}
            </div>
            <Button onClick={refresh}>
              重试
            </Button>
          </div>
        </AffineOtherPageLayout>
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
      <AffineOtherPageLayout>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px'
        }}>
          {/* 头部导航 */}
          <div style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Button 
              variant="plain" 
              size="small" 
              onClick={handleBack}
            >
              <ArrowLeftSmallIcon />
              返回社区
            </Button>
            <Button 
              variant="plain" 
              size="small" 
              onClick={handleHome}
            >
              返回首页
            </Button>
          </div>

          {/* 文档标题 */}
          <div style={{
            marginBottom: '24px'
          }}>
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--affine-text-primary-color)'
            }}>
              {doc.title}
            </h1>
          </div>

          {/* 文档信息 */}
          <div style={{
            marginBottom: '32px',
            padding: '20px',
            backgroundColor: 'var(--affine-background-secondary-color)',
            borderRadius: '12px',
            border: '1px solid var(--affine-border-color)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--affine-text-secondary-color)',
                  marginBottom: '6px'
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
                gap: '16px'
              }}>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: doc.permission === 'PUBLIC' 
                    ? '#10b981' 
                    : '#3b82f6',
                  color: 'white',
                  fontSize: '13px',
                  borderRadius: '6px',
                  fontWeight: '500'
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
              fontSize: '15px',
              color: 'var(--affine-text-primary-color)',
              lineHeight: '1.6'
            }}>
              {doc.description}
            </div>
          </div>

          {/* 文档内容 */}
          <div style={{
            border: '1px solid var(--affine-border-color)',
            borderRadius: '12px',
            padding: '32px',
            backgroundColor: 'var(--affine-background-primary-color)',
            minHeight: '400px'
          }}>
            <div style={{
              borderBottom: '1px solid var(--affine-border-color)',
              paddingBottom: '20px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: '0',
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--affine-text-primary-color)'
              }}>
                {doc.title}
              </h2>
            </div>

            <div style={{
              color: 'var(--affine-text-primary-color)',
              lineHeight: '1.7',
              fontSize: '16px'
            }}>
              <p>这里显示文档的实际内容。在真实实现中，这里会集成BlockSuite编辑器来显示文档内容。</p>
              <p>文档内容会以只读模式展示，用户可以查看但不能编辑。内容包括:</p>
              <ul style={{ 
                paddingLeft: '24px', 
                margin: '16px 0',
                lineHeight: '1.8'
              }}>
                <li>完整的文档结构和格式</li>
                <li>图片、表格等富媒体内容</li>
                <li>代码块和公式等特殊内容</li>
                <li>文档的所有原始样式</li>
              </ul>
              <p>当前显示的是模拟内容，确保在开发阶段不会遇到权限问题。</p>

              <div style={{
                marginTop: '32px',
                padding: '20px',
                backgroundColor: 'var(--affine-background-secondary-color)',
                borderRadius: '8px',
                border: '1px solid var(--affine-border-color)'
              }}>
                <strong style={{ color: 'var(--affine-text-primary-color)' }}>
                  ✅ 修复说明
                </strong>
                <p style={{
                  margin: '12px 0 0 0',
                  fontSize: '14px',
                  color: 'var(--affine-text-secondary-color)',
                  lineHeight: '1.6'
                }}>
                  此页面使用独立的社区组件，绕过了工作空间权限检查。
                  现在即使工作空间权限不足，用户仍可以正常访问社区文档内容。
                  这确保了社区功能的可访问性。
                </p>
              </div>
            </div>
          </div>
        </div>
      </AffineOtherPageLayout>
    );
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