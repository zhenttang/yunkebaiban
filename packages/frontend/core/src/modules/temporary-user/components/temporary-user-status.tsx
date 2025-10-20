import { useI18n } from '@yunke/i18n';
import {
  Avatar,
  IconButton,
  toast,
  Button,
  Tooltip,
} from '@yunke/component';
import { 
  MoreHorizontalIcon, 
  InformationIcon, 
  UpgradeIcon,
  SignOutIcon 
} from '@blocksuite/icons/rc';
import { useService, useLiveData } from '@toeverything/infra';
import { useCallback, useMemo } from 'react';

import { TemporaryUserService } from '../services/temporary-user';
import { formatTimeRemaining } from '../utils/time';

export interface TemporaryUserStatusProps {
  className?: string;
  compact?: boolean;
  showTimeRemaining?: boolean;
  onExtendSession?: () => Promise<void>;
  onLogout?: () => Promise<void>;
}

export const TemporaryUserStatus = ({
  className,
  compact = false,
  showTimeRemaining = true,
  onExtendSession,
  onLogout,
}: TemporaryUserStatusProps) => {
  const t = useI18n();
  const temporaryUserService = useService(TemporaryUserService);
  
  const user = useLiveData(temporaryUserService.session.user$);
  const status = useLiveData(temporaryUserService.session.status$);
  
  // 计算会话状态
  const isSessionExpired = useMemo(() => {
    if (!user) return false;
    return new Date(user.expiresAt) <= new Date();
  }, [user]);
  
  const isExpiringSoon = useMemo(() => {
    if (!user || isSessionExpired) return false;
    const now = new Date();
    const expiresAt = new Date(user.expiresAt);
    const diff = expiresAt.getTime() - now.getTime();
    return diff < 10 * 60 * 1000; // 10分钟内过期
  }, [user, isSessionExpired]);

  const timeRemaining = useMemo(() => {
    if (!user) return '';
    return formatTimeRemaining(user.expiresAt);
  }, [user]);

  const handleExtendSession = useCallback(async () => {
    try {
      if (onExtendSession) {
        await onExtendSession();
      } else {
        const success = await temporaryUserService.extendSession();
        if (success) {
          toast(t['com.yunke.share.temporary-user.session-extended']());
        } else {
          toast(t['com.yunke.share.temporary-user.extend-failed']());
        }
      }
    } catch (error) {
              console.error('扩展会话失败:', error);
      toast(t['com.yunke.share.temporary-user.extend-failed']());
    }
  }, [temporaryUserService, onExtendSession, t]);

  const handleLogout = useCallback(async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await temporaryUserService.logout();
        toast(t['com.yunke.share.temporary-user.logged-out']());
      }
    } catch (error) {
      console.error('登出失败:', error);
      toast(t['com.yunke.share.temporary-user.logout-failed']());
    }
  }, [temporaryUserService, onLogout, t]);

  // 不显示未认证状态
  if (status !== 'authenticated' || !user) {
    return null;
  }

  const statusMessage = useMemo(() => {
    if (isSessionExpired) {
      return t['com.yunke.share.temporary-user.status.expired']();
    }
    if (isExpiringSoon) {
      return t['com.yunke.share.temporary-user.status.expiring-soon']();
    }
    return t['com.yunke.share.temporary-user.status.active']();
  }, [isSessionExpired, isExpiringSoon, t]);

  if (compact) {
    return (
      <div 
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'var(--yunke-background-secondary-color)',
          borderRadius: '6px',
          border: '1px solid var(--yunke-border-color)',
        }}
      >
        <Avatar
          size={24}
          name={user.name}
          url={user.avatarUrl}
        />
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 500, 
          color: 'var(--yunke-text-primary-color)' 
        }}>
          {user.name}
        </span>
        {showTimeRemaining && (
          <span style={{ 
            fontSize: '11px', 
            color: isExpiringSoon ? 'var(--yunke-warning-color)' : 'var(--yunke-text-secondary-color)' 
          }}>
            {timeRemaining}
          </span>
        )}
        <Tooltip content={t['com.yunke.share.temporary-user.more-actions']()}>
          <IconButton size={16}>
            <MoreHorizontalIcon />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: 'var(--yunke-background-secondary-color)',
        borderRadius: '8px',
        border: '1px solid var(--yunke-border-color)',
        maxWidth: '300px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Avatar
          size={32}
          name={user.name}
          url={user.avatarUrl}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 500, 
            fontSize: '14px', 
            color: 'var(--yunke-text-primary-color)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user.name}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: isExpiringSoon 
              ? 'var(--yunke-warning-color)' 
              : 'var(--yunke-success-color)' 
          }}>
            {statusMessage}
          </div>
        </div>
      </div>

      {showTimeRemaining && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '8px',
          backgroundColor: 'var(--yunke-background-tertiary-color)',
          borderRadius: '4px'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--yunke-text-secondary-color)' }}>
            {t['com.yunke.share.temporary-user.time-remaining']()}:
          </span>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 500, 
            color: isExpiringSoon ? 'var(--yunke-warning-color)' : 'var(--yunke-text-primary-color)' 
          }}>
            {timeRemaining}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
        {isExpiringSoon && !isSessionExpired && (
          <Button
            onClick={handleExtendSession}
            prefix={<UpgradeIcon />}
            style={{ fontSize: '12px' }}
          >
            {t['com.yunke.share.temporary-user.extend-session']()}
          </Button>
        )}
        
        <Tooltip content={t['com.yunke.share.temporary-user.info-tooltip']()}>
          <IconButton size={16}>
            <InformationIcon />
          </IconButton>
        </Tooltip>

        <Tooltip content={t['com.yunke.share.temporary-user.logout']()}>
          <IconButton size={16} onClick={handleLogout}>
            <SignOutIcon />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}; 