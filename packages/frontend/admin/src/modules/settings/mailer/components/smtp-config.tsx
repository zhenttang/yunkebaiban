import { useEffect, useMemo, useState } from 'react';
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
import { cn } from '@yunke/admin/utils';
import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Loader2,
  Mail,
  RefreshCcw,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  TestTube,
} from 'lucide-react';
import { toast } from 'sonner';

import { useMailerConfig } from '../hooks/use-mailer-config';
import type { MailerConfigDto } from '../types';

const smtpConfigSchema = z.object({
  enabled: z.boolean(),
  host: z.string().min(1, 'SMTP 主机不能为空'),
  port: z.number().min(1, '端口必须大于 0').max(65535, '端口范围无效'),
  username: z.string().optional(),
  password: z.string().optional(),
  sender: z.string().email('请输入有效的发件人邮箱'),
  senderName: z.string().optional(),
  ssl: z.boolean().optional(),
  startTls: z.boolean().optional(),
  ignoreTls: z.boolean().optional(),
  connectionTimeout: z.number().min(1000).optional(),
  readTimeout: z.number().min(1000).optional(),
  debug: z.boolean().optional(),
  provider: z.string().optional(),
  maxQueueSize: z.number().min(1).optional(),
  maxRetries: z.number().min(0).optional(),
  retryInterval: z.number().min(1).optional(),
  queueEnabled: z.boolean().optional(),
});

type SmtpConfigForm = z.infer<typeof smtpConfigSchema>;

