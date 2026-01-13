import { useLiveData, useService } from '@toeverything/infra';
import { useEffect, useState } from 'react';

import { TemporaryUserService } from '../services/temporary-user';
import { TemporaryUserCollaboration } from '../utils/collaboration';

import * as styles from './temporary-user-cursor.css';

export interface TemporaryUserCursorProps {
  className?: string;
  workspaceId: string;
  docId: string;
}

/**
 * 临时用户光标组件
 * 用于在协作编辑中显示临时用户的光标和选择状态
 */
export const TemporaryUserCursor = ({
  className,
  workspaceId,
  docId,
}: TemporaryUserCursorProps) => {
  const temporaryUserService = useService(TemporaryUserService);
  const user = useLiveData(temporaryUserService.session.user$);
  const status = useLiveData(temporaryUserService.session.status$);
  
  const [isVisible, setIsVisible] = useState(false);
  const [collaboratorCount, setCollaboratorCount] = useState(0);
  const [collaborators, setCollaborators] = useState<Array<{
    clientId: number;
    user: any;
    isTemporary?: boolean;
    isAnonymous?: boolean;
  }>>([]);

  // 检查是否有有效的临时用户身份
  const hasValidIdentity = status === 'authenticated' && user !== null;

  useEffect(() => {
    if (!hasValidIdentity) {
      setIsVisible(false);
      return;
    }

    // 设置光标显示状态
    setIsVisible(true);

    // TODO: 在真实环境中，这里应该从workspace的awareness系统获取协作者数据
    // 由于当前组件无法直接访问awareness，我们先使用模拟数据
    // 在未来的版本中，可以通过WorkspaceService或直接注入DocImpl来获取awareness
    const updateCollaboratorCount = () => {
      // 模拟协作者数据
      const mockCollaborators = [
        {
          clientId: Date.now(),
          user: {
            name: user?.name || '临时用户',
            isTemporary: true,
            temporaryId: user?.id,
          },
          isTemporary: true,
        }
      ];
      
      setCollaborators(mockCollaborators);
      setCollaboratorCount(mockCollaborators.length);
    };

    updateCollaboratorCount();
    const interval = setInterval(updateCollaboratorCount, 30000); // 每30秒更新一次

    return () => {
      clearInterval(interval);
    };
  }, [hasValidIdentity, user]);

  if (!isVisible || !user) {
    return null;
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* 用户身份指示器 */}
      <div className={styles.userIndicator}>
        <div 
          className={styles.avatar}
          style={{
            backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined,
            backgroundColor: user.id ? TemporaryUserCollaboration.generateUserColor(user.id) : 'var(--yunke-brand-color)',
          }}
        >
          {!user.avatarUrl && user.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userStatus}>临时访客</span>
        </div>
      </div>

      {/* 协作状态指示 */}
      {collaboratorCount > 0 && (
        <div className={styles.collaborationIndicator}>
          <div className={styles.collaboratorDot} />
          <span className={styles.collaboratorText}>
            {collaboratorCount === 1 ? '您正在编辑' : `${collaboratorCount} 人正在协作编辑`}
          </span>
        </div>
      )}

      {/* 编辑提示 */}
      <div className={styles.editHint}>
        <span className={styles.hintIcon}>✍️</span>
        <span className={styles.hintText}>
          您的编辑将实时同步给其他用户
        </span>
      </div>
    </div>
  );
};

/**
 * 临时用户光标装饰器
 * 用于在编辑器中直接显示光标样式
 */
export const TemporaryUserCursorDecorator = ({
  userId,
  userName,
  isTemporary = false,
}: {
  userId: string;
  userName: string;
  isTemporary?: boolean;
}) => {
  if (!isTemporary) {
    return null;
  }

  const userColor = TemporaryUserCollaboration.generateUserColor(userId);

  return (
    <div className={styles.cursorDecorator}>
      <div 
        className={styles.cursorLine}
        style={{ backgroundColor: userColor }}
      />
      <div 
        className={styles.cursorLabel}
        style={{ backgroundColor: userColor }}
      >
        <span className={styles.cursorLabelText}>{userName}</span>
        <span className={styles.cursorLabelBadge}>临时</span>
      </div>
    </div>
  );
}; 