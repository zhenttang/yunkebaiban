import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@affine/admin/components/ui/badge';
import { Button } from '@affine/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { DatePickerWithRange } from '@affine/admin/components/ui/date-range-picker';
import { Progress } from '@affine/admin/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@affine/admin/components/ui/select';
import { Skeleton } from '@affine/admin/components/ui/skeleton';
import { cn } from '@affine/admin/utils';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  Loader2,
  Mail,
  PieChart,
  RefreshCw,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

import { useEmailTemplates } from '../hooks/use-email-templates';
import type { MailTemplateDto } from '../types';

interface StatisticsData {
  overview: {
    totalSent: number;
    successRate: number;
    failureRate: number;
    totalTemplates: number;
    todaySent: number;
    weekSent: number;
    monthSent: number;
  };
  trend: Array<{ date: string; sent: number; success: number; failed: number }>;
  templates: Array<{ name: string; type: string; usage: number; successRate: number; lastUsed: string }>;
  recentLogs: Array<{ id: string; subject: string; toEmail: string; status: 'success' | 'failed'; sentAt: string; errorMessage?: string }>;
}

export function EmailStatistics() {
  const { templates } = useEmailTemplates();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => ({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  }));
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const data = generateMockStatistics(templates);
      setStatistics(data);
    } catch (err) {
      console.error(err);
      toast.error('获取邮件统计失败');
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [templateFilter, dateRange, templates.length]);

  useEffect(() => {
    const handler = () => fetchStatistics();
    window.addEventListener('mailer:refresh', handler);
    return () => window.removeEventListener('mailer:refresh', handler);
  }, []);

  const filteredLogs = useMemo(() => {
    if (!statistics) return [];
    if (templateFilter === 'all') return statistics.recentLogs;
    const template = templates.find(t => t.id === templateFilter);
    return statistics.recentLogs.filter(log => log.subject.includes(template?.name ?? ''));
  }, [statistics, templateFilter, templates]);

  if (loading) {
    return (
      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-white/80 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card className="border border-rose-200/70 bg-rose-50/60">
        <CardContent className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-rose-600">
          <AlertCircle className="h-5 w-5" /> 邮件统计数据暂不可用
          <Button size="sm" variant="outline" onClick={fetchStatistics}>
            重新获取
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { overview, trend, templates: templateUsage } = statistics;
  const totalSuccess = Math.round((overview.successRate / 100) * overview.totalSent);
  const totalFailed = overview.totalSent - totalSuccess;

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      dateRange,
      templateFilter,
      overview,
      trend,
      templateUsage,
      logs: filteredLogs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mailer-statistics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('统计数据已导出');
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardContent className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
          <OverviewCard
            title="累计发送"
            value={overview.totalSent.toLocaleString()}
            icon={<Send className="h-4 w-4 text-blue-500" />}
            description={`本月 ${overview.monthSent.toLocaleString()} 封`}
          />
          <OverviewCard
            title="成功率"
            value={`${overview.successRate.toFixed(1)}%`}
            trendLabel={`今日成功 ${overview.todaySent.toLocaleString()} 封`}
            positive
          />
          <OverviewCard
            title="失败率"
            value={`${overview.failureRate.toFixed(1)}%`}
            trendLabel={`${totalFailed.toLocaleString()} 封累计失败`}
            negative
          />
          <OverviewCard
            title="模板数量"
            value={overview.totalTemplates.toString()}
            description={`正在使用 ${templateUsage.filter(t => t.successRate > 90).length} 个模板`}
            icon={<Mail className="h-4 w-4 text-emerald-500" />}
          />
        </CardContent>
      </Card>

      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">发送趋势</CardTitle>
            <p className="text-xs text-slate-500">按日统计过去 30 天的发送量与成功率。</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
            <Button variant="outline" size="sm" onClick={fetchStatistics} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> 刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TrendChart data={trend} />
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-2 text-slate-600"><span className="h-2 w-2 rounded-full bg-blue-500" />发送量</span>
            <span className="flex items-center gap-2 text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />成功数</span>
            <span className="flex items-center gap-2 text-rose-600"><span className="h-2 w-2 rounded-full bg-rose-500" />失败数</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900">模板使用情况</CardTitle>
            <p className="text-xs text-slate-500">了解各模板的投递量与成功率，识别表现最优的模板。</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={templateFilter} onValueChange={setTemplateFilter}>
              <SelectTrigger className="h-9 w-48 rounded-full border-slate-200">
                <SelectValue placeholder="选择模板" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有模板</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" /> 导出数据
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {templateUsage.slice(0, 6).map(template => (
            <div key={template.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{template.name}</p>
                  <span className="text-xs text-slate-400">{template.type}</span>
                </div>
                <Badge variant={template.successRate > 95 ? 'outline' : 'secondary'} className="rounded-full px-2 py-0.5 text-xs">
                  成功率 {template.successRate}%
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>发送次数</span>
                  <span>{template.usage.toLocaleString()}</span>
                </div>
                <Progress value={template.successRate} className="h-2" />
                <p className="text-xs text-slate-400">最近使用：{new Date(template.lastUsed).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">最近发送记录</CardTitle>
          <p className="text-xs text-slate-500">展示最近 20 条邮件发送日志，便于追踪问题。</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredLogs.slice(0, 10).map(log => (
            <div
              key={log.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={log.status === 'success' ? 'outline' : 'destructive'}
                    className={cn('rounded-full px-2 py-0.5 text-xs', log.status === 'success' ? 'border-emerald-200 text-emerald-600' : '')}
                  >
                    {log.status === 'success' ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> 成功</span>
                    ) : (
                      <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> 失败</span>
                    )}
                  </Badge>
                  <span className="font-medium text-slate-800">{log.subject}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {log.toEmail} · {new Date(log.sentAt).toLocaleString()}
                </div>
                {log.errorMessage && (
                  <p className="mt-2 text-xs text-rose-500">错误：{log.errorMessage}</p>
                )}
              </div>
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs text-slate-500">
                {log.status === 'success' ? '投递完成' : '等待重试'}
              </Badge>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-500">
              暂无发送记录。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewCard({
  title,
  value,
  description,
  trendLabel,
  icon,
  positive,
  negative,
}: {
  title: string;
  value: string;
  description?: string;
  trendLabel?: string;
  icon?: JSX.Element;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon ?? <BarChart3 className="h-4 w-4 text-slate-400" />} {title}
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      {trendLabel && (
        <div
          className={cn(
            'mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs',
            positive && 'bg-emerald-100 text-emerald-700',
            negative && 'bg-rose-100 text-rose-700',
            !positive && !negative && 'bg-slate-100 text-slate-500',
          )}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : negative ? <ArrowDownRight className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}

function TrendChart({ data }: { data: Array<{ date: string; sent: number; success: number; failed: number }> }) {
  return (
    <div className="relative h-56 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50">
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-4 opacity-40">
        {Array.from({ length: 48 }).map((_, index) => (
          <div key={index} className="border border-slate-200/40" />
        ))}
      </div>
      <div className="relative h-full w-full p-4 text-xs text-slate-400">
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px]">
          {data.filter((_, index) => index % 5 === 0).map(item => (
            <span key={item.date}>{item.date.slice(5)}</span>
          ))}
        </div>
        <div className="absolute left-4 top-4 flex h-[calc(100%-48px)] w-[calc(100%-32px)] items-end gap-1">
          {data.map(point => {
            const total = Math.max(point.sent, 1);
            const successPercent = (point.success / total) * 100;
            const failedPercent = (point.failed / total) * 100;
            const sentHeight = Math.min(point.sent / 4, 100);
            return (
              <div key={point.date} className="flex w-1.5 flex-col justify-end">
                <div className="h-full rounded-full bg-slate-200/40">
                  <div className="rounded-t-full bg-blue-400/60" style={{ height: `${sentHeight}%` }} />
                  <div className="rounded-t-full bg-emerald-400" style={{ height: `${successPercent / 2}%` }} />
                  <div className="rounded-t-full bg-rose-400" style={{ height: `${failedPercent / 2}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function generateMockStatistics(templates: MailTemplateDto[]): StatisticsData {
  const overview = {
    totalSent: 15420,
    successRate: 96.8,
    failureRate: 3.2,
    totalTemplates: templates.length || 6,
    todaySent: 245,
    weekSent: 1680,
    monthSent: 7240,
  };

  const trend = Array.from({ length: 30 }).map((_, index) => {
    const date = new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000);
    const sent = Math.floor(Math.random() * 300) + 80;
    const success = Math.floor(sent * (0.92 + Math.random() * 0.06));
    return {
      date: date.toISOString().split('T')[0],
      sent,
      success,
      failed: sent - success,
    };
  });

  const templateUsage = templates.length
    ? templates.map(template => ({
        name: template.name,
        type: template.type,
        usage: Math.floor(Math.random() * 1200) + 50,
        successRate: Math.floor(90 + Math.random() * 10),
        lastUsed: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      }))
    : Array.from({ length: 4 }).map((_, index) => ({
        name: `系统模板 ${index + 1}`,
        type: '自动通知',
        usage: Math.floor(Math.random() * 1200) + 50,
        successRate: Math.floor(90 + Math.random() * 10),
        lastUsed: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      }));

  const recentLogs = Array.from({ length: 20 }).map((_, index) => ({
    id: `log-${index}`,
    subject: `邮件任务 #${index + 1}`,
    toEmail: `user${index}@example.com`,
    status: Math.random() > 0.1 ? 'success' : 'failed',
    sentAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    errorMessage: Math.random() > 0.9 ? 'SMTP 连接超时' : undefined,
  }));

  return { overview, trend, templates: templateUsage, recentLogs };
}
