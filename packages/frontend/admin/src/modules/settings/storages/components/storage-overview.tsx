import { useMemo } from 'react';
import { Card, CardContent } from '@affine/admin/components/ui/card';
import { Badge } from '@affine/admin/components/ui/badge';
import { Button } from '@affine/admin/components/ui/button';
import { Progress } from '@affine/admin/components/ui/progress';
import { Separator } from '@affine/admin/components/ui/separator';
import {
  CloudIcon,
  DatabaseIcon,
  HardDriveIcon,
  RefreshCw as RefreshIcon,
  TrendingUpIcon,
  UploadIcon,
} from 'lucide-react';
import { formatBytes, formatNumber } from '@affine/admin/utils';

import { useStorageStatsContext } from '../hooks/storage-stats-context';
import { useStorageConfig } from '../hooks/use-storage-config';

const PROVIDER_ICON: Record<string, JSX.Element> = {
  fs: <HardDriveIcon className="h-4 w-4" />,
  'aws-s3': <CloudIcon className="h-4 w-4" />,
  'cloudflare-r2': <CloudIcon className="h-4 w-4" />,
  'tencent-cos': <CloudIcon className="h-4 w-4" />,
};

export const StorageOverview = () => {
  const { usage, stats, loading, refetch } = useStorageStatsContext();
  const { config, loading: configLoading } = useStorageConfig();

  const provider = config?.provider;

  const usagePercent = useMemo(() => {
    if (!usage) {
      return 0;
    }
    const total = usage.usedSpace + usage.availableSpace;
    if (total === 0) {
      return 0;
    }
    return Math.min(100, (usage.usedSpace / total) * 100);
  }, [usage]);

  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <DatabaseIcon className="h-4 w-4" />
              存储服务状态
              {loading && <Badge variant="outline">刷新中</Badge>}
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">{formatBytes(usage?.usedSpace ?? 0)} 已使用</h2>
              {provider && (
                <Badge className="gap-1" variant="secondary">
                  {PROVIDER_ICON[provider] ?? <CloudIcon className="h-4 w-4" />}
                  {provider}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              可用空间 {formatBytes(usage?.availableSpace ?? 0)}，共 {formatBytes((usage?.usedSpace ?? 0) + (usage?.availableSpace ?? 0))}
            </p>
            <div className="max-w-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>整体使用率</span>
                <span>{usagePercent.toFixed(1)}%</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
            </div>
          </div>

          <Separator orientation="vertical" className="hidden h-20 lg:block" />

          <div className="grid w-full gap-4 sm:grid-cols-3 lg:w-auto">
            <OverviewStat
              label="今日上传"
              icon={<UploadIcon className="h-4 w-4" />}
              value={formatNumber(stats?.uploadsToday ?? usage?.dailyUploads ?? 0)}
            />
            <OverviewStat
              label="本月上传"
              icon={<TrendingUpIcon className="h-4 w-4" />}
              value={formatNumber(stats?.uploadsThisMonth ?? usage?.monthlyUploads ?? 0)}
            />
            <OverviewStat
              label="文件总数"
              icon={<DatabaseIcon className="h-4 w-4" />}
              value={formatNumber(usage?.totalFiles ?? 0)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm text-gray-500">
          <div>
            最近更新 {stats?.recentUploads?.[0]?.uploadedAt ? new Date(stats.recentUploads[0].uploadedAt).toLocaleString() : '暂无记录'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
            }}
            disabled={loading || configLoading}
          >
            <RefreshIcon className="mr-2 h-4 w-4" /> 刷新数据
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface OverviewStatProps {
  readonly label: string;
  readonly value: string;
  readonly icon: JSX.Element;
}

const OverviewStat = ({ label, value, icon }: OverviewStatProps) => {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
};
