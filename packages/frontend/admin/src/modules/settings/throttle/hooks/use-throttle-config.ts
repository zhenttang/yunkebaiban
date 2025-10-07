import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '../../../../../../../common/request/src';
import type {
  ThrottleConfig,
  ThrottleStatsDto,
  ThrottleTestResultDto,
  ValidationResultDto,
  ThrottlePresetDto
} from '../types';

export function useThrottleConfig() {
  const [config, setConfig] = useState<ThrottleConfig | null>(null);
  const [presets, setPresets] = useState<ThrottlePresetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取throttle配置
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/throttle/config');
      setConfig(response);
    } catch (err: any) {
      console.error('Failed to fetch throttle config:', err);
      setError('无法加载限流配置');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取预设配置
  const fetchPresets = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/throttle/presets');
      setPresets(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Failed to fetch presets:', err);
      setPresets([]);
    }
  }, []);

  // 更新配置
  const updateConfig = useCallback(async (newConfig: ThrottleConfig) => {
    try {
      const response = await httpClient.put('/api/admin/throttle/config', newConfig);
      setConfig(response);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to update throttle config:', err);
      return {
        success: false,
        error: err.response?.data?.message || '更新限流配置失败'
      };
    }
  }, []);

  // 验证配置
  const validateConfig = useCallback(async (configToValidate: ThrottleConfig): Promise<ValidationResultDto> => {
    try {
      const response = await httpClient.post('/api/admin/throttle/validate', configToValidate);
      return response;
    } catch (err: any) {
      console.error('Failed to validate config:', err);
      return {
        valid: false,
        errors: [err.response?.data?.message || '配置验证失败'],
        warnings: []
      };
    }
  }, []);

  // 测试限流器
  const testThrottle = useCallback(async (testConfig?: ThrottleConfig): Promise<ThrottleTestResultDto> => {
    try {
      const configToTest = testConfig || config;
      if (!configToTest) {
        throw new Error('没有可测试的配置');
      }

      const response = await httpClient.post('/api/admin/throttle/test', configToTest);
      return response;
    } catch (err: any) {
      console.error('Failed to test throttle:', err);
      return {
        success: false,
        message: err.response?.data?.message || '限流测试失败',
        details: err.message
      };
    }
  }, [config]);

  // 获取预设配置
  const getPreset = useCallback(async (presetId: string): Promise<ThrottlePresetDto | null> => {
    try {
      const response = await httpClient.get(`/api/admin/throttle/presets/${presetId}`);
      return response;
    } catch (err: any) {
      console.error('Failed to get preset:', err);
      return null;
    }
  }, []);

  // 重新加载配置
  const reloadConfig = useCallback(async () => {
    try {
      await httpClient.post('/api/admin/throttle/reload');
      await fetchConfig(); // 重新获取配置
      return { success: true };
    } catch (err: any) {
      console.error('Failed to reload config:', err);
      return {
        success: false,
        error: err.response?.data?.message || '重新加载配置失败'
      };
    }
  }, [fetchConfig]);

  // 获取统计数据
  const getThrottleStats = useCallback(async (timeRange?: { from: Date; to: Date }) => {
    try {
      const params = new URLSearchParams();
      if (timeRange) {
        params.append('from', timeRange.from.toISOString());
        params.append('to', timeRange.to.toISOString());
      }

      const response = await httpClient.get(`/api/admin/throttle/stats?${params.toString()}`);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to get throttle stats:', err);
      return {
        success: false,
        error: err.response?.data?.message || '获取限流统计失败'
      };
    }
  }, []);

  // 获取限流日志
  const getThrottleLogs = useCallback(async (page = 1, size = 20, level?: string) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      if (level && level !== 'all') {
        params.append('level', level);
      }

      const response = await httpClient.get(`/api/admin/throttle/logs?${params.toString()}`);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to get throttle logs:', err);
      return {
        success: false,
        error: err.response?.data?.message || '获取限流日志失败'
      };
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchConfig();
    fetchPresets();
  }, [fetchConfig, fetchPresets]);

  return {
    config,
    presets,
    loading,
    error,
    refetch: fetchConfig,
    updateConfig,
    validateConfig,
    testThrottle,
    getPreset,
    reloadConfig,
    getThrottleStats,
    getThrottleLogs,
  };
}

export function useThrottleStats() {
  const [stats, setStats] = useState<ThrottleStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/throttle/stats');
      setStats(response);
    } catch (err: any) {
      console.error('Failed to fetch throttle stats:', err);
      setError('无法加载限流统计');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}