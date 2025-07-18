/**
 * AFFiNE 数据透明化集成方案
 * 
 * 这个文件定义了如何将数据透明化系统集成到 AFFiNE 界面中
 * 包括具体的集成位置、组件设计和用户体验优化
 */

import React, { useState, useEffect } from 'react';
import { 
  DocumentDataTransparency, 
  WorkspaceDataTransparency,
  useDataTransparency,
  useDocumentDataTransparency,
  getDataTransparencyService,
  DEFAULT_DATA_TRANSPARENCY_CONFIG
} from '../data-transparency';

// 集成方案概述
export const INTEGRATION_PLAN = {
  // 1. 页面头部集成点
  HEADER_INTEGRATION: {
    location: '/desktop/pages/workspace/detail-page/detail-page-header.tsx',
    position: 'next-to-title',
    component: 'DocumentStatusIndicator',
    description: '在文档标题旁显示数据状态指示器'
  },
  
  // 2. 侧边栏集成点
  SIDEBAR_INTEGRATION: {
    location: '/components/root-app-sidebar/index.tsx',
    position: 'workspace-section',
    component: 'WorkspaceDataPanel',
    description: '在工作空间侧边栏添加数据透明化面板'
  },
  
  // 3. 右侧工具栏集成点
  TOOLBAR_INTEGRATION: {
    location: '/modules/workbench/view/sidebar/sidebar-container.tsx',
    position: 'sidebar-tab',
    component: 'DocumentDataPanel',
    description: '在右侧工具栏添加数据透明化标签页'
  },
  
  // 4. 状态栏集成点
  STATUS_BAR_INTEGRATION: {
    location: '/components/page-detail-editor.tsx',
    position: 'editor-footer',
    component: 'EditorStatusBar',
    description: '在编辑器底部添加状态栏'
  }
};

/**
 * 1. 文档标题旁的数据状态指示器
 * 集成位置：detail-page-header.tsx
 */
