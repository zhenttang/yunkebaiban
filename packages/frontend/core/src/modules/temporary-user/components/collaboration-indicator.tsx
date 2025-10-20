import { useLiveData, useService } from '@toeverything/infra';
import { useEffect, useState } from 'react';

import { TemporaryUserService } from '../services/temporary-user';
import { TemporaryUserCollaboration } from '../utils/collaboration';

export interface CollaborationIndicatorProps {
  className?: string;
  workspaceId: string;
  docId: string;
}

/**
 * 协作状态指示器
 * 显示临时用户的协作状态和在线用户信息
 */
export const CollaborationIndicator = ({
  className,
  workspaceId,
  docId,
}: CollaborationIndicatorProps) => {
  const temporaryUserService = useService(TemporaryUserService);
  const user = useLiveData(temporaryUserService.session.user$);
  const status = useLiveData(temporaryUserService.session.status$);
  
  const [isVisible, setIsVisible] = useState(false);

  // 检查是否有有效的临时用户身份
  const hasValidIdentity = status === 'authenticated' && user !== null;

  useEffect(() => {
    setIsVisible(hasValidIdentity);
  }, [hasValidIdentity]);

  if (!isVisible || !user) {
    return null;
  }

  const userColor = TemporaryUserCollaboration.generateUserColor(user.id);

  return (
    <div 
      className={className}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        backgroundColor: 'var(--yunke-background-primary-color)',
        border: '1px solid var(--yunke-border-color)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '280px',
        fontSize: '12px',
      }}
    >
      {/* 用户身份指示器 */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div 
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: userColor,
            backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {!user.avatarUrl && user.name.charAt(0).toUpperCase()}
        </div>
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            flex: 1,
          }}
        >
          <span 
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--yunke-text-primary-color)',
              lineHeight: '16px',
            }}
          >
            {user.name}
          </span>
          <span 
            style={{
              fontSize: '11px',
              color: 'var(--yunke-text-secondary-color)',
              lineHeight: '14px',
            }}
          >
            临时访客
          </span>
        </div>
      </div>

      {/* 协作状态指示 */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          backgroundColor: 'var(--yunke-background-success-color)',
          borderRadius: '4px',
          border: '1px solid var(--yunke-success-color)',
        }}
      >
        <div 
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--yunke-success-color)',
            animation: 'pulse 2s infinite',
          }}
        />
        <span 
          style={{
            fontSize: '11px',
            color: 'var(--yunke-success-color)',
            fontWeight: 500,
          }}
        >
          您正在编辑
        </span>
      </div>

      {/* 编辑提示 */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 8px',
          backgroundColor: 'var(--yunke-background-secondary-color)',
          borderRadius: '4px',
          border: '1px dashed var(--yunke-border-color)',
        }}
      >
        <span 
          style={{
            fontSize: '12px',
            flexShrink: 0,
          }}
        >
          ✍️
        </span>
        <span 
          style={{
            fontSize: '11px',
            color: 'var(--yunke-text-secondary-color)',
            lineHeight: '14px',
          }}
        >
          您的编辑将实时同步给其他用户
        </span>
      </div>
    </div>
  );
}; 