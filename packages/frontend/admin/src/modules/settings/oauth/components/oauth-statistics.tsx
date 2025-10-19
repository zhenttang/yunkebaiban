import { useMemo } from 'react';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Progress } from '@yunke/admin/components/ui/progress';
import { Skeleton } from '@yunke/admin/components/ui/skeleton';
import {
  Activity,
  BarChart3,
  CalendarClock,
  GaugeCircle,
  PieChart,
  Rocket,
  Users,
} from 'lucide-react';

import type { OAuthProvider, OAuthStatistics } from '../types';

interface OAuthStatisticsProps {
  statistics: OAuthStatistics | null;
  providers: OAuthProvider[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

const providerLabels: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Microsoft',
  apple: 'Apple',
  oidc: 'OIDC',
};

const StatisticsSkeleton = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    {[1, 2, 3, 4].map(index => (
      <Card key={index} className="border border-slate-200/60 bg-white/70 backdrop-blur">
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-3/5" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const EmptyState = ({ onRefresh, loading }: { onRefresh: () => Promise<void>; loading: boolean }) => (
  <Card className="overflow-hidden border border-dashed border-slate-300 bg-gradient-to-br from-white via-white to-slate-50">
    <CardContent className="flex flex-col items-center gap-4 py-12 text-center text-slate-600">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 text-3xl">📊</div>
      <div>
        <p className="text-lg font-semibold text-slate-800">暂无统计数据</p>
        <p className="mt-1 text-sm text-slate-500">刷新后即可拉取最新的使用情况。</p>
      </div>
      <Button variant="outline" onClick={onRefresh} disabled={loading} className="gap-2">
        {loading ? '加载中...' : '立即刷新'}
      </Button>
    </CardContent>
  </Card>
);

export function OAuthStatistics({ statistics, providers, loading, onRefresh }: OAuthStatisticsProps) {
  const computed = useMemo(() => {
    if (!statistics) {
      return null;
    }

    const enabledRate = statistics.totalProviders > 0
      ? (statistics.enabledProviders / statistics.totalProviders) * 100
      : 0;

    const configuredRate = statistics.totalProviders > 0
      ? (statistics.configuredProviders / statistics.totalProviders) * 100
      : 0;

    const disabledProviders = Math.max(statistics.totalProviders - statistics.enabledProviders, 0);
    const unConfiguredProviders = Math.max(statistics.totalProviders - statistics.configuredProviders, 0);

    const distribution = Object.entries(statistics.usersByProvider || {})
      .sort(([, a], [, b]) => Number(b) - Number(a));

    const topProvider = statistics.mostPopularProvider
      ? providerLabels[statistics.mostPopularProvider.toLowerCase()] ?? statistics.mostPopularProvider
      : null;

    const topProviderUsers = statistics.mostPopularProvider
      ? statistics.usersByProvider?.[statistics.mostPopularProvider] ?? 0
      : 0;

    const recentLogins = Object.entries(statistics.recentLogins || {})
      .sort(([, a], [, b]) => Number(b) - Number(a));

    return {
      enabledRate,
      configuredRate,
      disabledProviders,
      unConfiguredProviders,
      distribution,
      topProvider,
      topProviderUsers,
      recentLogins,
    };
  }, [statistics]);

  if (loading && !statistics) {
    return <StatisticsSkeleton />;
  }

  if (!statistics) {
    return <EmptyState onRefresh={onRefresh} loading={loading} />;
  }

  const {
    enabledRate,
    configuredRate,
    disabledProviders,
    unConfiguredProviders,
    distribution,
    topProvider,
    topProviderUsers,
    recentLogins,
  } = computed!;

  const hasDistribution = distribution.length > 0 && statistics.totalOAuthUsers > 0;
  const hasRecentLogins = recentLogins.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-200/70 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <CardHeader className="flex flex-col space-y-3 text-slate-600">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4 text-blue-500" /> 总提供商数
            </div>
            <div className="text-3xl font-semibold text-slate-900">{statistics.totalProviders}</div>
            <div className="text-xs text-slate-500">
              与导航中已配置的 {providers.length} 个提供商保持同步
            </div>
          </CardHeader>
        </Card>

        <Card className="border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40">
          <CardHeader className="flex flex-col space-y-3 text-slate-600">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GaugeCircle className="h-4 w-4 text-emerald-500" /> 启用率
            </div>
            <div className="text-3xl font-semibold text-emerald-700">{statistics.enabledProviders}</div>
            <div className="flex items-center justify-between text-xs text-emerald-600/80">
              <span>启用 {enabledRate.toFixed(1)}%</span>
              <span>禁用 {disabledProviders}</span>
            </div>
            <Progress value={enabledRate} className="h-2 bg-emerald-200/40" />
          </CardHeader>
        </Card>

        <Card className="border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-blue-100/50">
          <CardHeader className="flex flex-col space-y-3 text-slate-600">
            <div className="flex items-center gap-2 text-sm font-medium">
              <PieChart className="h-4 w-4 text-blue-500" /> 配置完成度
            </div>
            <div className="text-3xl font-semibold text-blue-700">{statistics.configuredProviders}</div>
            <div className="flex items-center justify-between text-xs text-blue-600/80">
              <span>完成 {configuredRate.toFixed(1)}%</span>
              <span>待配置 {unConfiguredProviders}</span>
            </div>
            <Progress value={configuredRate} className="h-2 bg-blue-200/40" />
          </CardHeader>
        </Card>

        <Card className="border border-purple-200/80 bg-gradient-to-br from-purple-50 via-white to-purple-100/40">
          <CardHeader className="flex flex-col space-y-3 text-slate-600">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-purple-500" /> OAuth 用户
            </div>
            <div className="text-3xl font-semibold text-purple-700">{statistics.totalOAuthUsers}</div>
            <div className="text-xs text-purple-600/80">最近 30 天活跃 {recentLogins.reduce((sum, [, value]) => sum + Number(value), 0)} 次</div>
          </CardHeader>
        </Card>
      </div>

      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">配置健康度</CardTitle>
            <p className="text-sm text-slate-500">关注启用率与配置率，快速排查潜在风险。</p>
          </div>
          <Badge variant="outline" className="gap-2 text-slate-600">
            <Activity className="h-3.5 w-3.5" />
            最后更新于 {new Date(statistics.lastUpdated).toLocaleString('zh-CN')}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
            <div className="flex items-center justify-between text-sm text-emerald-700">
              <span className="font-medium">启用覆盖率</span>
              <span>{enabledRate.toFixed(1)}%</span>
            </div>
            <Progress value={enabledRate} className="h-2 bg-emerald-200/40" />
            <p className="text-xs text-emerald-700/80">
              已启用 {statistics.enabledProviders} 个提供商，仍有 {disabledProviders} 个处于禁用状态。
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
            <div className="flex items-center justify-between text-sm text-blue-700">
              <span className="font-medium">配置完成率</span>
              <span>{configuredRate.toFixed(1)}%</span>
            </div>
            <Progress value={configuredRate} className="h-2 bg-blue-200/40" />
            <p className="text-xs text-blue-700/80">
              已正确配置 {statistics.configuredProviders} 个提供商，还有 {unConfiguredProviders} 个等待完善凭证。
            </p>
          </div>
        </CardContent>
      </Card>

      {hasDistribution && (
        <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">用户来源分布</CardTitle>
              <p className="text-sm text-slate-500">按用户数量排序，展示各提供商的受欢迎程度。</p>
            </div>
            {topProvider && (
              <Badge className="gap-2 bg-purple-500/10 text-purple-600">
                <Rocket className="h-3.5 w-3.5" />
                最受欢迎：{topProvider} · {topProviderUsers} 位用户
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {distribution.map(([providerKey, count]) => {
              const percentage = statistics.totalOAuthUsers > 0
                ? (Number(count) / statistics.totalOAuthUsers) * 100
                : 0;
              const label = providerLabels[providerKey.toLowerCase()] ?? providerKey;

              return (
                <div key={providerKey} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{label}</span>
                    <span>{count} 用户 · {percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {hasRecentLogins && (
        <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">最近 30 天使用情况</CardTitle>
              <p className="text-sm text-slate-500">记录各提供商的登录次数，帮助发现趋势。</p>
            </div>
            <Badge variant="outline" className="gap-2 text-slate-600">
              <CalendarClock className="h-3.5 w-3.5" />
              合计 {recentLogins.reduce((sum, [, value]) => sum + Number(value), 0)} 次登录
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {recentLogins.map(([providerKey, count]) => {
              const label = providerLabels[providerKey.toLowerCase()] ?? providerKey;
              return (
                <div key={providerKey} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{label}</span>
                  <span>{count} 次</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <GaugeCircle className="h-4 w-4 text-blue-500" />
            数据最新时间：{new Date(statistics.lastUpdated).toLocaleString('zh-CN')}
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="gap-2">
            {loading ? '刷新中...' : '刷新统计'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
