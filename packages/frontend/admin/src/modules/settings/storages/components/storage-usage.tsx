import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Badge } from '@affine/admin/components/ui/badge';
import { Progress } from '@affine/admin/components/ui/progress';
import { Button } from '@affine/admin/components/ui/button';
import { 
  DatabaseTableViewIcon, 
  RefreshIcon, 
  TrashIcon,
  DownloadIcon 
} from '@blocksuite/icons/rc';
import { formatBytes, formatNumber } from '@affine/admin/utils';

import { useStorageStats } from '../hooks/use-storage-stats';

export function StorageUsageCard() {
  const { usage, loading, error, refetch } = useStorageStats();

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

        {/* 文件统计 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(usage.totalFiles)}
            </div>
            <div className="text-sm text-blue-700">总文件数</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatBytes(usage.totalSize)}
            </div>
            <div className="text-sm text-green-700">总大小</div>
          </div>
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
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-lg font-semibold">{formatNumber(usage.dailyUploads)}</div>
            <div className="text-xs text-gray-500">今日上传</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{formatNumber(usage.monthlyUploads)}</div>
            <div className="text-xs text-gray-500">本月上传</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}