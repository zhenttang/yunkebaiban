import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PermissionSelector } from './components/permission-selector';
import { communityApi } from '../../../../api/community';
import { CommunityPermission } from '../../../../types/community';
import * as styles from './styles/share-modal.css';

interface ShareToCommunityModalProps {
  docId: string;
  workspaceId: string;
  defaultTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ShareToCommunityModal = ({
  docId,
  workspaceId,
  defaultTitle,
  onClose,
  onSuccess
}: ShareToCommunityModalProps) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [permission, setPermission] = useState<CommunityPermission>(CommunityPermission.PUBLIC);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const handleShare = async () => {
    if (!title.trim()) {
      showToast('请输入标题', 'error');
      return;
    }

    setLoading(true);
    try {
      const document = await communityApi.shareDocToCommunity(workspaceId, docId, {
        title: title.trim(),
        description: description.trim(),
        permission
      });

      if (document && document.id) {
        showToast('文档已成功分享到社区', 'success');
        onSuccess?.();
        onClose();
      } else {
        showToast('分享失败', 'error');
      }
    } catch (error) {
      console.error('分享失败:', error);

      let errorMessage = '网络错误，请重试';
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = '请先登录后再分享文档到社区';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = '您没有权限分享此文档';
        } else {
          errorMessage = error.message;
        }
      }

      showToast(errorMessage, 'error');
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>分享到社区</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label className={styles.label}>标题 *</label>
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入社区显示的标题"
              maxLength={200}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>描述</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述文档内容（可选）"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>访问权限</label>
            <PermissionSelector
              value={permission}
              onChange={setPermission}
              disabled={loading}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={loading}
            >
              取消
            </button>
            <button
              className={styles.shareButton}
              onClick={handleShare}
              disabled={loading || !title.trim()}
            >
              {loading ? '分享中...' : '分享到社区'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};