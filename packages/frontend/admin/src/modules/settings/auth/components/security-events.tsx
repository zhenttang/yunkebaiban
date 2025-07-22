import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Badge } from '@affine/admin/components/ui/badge';
import { AlertTriangle, Shield, Clock, Trash2, RotateCcw } from 'lucide-react';
import type { SecurityEventDto, SecurityEventSeverity, SecurityEventType } from '../types';

interface SecurityEventsProps {
  events: SecurityEventDto[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function SecurityEvents({ events, loading, error, onRefresh }: SecurityEventsProps) {
  const getSeverityColor = (severity: SecurityEventSeverity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (type: SecurityEventType) => {
    switch (type) {
      case 'LOGIN_FAILED':
      case 'ACCOUNT_LOCKED':
      case 'PERMISSION_DENIED':
      case 'SUSPICIOUS_ACTIVITY':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'LOGIN_SUCCESS':
      case 'ACCOUNT_UNLOCKED':
      case 'TWO_FACTOR_ENABLED':
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getEventTypeLabel = (type: SecurityEventType) => {
    const labels: Record<SecurityEventType, string> = {
      'LOGIN_SUCCESS': '登录成功',
      'LOGIN_FAILED': '登录失败',
      'LOGOUT': '退出登录',
      'PASSWORD_CHANGED': '密码变更',
      'ACCOUNT_LOCKED': '账户锁定',
      'ACCOUNT_UNLOCKED': '账户解锁',
      'SUSPICIOUS_ACTIVITY': '可疑活动',
      'PERMISSION_DENIED': '权限拒绝',
      'SESSION_EXPIRED': '会话过期',
      'TWO_FACTOR_ENABLED': '双因素认证启用',
      'TWO_FACTOR_DISABLED': '双因素认证禁用',
    };
    return labels[type] || type;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>安全事件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">加载失败</div>
            <div className="text-gray-500 mb-4">{error}</div>
            <Button onClick={onRefresh}>重试</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>安全事件</span>
          <div className="flex gap-2">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无安全事件</div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {events.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getEventTypeIcon(event.eventType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {getEventTypeLabel(event.eventType)}
                        </span>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {event.description}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">用户:</span>{' '}
                          {event.userEmail || '未知'}
                        </div>
                        <div>
                          <span className="font-medium">IP:</span>{' '}
                          {event.ipAddress}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">时间:</span>{' '}
                          {formatTime(event.timestamp)}
                        </div>
                        {event.userAgent && (
                          <div className="col-span-2 truncate">
                            <span className="font-medium">设备:</span>{' '}
                            {event.userAgent}
                          </div>
                        )}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="col-span-2">
                            <span className="font-medium">详情:</span>{' '}
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <span key={key} className="inline-block mr-2">
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}