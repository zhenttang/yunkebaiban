import { useState, useEffect, useCallback, useRef } from 'react';
import { DataTransparencyDetector } from './detector';
import { 
  DataTransparencyConfig, 
  DocumentTransparencyInfo, 
  WorkspaceTransparencyInfo 
} from './types';

/**
 * 数据透明化 React Hook
 * 提供响应式的数据透明化状态管理
 */
export const useDataTransparency = (
  workspaceId: string,
  config: DataTransparencyConfig
) => {
  const [detector] = useState(() => new DataTransparencyDetector(config));
  const [isInitialized, setIsInitialized] = useState(false);
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceTransparencyInfo | null>(null);
  const [documentInfos, setDocumentInfos] = useState<Map<string, DocumentTransparencyInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化检测器
  useEffect(() => {
    if (!isInitialized) {
      detector.initialize()
        .then(() => {
          setIsInitialized(true);
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : '初始化失败');
          setLoading(false);
        });
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      detector.destroy();
    };
  }, [detector, isInitialized]);

  // 加载工作空间信息
  const loadWorkspaceInfo = useCallback(async () => {
    if (!isInitialized || !workspaceId) return;

    try {
      setError(null);
      const info = await detector.getWorkspaceTransparencyInfo(workspaceId);
      setWorkspaceInfo(info);
      
      // 同时更新文档信息Map
      const newDocumentInfos = new Map<string, DocumentTransparencyInfo>();
      info.documents.forEach(doc => {
        newDocumentInfos.set(doc.docId, doc);
      });
      setDocumentInfos(newDocumentInfos);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载工作空间信息失败');
    }
  }, [detector, workspaceId, isInitialized]);

  // 加载单个文档信息
  const loadDocumentInfo = useCallback(async (docId: string) => {
    if (!isInitialized || !workspaceId) return;

    try {
      const info = await detector.getDocumentTransparencyInfo(docId, workspaceId);
      setDocumentInfos(prev => new Map(prev).set(docId, info));
      return info;
    } catch (err) {
      console.error('加载文档信息失败:', err);
      throw err;
    }
  }, [detector, workspaceId, isInitialized]);

  // 刷新所有数据
  const refresh = useCallback(async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    try {
      await loadWorkspaceInfo();
    } finally {
      setLoading(false);
    }
  }, [loadWorkspaceInfo, isInitialized]);

  // 监听数据变化
  useEffect(() => {
    if (!isInitialized) return;

    const handleDataStatusChange = (event: any) => {
      // 更新对应的文档信息
      if (event.docId) {
        loadDocumentInfo(event.docId);
      }
    };

    const handleSyncStatusChange = (event: any) => {
      // 更新同步状态
      if (event.docId) {
        loadDocumentInfo(event.docId);
      }
    };

    const handleRefreshRequested = () => {
      loadWorkspaceInfo();
    };

    detector.on('data-status-changed', handleDataStatusChange);
    detector.on('sync-status-changed', handleSyncStatusChange);
    detector.on('refresh-requested', handleRefreshRequested);

    return () => {
      detector.off('data-status-changed', handleDataStatusChange);
      detector.off('sync-status-changed', handleSyncStatusChange);
      detector.off('refresh-requested', handleRefreshRequested);
    };
  }, [detector, isInitialized, loadWorkspaceInfo, loadDocumentInfo]);

  // 初始加载
  useEffect(() => {
    if (isInitialized && workspaceId) {
      loadWorkspaceInfo();
    }
  }, [isInitialized, workspaceId, loadWorkspaceInfo]);

  // 返回API
  return {
    // 状态
    isInitialized,
    loading,
    error,
    workspaceInfo,
    documentInfos,
    
    // 方法
    refresh,
    loadDocumentInfo,
    loadWorkspaceInfo,
    
    // 检测器实例
    detector,
    
    // 便捷方法
    getDocumentInfo: (docId: string) => documentInfos.get(docId),
    isDocumentSynced: (docId: string) => {
      const info = documentInfos.get(docId);
      return info?.syncStatus.status === 'synced';
    },
    hasOfflineOperations: () => {
      return workspaceInfo?.syncSummary.offlineOperations > 0;
    },
    isCloudConnected: () => {
      return workspaceInfo?.connection.isCloudConnected || false;
    },
    getSyncedDocumentsCount: () => {
      return workspaceInfo?.syncSummary.syncedDocs || 0;
    },
    getPendingDocumentsCount: () => {
      return workspaceInfo?.syncSummary.pendingDocs || 0;
    },
  };
};

/**
 * 文档级别的数据透明化 Hook
 */
export const useDocumentDataTransparency = (
  docId: string,
  workspaceId: string,
  config: DataTransparencyConfig
) => {
  const [detector] = useState(() => new DataTransparencyDetector(config));
  const [documentInfo, setDocumentInfo] = useState<DocumentTransparencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载文档信息
  const loadDocumentInfo = useCallback(async () => {
    if (!docId || !workspaceId) return;

    try {
      setLoading(true);
      setError(null);
      const info = await detector.getDocumentTransparencyInfo(docId, workspaceId);
      setDocumentInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文档信息失败');
    } finally {
      setLoading(false);
    }
  }, [detector, docId, workspaceId]);

  // 初始化和加载
  useEffect(() => {
    detector.initialize()
      .then(() => loadDocumentInfo())
      .catch((err) => {
        setError(err instanceof Error ? err.message : '初始化失败');
        setLoading(false);
      });

    return () => {
      detector.destroy();
    };
  }, [detector, loadDocumentInfo]);

  // 监听变化
  useEffect(() => {
    const handleChange = (event: any) => {
      if (event.docId === docId) {
        loadDocumentInfo();
      }
    };

    detector.on('data-status-changed', handleChange);
    detector.on('sync-status-changed', handleChange);

    return () => {
      detector.off('data-status-changed', handleChange);
      detector.off('sync-status-changed', handleChange);
    };
  }, [detector, docId, loadDocumentInfo]);

  return {
    documentInfo,
    loading,
    error,
    refresh: loadDocumentInfo,
    detector,
    
    // 便捷方法
    isSynced: documentInfo?.syncStatus.status === 'synced',
    isAvailableLocally: documentInfo?.locations.local.available || false,
    isAvailableInCloud: documentInfo?.locations.cloud.available || false,
    hasOfflineOperations: documentInfo?.offlineOperations.count > 0,
    isVersionConsistent: documentInfo?.version.isConsistent || false,
    getSyncProgress: () => documentInfo?.syncStatus.progress || 0,
    getIntegrityStatus: () => documentInfo?.integrity.status || 'missing',
  };
};