export const DocumentStatusIndicator: React.FC<{
  docId: string;
  workspaceId: string;
  className?: string;
}> = ({ docId, workspaceId, className = '' }) => {
  const {
    isSynced,
    isAvailableLocally,
    isAvailableInCloud,
    hasOfflineOperations,
    getSyncProgress,
    refresh,
  } = useDocumentDataTransparency(docId, workspaceId, DEFAULT_DATA_TRANSPARENCY_CONFIG);

  const [showTooltip, setShowTooltip] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // 获取主要状态图标
  const getMainStatusIcon = () => {
    if (hasOfflineOperations) return '⚠️';
    if (isSynced) return '✅';
    if (isAvailableInCloud) return '🔄';
    if (isAvailableLocally) return '💾';
    return '❌';
  };

  // 获取状态描述
  const getStatusDescription = () => {
    if (hasOfflineOperations) return '有离线操作待同步';
    if (isSynced) return '已同步到云端';
    if (isAvailableInCloud) return '同步中';
    if (isAvailableLocally) return '仅本地存储';
    return '数据不可用';
  };

  // 获取存储位置标识
  const getStorageIndicators = () => {
    const indicators: string[] = [];
    if (isAvailableLocally) indicators.push('📱');
    if (isAvailableInCloud) indicators.push('☁️');
    return indicators;
  };

  return (
    <div className={`document-status-indicator ${className}`}>
      {/* 主状态指示器 */}
      <button
        className="status-button"
        onClick={() => setShowDetailPanel(!showDetailPanel)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={getStatusDescription()}
      >
        <span className="main-status">{getMainStatusIcon()}</span>
        <span className="storage-indicators">
          {getStorageIndicators().join('')}
        </span>
        {hasOfflineOperations && (
          <span className="offline-count">
            {/* 显示离线操作数量 */}
          </span>
        )}
      </button>

      {/* 悬浮提示 */}
      {showTooltip && (
        <div className="status-tooltip">
          <div className="tooltip-content">
            <div className="status-line">
              <span className="label">状态:</span>
              <span className="value">{getStatusDescription()}</span>
            </div>
            <div className="status-line">
              <span className="label">存储:</span>
              <span className="value">
                {isAvailableLocally && '本地 '}
                {isAvailableInCloud && '云端 '}
                {!isAvailableLocally && !isAvailableInCloud && '无'}
              </span>
            </div>
            {!isSynced && (
              <div className="status-line">
                <span className="label">进度:</span>
                <span className="value">{getSyncProgress()}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 详细面板 */}
      {showDetailPanel && (
        <div className="status-detail-panel">
          <DocumentDataTransparency
            docId={docId}
            workspaceId={workspaceId}
            detector={getDataTransparencyService().getDetector(workspaceId)}
            compact={false}
          />
        </div>
      )}
    </div>
  );
};

/**
 * 2. 工作空间侧边栏的数据透明化面板
 * 集成位置：root-app-sidebar/index.tsx
 */
export const WorkspaceDataPanel: React.FC<{
  workspaceId: string;
  isCollapsed?: boolean;
}> = ({ workspaceId, isCollapsed = false }) => {
  const {
    workspaceInfo,
    loading,
    error,
    isCloudConnected,
    hasOfflineOperations,
    getSyncedDocumentsCount,
    getPendingDocumentsCount,
    refresh,
  } = useDataTransparency(workspaceId, DEFAULT_DATA_TRANSPARENCY_CONFIG);

  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) return <div className="workspace-data-loading">检测中...</div>;
  if (error) return <div className="workspace-data-error">检测失败</div>;

  return (
    <div className={`workspace-data-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 折叠状态下的简要显示 */}
      {isCollapsed ? (
        <div className="collapsed-indicator">
          <button
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
            title="数据透明化"
          >
            <span className="icon">📊</span>
            <span className="status-dot">
              {isCloudConnected() ? '🟢' : '🔴'}
            </span>
          </button>
        </div>
      ) : (
        <>
          {/* 展开状态下的详细显示 */}
          <div className="panel-header">
            <button
              className="panel-toggle"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="icon">📊</span>
              <span className="title">数据状态</span>
              <span className="arrow">{isExpanded ? '▼' : '▶'}</span>
            </button>
          </div>

          {/* 简要状态 */}
          <div className="status-summary">
            <div className="status-item">
              <span className="label">连接:</span>
              <span className={`value ${isCloudConnected() ? 'connected' : 'disconnected'}`}>
                {isCloudConnected() ? '✅ 已连接' : '❌ 未连接'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">同步:</span>
              <span className="value">
                {getSyncedDocumentsCount()}/{getSyncedDocumentsCount() + getPendingDocumentsCount()}
              </span>
            </div>
            {hasOfflineOperations() && (
              <div className="status-item warning">
                <span className="label">离线:</span>
                <span className="value">⚠️ 有待同步操作</span>
              </div>
            )}
          </div>

          {/* 详细面板 */}
          {isExpanded && (
            <div className="detailed-panel">
              <WorkspaceDataTransparency
                workspaceId={workspaceId}
                detector={getDataTransparencyService().getDetector(workspaceId)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * 3. 右侧工具栏的数据透明化标签页
 * 集成位置：sidebar-container.tsx
 */
export const DocumentDataTab: React.FC<{
  docId: string;
  workspaceId: string;
  isActive?: boolean;
  onActivate?: () => void;
}> = ({ docId, workspaceId, isActive = false, onActivate }) => {
  const {
    documentInfo,
    loading,
    error,
    isSynced,
    hasOfflineOperations,
  } = useDocumentDataTransparency(docId, workspaceId, DEFAULT_DATA_TRANSPARENCY_CONFIG);

  const getTabIcon = () => {
    if (loading) return '🔄';
    if (error) return '❌';
    if (hasOfflineOperations) return '⚠️';
    if (isSynced) return '✅';
    return '📊';
  };

  return (
    <div className="document-data-tab">
      {/* 标签页头部 */}
      <button
        className={`tab-header ${isActive ? 'active' : ''}`}
        onClick={onActivate}
      >
        <span className="tab-icon">{getTabIcon()}</span>
        <span className="tab-title">数据状态</span>
        {hasOfflineOperations && (
          <span className="notification-badge">!</span>
        )}
      </button>

      {/* 标签页内容 */}
      {isActive && (
        <div className="tab-content">
          {loading ? (
            <div className="loading-state">检测数据状态...</div>
          ) : error ? (
            <div className="error-state">检测失败: {error}</div>
          ) : (
            <DocumentDataTransparency
              docId={docId}
              workspaceId={workspaceId}
              detector={getDataTransparencyService().getDetector(workspaceId)}
              compact={false}
            />
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 4. 编辑器状态栏
 * 集成位置：page-detail-editor.tsx
 */
export const EditorStatusBar: React.FC<{
  docId: string;
  workspaceId: string;
  className?: string;
}> = ({ docId, workspaceId, className = '' }) => {
  const {
    isSynced,
    isAvailableLocally,
    isAvailableInCloud,
    hasOfflineOperations,
    getSyncProgress,
    documentInfo,
  } = useDocumentDataTransparency(docId, workspaceId, DEFAULT_DATA_TRANSPARENCY_CONFIG);

  const [showDetails, setShowDetails] = useState(false);

  // 获取状态文本
  const getStatusText = () => {
    if (hasOfflineOperations) return '有离线操作待同步';
    if (isSynced) return '已保存到云端';
    if (isAvailableInCloud) return '同步中...';
    if (isAvailableLocally) return '已保存到本地';
    return '未保存';
  };

  // 获取最后更新时间
  const getLastUpdateTime = () => {
    if (documentInfo?.locations.cloud.lastUpdated) {
      return new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(documentInfo.locations.cloud.lastUpdated);
    }
    return null;
  };

  return (
    <div className={`editor-status-bar ${className}`}>
      <div className="status-bar-content">
        {/* 主要状态 */}
        <div className="main-status">
          <span className="status-icon">
            {hasOfflineOperations ? '⚠️' : isSynced ? '✅' : '🔄'}
          </span>
          <span className="status-text">{getStatusText()}</span>
        </div>

        {/* 同步进度 */}
        {!isSynced && (
          <div className="sync-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getSyncProgress()}%` }}
              />
            </div>
            <span className="progress-text">{getSyncProgress()}%</span>
          </div>
        )}

        {/* 最后更新时间 */}
        {getLastUpdateTime() && (
          <div className="last-update">
            <span className="update-text">上次同步: {getLastUpdateTime()}</span>
          </div>
        )}

        {/* 存储位置指示器 */}
        <div className="storage-indicators">
          {isAvailableLocally && (
            <span className="storage-indicator local" title="本地存储">📱</span>
          )}
          {isAvailableInCloud && (
            <span className="storage-indicator cloud" title="云端存储">☁️</span>
          )}
        </div>

        {/* 详细信息按钮 */}
        <button
          className="details-button"
          onClick={() => setShowDetails(!showDetails)}
          title="查看详细信息"
        >
          <span className="details-icon">ℹ️</span>
        </button>
      </div>

      {/* 详细信息面板 */}
      {showDetails && (
        <div className="status-details-panel">
          <DocumentDataTransparency
            docId={docId}
            workspaceId={workspaceId}
            detector={getDataTransparencyService().getDetector(workspaceId)}
            compact={true}
          />
        </div>
      )}
    </div>
  );
};

