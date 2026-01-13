import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { httpClient } from '@yunke/request';
import type {
  SecurityStats,
  SecurityEvent,
  BlockedIp,
  BlockIpRequest,
} from '../types';

const API_BASE = '/api/admin/security';

/**
 * 获取安全统计
 */
export function useSecurityStats() {
  return useSWR<SecurityStats>(
    ['security-stats'],
    async () => {
      return await httpClient.get(`${API_BASE}/stats`);
    },
    {
      refreshInterval: 30000, // 每30秒刷新一次
      revalidateOnFocus: false,
    }
  );
}

/**
 * 获取安全事件列表
 */
export function useSecurityEvents(days = 7, limit = 100) {
  return useSWR<{ data: SecurityEvent[]; total: number }>(
    ['security-events', days, limit],
    async () => {
      return await httpClient.get(`${API_BASE}/events?days=${days}&limit=${limit}`);
    },
    {
      refreshInterval: 60000, // 每1分钟刷新一次
      revalidateOnFocus: false,
    }
  );
}

/**
 * 获取被封禁的IP列表
 */
export function useBlockedIps() {
  return useSWR<{ data: BlockedIp[]; total: number }>(
    ['security-blocked-ips'],
    async () => {
      return await httpClient.get(`${API_BASE}/blocked-ips`);
    },
    {
      refreshInterval: 30000, // 每30秒刷新一次
      revalidateOnFocus: false,
    }
  );
}

/**
 * 封禁IP
 */
export function useBlockIp() {
  const { mutate } = useSWRConfig();

  return useSWRMutation(
    'block-ip',
    async (_key: string, { arg }: { arg: BlockIpRequest }) => {
      return await httpClient.post(`${API_BASE}/block-ip`, arg);
    },
    {
      onSuccess: () => {
        mutate(['security-blocked-ips']);
        mutate(['security-stats']);
      },
    }
  );
}

/**
 * 解封IP
 */
export function useUnblockIp() {
  const { mutate } = useSWRConfig();

  return useSWRMutation(
    'unblock-ip',
    async (_key: string, { arg }: { arg: string }) => {
      return await httpClient.delete(`${API_BASE}/blocked-ips/${arg}`);
    },
    {
      onSuccess: () => {
        mutate(['security-blocked-ips']);
        mutate(['security-stats']);
      },
    }
  );
}

/**
 * 解锁账号
 */
export function useUnlockAccount() {
  return useSWRMutation(
    'unlock-account',
    async (_key: string, { arg }: { arg: string }) => {
      return await httpClient.post(
        `${API_BASE}/unlock-account?username=${encodeURIComponent(arg)}`
      );
    }
  );
}

