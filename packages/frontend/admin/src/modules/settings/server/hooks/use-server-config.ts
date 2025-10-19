import { useState, useEffect, useCallback } from 'react';
import { httpClient } from '@yunke/request';
import type { ServerConfigDto, SystemInfoDto, ServerStatusDto } from '../types';

export const useServerConfig = () => {
  const [config, setConfig] = useState<ServerConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/server-config/server-config');
      setConfig(response);
    } catch (err: any) {
      console.error('Failed to fetch server config:', err);
      setError(err?.message || '获取服务器配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (newConfig: ServerConfigDto) => {
    try {
      setSaving(true);
      const response = await httpClient.put('/api/admin/server-config/server-config', newConfig);
      
      if (response.success) {
        setConfig(response.data);
        return { success: true, message: response.message };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err: any) {
      console.error('Failed to update server config:', err);
      return { success: false, error: err?.message || '更新服务器配置失败' };
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    saving,
    refetch: fetchConfig,
    updateConfig,
  };
};

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/server-config/server-info');
      setSystemInfo(response);
    } catch (err: any) {
      console.error('Failed to fetch system info:', err);
      setError(err?.message || '获取系统信息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemInfo();
  }, [fetchSystemInfo]);

  return {
    systemInfo,
    loading,
    error,
    refetch: fetchSystemInfo,
  };
};

export const useServerStatus = () => {
  const [status, setStatus] = useState<ServerStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/server-config/server-status');
      setStatus(response);
    } catch (err: any) {
      console.error('Failed to fetch server status:', err);
      setError(err?.message || '获取服务器状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    // 每30秒刷新一次状态
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
  };
};