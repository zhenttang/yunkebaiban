import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Alert, AlertDescription } from '@affine/admin/components/ui/alert';
import { Progress } from '@affine/admin/components/ui/progress';
import { InfoIcon } from '@blocksuite/icons/rc';
import { Archive as ArchiveIcon, CheckCircle as CheckCircleIcon, RefreshCw as RefreshIcon, Trash2 as TrashIcon } from 'lucide-react';
import { formatBytes } from '@affine/admin/utils';

import { useStorageStatsContext } from '../hooks/storage-stats-context';

interface CleanupResult {
  success: boolean;
  deletedFiles: number;
  freedSpace: number;
  error?: string;
}

export function StorageCleanup() {
  const { usage, stats, files, cleanupStorage } = useStorageStatsContext();
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);

  const totalSpace = useMemo(() => {
    if (!usage) return 0;
    return usage.usedSpace + usage.availableSpace;
  }, [usage]);

  const usagePercent = totalSpace > 0 ? (usage?.usedSpace ?? 0) / totalSpace * 100 : 0;

  const storageHealth = useMemo(() => {
    if (!usage) {
      return { status: 'unknown', message: '无法获取存储状态' } as const;
    }
    if (usagePercent < 70) {
      return { status: 'good', message: '存储空间充足' } as const;
    }
    if (usagePercent < 90) {
      return { status: 'warning', message: '存储空间偏高，建议清理' } as const;
    }
    return { status: 'critical', message: '存储空间不足，需要立即清理' } as const;
  }, [usage, usagePercent]);

  const largestFiles = useMemo(() => stats?.largestFiles?.slice(0, 3) ?? [], [stats]);
  const ninetyDaysAgo = useMemo(() => Date.now() - 1000 * 60 * 60 * 24 * 90, []);
  const inactiveFiles = useMemo(
    () => files.filter(file => file.lastAccessed && new Date(file.lastAccessed).getTime() < ninetyDaysAgo),
    [files, ninetyDaysAgo]
  );
  const estimatedReclaimBytes = useMemo(
    () => largestFiles.reduce((sum, file) => sum + file.size, 0),
    [largestFiles]
  );

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanupResult(null);
    try {
      const result = await cleanupStorage();
      setCleanupResult(result);
    } catch (error: any) {
      setCleanupResult({
        success: false,
        deletedFiles: 0,
        freedSpace: 0,
        error: error?.message ?? '清理失败',
      });
    } finally {
      setCleaning(false);
    }
  };

  const alertVariant = storageHealth.status === 'critical' ? 'destructive' : 'default';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArchiveIcon className="h-5 w-5" />
          存储清理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant={alertVariant}>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{storageHealth.message}</span>
            {usage ? (
              <span className="text-sm font-mono">
                {formatBytes(usage.usedSpace)} / {formatBytes(totalSpace)}
              </span>
            ) : null}
          </AlertDescription>
        </Alert>

        {usage ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">存储使用率</span>
              <span className="text-sm text-gray-600">{usagePercent.toFixed(1)}%</span>
            </div>
            <Progress
              value={usagePercent}
              className="h-2"
              indicatorClassName={
                storageHealth.status === 'critical'
                  ? 'bg-red-500'
                  : storageHealth.status === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }
            />
          </div>
        ) : null}

        <div className="space-y-4">
          <h4 className="font-medium">清理建议</h4>

          <div className="space-y-3">
            <SuggestionRow
              title="最大文件优先"
              description="集中处理体积最大的文件，快速释放空间"
              value={estimatedReclaimBytes ? formatBytes(estimatedReclaimBytes) : '等待统计'}
            />
            <SuggestionRow
              title="长期未访问"
              description={`超过 90 天未访问的文件 ${inactiveFiles.length} 个，可考虑迁移或删除`}
              value="建议人工确认"
            />
            <SuggestionRow
              title="缓存与临时文件"
              description="系统自动识别并安全清理，适合定期执行"
              value="推荐每周一次"
            />
          </div>

          {largestFiles.length > 0 ? (
            <div className="space-y-3 rounded-lg bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-700">体积最大的文件</div>
              <ul className="space-y-2 text-sm text-gray-600">
                {largestFiles.map(file => (
                  <li key={file.id} className="flex items-center justify-between">
                    <span className="truncate pr-4" title={file.filename}>{file.filename}</span>
                    <span className="font-mono text-xs text-gray-500">{formatBytes(file.size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {cleanupResult ? (
          <Alert variant={cleanupResult.success ? 'default' : 'destructive'}>
            {cleanupResult.success ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <InfoIcon className="h-4 w-4" />
            )}
            <AlertDescription>
              {cleanupResult.success ? (
                <div>
                  清理完成，删除 {cleanupResult.deletedFiles} 个文件，共释放 {formatBytes(cleanupResult.freedSpace)}。
                </div>
              ) : (
                <div>清理失败: {cleanupResult.error}</div>
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-3 border-t pt-4">
          <Button
            onClick={handleCleanup}
            disabled={cleaning}
            variant={storageHealth.status === 'critical' ? 'default' : 'outline'}
          >
            {cleaning ? (
              <RefreshIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrashIcon className="mr-2 h-4 w-4" />
            )}
            {cleaning ? '清理中…' : '开始清理'}
          </Button>

          <div className="text-sm text-gray-600">
            预计可释放 {formatBytes(estimatedReclaimBytes || 0)}
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4">
          <h5 className="mb-2 font-medium text-blue-900">自动清理</h5>
          <p className="text-sm text-blue-700">
            自动清理计划由后端策略控制。如需修改周期或范围，请在任务调度模块中调整。
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
            <CheckCircleIcon className="h-4 w-4" />
            计划执行后，这里将显示最近一次执行时间。
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SuggestionRowProps {
  readonly title: string;
  readonly description: string;
  readonly value: string;
}

const SuggestionRow = ({ title, description, value }: SuggestionRowProps) => {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <div className="text-sm text-gray-500">{value}</div>
    </div>
  );
};
