import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '../../../../../../common/request/src';
import type { SecurityEventsResponse, SecurityEventDto, SessionDto, SessionStatsDto } from '../types';

export function useSecurityEvents() {
  const [events, setEvents] = useState<SecurityEventDto[] | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        size: pagination.pageSize.toString(),
        sortBy: 'timestamp',
        sortDir: 'desc',
      });

      const response: SecurityEventsResponse = await httpClient.get(`/api/admin/auth/security-events?${params.toString()}`);
      
      setEvents(response.events);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      console.error('Failed to fetch security events:', err);
      setError(err.message || '获取安全事件失败');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize]);

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await httpClient.delete(`/api/admin/auth/security-events/${eventId}`);
      await fetchEvents(); // 刷新列表
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchEvents]);

  const clearOldEvents = useCallback(async (daysOld: number) => {
    try {
      await httpClient.post('/api/admin/auth/security-events/cleanup', { daysOld });
      await fetchEvents(); // 刷新列表
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    pagination,
    setPagination,
    totalElements,
    loading,
    error,
    refetch: fetchEvents,
    deleteEvent,
    clearOldEvents,
  };
}

export function useActiveSessions() {
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [stats, setStats] = useState<SessionStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sessionsResponse, statsResponse] = await Promise.all([
        httpClient.get('/api/admin/auth/sessions'),
        httpClient.get('/api/admin/auth/sessions/stats')
      ]);
      
      setSessions(sessionsResponse);
      setStats(statsResponse);
    } catch (err: any) {
      console.error('Failed to fetch sessions:', err);
      setError(err.message || '获取会话信息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const invalidateSession = useCallback(async (sessionId: string) => {
    try {
      await httpClient.delete(`/api/admin/auth/sessions/${sessionId}`);
      await fetchSessions(); // 刷新列表
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchSessions]);

  const invalidateAllSessions = useCallback(async () => {
    try {
      await httpClient.post('/api/admin/auth/sessions/invalidate-all');
      await fetchSessions(); // 刷新列表
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    stats,
    loading,
    error,
    refetch: fetchSessions,
    invalidateSession,
    invalidateAllSessions,
  };
}