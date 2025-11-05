import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Skeleton } from '@yunke/admin/components/ui/skeleton';
import {
  AlertTriangle,
  Clock,
  History,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react';
import type { SecurityEvent } from '../types';
import { EVENT_TYPE_LABELS, SECURITY_LEVEL_META } from '../types';

interface SecurityEventsListProps {
  events: SecurityEvent[] | undefined;
  loading: boolean;
  onRefresh: () => void;
}

export function SecurityEventsList({
  events,
  loading,
  onRefresh,
}: SecurityEventsListProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle>安全事件</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          刷新
        </Button>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : !events || events.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              暂无安全事件，系统运行正常
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => {
              const levelMeta = SECURITY_LEVEL_META[event.level];
              return (
                <div
                  key={index}
                  className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {EVENT_TYPE_LABELS[event.type]}
                        </span>
                        <Badge
                          className={`text-xs ${levelMeta.className} border`}
                        >
                          {levelMeta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {event.details}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {event.ip && (
                          <Badge variant="outline" className="gap-1">
                            IP: {event.ip}
                          </Badge>
                        )}
                        {event.userId && (
                          <Badge variant="outline" className="gap-1">
                            用户: {event.userId}
                          </Badge>
                        )}
                        {event.requestPath && (
                          <Badge variant="outline" className="gap-1">
                            路径: {event.requestPath}
                          </Badge>
                        )}
                        {event.action && (
                          <Badge variant="outline" className="gap-1">
                            动作: {event.action}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

