import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Badge } from '@affine/admin/components/ui/badge';
import { Progress } from '@affine/admin/components/ui/progress';
import { Separator } from '@affine/admin/components/ui/separator';
import { ScrollArea } from '@affine/admin/components/ui/scroll-area';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Database, 
  Users, 
  Timer,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Server
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Header } from '../header';
import { useMetrics } from './hooks/use-metrics';

export function MonitoringPage() {
  const { 
    systemMetrics, 
    applicationMetrics, 
    databaseMetrics, 
    healthStatus,
    metricsSummary,
    loading, 
    error,
    refreshMetrics 
  } = useMetrics();

  // 自动刷新
  useEffect(() => {
    const interval = setInterval(refreshMetrics, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  if (error) {
    return (
      <div className="h-screen flex-1 flex-col flex">
        <Header title="系统监控" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">监控数据加载失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={refreshMetrics}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex-1 flex-col flex">
      <Header 
        title="系统监控" 
        endFix={
          <div className="flex items-center gap-2">
            <Badge variant={healthStatus?.overall === 'UP' ? 'default' : 'destructive'}>
              {healthStatus?.overall === 'UP' ? '健康' : '异常'}
            </Badge>
            <button 
              onClick={refreshMetrics}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="刷新数据"
            >
              <Activity className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />
      
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* 概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="CPU使用率"
              value={systemMetrics?.cpu?.processCpuLoad || 0}
              unit="%"
              icon={<Cpu className="h-4 w-4" />}
              color={getColorByThreshold(systemMetrics?.cpu?.processCpuLoad || 0, 70, 90)}
            />
            <MetricCard
              title="内存使用率"
              value={systemMetrics?.memory?.heapUsedPercent || 0}
              unit="%"
              icon={<MemoryStick className="h-4 w-4" />}
              color={getColorByThreshold(systemMetrics?.memory?.heapUsedPercent || 0, 70, 85)}
            />
            <MetricCard
              title="磁盘使用率"
              value={systemMetrics?.disk?.usedPercent || 0}
              unit="%"
              icon={<HardDrive className="h-4 w-4" />}
              color={getColorByThreshold(systemMetrics?.disk?.usedPercent || 0, 80, 95)}
            />
            <MetricCard
              title="活跃用户"
              value={applicationMetrics?.userActivity?.activeUsers || 0}
              unit="人"
              icon={<Users className="h-4 w-4" />}
              color="blue"
            />
          </div>

          {/* 告警信息 */}
          {metricsSummary?.alerts && metricsSummary.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  活跃告警
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metricsSummary.alerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{alert.message}</span>
                      </div>
                      <Badge variant="secondary">{alert.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 详细指标 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 系统指标 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  系统资源
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemMetrics && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">CPU使用率</span>
                        <span className="text-sm text-gray-600">
                          {systemMetrics.cpu?.processCpuLoad?.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={systemMetrics.cpu?.processCpuLoad || 0} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">内存使用率</span>
                        <span className="text-sm text-gray-600">
                          {systemMetrics.memory?.heapUsedPercent?.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={systemMetrics.memory?.heapUsedPercent || 0} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">磁盘使用率</span>
                        <span className="text-sm text-gray-600">
                          {systemMetrics.disk?.usedPercent?.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={systemMetrics.disk?.usedPercent || 0} className="h-2" />
                    </div>

                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">可用处理器</span>
                        <p className="font-medium">{systemMetrics.cpu?.availableProcessors} 核</p>
                      </div>
                      <div>
                        <span className="text-gray-600">系统运行时间</span>
                        <p className="font-medium">{formatUptime(systemMetrics.runtime?.uptime)}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 应用指标 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  应用性能
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {applicationMetrics && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">总请求数</span>
                        <p className="text-2xl font-bold">
                          {applicationMetrics.requests?.totalApiCalls?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">平均响应时间</span>
                        <p className="text-2xl font-bold">
                          {applicationMetrics.responseTime ? 
                            Object.values(applicationMetrics.responseTime)[0]?.average?.toFixed(1) || 0 
                            : 0}ms
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <span className="text-sm font-medium mb-2 block">热门API端点</span>
                      <div className="space-y-2">
                        {applicationMetrics.requests?.topEndpoints && 
                          Object.entries(applicationMetrics.requests.topEndpoints)
                            .slice(0, 5)
                            .map(([endpoint, count]) => (
                              <div key={endpoint} className="flex items-center justify-between text-sm">
                                <span className="truncate flex-1 mr-2">{endpoint}</span>
                                <Badge variant="outline">{count}</Badge>
                              </div>
                            ))
                        }
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 数据库指标 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  数据库性能
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {databaseMetrics && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">连接状态</span>
                      <Badge variant={databaseMetrics.database?.connected ? 'default' : 'destructive'}>
                        {databaseMetrics.database?.connected ? '已连接' : '断开'}
                      </Badge>
                    </div>
                    
                    {databaseMetrics.connectionPool && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">连接池使用率</span>
                          <span className="text-sm text-gray-600">
                            {databaseMetrics.connectionPool.activeConnections}/
                            {databaseMetrics.connectionPool.maxConnections}
                          </span>
                        </div>
                        <Progress 
                          value={databaseMetrics.connectionPool.connectionUsage || 0} 
                          className="h-2" 
                        />
                      </div>
                    )}
                    
                    <Separator />
                    
                    {databaseMetrics.queryPerformance && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">平均查询时间</span>
                          <p className="font-medium">{databaseMetrics.queryPerformance.averageQueryTime}ms</p>
                        </div>
                        <div>
                          <span className="text-gray-600">慢查询数</span>
                          <p className="font-medium">{databaseMetrics.queryPerformance.slowQueries}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* 健康检查 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  健康检查
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthStatus && Object.entries(healthStatus)
                  .filter(([key]) => key !== 'overall')
                  .map(([component, status]) => (
                    <div key={component} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{component}</span>
                      <div className="flex items-center gap-2">
                        {status.status === 'UP' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={status.status === 'UP' ? 'default' : 'destructive'}>
                          {status.status === 'UP' ? '正常' : '异常'}
                        </Badge>
                      </div>
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: 'green' | 'yellow' | 'red' | 'blue';
}

function MetricCard({ title, value, unit, icon, color }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">
              {typeof value === 'number' ? value.toFixed(1) : value}{unit}
            </p>
          </div>
          <div className={`p-2 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getColorByThreshold(value: number, warning: number, critical: number): 'green' | 'yellow' | 'red' {
  if (value >= critical) return 'red';
  if (value >= warning) return 'yellow';
  return 'green';
}

function formatUptime(uptime?: number): string {
  if (!uptime) return '未知';
  
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
}

export { MonitoringPage as Component };