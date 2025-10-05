import React, { useState, useEffect } from 'react';
import { ShareToCommunityModal } from './share-to-community-modal';
import { communityApi } from '../../../../api/community';
import * as styles from './styles/share-button.css';

interface CommunityShareButtonProps {
  docId: string;
  workspaceId: string;
  docTitle: string;
}

export const CommunityShareButton = ({ 
  docId, 
  workspaceId, 
  docTitle 
}: CommunityShareButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // 简单的toast实现，实际项目中应该使用现有的toast组件
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  // 检查文档是否已分享到社区
  useEffect(() => {
    // 这里可以调用API检查文档状态
    // checkCommunityShareStatus();
    // 暂时设置为未分享状态
    setIsShared(false);
  }, [docId]);

  const handleUnshare = async () => {
    if (!confirm('确定要取消分享到社区吗？')) return;

    setLoading(true);
    try {
      await communityApi.unshareDocFromCommunity(workspaceId, docId);
      setIsShared(false);
      showToast('已取消分享到社区', 'success');
    } catch (error) {
      console.error('取消分享失败:', error);
      showToast(error instanceof Error ? error.message : '网络错误，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShareSuccess = () => {
    setIsShared(true);
  };

  if (isShared) {
    return (
      <div className={styles.sharedContainer}>
        <button
          className={styles.sharedButton}
          onClick={handleUnshare}
          disabled={loading}
          title="点击取消分享到社区"
        >
          <span className={styles.checkIcon}>✓</span>
          已分享到社区
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        className={styles.shareButton}
        onClick={() => setShowModal(true)}
        title="分享文档到工作空间社区"
      >
        <span className={styles.shareIcon}>📤</span>
        分享到社区
      </button>

      {showModal && (
        <ShareToCommunityModal
          docId={docId}
          workspaceId={workspaceId}
          defaultTitle={docTitle}
          onClose={() => setShowModal(false)}
          onSuccess={handleShareSuccess}
        />
      )}
    </>
  );
};