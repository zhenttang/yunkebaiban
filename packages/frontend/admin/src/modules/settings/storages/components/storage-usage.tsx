import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Progress } from '@yunke/admin/components/ui/progress';
import { Button } from '@yunke/admin/components/ui/button';
import {
  DatabaseTableViewIcon
} from '@blocksuite/icons/rc';
import { RefreshCw as RefreshIcon, TrendingUpIcon } from 'lucide-react';
import { formatBytes, formatNumber } from '@yunke/admin/utils';

import { useStorageStatsContext } from '../hooks/storage-stats-context';

export function StorageUsageCard() {
  const { usage, stats, loading, error, refetch } = useStorageStatsContext();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseTableViewIcon className="h-5 w-5" />
            存储使用情况
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse h-4 bg-gray-200 rounded"></div>
            <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseTableViewIcon className="h-5 w-5" />
            存储使用情况
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{error || '暂无数据'}</p>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshIcon className="h-4 w-4 mr-2" />
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = usage.availableSpace > 0 
    ? (usage.usedSpace / (usage.usedSpace + usage.availableSpace)) * 100 
    : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DatabaseTableViewIcon className="h-5 w-5" />
            存储使用情况
          </div>
          <Button onClick={refetch} variant="ghost" size="sm">
            <RefreshIcon className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 总体使用情况 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">存储空间使用</span>
            <span className="text-sm text-gray-600">
              {formatBytes(usage.usedSpace)} / {formatBytes(usage.usedSpace + usage.availableSpace)}
            </span>
          </div>
          <Progress 
            value={usagePercentage} 
            className="h-3"
            indicatorClassName={getUsageColor(usagePercentage)}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{usagePercentage.toFixed(1)}% 已使用</span>
            <span>{formatBytes(usage.availableSpace)} 可用</span>
          </div>
        </div>

        {/* 快速指标 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <QuickStat label="总文件数" value={formatNumber(usage.totalFiles)} tone="blue" />
          <QuickStat label="总容量" value={formatBytes(usage.totalSize)} tone="green" />
          <QuickStat
            label="本月上传"
            value={formatNumber(stats?.uploadsThisMonth ?? usage.monthlyUploads)}
            tone="purple"
            icon={<TrendingUpIcon className="h-4 w-4" />}
          />
        </div>

        {/* 文件类型分布 */}
        <div>
          <h4 className="text-sm font-medium mb-3">文件类型分布</h4>
          <div className="space-y-2">
            {Object.entries(usage.filesByType).map(([type, count]) => {
              const sizeForType = usage.sizeByType[type] || 0;
              const percentage = usage.totalFiles > 0 ? (count / usage.totalFiles) * 100 : 0;
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {type}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {formatNumber(count)} 个文件
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatBytes(sizeForType)}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 上传统计 */}
        <div className="grid gap-4 rounded-lg border bg-gray-50 p-4 md:grid-cols-3">
          <UploadSummary label="今日上传" value={usage.dailyUploads} hint="过去24小时新增文件" />
          <UploadSummary label="本周上传" value={stats?.uploadsThisWeek ?? 0} hint="以周为粒度统计" />
          <UploadSummary label="本月上传" value={usage.monthlyUploads} hint="自然月累计上传量" />
        </div>

        {/* 热门文件 */}
        {!!stats?.popularFiles?.length && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-sm font-medium">热门文件</h4>
            <div className="grid gap-3 md:grid-cols-2">
              {stats.popularFiles.slice(0, 4).map(file => (
                <div key={file.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{file.filename}</span>
                    <Badge variant="secondary" className="text-xs">
                      {formatBytes(file.size)}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    下载 {formatNumber(file.downloadCount)} 次 · 上传于 {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickStatProps {
  readonly label: string;
  readonly value: string;
  readonly tone: 'blue' | 'green' | 'purple';
  readonly icon?: JSX.Element;
}

const toneToClass: Record<QuickStatProps['tone'], string> = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  purple: 'bg-purple-50 text-purple-700',
};

const QuickStat = ({ label, value, tone, icon }: QuickStatProps) => {
  return (
    <div className={`rounded-lg p-4 ${toneToClass[tone]}`}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
        {icon ? <span>{icon}</span> : null}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
};

interface UploadSummaryProps {
  readonly label: string;
  readonly value: number;
  readonly hint?: string;
}

const UploadSummary = ({ label, value, hint }: UploadSummaryProps) => {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-gray-600">{label}</div>
      <div className="mt-2 text-xl font-semibold text-gray-900">{formatNumber(value)}</div>
      {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
};
