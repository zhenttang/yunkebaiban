import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@affine/component';

import { ViewBody } from '../../../../modules/workbench';
import { PaymentTestPage } from '../../../../components/payment-test-page';
import * as styles from './community.css';

// 全局社区模拟数据
const mockGlobalDocs = [
  {
    id: '1',
    title: '开源项目协作指南',
    description: '分享如何在开源项目中高效协作的经验',
    authorId: 'user1',
    authorName: '张三',
    sharedAt: new Date().toISOString(),
    viewCount: 156,
    permission: 'PUBLIC' as const,
    workspaceId: 'workspace1',
  },
  {
    id: '2',
    title: 'React最佳实践总结',
    description: '从项目实战中总结的React开发最佳实践',
    authorId: 'user2',
    authorName: '李四',
    sharedAt: new Date(Date.now() - 86400000).toISOString(),
    viewCount: 89,
    permission: 'PUBLIC' as const,
    workspaceId: 'workspace2',
  },
  {
    id: '3',
    title: '设计系统构建经验',
    description: '如何从零开始构建一个完整的设计系统',
    authorId: 'user3',
    authorName: '王五',
    sharedAt: new Date(Date.now() - 172800000).toISOString(),
    viewCount: 234,
    permission: 'PUBLIC' as const,
    workspaceId: 'workspace3',
  },
];

export const CommunityPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showPaymentTest, setShowPaymentTest] = useState(false);

  useEffect(() => {
    console.log('🎯 社区页面已加载, workspaceId:', workspaceId || '全局模式');
  }, [workspaceId]);

  console.log('✅ 渲染社区页面, workspaceId:', workspaceId || '全局模式');

  const filteredDocs = mockGlobalDocs.filter(doc => 
    doc.title.includes(search) || 
    doc.description.includes(search) ||
    doc.authorName.includes(search)
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleViewDoc = (doc: typeof mockGlobalDocs[0]) => {
    console.log('查看文档:', doc);
    // 跳转到社区文档详情页
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/community/${doc.id}`);
    } else {
      // 如果没有workspaceId，使用当前URL中的workspaceId
      const currentPath = window.location.pathname;
      const workspaceMatch = currentPath.match(/\/workspace\/([^\/]+)/);
      if (workspaceMatch) {
        const currentWorkspaceId = workspaceMatch[1];
        navigate(`/workspace/${currentWorkspaceId}/community/${doc.id}`);
      } else {
        console.error('无法获取workspaceId');
      }
    }
  };

  const handleShareDoc = (doc: typeof mockGlobalDocs[0]) => {
    console.log('分享文档:', doc);
    // 这里可以打开分享弹窗或复制链接
    const shareText = `推荐文档: ${doc.title}\n作者: ${doc.authorName}\n${doc.description}`;
    if (navigator.share) {
      navigator.share({
        title: doc.title,
        text: shareText,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('文档信息已复制到剪贴板！');
      }).catch(() => {
        alert(`分享文档: ${doc.title}`);
      });
    }
  };

  return (
    <ViewBody>
      {showPaymentTest ? (
        <div>
          <div style={{ padding: '20px', borderBottom: `1px solid ${styles.communityContent}` }}>
            <Button 
              onClick={() => setShowPaymentTest(false)}
              variant="secondary"
              size="default"
            >
              ← 返回社区
            </Button>
          </div>
          <PaymentTestPage />
        </div>
      ) : (
        <div className={styles.communityContent}>
          <div className={styles.header}>
            <h1 className={styles.title}>社区</h1>
            <p className={styles.subtitle}>发现和分享优质内容</p>
            
            {/* 支付测试按钮 */}
            <div style={{ marginTop: '16px' }}>
              <Button 
                onClick={() => setShowPaymentTest(true)}
                variant="primary"
                size="default"
              >
                🧪 支付功能测试
              </Button>
            </div>
          </div>
        
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="搜索社区内容..."
            value={search}
            onChange={handleSearch}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.docGrid}>
          {filteredDocs.map(doc => (
            <div key={doc.id} className={styles.docCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.docTitle}>{doc.title}</h3>
                <span className={styles.viewCount}>{doc.viewCount} 次查看</span>
              </div>
              <p className={styles.docDescription}>{doc.description}</p>
              <div className={styles.cardFooter}>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>作者: {doc.authorName}</span>
                  <span className={styles.sharedAt}>
                    {new Date(doc.sharedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.actions}>
                  <button 
                    className={styles.viewButton}
                    onClick={() => handleViewDoc(doc)}
                  >
                    查看
                  </button>
                  <button 
                    className={styles.shareButton}
                    onClick={() => handleShareDoc(doc)}
                  >
                    分享
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredDocs.length === 0 && (
          <div className={styles.emptyState}>
            <p>暂无匹配的社区内容</p>
          </div>
        )}
        </div>
      )}
    </ViewBody>
  );
};

export const Component = () => {
  return <CommunityPage />;
};