/**
 * 5. 全局数据透明化设置面板
 * 集成位置：设置页面
 */
export const DataTransparencySettings: React.FC<{
  workspaceId: string;
}> = ({ workspaceId }) => {
  const [config, setConfig] = useState(DEFAULT_DATA_TRANSPARENCY_CONFIG);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfigChange = async (newConfig: typeof config) => {
    setIsLoading(true);
    try {
      setConfig(newConfig);
      getDataTransparencyService().updateConfig(newConfig);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="data-transparency-settings">
      <h3>数据透明化设置</h3>
      
      <div className="settings-section">
        <h4>显示选项</h4>
        <label>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleConfigChange({ ...config, enabled: e.target.checked })}
          />
          启用数据透明化
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.showDetails}
            onChange={(e) => handleConfigChange({ ...config, showDetails: e.target.checked })}
          />
          显示详细信息
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.showDebugInfo}
            onChange={(e) => handleConfigChange({ ...config, showDebugInfo: e.target.checked })}
          />
          显示调试信息
        </label>
      </div>

      <div className="settings-section">
        <h4>更新频率</h4>
        <select
          value={config.refreshInterval}
          onChange={(e) => handleConfigChange({ ...config, refreshInterval: Number(e.target.value) })}
        >
          <option value={5000}>5秒</option>
          <option value={10000}>10秒</option>
          <option value={30000}>30秒</option>
          <option value={60000}>1分钟</option>
        </select>
      </div>

      <div className="settings-section">
        <h4>检查深度</h4>
        <select
          value={config.checkDepth}
          onChange={(e) => handleConfigChange({ ...config, checkDepth: e.target.value as any })}
        >
          <option value="basic">基础</option>
          <option value="detailed">详细</option>
          <option value="comprehensive">全面</option>
        </select>
      </div>

      {isLoading && (
        <div className="loading-indicator">正在保存设置...</div>
      )}
    </div>
  );
};

/**
 * 集成位置映射
 */
export const INTEGRATION_LOCATIONS = {
  // 文档头部状态指示器
  DOCUMENT_HEADER: {
    file: '/desktop/pages/workspace/detail-page/detail-page-header.tsx',
    insertion: 'after-title',
    component: DocumentStatusIndicator,
  },
  
  // 工作空间侧边栏
  WORKSPACE_SIDEBAR: {
    file: '/components/root-app-sidebar/index.tsx',
    insertion: 'workspace-section',
    component: WorkspaceDataPanel,
  },
  
  // 右侧工具栏
  DOCUMENT_SIDEBAR: {
    file: '/modules/workbench/view/sidebar/sidebar-container.tsx',
    insertion: 'sidebar-tabs',
    component: DocumentDataTab,
  },
  
  // 编辑器状态栏
  EDITOR_STATUS: {
    file: '/components/page-detail-editor.tsx',
    insertion: 'editor-footer',
    component: EditorStatusBar,
  },
  
  // 设置页面
  SETTINGS_PANEL: {
    file: '/desktop/pages/workspace/settings/data-transparency.tsx',
    insertion: 'settings-content',
    component: DataTransparencySettings,
  },
};