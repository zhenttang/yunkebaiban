import { useState, useEffect, useCallback } from 'react';
import { httpClient } from '../../../../../../common/request/src';

interface MetricsData {
  systemMetrics?: any;
  applicationMetrics?: any;
  databaseMetrics?: any;
  healthStatus?: any;
  metricsSummary?: any;
  historyData?: any;
}

export function useMetrics() {
  const [data, setData] = useState<MetricsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取系统指标
  const fetchSystemMetrics = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/metrics/system');
      return response.data;
    } catch (error) {
      console.error('获取系统指标失败:', error);
      throw error;
    }
  }, []);

  // 获取应用指标
  const fetchApplicationMetrics = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/metrics/application');
      return response.data;
    } catch (error) {
      console.error('获取应用指标失败:', error);
      throw error;
    }
  }, []);

  // 获取数据库指标
  const fetchDatabaseMetrics = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/metrics/database');
      return response.data;
    } catch (error) {
      console.error('获取数据库指标失败:', error);
      throw error;
    }
  }, []);

  // 获取健康状态
  const fetchHealthStatus = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/metrics/health');
      return response.data;
    } catch (error) {
      console.error('获取健康状态失败:', error);
      throw error;
    }
  }, []);

  // 获取指标汇总
  const fetchMetricsSummary = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/metrics/summary');
      return response.data;
    } catch (error) {
      console.error('获取指标汇总失败:', error);
      throw error;
    }
  }, []);

  // 获取历史数据
  const fetchHistoryData = useCallback(async (type: string, timeRange: string) => {
    try {
      const response = await httpClient.get('/api/admin/metrics/history', {
        params: { type, timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('获取历史数据失败:', error);
      throw error;
    }
  }, []);

  // 刷新所有指标数据
  const refreshMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        systemMetrics,
        applicationMetrics,
        databaseMetrics,
        healthStatus,
        metricsSummary
      ] = await Promise.all([
        fetchSystemMetrics(),
        fetchApplicationMetrics(),
        fetchDatabaseMetrics(),
        fetchHealthStatus(),
        fetchMetricsSummary()
      ]);

      setData({
        systemMetrics,
        applicationMetrics,
        databaseMetrics,
        healthStatus,
        metricsSummary
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取监控数据失败');
    } finally {
      setLoading(false);
    }
  }, [
    fetchSystemMetrics,
    fetchApplicationMetrics,
    fetchDatabaseMetrics,
    fetchHealthStatus,
    fetchMetricsSummary
  ]);

  // 导出指标数据
  const exportMetrics = useCallback(async (format: string = 'json', timeRange: string = '1h') => {
    try {
      const response = await httpClient.post('/api/admin/metrics/export', {
        format,
        timeRange
      });
      return response.data;
    } catch (error) {
      console.error('导出指标数据失败:', error);
      throw error;
    }
  }, []);

  // 初始化加载数据
  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    ...data,
    loading,
    error,
    refreshMetrics,
    fetchHistoryData,
    exportMetrics
  };
}

// 历史数据Hook
export function useHistoryMetrics(type: string, timeRange: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await httpClient.get('/api/admin/metrics/history', {
        params: { type, timeRange }
      });
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取历史数据失败');
    } finally {
      setLoading(false);
    }
  }, [type, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

// 实时指标Hook (WebSocket或定时轮询)
export function useRealTimeMetrics(interval: number = 5000) {
  const [metrics, setMetrics] = useState<any>({});
  const [connected, setConnected] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/metrics/summary');
      setMetrics(response.data);
      setConnected(true);
    } catch (error) {
      console.error('获取实时指标失败:', error);
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    // 立即获取一次数据
    fetchMetrics();

    // 设置定时器定期获取数据
    const timer = setInterval(fetchMetrics, interval);

    return () => clearInterval(timer);
  }, [fetchMetrics, interval]);

  return {
    metrics,
    connected,
    refresh: fetchMetrics
  };
}