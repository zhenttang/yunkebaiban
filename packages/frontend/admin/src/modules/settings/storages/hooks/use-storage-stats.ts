import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '@affine/request';
import type { StorageUsageDto, StorageStatsDto, StorageFileDto } from '../types';

export const useStorageStats = () => {
  const [usage, setUsage] = useState<StorageUsageDto | null>(null);
  const [stats, setStats] = useState<StorageStatsDto | null>(null);
  const [files, setFiles] = useState<StorageFileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setError(null);
      const response = await httpClient.get('/api/admin/storage/usage');
      setUsage(response);
    } catch (err: any) {
      console.error('Failed to fetch storage usage:', err);
      setError('获取存储使用情况失败');
      setUsage(null);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const response = await httpClient.get('/api/admin/storage/statistics');
      setStats(response);
    } catch (err: any) {
      console.error('Failed to fetch storage stats:', err);
      setError('获取存储统计失败');
      setStats(null);
    }
  }, []);

  const fetchFiles = useCallback(async (page = 0, size = 20, sortBy = 'uploadedAt', sortDir = 'desc') => {
    try {
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sortBy,
        sortDir,
      });
      const response = await httpClient.get(`/api/admin/storage/files?${params.toString()}`);
      setFiles(response.files || []);
      return response;
    } catch (err: any) {
      console.error('Failed to fetch storage files:', err);
      setError('获取文件列表失败');
      setFiles([]);
      return { files: [], totalElements: 0 };
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      await httpClient.delete(`/api/admin/storage/files/${fileId}`);
      // 重新获取文件列表
      await fetchFiles();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete file:', err);
      return { success: false, error: err.message || '删除文件失败' };
    }
  }, [fetchFiles]);

  const downloadFile = useCallback(async (fileId: string) => {
    try {
      const response = await httpClient.get(`/api/admin/storage/files/${fileId}/download`, {
        responseType: 'blob'
      });
      return response;
    } catch (err: any) {
      console.error('Failed to download file:', err);
      throw new Error(err.message || '下载文件失败');
    }
  }, []);

  const cleanupStorage = useCallback(async () => {
    try {
      setError(null);
      const response = await httpClient.post('/api/admin/storage/cleanup');
      // 重新获取统计信息
      await Promise.all([fetchUsage(), fetchStats()]);
      return response;
    } catch (err: any) {
      console.error('Failed to cleanup storage:', err);
      setError('清理存储失败');
      return { success: false, error: err.message };
    }
  }, [fetchUsage, fetchStats]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUsage(),
        fetchStats(),
        fetchFiles()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchUsage, fetchStats, fetchFiles]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    usage,
    stats,
    files,
    loading,
    error,
    refetch: fetchAll,
    fetchFiles,
    deleteFile,
    downloadFile,
    cleanupStorage,
  };
};