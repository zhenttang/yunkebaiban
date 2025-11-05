/**
 * 安全监控管理页面
 *
 * 功能：
 * - 实时安全统计
 * - 安全事件列表
 * - IP封禁管理
 * - 攻击类型分析
 */

import { Alert, AlertDescription } from '@yunke/admin/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { SecurityStatsCards } from './components/security-stats-cards';
import { SecurityEventsList } from './components/security-events-list';
import { BlockedIpsTable } from './components/blocked-ips-table';
import {
  useSecurityStats,
  useSecurityEvents,
  useBlockedIps,
} from './hooks/use-security-monitor';

export function SecurityMonitoring() {
  // 获取数据
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    mutate: refetchStats,
  } = useSecurityStats();

  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
    mutate: refetchEvents,
  } = useSecurityEvents(7, 50);

  const {
    data: blockedIpsData,
    isLoading: ipsLoading,
    error: ipsError,
    mutate: refetchIps,
  } = useBlockedIps();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">安全监控</h2>
        <p className="text-muted-foreground">
          实时监控恶意攻击、查看安全事件、管理IP封禁
        </p>
      </div>

      {/* 错误提示 */}
      {(statsError || eventsError || ipsError) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            数据加载失败:{' '}
            {(statsError as Error)?.message ||
              (eventsError as Error)?.message ||
              (ipsError as Error)?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <SecurityStatsCards stats={stats} loading={statsLoading} />

      {/* 攻击类型统计 */}
      {stats && !statsLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">攻击类型分布</h3>
            <div className="space-y-3">
              {Object.entries(stats.attacksByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min((count / stats.todayEvents) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 实时监控状态 */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-4 font-semibold">实时监控状态</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">DDoS防护</span>
                <span className="flex h-6 items-center gap-2 rounded-full bg-emerald-100 px-3 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  运行中
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SQL注入防护</span>
                <span className="flex h-6 items-center gap-2 rounded-full bg-emerald-100 px-3 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  运行中
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">爬虫防护</span>
                <span className="flex h-6 items-center gap-2 rounded-full bg-emerald-100 px-3 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  运行中
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">登录保护</span>
                <span className="flex h-6 items-center gap-2 rounded-full bg-emerald-100 px-3 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  运行中
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IP封禁列表 */}
      <BlockedIpsTable
        blockedIps={blockedIpsData?.data}
        loading={ipsLoading}
        onRefresh={refetchIps}
      />

      {/* 安全事件列表 */}
      <SecurityEventsList
        events={eventsData?.data}
        loading={eventsLoading}
        onRefresh={refetchEvents}
      />
    </div>
  );
}

