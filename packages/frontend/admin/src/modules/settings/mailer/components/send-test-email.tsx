import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent } from '@yunke/admin/components/ui/card';
import { Input } from '@yunke/admin/components/ui/input';
import { Label } from '@yunke/admin/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yunke/admin/components/ui/select';
import { Switch } from '@yunke/admin/components/ui/switch';
import { Separator } from '@yunke/admin/components/ui/separator';
import { Textarea } from '@yunke/admin/components/ui/textarea';
import { cn } from '@yunke/admin/utils';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardEdit,
  Loader2,
  Mail,
  PlayCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { useMailerConfig } from '../hooks/use-mailer-config';
import { useEmailTemplates } from '../hooks/use-email-templates';
import type { MailerTestResultDto, SendTestMailRequestDto } from '../types';

const testEmailSchema = z.object({
  toEmail: z.string().email('请输入有效的邮箱地址'),
  subject: z.string().min(1, '邮件主题不能为空'),
  content: z.string().min(1, '邮件内容不能为空'),
  useCurrentConfig: z.boolean(),
  templateId: z.string().optional(),
});

type TestEmailForm = z.infer<typeof testEmailSchema>;

export function SendTestEmail() {
  const { config, sendTestMail, testConnection } = useMailerConfig();
  const { templates, refetch } = useEmailTemplates();

  const [connectionResult, setConnectionResult] = useState<MailerTestResultDto | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendResult, setSendResult] = useState<MailerTestResultDto | null>(null);

  const form = useForm<TestEmailForm>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      toEmail: '',
      subject: 'YUNKE 测试邮件',
      content: '这是一封来自 YUNKE 的测试邮件，发送时间：' + new Date().toLocaleString(),
      useCurrentConfig: true,
      templateId: '',
    },
  });

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('mailer:refresh', handler);
    return () => window.removeEventListener('mailer:refresh', handler);
  }, [refetch]);

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'manual') {
      form.setValue('templateId', '');
      return;
    }
    const selected = templates.find(template => template.id === templateId);
    if (selected) {
      form.setValue('templateId', templateId);
      form.setValue('subject', selected.subject);
      form.setValue('content', selected.content);
      toast.success('已应用模板内容');
    } else {
      form.setValue('templateId', '');
    }
  };

  const handleTestConnection = async () => {
    if (!config) {
      toast.error('尚未配置邮件服务');
      return;
    }
    setTestingConnection(true);
    setConnectionResult(null);
    const result = await testConnection();
    setConnectionResult(result);
    setTestingConnection(false);
    toast[result.success ? 'success' : 'error'](result.message || (result.success ? '连接成功' : '连接失败'));
  };

  const fillExampleContent = () => {
    form.setValue('subject', 'YUNKE 邮件服务链路测试');
    form.setValue(
      'content',
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #334155; }
    .card { border-radius: 12px; padding: 24px; background: #f8fafc; margin-top: 16px; }
    .muted { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <h2 style="color:#6366f1;">YUNKE 邮件服务测试</h2>
  <p>您好，</p>
  <p>这是一封来自 <strong>YUNKE 管理后台</strong> 的测试邮件，发送时间：${new Date().toLocaleString()}。</p>
  <div class="card">
    <p><strong>当前配置验证通过</strong></p>
    <ul>
      <li>SMTP 服务地址：${config?.host ?? '未配置'}</li>
      <li>发件人邮箱：${config?.sender ?? '未配置'}</li>
      <li>安全策略：${config?.ssl ? 'SSL' : config?.startTls ? 'STARTTLS' : '无加密'}</li>
    </ul>
  </div>
  <p class="muted">若收件正常，说明邮件发送链路工作正常。</p>
</body>
</html>`
    );
    toast.success('已填充示例内容');
  };

  const handleSend = async (data: TestEmailForm) => {
    setSendingEmail(true);
    setSendResult(null);
    const request: SendTestMailRequestDto = {
      toEmail: data.toEmail,
      subject: data.subject,
      content: data.content,
      useCurrentConfig: data.useCurrentConfig,
    };
    const result = await sendTestMail(request);
    setSendResult(result);
    setSendingEmail(false);
    toast[result.success ? 'success' : 'error'](result.message || (result.success ? '测试邮件已发送' : '发送失败'));
  };

  const connectionStatusBadge = config?.enabled ? (
    <Badge variant="outline" className="gap-2 rounded-full border-emerald-200 bg-emerald-50 text-emerald-600">
      <ShieldCheck className="h-3.5 w-3.5" /> 服务已启用
    </Badge>
  ) : (
    <Badge variant="destructive" className="gap-2 rounded-full">
      <AlertTriangle className="h-3.5 w-3.5" /> 服务未启用
    </Badge>
  );

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-2 rounded-full border-slate-200 bg-slate-50 text-slate-600">
              <Send className="h-3.5 w-3.5" /> 链路验证
            </Badge>
            <h3 className="text-xl font-semibold text-slate-900">SMTP 连接状态</h3>
            <p className="text-sm text-slate-500">
              在发送测试邮件前，建议先校验 SMTP 配置与认证是否可用。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {connectionStatusBadge}
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testingConnection || !config?.enabled}
              className="flex items-center gap-2"
            >
              {testingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              测试连接
            </Button>
          </div>
        </CardContent>
      </Card>

      {connectionResult && (
        <ResultCallout
          success={connectionResult.success}
          title={connectionResult.success ? '连接测试成功' : '连接测试失败'}
          message={connectionResult.message}
          details={connectionResult.details}
          duration={connectionResult.duration}
        />
      )}

      <form onSubmit={form.handleSubmit(handleSend)} className="space-y-6">
        <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
          <CardContent className="space-y-6 p-6 md:p-8">
            <section className="space-y-4">
              <header className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">邮件内容</p>
                  <span className="text-xs text-slate-500">支持直接编写 HTML 内容或引用已有模板。</span>
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="toEmail">收件人邮箱</Label>
                  <Input id="toEmail" type="email" placeholder="test@example.com" {...form.register('toEmail')} />
                  {form.formState.errors.toEmail && (
                    <p className="text-xs text-red-500">{form.formState.errors.toEmail.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateId">使用模板（可选）</Label>
                  <Select value={form.watch('templateId')} onValueChange={handleTemplateSelect}>
                    <SelectTrigger id="templateId">
                      <SelectValue placeholder="选择模板或手动填写内容" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">手动编写</SelectItem>
                      {templates.filter(t => t.isActive).map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">邮件主题</Label>
                <Input id="subject" placeholder="YUNKE 测试邮件" {...form.register('subject')} />
                {form.formState.errors.subject && (
                  <p className="text-xs text-red-500">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">邮件内容</Label>
                  <Button type="button" variant="outline" size="sm" onClick={fillExampleContent}>
                    <ClipboardEdit className="mr-2 h-4 w-4" /> 填充示例
                  </Button>
                </div>
                <Textarea
                  id="content"
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="支持 HTML 内容，可包含样式或占位变量"
                  {...form.register('content')}
                />
                {form.formState.errors.content && (
                  <p className="text-xs text-red-500">{form.formState.errors.content.message}</p>
                )}
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <header className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">发送选项</p>
                  <span className="text-xs text-slate-500">可选择使用当前配置或临时凭据发送。</span>
                </div>
              </header>

              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">使用当前 SMTP 配置</p>
                  <p className="text-xs text-slate-500">如需测试临时配置，可先前往 SMTP 页面保存后再发送。</p>
                </div>
                <Switch
                  checked={form.watch('useCurrentConfig')}
                  onCheckedChange={checked => form.setValue('useCurrentConfig', checked)}
                />
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
              <div className={cn('text-xs text-slate-400', !config?.enabled && 'text-amber-600')}>
                {!config?.enabled
                  ? 'SMTP 服务尚未启用，无法发送测试邮件。请先在 SMTP 配置中启用服务。'
                  : '系统将使用当前配置发送测试邮件，如长时间未收到请检查垃圾邮件。'}
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={sendingEmail || !config?.enabled} className="flex items-center gap-2">
                  {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  发送测试邮件
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {sendResult && (
        <ResultCallout
          success={sendResult.success}
          title={sendResult.success ? '测试邮件发送成功' : '测试邮件发送失败'}
          message={sendResult.message}
          details={sendResult.details}
          duration={sendResult.duration}
        />
      )}
    </div>
  );
}

function ResultCallout({
  success,
  title,
  message,
  details,
  duration,
}: {
  success: boolean;
  title: string;
  message: string;
  details?: string;
  duration?: number;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-sm',
        success ? 'border-emerald-200/70 bg-emerald-50/60 text-emerald-700' : 'border-rose-200/70 bg-rose-50/60 text-rose-700',
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {title}
      </div>
      <p className="mt-2 text-xs opacity-80">{message}</p>
      {duration !== undefined && (
        <p className="mt-2 text-xs opacity-60">耗时 {duration} ms</p>
      )}
      {details && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-[11px] text-slate-600 shadow-inner">
          {details}
        </pre>
      )}
    </div>
  );
}
