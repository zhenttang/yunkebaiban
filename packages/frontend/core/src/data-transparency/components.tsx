import React, { useState, useEffect, useCallback } from 'react';
import { 
  DocumentTransparencyInfo, 
  WorkspaceTransparencyInfo, 
  DataTransparencyConfig 
} from './types';
import { DataTransparencyDetector } from './detector';
import './data-transparency.css';

/**
 * 数据状态指示器图标
 */
const DataStatusIcon: React.FC<{ 
  status: 'available' | 'unavailable' | 'syncing' | 'error' | 'conflict' 
}> = ({ status }) => {
  const icons = {
    available: '✅',
    unavailable: '❌',
    syncing: '🔄',
    error: '⚠️',
    conflict: '⚡',
  };
  
  return <span className={`data-status-icon ${status}`}>{icons[status]}</span>;
};

/**
 * 存储位置指示器
 */
const StorageLocationIndicator: React.FC<{
  location: string;
  available: boolean;
  size?: number;
  lastUpdated?: Date;
}> = ({ location, available, size, lastUpdated }) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={`storage-location ${available ? 'available' : 'unavailable'}`}>
      <div className="location-header">
        <DataStatusIcon status={available ? 'available' : 'unavailable'} />
        <span className="location-name">{location}</span>
      </div>
      <div className="location-details">
        {available && (
          <>
            {size && <span className="size">大小: {formatSize(size)}</span>}
            {lastUpdated && (
              <span className="last-updated">
                更新: {formatTime(lastUpdated)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * 同步状态指示器
 */
const SyncStatusIndicator: React.FC<{
  status: 'synced' | 'pending' | 'failed' | 'conflict' | 'offline';
  description: string;
  progress?: number;
  lastSyncTime?: Date;
}> = ({ status, description, progress, lastSyncTime }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'synced': return 'available';
      case 'pending': return 'syncing';
      case 'failed': return 'error';
      case 'conflict': return 'conflict';
      case 'offline': return 'unavailable';
      default: return 'unavailable';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'synced': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'failed': return '#f44336';
      case 'conflict': return '#9c27b0';
      case 'offline': return '#607d8b';
      default: return '#607d8b';
    }
  };

  return (
    <div className={`sync-status ${status}`}>
      <div className="status-header">
        <DataStatusIcon status={getStatusIcon()} />
        <span className="status-description">{description}</span>
      </div>
      {progress !== undefined && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress}%`, 
                backgroundColor: getStatusColor() 
              }}
            />
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}
      {lastSyncTime && (
        <div className="last-sync">
          上次同步: {new Intl.DateTimeFormat('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(lastSyncTime)}
        </div>
      )}
    </div>
  );
};

/**
 * 数据完整性指示器
 */
const DataIntegrityIndicator: React.FC<{
  status: 'intact' | 'corrupted' | 'partial' | 'missing';
  description: string;
  checkTime: Date;
}> = ({ status, description, checkTime }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'intact': return 'available';
      case 'corrupted': return 'error';
      case 'partial': return 'syncing';
      case 'missing': return 'unavailable';
      default: return 'unavailable';
    }
  };

  return (
    <div className={`integrity-status ${status}`}>
      <div className="status-header">
        <DataStatusIcon status={getStatusIcon()} />
        <span className="status-description">{description}</span>
      </div>
      <div className="check-time">
        检查时间: {new Intl.DateTimeFormat('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(checkTime)}
      </div>
    </div>
  );
};

/**
 * 文档数据透明化组件
 */
export const DocumentDataTransparency: React.FC<{
  docId: string;
  workspaceId: string;
  detector: DataTransparencyDetector;
  compact?: boolean;
}> = ({ docId, workspaceId, detector, compact = false }) => {
  const [transparencyInfo, setTransparencyInfo] = useState<DocumentTransparencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadTransparencyInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await detector.getDocumentTransparencyInfo(docId, workspaceId);
      setTransparencyInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据状态失败');
    } finally {
      setLoading(false);
    }
  }, [docId, workspaceId, detector]);

  useEffect(() => {
    loadTransparencyInfo();
  }, [loadTransparencyInfo]);

  useEffect(() => {
    // 监听数据状态变化
    const handleStatusChange = () => {
      loadTransparencyInfo();
    };

    detector.on('data-status-changed', handleStatusChange);
    detector.on('sync-status-changed', handleStatusChange);
    detector.on('refresh-requested', handleStatusChange);

    return () => {
      detector.off('data-status-changed', handleStatusChange);
      detector.off('sync-status-changed', handleStatusChange);
      detector.off('refresh-requested', handleStatusChange);
    };
  }, [detector, loadTransparencyInfo]);

  if (loading) {
    return (
      <div className="document-transparency loading">
        <div className="loading-spinner">🔄 检测数据状态...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-transparency error">
        <div className="error-message">❌ {error}</div>
        <button className="retry-button" onClick={loadTransparencyInfo}>
          重试
        </button>
      </div>
    );
  }

  if (!transparencyInfo) {
    return (
      <div className="document-transparency empty">
        <div className="empty-message">无数据状态信息</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="document-transparency compact">
        <div className="compact-status">
          <DataStatusIcon 
            status={transparencyInfo.syncStatus.status === 'synced' ? 'available' : 'syncing'} 
          />
          <span className="compact-description">
            {transparencyInfo.locations.cloud.available ? '云端' : '本地'}
          </span>
          {transparencyInfo.offlineOperations.count > 0 && (
            <span className="offline-count">
              {transparencyInfo.offlineOperations.count} 待同步
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="document-transparency">
      <div className="transparency-header">
        <h3 className="document-title">{transparencyInfo.title}</h3>
        <button 
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '收起' : '展开'}
        </button>
        <button className="refresh-button" onClick={loadTransparencyInfo}>
          🔄 刷新
        </button>
      </div>

      <div className="transparency-content">
        {/* 存储位置 */}
        <div className="section">
          <h4>📁 存储位置</h4>
          <div className="storage-locations">
            <StorageLocationIndicator
              location="本地存储"
              available={transparencyInfo.locations.local.available}
              size={transparencyInfo.locations.local.size}
              lastUpdated={transparencyInfo.locations.local.lastUpdated}
            />
            <StorageLocationIndicator
              location="云端存储"
              available={transparencyInfo.locations.cloud.available}
              size={transparencyInfo.locations.cloud.size}
              lastUpdated={transparencyInfo.locations.cloud.lastUpdated}
            />
            <StorageLocationIndicator
              location="离线缓存"
              available={transparencyInfo.locations.cache.available}
              size={transparencyInfo.locations.cache.size}
              lastUpdated={transparencyInfo.locations.cache.lastUpdated}
            />
          </div>
        </div>

        {/* 同步状态 */}
        <div className="section">
          <h4>🔄 同步状态</h4>
          <SyncStatusIndicator
            status={transparencyInfo.syncStatus.status}
            description={transparencyInfo.syncStatus.description}
            progress={transparencyInfo.syncStatus.progress}
            lastSyncTime={transparencyInfo.syncStatus.lastSyncTime}
          />
        </div>

        {/* 数据完整性 */}
        <div className="section">
          <h4>🔒 数据完整性</h4>
          <DataIntegrityIndicator
            status={transparencyInfo.integrity.status}
            description={transparencyInfo.integrity.description}
            checkTime={transparencyInfo.integrity.checkTime}
          />
        </div>

        {/* 离线操作 */}
        {transparencyInfo.offlineOperations.count > 0 && (
          <div className="section">
            <h4>📦 离线操作</h4>
            <div className="offline-operations">
              <div className="operation-summary">
                {transparencyInfo.offlineOperations.count} 个操作待同步
              </div>
              {expanded && (
                <div className="operation-list">
                  {transparencyInfo.offlineOperations.operations.map((op, index) => (
                    <div key={op.id} className="operation-item">
                      <span className="operation-type">{op.type}</span>
                      <span className="operation-time">
                        {new Intl.DateTimeFormat('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(op.timestamp)}
                      </span>
                      <span className="operation-size">
                        {op.size < 1024 ? `${op.size}B` : `${(op.size/1024).toFixed(1)}KB`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 版本信息 */}
        {expanded && (
          <div className="section">
            <h4>📋 版本信息</h4>
            <div className="version-info">
              <div className="version-item">
                <span className="version-label">本地版本:</span>
                <span className="version-value">
                  {transparencyInfo.version.local || '无'}
                </span>
              </div>
              <div className="version-item">
                <span className="version-label">云端版本:</span>
                <span className="version-value">
                  {transparencyInfo.version.cloud || '无'}
                </span>
              </div>
              <div className="version-item">
                <span className="version-label">版本一致:</span>
                <span className={`version-value ${transparencyInfo.version.isConsistent ? 'consistent' : 'inconsistent'}`}>
                  {transparencyInfo.version.isConsistent ? '是' : '否'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 工作空间数据透明化组件
 */
export const WorkspaceDataTransparency: React.FC<{
  workspaceId: string;
  detector: DataTransparencyDetector;
}> = ({ workspaceId, detector }) => {
  const [transparencyInfo, setTransparencyInfo] = useState<WorkspaceTransparencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const loadTransparencyInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await detector.getWorkspaceTransparencyInfo(workspaceId);
      setTransparencyInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载工作空间状态失败');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, detector]);

  useEffect(() => {
    loadTransparencyInfo();
  }, [loadTransparencyInfo]);

  const toggleDocExpansion = (docId: string) => {
    setExpandedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="workspace-transparency loading">
        <div className="loading-spinner">🔄 检测工作空间状态...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-transparency error">
        <div className="error-message">❌ {error}</div>
        <button className="retry-button" onClick={loadTransparencyInfo}>
          重试
        </button>
      </div>
    );
  }

  if (!transparencyInfo) {
    return (
      <div className="workspace-transparency empty">
        <div className="empty-message">无工作空间状态信息</div>
      </div>
    );
  }

  return (
    <div className="workspace-transparency">
      <div className="transparency-header">
        <h2 className="workspace-title">{transparencyInfo.name}</h2>
        <button className="refresh-button" onClick={loadTransparencyInfo}>
          🔄 刷新
        </button>
      </div>

      <div className="transparency-content">
        {/* 存储摘要 */}
        <div className="section">
          <h3>📊 存储摘要</h3>
          <div className="storage-summary">
            <div className="summary-item">
              <span className="summary-label">文档总数:</span>
              <span className="summary-value">{transparencyInfo.storage.documents}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">本地存储:</span>
              <span className="summary-value">
                {transparencyInfo.storage.total.local > 0 
                  ? `${(transparencyInfo.storage.total.local / (1024 * 1024)).toFixed(1)}MB`
                  : '0MB'
                }
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">云端存储:</span>
              <span className="summary-value">
                {transparencyInfo.storage.total.cloud > 0 
                  ? `${(transparencyInfo.storage.total.cloud / (1024 * 1024)).toFixed(1)}MB`
                  : '0MB'
                }
              </span>
            </div>
          </div>
        </div>

        {/* 同步摘要 */}
        <div className="section">
          <h3>🔄 同步摘要</h3>
          <div className="sync-summary">
            <div className="summary-item">
              <span className="summary-label">已同步:</span>
              <span className="summary-value">{transparencyInfo.syncSummary.syncedDocs}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">待同步:</span>
              <span className="summary-value">{transparencyInfo.syncSummary.pendingDocs}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">同步失败:</span>
              <span className="summary-value">{transparencyInfo.syncSummary.failedDocs}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">离线操作:</span>
              <span className="summary-value">{transparencyInfo.syncSummary.offlineOperations}</span>
            </div>
          </div>
        </div>

        {/* 连接状态 */}
        <div className="section">
          <h3>🌐 连接状态</h3>
          <div className="connection-status">
            <div className="status-item">
              <DataStatusIcon 
                status={transparencyInfo.connection.isOnline ? 'available' : 'unavailable'} 
              />
              <span className="status-label">网络连接</span>
              <span className="status-value">
                {transparencyInfo.connection.isOnline ? '在线' : '离线'}
              </span>
            </div>
            <div className="status-item">
              <DataStatusIcon 
                status={transparencyInfo.connection.isCloudConnected ? 'available' : 'unavailable'} 
              />
              <span className="status-label">云端连接</span>
              <span className="status-value">
                {transparencyInfo.connection.isCloudConnected ? '已连接' : '未连接'}
              </span>
            </div>
          </div>
        </div>

        {/* 文档列表 */}
        <div className="section">
          <h3>📄 文档列表</h3>
          <div className="documents-list">
            {transparencyInfo.documents.map((doc) => (
              <div key={doc.docId} className="document-item">
                <div className="document-header" onClick={() => toggleDocExpansion(doc.docId)}>
                  <span className="document-title">{doc.title}</span>
                  <div className="document-status">
                    <DataStatusIcon 
                      status={doc.syncStatus.status === 'synced' ? 'available' : 'syncing'} 
                    />
                    <span className="status-text">
                      {doc.locations.cloud.available ? '云端' : '本地'}
                    </span>
                    {doc.offlineOperations.count > 0 && (
                      <span className="offline-badge">
                        {doc.offlineOperations.count} 待同步
                      </span>
                    )}
                  </div>
                  <button className="expand-button">
                    {expandedDocs.has(doc.docId) ? '▼' : '▶'}
                  </button>
                </div>
                {expandedDocs.has(doc.docId) && (
                  <div className="document-details">
                    <DocumentDataTransparency
                      docId={doc.docId}
                      workspaceId={workspaceId}
                      detector={detector}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 数据透明化控制面板
 */
export const DataTransparencyPanel: React.FC<{
  workspaceId: string;
  config: DataTransparencyConfig;
  onConfigChange: (config: DataTransparencyConfig) => void;
}> = ({ workspaceId, config, onConfigChange }) => {
  const [detector] = useState(() => new DataTransparencyDetector(config));
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      detector.initialize().then(() => {
        setIsInitialized(true);
      });
    }

    return () => {
      detector.destroy();
    };
  }, [detector, isInitialized]);

  const handleConfigChange = (key: keyof DataTransparencyConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    onConfigChange(newConfig);
  };

  if (!isInitialized) {
    return (
      <div className="data-transparency-panel loading">
        <div className="loading-spinner">🔄 初始化数据透明化系统...</div>
      </div>
    );
  }

  return (
    <div className="data-transparency-panel">
      <div className="panel-header">
        <h2>📊 数据透明化面板</h2>
        <div className="panel-controls">
          <label>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => handleConfigChange('enabled', e.target.checked)}
            />
            启用数据透明化
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.showDetails}
              onChange={(e) => handleConfigChange('showDetails', e.target.checked)}
            />
            显示详细信息
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.showDebugInfo}
              onChange={(e) => handleConfigChange('showDebugInfo', e.target.checked)}
            />
            显示调试信息
          </label>
        </div>
      </div>

      {config.enabled && (
        <div className="panel-content">
          <WorkspaceDataTransparency
            workspaceId={workspaceId}
            detector={detector}
          />
        </div>
      )}
    </div>
  );
};