export function SmtpConfig() {
  const {
    config,
    providers,
    loading,
    error,
    updateConfig,
    testConnection,
    validateConfig,
    getProviderPreset,
    reloadConfig,
    refetch,
  } = useMailerConfig();

  const [testing, setTesting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors?: string[]; warnings?: string[] } | null>(null);

  const form = useForm<SmtpConfigForm>({
    resolver: zodResolver(smtpConfigSchema),
    defaultValues: {
      enabled: false,
      host: '',
      port: 587,
      username: '',
      password: '',
      sender: '',
      senderName: '',
      ssl: false,
      startTls: true,
      ignoreTls: false,
      connectionTimeout: 5000,
      readTimeout: 10000,
      debug: false,
      provider: '',
      maxQueueSize: 100,
      maxRetries: 3,
      retryInterval: 5,
      queueEnabled: true,
    },
  });

  const { watch, reset, formState, handleSubmit, getValues } = form;

  useEffect(() => {
    if (config) {
      reset({
        enabled: config.enabled ?? false,
        host: config.host ?? '',
        port: config.port ?? 587,
        username: config.username ?? '',
        password: config.password ?? '',
        sender: config.sender ?? '',
        senderName: config.senderName ?? '',
        ssl: config.ssl ?? false,
        startTls: config.startTls ?? true,
        ignoreTls: config.ignoreTls ?? false,
        connectionTimeout: config.connectionTimeout ?? 5000,
        readTimeout: config.readTimeout ?? 10000,
        debug: config.debug ?? false,
        provider: config.provider ?? '',
        maxQueueSize: config.maxQueueSize ?? 100,
        maxRetries: config.maxRetries ?? 3,
        retryInterval: config.retryInterval ?? 5,
        queueEnabled: config.queueEnabled ?? true,
      }, { keepDirty: false });
    }
  }, [config, reset]);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('mailer:refresh', handler);
    return () => window.removeEventListener('mailer:refresh', handler);
  }, [refetch]);

  const handleProviderSelect = async (providerId: string) => {
    if (!providerId || providerId === 'manual') {
      form.setValue('provider', '');
      return;
    }
    const preset = await getProviderPreset(providerId);
    if (preset) {
      form.setValue('provider', providerId);
      form.setValue('host', preset.defaultHost ?? '');
      if (preset.defaultPort) {
        form.setValue('port', preset.defaultPort);
      }
      form.setValue('ssl', preset.defaultSsl ?? false);
      form.setValue('startTls', preset.defaultStartTls ?? true);
      toast.success(`已应用 ${preset.name} 预设`);
    }
  };

  const onSave = async (data: SmtpConfigForm) => {
    const result = await updateConfig(data as MailerConfigDto);
    if (result.success) {
      toast.success('SMTP 配置已保存');
      setTestResult(null);
      setValidationResult(null);
    } else {
      toast.error(result.error ?? '保存失败');
    }
  };

  const onTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(getValues() as MailerConfigDto);
    setTesting(false);
    setTestResult(result);
    toast[result.success ? 'success' : 'error'](result.message || (result.success ? '连接测试成功' : '连接测试失败'));
  };

  const onValidateConfig = async () => {
    setValidating(true);
    try {
      const result = await validateConfig(getValues() as MailerConfigDto);
      setValidationResult(result);
      toast[result.valid ? 'success' : 'error'](result.valid ? '配置验证通过' : '配置存在问题');
    } finally {
      setValidating(false);
    }
  };

  const onReload = async () => {
    const result = await reloadConfig();
    toast[result.success ? 'success' : 'error'](result.success ? '配置已重新加载' : result.error || '重新加载失败');
  };

  const enabled = watch('enabled');
  const provider = watch('provider');
  const ssl = watch('ssl');
  const startTls = watch('startTls');
  const debug = watch('debug');

  const summaryTags = useMemo(() => {
    return [
      enabled ? '服务已启用' : '服务关闭',
      provider && provider !== 'manual' ? `预设: ${providers.find(p => p.id === provider)?.name ?? provider}` : '手动配置',
      ssl ? 'SSL' : startTls ? 'STARTTLS' : '无加密',
      debug ? '调试日志开启' : '调试关闭',
    ];
  }, [enabled, provider, providers, ssl, startTls, debug]);

  if (loading) {
    return (
      <Card className="border border-slate-200/70 bg-white/80 backdrop-blur">
        <CardContent className="flex h-40 items-center justify-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> 正在加载邮件配置...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-rose-200/60 bg-rose-50/50">
        <CardContent className="flex h-40 items-center justify-center text-sm text-rose-600">
          <AlertTriangle className="mr-2 h-4 w-4" /> {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-slate-200/70 bg-white/90 backdrop-blur">
      <CardContent className="space-y-10 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-2 rounded-full border-slate-200 bg-slate-50 text-slate-600">
              <Server className="h-3.5 w-3.5" /> SMTP 服务
            </Badge>
            <h3 className="text-xl font-semibold text-slate-900">连接与凭证</h3>
            <p className="text-sm text-slate-500">
              指定邮件服务器地址、认证信息与安全策略，确保系统通知可靠送达。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {summaryTags.map(tag => (
              <Badge key={tag} variant="outline" className="rounded-full border-slate-200 text-xs text-slate-600">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-8">
          <section className="space-y-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-6 shadow-sm">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">基础设置</p>
                  <span className="text-xs text-blue-600/80">填写 SMTP 主机、端口及登录凭据。</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">启用邮件服务</span>
                <Switch checked={watch('enabled')} onCheckedChange={checked => form.setValue('enabled', checked)} />
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <div className="space-y-2">
                <Label htmlFor="host">SMTP 主机</Label>
                <Input id="host" placeholder="smtp.example.com" {...form.register('host')} />
                {formState.errors.host && <p className="text-xs text-red-500">{formState.errors.host.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">端口</Label>
                <Input id="port" type="number" {...form.register('port', { valueAsNumber: true })} />
                {formState.errors.port && <p className="text-xs text-red-500">{formState.errors.port.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="username">用户名/账号</Label>
                <Input id="username" placeholder="no-reply@example.com" {...form.register('username')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码或应用密钥</Label>
                <Input id="password" type="password" placeholder="应用专用密码" {...form.register('password')} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sender">发件人邮箱</Label>
                <Input id="sender" type="email" placeholder="noreply@example.com" {...form.register('sender')} />
                {formState.errors.sender && <p className="text-xs text-red-500">{formState.errors.sender.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderName">发件人名称</Label>
                <Input id="senderName" placeholder="YUNKE" {...form.register('senderName')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>服务提供商预设</Label>
              <Select value={watch('provider')} onValueChange={handleProviderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="选择常用服务商或保持手动配置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">手动配置</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">传输安全</p>
                <span className="text-xs text-slate-500">配置 SSL/STARTTLS 或验证策略以保障链路安全。</span>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <SecurityToggle
                title="启用 SSL"
                description="直接使用 SSL 加密连接"
                checked={watch('ssl')}
                onChange={checked => form.setValue('ssl', checked)}
              />
              <SecurityToggle
                title="启用 STARTTLS"
                description="先普通连接，再升级为 TLS"
                checked={watch('startTls')}
                onChange={checked => form.setValue('startTls', checked)}
              />
              <SecurityToggle
                title="忽略证书验证"
                description="仅在测试环境中使用"
                checked={watch('ignoreTls')}
                onChange={checked => form.setValue('ignoreTls', checked)}
                danger
              />
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">高级与队列</p>
                <span className="text-xs text-emerald-600/80">灵活控制超时、队列与重试策略，提升吞吐能力。</span>
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="connectionTimeout">连接超时 (毫秒)</Label>
                <Input
                  id="connectionTimeout"
                  type="number"
                  {...form.register('connectionTimeout', { valueAsNumber: true })}
                />
                {formState.errors.connectionTimeout && (
                  <p className="text-xs text-red-500">{formState.errors.connectionTimeout.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="readTimeout">读取超时 (毫秒)</Label>
                <Input
                  id="readTimeout"
                  type="number"
                  {...form.register('readTimeout', { valueAsNumber: true })}
                />
                {formState.errors.readTimeout && (
                  <p className="text-xs text-red-500">{formState.errors.readTimeout.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="maxQueueSize">最大队列长度</Label>
                <Input
                  id="maxQueueSize"
                  type="number"
                  {...form.register('maxQueueSize', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRetries">最大重试次数</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  {...form.register('maxRetries', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryInterval">重试间隔 (分钟)</Label>
                <Input
                  id="retryInterval"
                  type="number"
                  {...form.register('retryInterval', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SecurityToggle
                title="启用发送队列"
                description="通过后台任务批量处理邮件"
                checked={watch('queueEnabled')}
                onChange={checked => form.setValue('queueEnabled', checked)}
              />
              <SecurityToggle
                title="输出调试日志"
                description="记录 SMTP 详细请求日志"
                checked={watch('debug')}
                onChange={checked => form.setValue('debug', checked)}
              />
            </div>

          </section>

          {testResult && (
            <ResultCallout
              success={testResult.success}
              title={testResult.success ? '连接测试成功' : '连接测试失败'}
              message={testResult.message}
              details={testResult.details}
            />
          )}

          {validationResult && (
            <ResultCallout
              success={validationResult.valid}
              title={validationResult.valid ? '配置验证通过' : '配置存在问题'}
              message={validationResult.valid ? '所有校验项均已通过' : '请检查以下错误或警告'}
              details={
                validationResult.errors?.join('\n') ||
                validationResult.warnings?.join('\n') ||
                undefined
              }
              warnings={!validationResult.valid ? validationResult.warnings : undefined}
            />
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-400">
              建议保存后立即通过“测试连接”验证配置；如需重新加载服务器端配置，可使用下方按钮。
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={onValidateConfig}
                disabled={validating}
              >
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                验证配置
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={onTestConnection}
                disabled={testing}
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                测试连接
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReload}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                重新加载
              </Button>
              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={formState.isSubmitting || !formState.isDirty}
              >
                {formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Inbox className="h-4 w-4" />}
                保存配置
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SecurityToggle({
  title,
  description,
  checked,
  onChange,
  danger,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-center md:justify-between',
        danger ? 'border-rose-200 text-rose-600' : 'border-slate-200 text-slate-600',
      )}
    >
      <div>
        <p className={cn('text-sm font-medium', danger ? 'text-rose-600' : 'text-slate-700')}>{title}</p>
        <p className={cn('text-xs', danger ? 'text-rose-500/80' : 'text-slate-500')}>{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ResultCallout({
  success,
  title,
  message,
  details,
  warnings,
}: {
  success: boolean;
  title: string;
  message: string;
  details?: string;
  warnings?: string[];
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-sm',
        success ? 'border-emerald-200/70 bg-emerald-50/60 text-emerald-700' : 'border-amber-200/70 bg-amber-50/60 text-amber-700',
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {title}
      </div>
      <p className="mt-2 text-xs opacity-80">{message}</p>
      {details && (
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-[11px] text-slate-600 shadow-inner">
          {details}
        </pre>
      )}
      {warnings && warnings.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-amber-700">
          {warnings.map(warning => (
            <li key={warning}>• {warning}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
