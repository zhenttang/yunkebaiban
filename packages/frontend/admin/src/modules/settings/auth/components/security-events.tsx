import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Skeleton } from '@yunke/admin/components/ui/skeleton';
import {
  AlertTriangle,
  Clock,
  History,
  Loader2,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
} from 'lucide-react';

import type { SecurityEventDto, SecurityEventSeverity, SecurityEventType } from '../types';

interface SecurityEventsProps {
  events: SecurityEventDto[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const severityMeta: Record<SecurityEventSeverity, { label: string; className: string }> = {
  CRITICAL: { label: '紧急', className: 'bg-rose-500/10 text-rose-600 border border-rose-200/60' },
  HIGH: { label: '高危', className: 'bg-orange-500/10 text-orange-600 border border-orange-200/60' },
  MEDIUM: { label: '中等', className: 'bg-amber-500/10 text-amber-600 border border-amber-200/60' },
  LOW: { label: '低危', className: 'bg-sky-500/10 text-sky-600 border border-sky-200/60' },
  INFO: { label: '信息', className: 'bg-slate-200/60 text-slate-600 border border-slate-300/60' },
};

const eventLabels: Record<SecurityEventType, string> = {
  LOGIN_SUCCESS: '登录成功',
  LOGIN_FAILED: '登录失败',
  LOGOUT: '退出登录',
  PASSWORD_CHANGED: '密码变更',
  ACCOUNT_LOCKED: '账户锁定',
  ACCOUNT_UNLOCKED: '账户解锁',
  SUSPICIOUS_ACTIVITY: '可疑行为',
  PERMISSION_DENIED: '权限拒绝',
  SESSION_EXPIRED: '会话过期',
  TWO_FACTOR_ENABLED: '双因素启用',
  TWO_FACTOR_DISABLED: '双因素关闭',
};

const eventIcons: Partial<Record<SecurityEventType, JSX.Element>> = {
  LOGIN_FAILED: <ShieldX className="h-4 w-4 text-rose-500" />,
  ACCOUNT_LOCKED: <ShieldX className="h-4 w-4 text-rose-500" />,
  PERMISSION_DENIED: <ShieldX className="h-4 w-4 text-rose-500" />,
  SUSPICIOUS_ACTIVITY: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  LOGIN_SUCCESS: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
  ACCOUNT_UNLOCKED: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
  TWO_FACTOR_ENABLED: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
  TWO_FACTOR_DISABLED: <ShieldQuestion className="h-4 w-4 text-amber-500" />,
};

const formatTime = (timestamp: string) => new Date(timestamp).toLocaleString('zh-CN');

export function SecurityEvents({ events, loading, error, onRefresh }: SecurityEventsProps) {
  if (error) {
    return (
      <Card className="border border-rose-200/60 bg-rose-50/40">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-rose-600">
            <ShieldX className="h-5 w-5" /> 安全事件加载失败
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            重新加载
          </Button>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-rose-600">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-slate-200/70 bg-white/90 backdrop-blur">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
            <History className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">安全事件</CardTitle>
            <p className="text-xs text-slate-500">实时记录登录、解锁、风控等关键行为。</p>
          </div>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          刷新
        </Button>
      </CardHeader>
      <CardContent className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-4">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
            暂无安全事件，系统运行稳定。
          </div>
        ) : (
          <div className="relative space-y-4">
            <div className="absolute left-3 top-0 h-full w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent" />
            {events.map((event) => {
              const meta = severityMeta[event.severity] ?? severityMeta.INFO;
              return (
                <div key={event.id} className="relative flex gap-4">
                  <div className="relative z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-white text-slate-600">
                    {eventIcons[event.eventType] ?? <Clock className="h-3.5 w-3.5 text-blue-500" />}
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {eventLabels[event.eventType] ?? event.eventType}
                      </span>
                      <span className="text-xs text-slate-400">{formatTime(event.timestamp)}</span>
                      <Badge className={`${meta.className} text-[11px] uppercase`}>{meta.label}</Badge>
                      {event.userEmail && (
                        <Badge variant="outline" className="rounded-full border-slate-200 text-[11px] text-slate-500">
                          用户 {event.userEmail}
                        </Badge>
                      )}
                      {event.ipAddress && (
                        <Badge variant="outline" className="rounded-full border-slate-200 text-[11px] text-slate-500">
                          IP {event.ipAddress}
                        </Badge>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-3 text-sm text-slate-600">{event.description}</p>
                    )}
                    <div className="mt-4 grid gap-3 text-xs text-slate-500 md:grid-cols-2">
                      {event.userAgent && (
                        <div className="truncate" title={event.userAgent}>
                          <span className="font-medium">设备：</span>
                          {event.userAgent}
                        </div>
                      )}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="space-x-1">
                          <span className="font-medium">详情：</span>
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <span key={key} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
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
