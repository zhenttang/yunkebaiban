import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Badge } from '@affine/admin/components/ui/badge';
import { Progress } from '@affine/admin/components/ui/progress';
import { Separator } from '@affine/admin/components/ui/separator';
import {
  Server,
  Activity,
  HardDrive,
  Clock,
  Cpu,
  Database,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HardDrive as Storage
} from 'lucide-react';
import type { SystemInfoDto, ServiceStatus } from '../types';

interface ServerInfoCardProps {
  systemInfo: SystemInfoDto;
  loading?: boolean;
}

export function ServerInfoCard({ systemInfo, loading }: ServerInfoCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            系统信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { version, runtime, system, status } = systemInfo;

  // 兼容后端返回的数据结构，添加默认值
  const safeStatus = status || {
    overall: 'DOWN',
    database: { status: 'DOWN' },
    redis: { status: 'DOWN' },
    storage: { status: 'DOWN' },
    email: { status: 'DOWN' }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}天 ${hours}小时`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  const getStatusIcon = (componentStatus?: { status: string }) => {
    if (!componentStatus) {
      return <XCircle className="h-4 w-4 text-gray-400" />;
    }
    switch (componentStatus.status) {
      case 'UP':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DOWN':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP':
        return 'default';
      case 'DOWN':
        return 'destructive';
      case 'WARNING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const memoryUsagePercent = system?.memory ?
    ((system.memory.used / system.memory.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 版本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            版本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">版本号</span>
              <p className="font-medium">{version?.version || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-600">环境</span>
              <p className="font-medium">{version?.environment || version?.buildProfile || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-600">构建时间</span>
              <p className="font-medium">{version?.buildTime ? new Date(version.buildTime).toLocaleString() : 'Unknown'}</p>
            </div>
            {version?.gitCommit && (
              <div>
                <span className="text-gray-600">Git提交</span>
                <p className="font-medium font-mono text-xs">{version.gitCommit.substring(0, 8)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 运行时信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            运行时信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">运行时间</span>
              <p className="font-medium">{runtime?.uptime ? formatUptime(runtime.uptime) : runtime?.uptimeSeconds ? formatUptime(runtime.uptimeSeconds * 1000) : 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-600">Java版本</span>
              <p className="font-medium">{runtime?.javaVersion || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-600">启动时间</span>
              <p className="font-medium">{runtime?.startTime ? new Date(runtime.startTime).toLocaleString() : 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-600">最大内存</span>
              <p className="font-medium">{runtime?.maxMemory ? formatBytes(runtime.maxMemory) : 'Unknown'}</p>
            </div>
          </div>

          {runtime && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">JVM内存使用率</span>
                <span className="text-sm text-gray-600">
                  {formatBytes(runtime.totalMemory - runtime.freeMemory)} / {formatBytes(runtime.totalMemory)}
                </span>
              </div>
              <Progress
                value={((runtime.totalMemory - runtime.freeMemory) / runtime.totalMemory) * 100}
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 系统信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            系统信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">操作系统</span>
              <p className="font-medium">{system?.osName || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-600">系统版本</span>
              <p className="font-medium">{system?.osVersion || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-600">系统架构</span>
              <p className="font-medium">{system?.osArch || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-600">处理器核心</span>
              <p className="font-medium">{system?.availableProcessors || system?.cpuCores || 'Unknown'} 核</p>
            </div>
          </div>

          {system?.memory && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">系统内存使用率</span>
                <span className="text-sm text-gray-600">
                  {formatBytes(system.memory.used)} / {formatBytes(system.memory.total)}
                </span>
              </div>
              <Progress value={memoryUsagePercent} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 健康状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            健康状态
            <Badge variant={getStatusColor(safeStatus.overall)} className="ml-auto">
              {safeStatus.overall === 'UP' ? '健康' : safeStatus.overall === 'DOWN' ? '异常' : '警告'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">数据库</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(safeStatus.database)}
              <Badge variant={getStatusColor(safeStatus.database?.status || 'DOWN')}>
                {safeStatus.database?.status === 'UP' ? '正常' : '异常'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Redis缓存</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(safeStatus.redis)}
              <Badge variant={getStatusColor(safeStatus.redis?.status || 'DOWN')}>
                {safeStatus.redis?.status === 'UP' ? '正常' : '异常'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Storage className="h-4 w-4" />
              <span className="text-sm font-medium">存储服务</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(safeStatus.storage)}
              <Badge variant={getStatusColor(safeStatus.storage?.status || 'DOWN')}>
                {safeStatus.storage?.status === 'UP' ? '正常' : '异常'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">邮件服务</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(safeStatus.email)}
              <Badge variant={getStatusColor(safeStatus.email?.status || 'DOWN')}>
                {safeStatus.email?.status === 'UP' ? '正常' : '异常'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}