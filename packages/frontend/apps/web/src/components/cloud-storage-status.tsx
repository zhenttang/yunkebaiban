import React from 'react';
import { useCloudStorage } from '@yunke/core/modules/cloud-storage';

interface CloudStorageStatusProps {
  className?: string;
}

export const CloudStorageStatus: React.FC<CloudStorageStatusProps> = ({ className }) => {
  const {
    storageMode,
    isConnected,
    isOnline,
    lastSync,
    pendingOperationsCount,
    reconnect
  } = useCloudStorage();

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
    if (!isOnline) return '网络离线';
    
    switch (storageMode) {
      case 'detecting':
        return '检测中...';
      case 'cloud':
        return '云存储';
      case 'local':
        return '本地存储';
      case 'error':
        return '连接错误';
      default:
        return '未知状态';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#666';
    
    switch (storageMode) {
      case 'detecting':
        return '#ffa500';
      case 'cloud':
        return '#4caf50';
      case 'local':
        return '#2196f3';
      case 'error':
        return '#f44336';
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
    
    if (diffMinutes < 1) return '刚刚同步';
    if (diffMinutes < 60) return `${diffMinutes}分钟前同步`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}小时前同步`;
    return lastSync.toLocaleDateString();
  };

  return (
    <div 
      className={`cloud-storage-status ${className || ''}`}
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        borderRadius: '6px',
        backgroundColor: storageMode === 'cloud' ? '#f0f9ff' : '#fef2f2',
        border: `1px solid ${getStatusColor()}`,
        cursor: storageMode === 'error' || storageMode === 'local' ? 'pointer' : 'default',
        fontSize: '12px',
        color: getStatusColor(),
        transition: 'all 0.2s ease',
        fontWeight: '500',
      }}
      title={`
        状态: ${getStatusText()}
        连接: ${isConnected ? '已连接' : '未连接'}
        网络: ${isOnline ? '在线' : '离线'}
        ${lastSync ? `最后同步: ${formatLastSync()}` : ''}
        ${pendingOperationsCount > 0 ? `排队操作: ${pendingOperationsCount}` : ''}
        ${(storageMode === 'error' || storageMode === 'local') ? '点击重连' : ''}
      `.trim()}
    >
      <span style={{ fontSize: '14px' }}>{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      {pendingOperationsCount > 0 && (
        <span 
          style={{
            backgroundColor: '#ff9800',
            color: 'white',
            borderRadius: '10px',
            padding: '1px 6px',
            fontSize: '10px',
            minWidth: '16px',
            textAlign: 'center'
          }}
        >
          {pendingOperationsCount}
        </span>
      )}
      {storageMode === 'cloud' && lastSync && (
        <span style={{ color: '#666', fontSize: '10px' }}>
          {formatLastSync()}
        </span>
      )}
    </div>
  );
};