import { useI18n } from '@yunke/i18n';
import { Button, Loading, toast } from '@yunke/component';
import { useService, useLiveData } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import { TemporaryUserService } from '../services/temporary-user';
import { TemporaryUserStatus } from './temporary-user-status';

export interface AnonymousUserIdentityProps {
  className?: string;
  workspaceId: string;
  docId: string;
  mode?: 'appendonly' | 'readonly';
  autoCreate?: boolean;
  onIdentityCreated?: (success: boolean) => void;
  onIdentityChanged?: (hasIdentity: boolean) => void;
}

export const AnonymousUserIdentity = ({
  className,
  workspaceId,
  docId,
  mode = 'readonly',
  autoCreate = true,
  onIdentityCreated,
  onIdentityChanged,
}: AnonymousUserIdentityProps) => {
  const t = useI18n();
  const temporaryUserService = useService(TemporaryUserService);
  
  const user = useLiveData(temporaryUserService.session.user$);
  const status = useLiveData(temporaryUserService.session.status$);
  
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateButton, setShowCreateButton] = useState(false);

  // 是否为AppendOnly模式
  const isAppendOnlyMode = mode === 'appendonly';

  // 检查是否已有有效身份
  const hasValidIdentity = status === 'authenticated' && user !== null;

  useEffect(() => {
    onIdentityChanged?.(hasValidIdentity);
  }, [hasValidIdentity, onIdentityChanged]);

  useEffect(() => {
    if (isAppendOnlyMode && autoCreate && !hasValidIdentity && !isCreating) {
      // 在AppendOnly模式下自动创建临时用户
      handleCreateIdentity();
    } else if (isAppendOnlyMode && !hasValidIdentity && !autoCreate) {
      // 显示手动创建按钮
      setShowCreateButton(true);
    } else {
      setShowCreateButton(false);
    }
  }, [isAppendOnlyMode, autoCreate, hasValidIdentity, isCreating]);

  const handleCreateIdentity = useCallback(async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const result = await temporaryUserService.createTemporaryUserForShare({
        workspaceId,
        docId,
      });

      if (result.success) {
        toast(t['com.yunke.share.temporary-user.identity-created']());
        onIdentityCreated?.(true);
      } else {
        const errorMessage = result.reason || t['com.yunke.share.temporary-user.identity-creation-failed']();
        toast(errorMessage);
        onIdentityCreated?.(false);
        setShowCreateButton(true);
      }
    } catch (error) {
      console.error('创建临时用户身份失败:', error);
      toast(t['com.yunke.share.temporary-user.identity-creation-failed']());
      onIdentityCreated?.(false);
      setShowCreateButton(true);
    } finally {
      setIsCreating(false);
    }
  }, [
    isCreating,
    temporaryUserService,
    workspaceId,
    docId,
    t,
    onIdentityCreated,
  ]);

  const handleRetryCreate = useCallback(() => {
    setShowCreateButton(false);
    handleCreateIdentity();
  }, [handleCreateIdentity]);

  // 只读模式下不需要显示任何内容
  if (!isAppendOnlyMode) {
    return null;
  }

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: 'var(--yunke-background-secondary-color)',
        border: '1px solid var(--yunke-border-color)',
        fontSize: '14px',
      }}
    >
      {/* 显示加载状态 */}
      {isCreating && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'var(--yunke-background-primary-color)',
            borderRadius: '6px',
            border: '1px solid var(--yunke-border-color)',
          }}
        >
          <Loading size={16} />
          <span 
            style={{
              fontSize: '13px',
              color: 'var(--yunke-text-secondary-color)',
            }}
          >
            {t['com.yunke.share.temporary-user.creating-identity']()}
          </span>
        </div>
      )}

      {/* 显示创建按钮 */}
      {showCreateButton && !isCreating && (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px',
            backgroundColor: 'var(--yunke-background-primary-color)',
            borderRadius: '6px',
            border: '1px solid var(--yunke-border-color)',
          }}
        >
          <div 
            style={{
              fontSize: '13px',
              color: 'var(--yunke-text-primary-color)',
              lineHeight: '1.4',
            }}
          >
            {t['com.yunke.share.temporary-user.create-identity-prompt']()}
          </div>
          <Button
            onClick={handleRetryCreate}
            disabled={isCreating}
          >
            {t['com.yunke.share.temporary-user.create-identity']()}
          </Button>
        </div>
      )}

      {/* 显示用户状态 */}
      {hasValidIdentity && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div 
            style={{
              fontSize: '13px',
              color: 'var(--yunke-text-primary-color)',
              fontWeight: 500,
            }}
          >
            {t['com.yunke.share.temporary-user.welcome-message']()}
          </div>
          <TemporaryUserStatus 
            compact={true}
            showTimeRemaining={true}
          />
        </div>
      )}

      {/* 编辑提示 */}
      {hasValidIdentity && (
        <div 
          style={{
            fontSize: '12px',
            color: 'var(--yunke-text-secondary-color)',
            padding: '8px',
            backgroundColor: 'var(--yunke-background-success-color)',
            borderRadius: '4px',
            border: '1px solid var(--yunke-success-color)',
            lineHeight: '1.3',
          }}
        >
          {t['com.yunke.share.temporary-user.edit-hint']()}
        </div>
      )}
    </div>
  );
}; 