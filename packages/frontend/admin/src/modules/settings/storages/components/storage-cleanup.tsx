import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Alert, AlertDescription } from '@affine/admin/components/ui/alert';
import { Progress } from '@affine/admin/components/ui/progress';
import { 
  TrashIcon, 
  RefreshIcon, 
  ArchiveIcon,
  InfoIcon,
  CheckCircleIcon
} from '@blocksuite/icons/rc';
import { useState } from 'react';
import { formatBytes } from '@affine/admin/utils';

import { useStorageStats } from '../hooks/use-storage-stats';

interface CleanupResult {
  success: boolean;
  deletedFiles: number;
  freedSpace: number;
  error?: string;
}

export function StorageCleanup() {
  const { usage, cleanupStorage } = useStorageStats();
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);

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
        error: error.message || '清理失败'
      });
    } finally {
      setCleaning(false);
    }
  };

  const getStorageHealth = () => {
    if (!usage) return { status: 'unknown', color: 'gray', message: '无法获取存储状态' };
    
    const totalSpace = usage.usedSpace + usage.availableSpace;
    const usagePercentage = totalSpace > 0 ? (usage.usedSpace / totalSpace) * 100 : 0;
    
    if (usagePercentage < 70) {
      return { status: 'good', color: 'green', message: '存储空间充足' };
    } else if (usagePercentage < 90) {
      return { status: 'warning', color: 'yellow', message: '存储空间偏高，建议清理' };
    } else {
      return { status: 'critical', color: 'red', message: '存储空间不足，需要立即清理' };
    }
  };

  const storageHealth = getStorageHealth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArchiveIcon className="h-5 w-5" />
          存储清理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 存储健康状态 */}
        <Alert variant={storageHealth.status === 'critical' ? 'destructive' : 'default'}>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{storageHealth.message}</span>
            {usage && (
              <span className="text-sm font-mono">
                {formatBytes(usage.usedSpace)} / {formatBytes(usage.usedSpace + usage.availableSpace)}
              </span>
            )}
          </AlertDescription>
        </Alert>

        {usage && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">存储使用率</span>
              <span className="text-sm text-gray-600">
                {((usage.usedSpace / (usage.usedSpace + usage.availableSpace)) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={(usage.usedSpace / (usage.usedSpace + usage.availableSpace)) * 100}
              className="h-2"
              indicatorClassName={
                storageHealth.status === 'critical' ? 'bg-red-500' :
                storageHealth.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
              }
            />
          </div>
        )}

        {/* 清理选项 */}
        <div className="space-y-4">
          <h4 className="font-medium">可清理的内容</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">临时文件</div>
                <div className="text-sm text-gray-600">清理上传过程中产生的临时文件</div>
              </div>
              <div className="text-sm text-gray-500">~50MB</div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">孤立文件</div>
                <div className="text-sm text-gray-600">删除数据库中不存在引用的文件</div>
              </div>
              <div className="text-sm text-gray-500">~120MB</div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">缓存文件</div>
                <div className="text-sm text-gray-600">清理图片缩略图和预览缓存</div>
              </div>
              <div className="text-sm text-gray-500">~80MB</div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">过期文件</div>
                <div className="text-sm text-gray-600">删除超过90天未访问的文件</div>
              </div>
              <div className="text-sm text-gray-500">~200MB</div>
            </div>
          </div>
        </div>

        {/* 清理结果 */}
        {cleanupResult && (
          <Alert variant={cleanupResult.success ? "default" : "destructive"}>
            {cleanupResult.success ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <InfoIcon className="h-4 w-4" />
            )}
            <AlertDescription>
              {cleanupResult.success ? (
                <div>
                  清理完成！删除了 {cleanupResult.deletedFiles} 个文件，
                  释放了 {formatBytes(cleanupResult.freedSpace)} 空间。
                </div>
              ) : (
                <div>清理失败: {cleanupResult.error}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleCleanup}
            disabled={cleaning}
            variant={storageHealth.status === 'critical' ? 'default' : 'outline'}
          >
            {cleaning ? (
              <RefreshIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TrashIcon className="h-4 w-4 mr-2" />
            )}
            {cleaning ? '清理中...' : '开始清理'}
          </Button>
          
          <div className="text-sm text-gray-600">
            预计可释放约 450MB 空间
          </div>
        </div>

        {/* 自动清理设置 */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">自动清理</h5>
          <p className="text-sm text-blue-700 mb-3">
            系统将每周自动清理临时文件和缓存，保持存储空间整洁。
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">已启用</span>
            </div>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600">下次执行: 2025年1月26日</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}