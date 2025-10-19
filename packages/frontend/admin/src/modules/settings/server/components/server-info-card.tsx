import { Badge } from '@yunke/admin/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Progress } from '@yunke/admin/components/ui/progress';
import { Skeleton } from '@yunke/admin/components/ui/skeleton';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  Mail,
  MemoryStick,
  Server,
  ShieldAlert,
  Signal,
  XCircle,
} from 'lucide-react';

import type { SystemInfoDto } from '../types';

interface ServerInfoCardProps {
  systemInfo: SystemInfoDto;
  loading?: boolean;
}

const LoadingSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2">
    {[1, 2, 3, 4].map((key) => (
      <Card key={key} className="border border-slate-200/70 bg-white/80 backdrop-blur">
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const StatusBadge = ({ status }: { status?: string }) => {
  if (!status) {
    return (
      <Badge variant="outline" className="gap-1 rounded-full border-slate-200 text-slate-500">
        <ShieldAlert className="h-3 w-3" /> 未知
      </Badge>
    );
  }

  if (status === 'UP') {
    return (
      <Badge className="gap-1 rounded-full bg-emerald-500/10 text-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> 正常
      </Badge>
    );
  }

  if (status === 'WARNING') {
    return (
      <Badge className="gap-1 rounded-full bg-amber-500/10 text-amber-600">
        <AlertTriangle className="h-3 w-3" /> 异常
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 rounded-full bg-rose-500/10 text-rose-600">
      <XCircle className="h-3 w-3" /> 不可用
    </Badge>
  );
};

export function ServerInfoCard({ systemInfo, loading }: ServerInfoCardProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  const { version, runtime, system, status } = systemInfo;

  const safeStatus = status || {
    overall: 'DOWN',
    database: { status: 'DOWN' },
    redis: { status: 'DOWN' },
    storage: { status: 'DOWN' },
    email: { status: 'DOWN' },
  };

  const memoryUsagePercent = system?.memory ? (system.memory.used / system.memory.total) * 100 : 0;
  const jvmUsagePercent = runtime
    ? ((runtime.totalMemory - runtime.freeMemory) / runtime.totalMemory) * 100
    : 0;
  const uptimeMs = runtime?.uptime
    ? runtime.uptime
    : runtime?.uptimeSeconds
      ? runtime.uptimeSeconds * 1000
      : undefined;

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '未知';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatTime = (milliseconds?: number) => {
    if (!milliseconds) return '未知';
    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}天 ${hours}小时`;
    if (hours > 0) return `${hours}小时 ${minutes}分钟`;
    return `${minutes}分钟`;
  };

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden border border-blue-200/60 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">整体状态</CardTitle>
              <p className="text-xs text-slate-500">版本与部署环境概览</p>
            </div>
          </div>
          <StatusBadge status={safeStatus.overall} />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/60 bg-white/80 p-4">
            <p className="text-xs text-slate-500">版本号</p>
            <p className="mt-1 text-base font-semibold text-slate-800">
              {version?.version ?? 'Unknown'}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              构建时间：{version?.buildTime ? new Date(version.buildTime).toLocaleString() : '未知'}
            </p>
          </div>
          <div className="rounded-xl border border-white/60 bg-white/80 p-4">
            <p className="text-xs text-slate-500">部署环境</p>
            <p className="mt-1 text-base font-semibold text-slate-800">
              {version?.environment || version?.buildProfile || 'Unknown'}
            </p>
            {version?.gitCommit && (
              <p className="mt-2 font-mono text-[11px] text-slate-400">
                Commit：{version.gitCommit.substring(0, 8)}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/60 bg-white/80 p-4">
            <p className="text-xs text-slate-500">累计运行</p>
            <p className="mt-1 text-base font-semibold text-slate-800">
              {formatTime(uptimeMs)}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              启动时间：{runtime?.startTime ? new Date(runtime.startTime).toLocaleString() : '未知'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Activity className="h-5 w-5 text-blue-500" /> JVM 运行状况
            </CardTitle>
            <Badge variant="outline" className="rounded-full border-slate-200 text-xs text-slate-500">
              Java {runtime?.javaVersion ?? '未知'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">最大内存</p>
                <p className="mt-1 font-medium text-slate-800">{formatBytes(runtime?.maxMemory)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">已分配</p>
                <p className="mt-1 font-medium text-slate-800">{formatBytes(runtime?.totalMemory)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">已使用</p>
                <p className="mt-1 font-medium text-slate-800">
                  {formatBytes(runtime ? runtime.totalMemory - runtime.freeMemory : undefined)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">空闲内存</p>
                <p className="mt-1 font-medium text-slate-800">{formatBytes(runtime?.freeMemory)}</p>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>JVM 内存利用率</span>
                <span>{jvmUsagePercent.toFixed(1)}%</span>
              </div>
              <Progress value={jvmUsagePercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Cpu className="h-5 w-5 text-purple-500" /> 宿主机资源
            </CardTitle>
            <Badge variant="outline" className="rounded-full border-slate-200 text-xs text-slate-500">
              {[system?.osName, system?.osVersion].filter(Boolean).join(' ') || '未知系统'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">CPU 核心</p>
                <p className="mt-1 font-medium text-slate-800">
                  {system?.availableProcessors ?? system?.cpuCores ?? '未知'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">操作架构</p>
                <p className="mt-1 font-medium text-slate-800">{system?.osArch ?? '未知'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">总内存</p>
                <p className="mt-1 font-medium text-slate-800">{formatBytes(system?.memory?.total)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">已使用</p>
                <p className="mt-1 font-medium text-slate-800">{formatBytes(system?.memory?.used)}</p>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>物理内存利用率</span>
                <span>{memoryUsagePercent.toFixed(1)}%</span>
              </div>
              <Progress value={memoryUsagePercent} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Signal className="h-5 w-5 text-emerald-500" /> 服务组件状态
          </CardTitle>
          <Badge variant="outline" className="rounded-full border-slate-200 text-xs text-slate-500">
            实时检测关键依赖
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            { key: 'database', label: '数据库', icon: <Database className="h-4 w-4" /> },
            { key: 'redis', label: '缓存', icon: <MemoryStick className="h-4 w-4" /> },
            { key: 'storage', label: '对象存储', icon: <HardDrive className="h-4 w-4" /> },
            { key: 'email', label: '邮件服务', icon: <Mail className="h-4 w-4" /> },
          ].map(({ key, label, icon }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  {icon}
                </div>
                <span className="font-medium text-slate-700">{label}</span>
              </div>
              <StatusBadge status={safeStatus[key as keyof typeof safeStatus]?.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
