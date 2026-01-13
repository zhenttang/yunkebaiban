import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Skeleton } from '@yunke/admin/components/ui/skeleton';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  TrendingUp,
} from 'lucide-react';
import type { SecurityStats } from '../types';

interface SecurityStatsCardsProps {
  stats: SecurityStats | undefined;
  loading: boolean;
}

export function SecurityStatsCards({ stats, loading }: SecurityStatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 今日事件总数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今日安全事件</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.todayEvents}</div>
          <p className="text-xs text-muted-foreground">
            最近1小时: {stats.lastHourEvents} 次
          </p>
        </CardContent>
      </Card>

      {/* 当前封禁IP数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">当前封禁IP</CardTitle>
          <ShieldX className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-600">
            {stats.blockedIpCount}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.todayBlockedIps !== undefined 
              ? `今日新增: ${stats.todayBlockedIps} 个`
              : '活跃的被封禁IP'}
          </p>
        </CardContent>
      </Card>

      {/* DDoS攻击次数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">DDoS攻击</CardTitle>
          <ShieldAlert className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.attacksByType.DDOS || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            流量攻击拦截次数
          </p>
        </CardContent>
      </Card>

      {/* 暴力破解次数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">暴力破解</CardTitle>
          <ShieldCheck className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.attacksByType.BRUTE_FORCE || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            登录攻击拦截次数
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

