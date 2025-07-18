import React, { useState, useEffect } from 'react';
import {
  DataTransparencyPanel,
  DocumentDataTransparency,
  WorkspaceDataTransparency,
  useDataTransparency,
  useDocumentDataTransparency,
  getDataTransparencyService,
  DEFAULT_DATA_TRANSPARENCY_CONFIG,
  DataTransparencyConfig,
} from './index';

/**
 * 数据透明化使用示例
 */

/**
 * 示例1: 基本的文档数据透明化显示
 */
export const DocumentTransparencyExample: React.FC<{
  docId: string;
  workspaceId: string;
}> = ({ docId, workspaceId }) => {
  const [config, setConfig] = useState<DataTransparencyConfig>(DEFAULT_DATA_TRANSPARENCY_CONFIG);
  
  const {
    documentInfo,
    loading,
    error,
    refresh,
    isSynced,
    isAvailableLocally,
    isAvailableInCloud,
    hasOfflineOperations,
  } = useDocumentDataTransparency(docId, workspaceId, config);

  if (loading) return <div>检测数据状态...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h3>文档数据透明化示例</h3>
      
      {/* 简单状态显示 */}
      <div style={{ marginBottom: '16px' }}>
        <div>同步状态: {isSynced ? '✅ 已同步' : '⏳ 未同步'}</div>
        <div>本地存储: {isAvailableLocally ? '✅ 可用' : '❌ 不可用'}</div>
        <div>云端存储: {isAvailableInCloud ? '✅ 可用' : '❌ 不可用'}</div>
        <div>离线操作: {hasOfflineOperations ? '⚠️ 有待同步操作' : '✅ 无待同步操作'}</div>
      </div>

      {/* 详细信息组件 */}
      <DocumentDataTransparency
        docId={docId}
        workspaceId={workspaceId}
        detector={getDataTransparencyService(config).getDetector(workspaceId)}
      />
      
      <button onClick={refresh}>刷新状态</button>
    </div>
  );
};

/**
 * 示例2: 工作空间数据透明化显示
 */
export const WorkspaceTransparencyExample: React.FC<{
  workspaceId: string;
}> = ({ workspaceId }) => {
  const [config, setConfig] = useState<DataTransparencyConfig>(DEFAULT_DATA_TRANSPARENCY_CONFIG);
  
  const {
    workspaceInfo,
    loading,
    error,
    refresh,
    isCloudConnected,
    hasOfflineOperations,
    getSyncedDocumentsCount,
    getPendingDocumentsCount,
  } = useDataTransparency(workspaceId, config);

  if (loading) return <div>检测工作空间状态...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <h3>工作空间数据透明化示例</h3>
      
      {/* 状态摘要 */}
      <div style={{ marginBottom: '16px' }}>
        <div>云端连接: {isCloudConnected() ? '✅ 已连接' : '❌ 未连接'}</div>
        <div>离线操作: {hasOfflineOperations() ? '⚠️ 有待同步操作' : '✅ 无待同步操作'}</div>
        <div>已同步文档: {getSyncedDocumentsCount()}</div>
        <div>待同步文档: {getPendingDocumentsCount()}</div>
      </div>

      {/* 详细信息组件 */}
      <WorkspaceDataTransparency
        workspaceId={workspaceId}
        detector={getDataTransparencyService(config).getDetector(workspaceId)}
      />
      
      <button onClick={refresh}>刷新状态</button>
    </div>
  );
};

/**
 * 示例3: 完整的数据透明化控制面板
 */
