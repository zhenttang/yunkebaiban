import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@affine/component';

import { ViewBody } from '../../../../modules/workbench';
import { PaymentTestPage } from '../../../../components/payment-test-page';
import * as styles from './community.css';
import * as api from './api';
import type { CommunityDocument, GetDocumentsParams } from './types';

export const CommunityPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<CommunityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showPaymentTest, setShowPaymentTest] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // 加载文档列表
  const loadDocuments = async (params?: GetDocumentsParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getPublicDocuments({
        page: currentPage,
        size: pageSize,
        ...params,
      });

      setDocuments(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('加载文档失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索文档
  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      loadDocuments();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.searchDocuments({
        keyword,
        page: currentPage,
        size: pageSize,
      });

      setDocuments(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('搜索失败:', err);
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 点赞文档
  const handleLike = async (doc: CommunityDocument) => {
    try {
      if (doc.isLiked) {
        await api.unlikeDocument(doc.id);
      } else {
        await api.likeDocument(doc.id);
      }

      // 重新加载文档列表
      await loadDocuments();
    } catch (err) {
      console.error('点赞操作失败:', err);
    }
  };

  // 收藏文档
  const handleCollect = async (doc: CommunityDocument) => {
    try {
      if (doc.isCollected) {
        await api.uncollectDocument(doc.id);
      } else {
        await api.collectDocument(doc.id);
      }

      // 重新加载文档列表
      await loadDocuments();
    } catch (err) {
      console.error('收藏操作失败:', err);
    }
  };

  // 查看文档详情
  const handleViewDoc = async (doc: CommunityDocument) => {
    console.log('查看文档:', doc);

    // 记录浏览
    try {
      await api.recordView(doc.id, {
        userAgent: navigator.userAgent,
      });
    } catch (err) {
      console.error('记录浏览失败:', err);
    }

    // 跳转到详情页
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/community/${doc.id}`);
    } else {
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

  // 分享文档
  const handleShareDoc = (doc: CommunityDocument) => {
    console.log('分享文档:', doc);
    const shareText = `推荐文档: ${doc.title}\n作者: ${doc.authorName}\n${doc.description || ''}`;

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

  // 初始加载
  useEffect(() => {
    console.log('🎯 社区页面已加载, workspaceId:', workspaceId || '全局模式');
    loadDocuments();
  }, [workspaceId, currentPage]);

  // 处理搜索输入
  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    // 防抖搜索
    const timer = setTimeout(() => {
      handleSearch(value);
    }, 500);

    return () => clearTimeout(timer);
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
              onChange={onSearchChange}
              className={styles.searchInput}
            />
          </div>

          {loading && (
            <div className={styles.loadingState}>
              <p>加载中...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              <p>错误: {error}</p>
              <Button onClick={() => loadDocuments()}>重试</Button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className={styles.statsBar}>
                <span>共找到 {totalElements} 篇文档</span>
              </div>

              <div className={styles.docGrid}>
                {documents.map(doc => (
                  <div key={doc.id} className={styles.docCard}>
                    {doc.coverImage && (
                      <div
                        className={styles.cardCover}
                        style={{ backgroundImage: `url(${doc.coverImage})` }}
                      />
                    )}

                    <div className={styles.cardHeader}>
                      <h3 className={styles.docTitle}>{doc.title}</h3>
                      {doc.isPaid && (
                        <span className={styles.priceTag}>
                          ¥{doc.discountPrice || doc.price}
                        </span>
                      )}
                    </div>

                    {doc.description && (
                      <p className={styles.docDescription}>{doc.description}</p>
                    )}

                    {doc.tags && doc.tags.length > 0 && (
                      <div className={styles.tagList}>
                        {doc.tags.map(tag => (
                          <span
                            key={tag.id}
                            className={styles.tag}
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={styles.cardStats}>
                      <span title="浏览数">👁️ {doc.viewCount}</span>
                      <span title="点赞数">❤️ {doc.likeCount}</span>
                      <span title="收藏数">⭐ {doc.collectCount}</span>
                      <span title="评论数">💬 {doc.commentCount}</span>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.authorInfo}>
                        <span className={styles.authorName}>
                          作者: {doc.authorName}
                        </span>
                        <span className={styles.publishedAt}>
                          {new Date(doc.publishedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className={styles.actions}>
                        <button
                          className={styles.likeButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(doc);
                          }}
                          data-liked={doc.isLiked}
                        >
                          {doc.isLiked ? '❤️' : '🤍'}
                        </button>

                        <button
                          className={styles.collectButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCollect(doc);
                          }}
                          data-collected={doc.isCollected}
                        >
                          {doc.isCollected ? '⭐' : '☆'}
                        </button>

                        <button
                          className={styles.viewButton}
                          onClick={() => handleViewDoc(doc)}
                        >
                          查看
                        </button>

                        <button
                          className={styles.shareButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareDoc(doc);
                          }}
                        >
                          分享
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分页控制 */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <Button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  >
                    上一页
                  </Button>

                  <span className={styles.pageInfo}>
                    第 {currentPage + 1} / {totalPages} 页
                  </span>

                  <Button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </>
          )}

          {!loading && !error && documents.length === 0 && (
            <div className={styles.emptyState}>
              <p>暂无社区内容</p>
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
