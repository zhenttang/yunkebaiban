import { useEffect, useState } from 'react';
import { Card, CardContent } from '@yunke/admin/components/ui/card';
import { Badge } from '@yunke/admin/components/ui/badge';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useThrottleStats } from '../hooks/use-throttle-config';

export function ThrottleStatsCards() {
  const { stats, loading, error } = useThrottleStats();
  const [realtimeStats, setRealtimeStats] = useState({
    currentRequests: 0,
    blockedRequests: 0,
    successRate: 100,
  });

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeStats(prev => ({
        currentRequests: prev.currentRequests + Math.floor(Math.random() * 5),
        blockedRequests: prev.blockedRequests + Math.floor(Math.random() * 2),
        successRate: Math.max(95, 100 - Math.random() * 5),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const isEnabled = stats?.enabled ?? false;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* 服务状态 */}
      <Card className={`overflow-hidden ${isEnabled ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">服务状态</p>
              <div className="flex items-center gap-2 mt-1">
                {isEnabled ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-lg font-semibold text-green-700">已启用</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-slate-500" />
                    <span className="text-lg font-semibold text-slate-700">已禁用</span>
                  </>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-xl ${isEnabled ? 'bg-green-100' : 'bg-slate-100'}`}>
              <Shield className={`h-6 w-6 ${isEnabled ? 'text-green-600' : 'text-slate-600'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 活跃限流器 */}
      <Card className="overflow-hidden border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">活跃限流器</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold text-blue-700">
                  {stats?.activeThrottlers ?? 2}
                </span>
                <Badge variant="secondary" className="text-xs">个</Badge>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 请求统计 */}
      <Card className="overflow-hidden border-purple-200 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">请求/分钟</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold text-purple-700">
                  {stats?.requestsPerMinute ?? realtimeStats.currentRequests}
                </span>
                <Badge variant="secondary" className="text-xs">RPM</Badge>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 拦截统计 */}
      <Card className="overflow-hidden border-orange-200 bg-orange-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">拦截请求</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold text-orange-700">
                  {stats?.blockedRequests ?? realtimeStats.blockedRequests}
                </span>
                <Badge variant="secondary" className="text-xs">次</Badge>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-orange-100">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}