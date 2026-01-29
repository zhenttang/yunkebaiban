import React from 'react';
import { IconButton } from '@yunke/component';
import { CloseIcon } from '@blocksuite/icons/rc';
import * as styles from './inline-cloud-status.css';

interface InlineCloudStatusProps {
  className?: string;
}

/**
 * 内联云端连接状态组件 - 集成到应用标签栏
 * 默认显示本地模式，避免依赖 CloudStorageProvider
 */
export const InlineCloudStatus: React.FC<InlineCloudStatusProps> = ({ className }) => {
  // 默认本地模式，不依赖 CloudStorageProvider
  const storageMode = 'local' as const;
  const isConnected = false;
  const isOnline = true;
  const lastSync = null;
  const pendingOperationsCount = 0;
  const reconnect = () => {};

  const getStatusIcon = () => {
    if (!isOnline) return '🚫';
    
    switch (storageMode) {
      case 'detecting':
        return '🔄';
      case 'cloud':
        return '☁️';
      case 'local':
        return '📱';
      case 'error':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return '离线';
    
    switch (storageMode) {
      case 'detecting':
        return '连接中';
      case 'cloud':
        return '云端';
      case 'local':
        return '本地';
      case 'error':
        return '错误';
      default:
        return '未知';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#999';
    
    switch (storageMode) {
      case 'detecting':
        return '#ffa500';
      case 'cloud':
        return '#10b981';
      case 'local':
        return '#6b7280';
      case 'error':
        return '#ef4444';
      default:
        return '#999';
    }
  };

  const handleClick = () => {
    if (storageMode === 'error' || storageMode === 'local') {
      reconnect();
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return '';
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    return `${Math.floor(diffMinutes / 60)}h`;
  };

  // 如果是云存储模式且有待处理操作，显示同步中状态
  const isActiveSyncing = storageMode === 'cloud' && pendingOperationsCount > 0;
  const displayText = isActiveSyncing ? '同步中' : getStatusText();

  return (
    <div 
      className={`${styles.inlineCloudStatus} ${className || ''}`}
      onClick={handleClick}
      title={`
        状态: ${getStatusText()}
        连接: ${isConnected ? '已连接' : '未连接'}
        网络: ${isOnline ? '在线' : '离线'}
        ${lastSync ? `最后同步: ${formatLastSync()}` : ''}
        ${pendingOperationsCount > 0 ? `排队: ${pendingOperationsCount}` : ''}
        ${(storageMode === 'error' || storageMode === 'local') ? '点击重连' : ''}
      `.trim()}
    >
      <span 
        className={styles.statusIcon}
        style={{ 
          color: getStatusColor(),
          animation: isActiveSyncing ? `${styles.spin} 1s linear infinite` : 'none'
        }}
      >
        {getStatusIcon()}
      </span>
      <span 
        className={styles.statusText}
        style={{ color: getStatusColor() }}
      >
        {displayText}
      </span>
      {pendingOperationsCount > 0 && (
        <span className={styles.pendingBadge}>
          {pendingOperationsCount}
        </span>
      )}
      {storageMode === 'cloud' && lastSync && !isActiveSyncing && (
        <span className={styles.lastSyncText}>
          {formatLastSync()}
        </span>
      )}
    </div>
  );
};