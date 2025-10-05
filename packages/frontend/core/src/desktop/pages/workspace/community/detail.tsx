import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@affine/component';
import { ArrowLeftSmallIcon } from '@blocksuite/icons/rc';
import { useState, useEffect } from 'react';

import { ViewBody, ViewHeader, ViewTitle } from '../../../../modules/workbench';
import type { CommunityDocument } from './types';
import * as api from './api';
import { AuthorInfo } from './components/AuthorInfo';
import { CommentSection } from './components/CommentSection';
import { AccessRestriction } from './components/AccessRestriction';
import * as styles from './community.css';

export const CommunityDocDetailPage = () => {
  const { workspaceId, documentId } = useParams<{ workspaceId: string; documentId: string }>();
  const navigate = useNavigate();

  const [doc, setDoc] = useState<CommunityDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    if (!documentId) return;

    setLoading(true);
    setError(null);

    try {
      const document = await api.getDocument(documentId);
      setDoc(document);

      // 记录浏览
      await api.recordView(documentId, {
        userAgent: navigator.userAgent,
      }).catch(console.error);
    } catch (err) {
      console.error('加载文档失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/workspace/${workspaceId}/community`);
  };

  const handleLike = async () => {
    if (!doc) return;

    try {
      if (doc.isLiked) {
        await api.unlikeDocument(doc.id);
      } else {
        await api.likeDocument(doc.id);
      }
      await loadDocument();
    } catch (err) {
      console.error('点赞操作失败:', err);
    }
  };

  const handleCollect = async () => {
    if (!doc) return;

    try {
      if (doc.isCollected) {
        await api.uncollectDocument(doc.id);
      } else {
        await api.collectDocument(doc.id);
      }
      await loadDocument();
    } catch (err) {
      console.error('收藏操作失败:', err);
    }
  };

  const handleShare = () => {
    if (!doc) return;

    const shareText = `推荐文档: ${doc.title}\\n作者: ${doc.authorName}\\n${doc.description || ''}`;

    if (navigator.share) {
      navigator.share({
        title: doc.title,
        text: shareText,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('文档信息已复制到剪贴板！');
      }).catch(() => {
        alert(`分享文档: ${doc.title}`);
      });
    }
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
            color: 'var(--affine-text-secondary-color)',
          }}>
            正在加载文档详情...
          </div>
        </ViewBody>
      </div>
    );
  }

  if (error || !doc) {
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
              color: 'var(--affine-text-secondary-color)',
            }}>
              <div style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--affine-error-color)' }}>
                {error || '文档不存在'}
              </div>
              <div style={{ marginBottom: '24px' }}>
                该文档可能已被删除或您没有访问权限
              </div>
              <Button onClick={loadDocument} style={{ marginRight: '12px' }}>
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
          {/* Cover image */}
          {doc.coverImage && (
            <div style={{
              width: '100%',
              height: '300px',
              backgroundImage: `url(${doc.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '8px',
              marginBottom: '24px',
            }} />
          )}

          {/* Document header */}
          <div style={{
            marginBottom: '24px',
          }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              margin: '0 0 12px 0',
              color: 'var(--affine-text-primary-color)',
            }}>
              {doc.title}
            </h1>
            {doc.description && (
              <p style={{
                fontSize: '16px',
                color: 'var(--affine-text-secondary-color)',
                lineHeight: '1.6',
                margin: '0 0 16px 0',
              }}>
                {doc.description}
              </p>
            )}

            {/* Tags */}
            {doc.tags && doc.tags.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '16px',
              }}>
                {doc.tags.map((tag) => (
                  <span
                    key={tag.id}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: tag.color || 'var(--affine-tag-blue)',
                      color: 'white',
                      fontSize: '12px',
                      borderRadius: '12px',
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Stats bar */}
            <div style={{
              display: 'flex',
              gap: '16px',
              fontSize: '14px',
              color: 'var(--affine-text-secondary-color)',
            }}>
              <span>👁️ {doc.viewCount} 浏览</span>
              <span>❤️ {doc.likeCount} 点赞</span>
              <span>⭐ {doc.collectCount} 收藏</span>
              <span>💬 {doc.commentCount} 评论</span>
              {doc.isPaid && (
                <span style={{ fontWeight: 600, color: 'var(--affine-primary-color)' }}>
                  ¥{doc.discountPrice || doc.price}
                </span>
              )}
            </div>
          </div>

          {/* Author info */}
          <AuthorInfo
            authorId={doc.authorId}
            authorName={doc.authorName}
            authorAvatar={doc.authorAvatar}
            publishedAt={doc.publishedAt}
            isFollowing={doc.isFollowing}
            onFollowChange={loadDocument}
          />

          {/* Document content */}
          <div style={{
            padding: '24px',
            backgroundColor: 'var(--affine-background-primary-color)',
            border: '1px solid var(--affine-border-color)',
            borderRadius: '8px',
            minHeight: '400px',
            marginBottom: '24px',
          }}>
            {/* 权限限制 */}
            {!doc.hasFullAccess && (doc.needFollow || doc.needPurchase) ? (
              <>
                {/* 预览内容 */}
                {doc.contentSnapshot && doc.previewLength && (
                  <div style={{
                    color: 'var(--affine-text-primary-color)',
                    lineHeight: '1.8',
                    fontSize: '15px',
                    marginBottom: '24px',
                    paddingBottom: '24px',
                    borderBottom: '1px solid var(--affine-border-color)',
                  }}>
                    <div dangerouslySetInnerHTML={{
                      __html: doc.contentSnapshot.substring(0, doc.previewLength).replace(/\\n/g, '<br/>')
                    }} />
                    <div style={{
                      marginTop: '16px',
                      fontSize: '14px',
                      fontStyle: 'italic',
                      color: 'var(--affine-text-secondary-color)',
                    }}>
                      ... （预览部分）
                    </div>
                  </div>
                )}

                {/* 访问限制提示 */}
                <AccessRestriction
                  document={doc}
                  onPurchase={() => {
                    // TODO: 实现购买逻辑
                    alert('购买功能开发中...');
                  }}
                  onFollow={async () => {
                    try {
                      await api.followAuthor(doc.authorId);
                      await loadDocument();
                    } catch (err) {
                      console.error('关注失败:', err);
                      alert('关注失败，请重试');
                    }
                  }}
                />
              </>
            ) : (
              /* 完整内容 */
              <div style={{
                color: 'var(--affine-text-primary-color)',
                lineHeight: '1.8',
                fontSize: '15px',
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                }}>
                  <p style={{
                    fontSize: '16px',
                    marginBottom: '16px',
                    color: 'var(--affine-text-primary-color)'
                  }}>
                    点击下方按钮查看完整文档内容
                  </p>
                  <p style={{
                    fontSize: '13px',
                    marginBottom: '24px',
                    color: 'var(--affine-text-secondary-color)'
                  }}>
                    文档更新会自动同步，无需重新分享
                  </p>
                  <Button
                    onClick={() => {
                      navigate(`/workspace/${doc.workspaceId}/${doc.sourceDocId}`);
                    }}
                    variant="primary"
                    size="large"
                  >
                    📄 查看完整文档
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <Button
              onClick={handleLike}
              variant={doc.isLiked ? 'primary' : 'secondary'}
              size="default"
            >
              {doc.isLiked ? '❤️ 已点赞' : '🤍 点赞'} ({doc.likeCount})
            </Button>
            <Button
              onClick={handleCollect}
              variant={doc.isCollected ? 'primary' : 'secondary'}
              size="default"
            >
              {doc.isCollected ? '⭐ 已收藏' : '☆ 收藏'} ({doc.collectCount})
            </Button>
            <Button
              onClick={handleShare}
              variant="secondary"
              size="default"
            >
              📤 分享
            </Button>
          </div>

          {/* Comments section */}
          <CommentSection documentId={doc.id} />
        </div>
      </ViewBody>
    </div>
  );
};

export const Component = () => {
  return <CommunityDocDetailPage />;
};

export default CommunityDocDetailPage;
