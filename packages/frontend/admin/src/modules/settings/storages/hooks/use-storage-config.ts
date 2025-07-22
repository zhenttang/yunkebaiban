import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '../../../../../../common/request/src';
import type { StorageConfigDto, StorageTestResult } from '../types';

export const useStorageConfig = () => {
  const [config, setConfig] = useState<StorageConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/storage/config');
      setConfig(response);
    } catch (err: any) {
      console.error('Failed to fetch storage config:', err);
      setError('获取存储配置失败');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<StorageConfigDto>) => {
    try {
      setError(null);
      const response = await httpClient.put('/api/admin/storage/config', newConfig);
      setConfig(response);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || '更新存储配置失败';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const testConnection = useCallback(async (testConfig?: Partial<StorageConfigDto>) => {
    try {
      setTesting(true);
      setError(null);
      const configToTest = testConfig || config;
      const response = await httpClient.post('/api/admin/storage/test', configToTest);
      return response as StorageTestResult;
    } catch (err: any) {
      console.error('Storage connection test failed:', err);
      return {
        success: false,
        message: err.message || '连接测试失败'
      } as StorageTestResult;
    } finally {
      setTesting(false);
    }
  }, [config]);

  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      const response = await httpClient.post('/api/admin/storage/reset-defaults');
      setConfig(response);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || '重置配置失败';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    testing,
    refetch: fetchConfig,
    updateConfig,
    testConnection,
    resetToDefaults,
  };
};