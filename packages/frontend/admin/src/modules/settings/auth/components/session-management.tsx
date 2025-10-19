import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Button } from '@yunke/admin/components/ui/button';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Trash2, Users, Clock, Activity, RefreshCw } from 'lucide-react';
import { useActiveSessions } from '../hooks/use-security-events';

export function SessionManagement() {
  const {
    sessions,
    stats,
    loading: sessionsLoading,
    error: sessionsError,
    refetch,
    invalidateSession,
    invalidateAllSessions
  } = useActiveSessions();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const handleInvalidateAll = async () => {
    if (confirm('确定要强制登出所有用户吗？这将影响所有活跃用户。')) {
      const result = await invalidateAllSessions();
      if (result.success) {
        alert('已成功强制登出所有用户');
      } else {
        alert('操作失败：' + result.error);
      }
    }
  };

  const handleInvalidateSession = async (sessionId: string) => {
    if (confirm('确定要强制登出此用户吗？')) {
      const result = await invalidateSession(sessionId);
      if (result.success) {
        alert('已成功强制登出用户');
      } else {
        alert('操作失败：' + result.error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <span>会话管理</span>
          {stats && (
            <Badge variant="secondary">
              {stats.totalActiveSessions} 个活跃会话
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          管理用户会话和查看会话统计信息
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 会话统计 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-sm font-medium">{stats.uniqueActiveUsers}</div>
                <div className="text-xs text-gray-500">活跃用户</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">{stats.sessionsLast24h}</div>
                <div className="text-xs text-gray-500">24小时内登录</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-sm font-medium">{formatDuration(stats.averageSessionDuration)}</div>
                <div className="text-xs text-gray-500">平均会话时长</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-sm font-medium">{stats.totalActiveSessions}</div>
                <div className="text-xs text-gray-500">总活跃会话</div>
              </div>
            </div>
          </div>
        )}

        {/* 会话控制 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">活跃会话</h3>
          <div className="flex gap-2">
            <Button
              onClick={refetch}
              variant="outline"
              size="sm"
              disabled={sessionsLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button
              onClick={handleInvalidateAll}
              variant="destructive"
              size="sm"
              disabled={sessionsLoading || !sessions?.length}
            >
              强制登出所有用户
            </Button>
          </div>
        </div>

        {/* 错误提示 */}
        {sessionsError && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
            {sessionsError}
          </div>
        )}

        {/* 活跃会话列表 */}
        {sessionsLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium truncate">{session.userEmail}</span>
                    <Badge variant={session.isActive ? "default" : "secondary"}>
                      {session.isActive ? "活跃" : "过期"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">IP:</span> {session.ipAddress}
                    </div>
                    <div>
                      <span className="font-medium">最后活动:</span> {formatTime(session.lastActivity)}
                    </div>
                    {session.createdAt && (
                      <div>
                        <span className="font-medium">创建时间:</span> {formatTime(session.createdAt)}
                      </div>
                    )}
                    {session.expiresAt && (
                      <div>
                        <span className="font-medium">过期时间:</span> {formatTime(session.expiresAt)}
                      </div>
                    )}
                    <div className="md:col-span-2 truncate">
                      <span className="font-medium">设备:</span> {session.userAgent}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleInvalidateSession(session.id)}
                  variant="outline"
                  size="sm"
                  className="ml-4 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  强制登出
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">暂无活跃会话</div>
        )}
      </CardContent>
    </Card>
  );
}