export const DataTransparencyControlPanelExample: React.FC<{
  workspaceId: string;
}> = ({ workspaceId }) => {
  const [config, setConfig] = useState<DataTransparencyConfig>(DEFAULT_DATA_TRANSPARENCY_CONFIG);

  const handleConfigChange = (newConfig: DataTransparencyConfig) => {
    setConfig(newConfig);
    // 更新全局服务配置
    getDataTransparencyService().updateConfig(newConfig);
  };

  return (
    <div>
      <h3>数据透明化控制面板示例</h3>
      <DataTransparencyPanel
        workspaceId={workspaceId}
        config={config}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
};

/**
 * 示例4: 紧凑模式的数据状态显示
 */
export const CompactDataStatusExample: React.FC<{
  docId: string;
  workspaceId: string;
}> = ({ docId, workspaceId }) => {
  const config = DEFAULT_DATA_TRANSPARENCY_CONFIG;
  const detector = getDataTransparencyService(config).getDetector(workspaceId);

  return (
    <div>
      <h3>紧凑模式数据状态</h3>
      <DocumentDataTransparency
        docId={docId}
        workspaceId={workspaceId}
        detector={detector}
        compact={true}
      />
    </div>
  );
};

/**
 * 示例5: 数据透明化服务的高级用法
 */
export const DataTransparencyServiceExample: React.FC = () => {
  const [globalSummary, setGlobalSummary] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const service = getDataTransparencyService(DEFAULT_DATA_TRANSPARENCY_CONFIG);
        await service.initialize();
        
        // 获取全局摘要
        const summary = await service.getGlobalTransparencySummary();
        setGlobalSummary(summary);
        
        // 获取统计信息
        const stats = service.getStatistics();
        setStatistics(stats);
        
        setLoading(false);
      } catch (error) {
        console.error('加载数据透明化服务失败:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRefreshAll = async () => {
    const service = getDataTransparencyService();
    await service.refreshAll();
    
    // 重新加载数据
    const summary = await service.getGlobalTransparencySummary();
    setGlobalSummary(summary);
  };

  if (loading) return <div>加载数据透明化服务...</div>;

  return (
    <div>
      <h3>数据透明化服务示例</h3>
      
      {/* 全局摘要 */}
      {globalSummary && (
        <div style={{ marginBottom: '16px' }}>
          <h4>全局摘要</h4>
          <div>总工作空间数: {globalSummary.totalWorkspaces}</div>
          <div>总文档数: {globalSummary.totalDocuments}</div>
          <div>已同步文档: {globalSummary.syncedDocuments}</div>
          <div>待同步文档: {globalSummary.pendingDocuments}</div>
          <div>离线操作: {globalSummary.offlineOperations}</div>
          <div>
            存储使用: 本地({(globalSummary.storageUsage.local / 1024 / 1024).toFixed(1)}MB) 
            云端({(globalSummary.storageUsage.cloud / 1024 / 1024).toFixed(1)}MB) 
            缓存({(globalSummary.storageUsage.cache / 1024 / 1024).toFixed(1)}MB)
          </div>
        </div>
      )}
      
      {/* 统计信息 */}
      {statistics && (
        <div style={{ marginBottom: '16px' }}>
          <h4>系统统计</h4>
          <div>活跃检测器: {statistics.activeDetectors}</div>
          <div>初始化状态: {statistics.isInitialized ? '✅ 已初始化' : '❌ 未初始化'}</div>
          <div>运行时间: {Math.floor(statistics.uptime / 1000)}秒</div>
          <div>配置状态: {statistics.config.enabled ? '✅ 已启用' : '❌ 已禁用'}</div>
        </div>
      )}
      
      <button onClick={handleRefreshAll}>刷新所有数据</button>
    </div>
  );
};

/**
 * 示例6: 集成到现有页面组件
 */
export const DocumentPageWithTransparency: React.FC<{
  docId: string;
  workspaceId: string;
}> = ({ docId, workspaceId }) => {
  const [showTransparency, setShowTransparency] = useState(false);
  const config = DEFAULT_DATA_TRANSPARENCY_CONFIG;
  
  const {
    documentInfo,
    isSynced,
    hasOfflineOperations,
  } = useDocumentDataTransparency(docId, workspaceId, config);

  return (
    <div>
      {/* 文档编辑器区域 */}
      <div style={{ border: '1px solid #ccc', padding: '16px', marginBottom: '16px' }}>
        <h3>文档编辑器</h3>
        <p>这里是文档内容编辑区域...</p>
      </div>
      
      {/* 数据状态指示器 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '16px',
        padding: '8px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        <span>数据状态:</span>
        <span style={{ color: isSynced ? '#4caf50' : '#ff9800' }}>
          {isSynced ? '✅ 已同步' : '⏳ 同步中'}
        </span>
        {hasOfflineOperations && (
          <span style={{ color: '#ff9800' }}>
            ⚠️ 有离线操作待同步
          </span>
        )}
        <button 
          onClick={() => setShowTransparency(!showTransparency)}
          style={{ marginLeft: 'auto' }}
        >
          {showTransparency ? '隐藏' : '显示'}数据详情
        </button>
      </div>
      
      {/* 数据透明化面板 */}
      {showTransparency && (
        <DocumentDataTransparency
          docId={docId}
          workspaceId={workspaceId}
          detector={getDataTransparencyService(config).getDetector(workspaceId)}
        />
      )}
    </div>
  );
};

/**
 * 主应用示例
 */
export const DataTransparencyApp: React.FC = () => {
  const [currentWorkspaceId] = useState('workspace-1');
  const [currentDocId] = useState('doc-1');

  return (
    <div style={{ padding: '20px' }}>
      <h1>数据透明化系统演示</h1>
      
      <div style={{ marginBottom: '32px' }}>
        <DocumentTransparencyExample
          docId={currentDocId}
          workspaceId={currentWorkspaceId}
        />
      </div>
      
      <div style={{ marginBottom: '32px' }}>
        <WorkspaceTransparencyExample
          workspaceId={currentWorkspaceId}
        />
      </div>
      
      <div style={{ marginBottom: '32px' }}>
        <DataTransparencyControlPanelExample
          workspaceId={currentWorkspaceId}
        />
      </div>
      
      <div style={{ marginBottom: '32px' }}>
        <CompactDataStatusExample
          docId={currentDocId}
          workspaceId={currentWorkspaceId}
        />
      </div>
      
      <div style={{ marginBottom: '32px' }}>
        <DataTransparencyServiceExample />
      </div>
      
      <div style={{ marginBottom: '32px' }}>
        <DocumentPageWithTransparency
          docId={currentDocId}
          workspaceId={currentWorkspaceId}
        />
      </div>
    </div>
  );
};

export default DataTransparencyApp;