import React, { useEffect, useState } from 'react';
import { ShareToCommunityModal } from './share-to-community-modal';
import {
  getCommunityDocStatus,
  unshareDocFromCommunity,
} from '../community/api';
import * as styles from './styles/share-button.css';

interface CommunityShareButtonProps {
  docId: string;
  workspaceId: string;
  docTitle: string;
}

export const CommunityShareButton = ({
  docId,
  workspaceId,
  docTitle,
}: CommunityShareButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const response = await getCommunityDocStatus(workspaceId, docId);
        if (cancelled) {
          return;
        }
        setIsShared(!!response?.data);
      } catch (error) {
        if (cancelled) {
          return;
        }
        console.warn('获取社区分享状态失败', error);
        setIsShared(false);
      }
    };

    void fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [docId, workspaceId]);

  const handleUnshare = async () => {
    if (!confirm('确定要取消分享到社区吗？')) {
      return;
    }

    setLoading(true);
    try {
      await unshareDocFromCommunity(workspaceId, docId);
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
