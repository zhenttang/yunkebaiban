import React from 'react';
import { useCloudStorage } from '@yunke/core/modules/cloud-storage';

interface WorkspaceCloudStatusProps {
  className?: string;
}

/**
 * 工作空间云存储状态组件 - 用于替代左上角的原生同步状态
 */
export const WorkspaceCloudStatus: React.FC<WorkspaceCloudStatusProps> = ({ className }) => {
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
        return '连接中...';
      case 'cloud':
        return '已连接云端';
      case 'local':
        return '本地模式';
      case 'error':
        return '连接失败';
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
    
    if (diffMinutes < 1) return '刚刚同步';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    return lastSync.toLocaleDateString();
  };

  // 如果是云存储模式且有待处理操作，显示同步中状态
  const isActiveSyncing = storageMode === 'cloud' && pendingOperationsCount > 0;
  const displayText = isActiveSyncing ? '同步中...' : getStatusText();

  return (
    <div 
      className={`workspace-cloud-status ${className || ''}`}
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: `1px solid rgba(${getStatusColor() === '#10b981' ? '16, 185, 129' : getStatusColor() === '#ef4444' ? '239, 68, 68' : getStatusColor() === '#ffa500' ? '255, 165, 0' : '107, 114, 128'}, 0.3)`,
        cursor: storageMode === 'error' || storageMode === 'local' ? 'pointer' : 'default',
        fontSize: '12px',
        color: getStatusColor(),
        transition: 'all 0.3s ease',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(12px)',
        maxWidth: '200px',
        opacity: 0.9,
        transform: 'scale(0.95)',
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
      <span style={{ 
        fontSize: '14px',
        animation: isActiveSyncing ? 'spin 1s linear infinite' : 'none'
      }}>
        {getStatusIcon()}
      </span>
      <span>{displayText}</span>
      {pendingOperationsCount > 0 && (
        <span 
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            color: 'white',
            borderRadius: '8px',
            padding: '1px 4px',
            fontSize: '10px',
            minWidth: '14px',
            textAlign: 'center',
            fontWeight: '600'
          }}
        >
          {pendingOperationsCount}
        </span>
      )}
      {storageMode === 'cloud' && lastSync && !isActiveSyncing && (
        <span style={{ color: 'rgba(107, 114, 128, 0.8)', fontSize: '10px' }}>
          {formatLastSync()}
        </span>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
