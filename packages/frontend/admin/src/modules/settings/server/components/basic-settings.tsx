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
import { Separator } from '@yunke/admin/components/ui/separator';
import { Switch } from '@yunke/admin/components/ui/switch';
import { Textarea } from '@yunke/admin/components/ui/textarea';
import { Activity, Clock4, Cloud, Languages, RefreshCcw, Save, Settings, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';

import type { ServerConfigDto } from '../types';

const serverConfigSchema = z.object({
  serverName: z.string().min(1, '服务器名称不能为空').max(100, '服务器名称过长'),
  externalUrl: z.string().url('请输入有效的URL').optional().or(z.literal('')),
  maxUploadSize: z.number().min(1, '最大上传大小不能小于1MB').max(1024, '最大上传大小不能超过1GB'),
  sessionTimeout: z.number().min(5, '会话超时时间不能小于5分钟').max(10080, '会话超时时间不能超过7天'),
  enableSignup: z.boolean(),
  enableInviteCode: z.boolean(),
  defaultLanguage: z.string(),
  timezone: z.string(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().max(500, '维护提示信息过长').optional(),
});

type ServerConfigForm = z.infer<typeof serverConfigSchema>;

type ToggleField = {
  key: keyof Pick<ServerConfigForm, 'enableSignup' | 'enableInviteCode' | 'maintenanceMode'>;
  label: string;
  description: string;
  icon: JSX.Element;
};

interface BasicSettingsProps {
  config: ServerConfigDto;
  onSave: (config: ServerConfigDto) => Promise<{ success: boolean; error?: string; message?: string }>;
  saving: boolean;
}

export function BasicSettings({ config, onSave, saving }: BasicSettingsProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const form = useForm<ServerConfigForm>({
    resolver: zodResolver(serverConfigSchema),
    defaultValues: {
      serverName: config.serverName || 'YUNKE',
      externalUrl: config.externalUrl || '',
      maxUploadSize: config.maxUploadSize || 100,
      sessionTimeout: config.sessionTimeout || 1440,
      enableSignup: config.enableSignup ?? true,
      enableInviteCode: config.enableInviteCode ?? false,
      defaultLanguage: config.defaultLanguage || 'zh-CN',
      timezone: config.timezone || 'Asia/Shanghai',
      maintenanceMode: config.maintenanceMode ?? false,
      maintenanceMessage: config.maintenanceMessage || '',
    },
  });

  const { watch, handleSubmit, reset, formState } = form;
  const { errors, defaultValues } = formState;
  const watchedValues = watch();

  useEffect(() => {
    const changed = Object.keys(watchedValues).some((key) => {
      const field = key as keyof ServerConfigForm;
      return watchedValues[field] !== defaultValues?.[field];
    });
    setHasChanges(changed);
  }, [watchedValues, defaultValues]);

  const onSubmit = async (data: ServerConfigForm) => {
    try {
      const result = await onSave({ ...config, ...data });
      if (result.success) {
        toast.success(result.message || '服务器配置保存成功');
        setHasChanges(false);
        reset(data);
      } else {
        toast.error(result.error || '服务器配置保存失败');
      }
    } catch (error) {
      console.error('Save config error:', error);
      toast.error('保存配置时发生错误');
    }
  };

  const handleReset = () => {
    reset();
    setHasChanges(false);
    toast.info('已重置为原始配置');
  };

  const languageOptions = useMemo(
    () => [
      { value: 'zh-CN', label: '简体中文' },
      { value: 'zh-TW', label: '繁體中文' },
      { value: 'en', label: 'English' },
      { value: 'ja', label: '日本語' },
      { value: 'ko', label: '한국어' },
    ],
    [],
  );

  const timezoneOptions = useMemo(
    () => [
      { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
      { value: 'UTC', label: '协调世界时 (UTC)' },
      { value: 'America/New_York', label: '美国东部时间 (UTC-5)' },
      { value: 'Europe/London', label: '英国时间 (UTC+0)' },
      { value: 'Asia/Tokyo', label: '日本标准时间 (UTC+9)' },
    ],
    [],
  );

  const toggleFields: ToggleField[] = [
    {
      key: 'enableSignup',
      label: '允许用户注册',
      description: '开放自助注册入口，让新用户可以直接加入平台。',
      icon: <Users className="h-4 w-4 text-blue-500" />, 
    },
    {
      key: 'enableInviteCode',
      label: '启用邀请码',
      description: '通过邀请码把控注册名额，适用于小范围内测。',
      icon: <ShieldCheck className="h-4 w-4 text-green-500" />, 
    },
    {
      key: 'maintenanceMode',
      label: '维护模式',
      description: '临时关闭对外服务，向访问者展示维护提示信息。',
      icon: <Activity className="h-4 w-4 text-amber-500" />, 
    },
  ];

  return (
    <Card className="overflow-hidden border border-slate-200/70 bg-white/90 backdrop-blur">
      <CardContent className="space-y-10 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-2 rounded-full border-slate-200 bg-slate-50 text-slate-600">
              <Settings className="h-3.5 w-3.5" />
              运行配置
            </Badge>
            <h3 className="text-xl font-semibold text-slate-900">基础信息</h3>
            <p className="text-sm text-slate-500">
              配置服务器对外展示的名称、访问入口及关键运行参数。
            </p>
          </div>
          {hasChanges && (
            <div className="rounded-full border border-amber-200 bg-amber-50/70 px-4 py-1 text-xs font-medium text-amber-600">
              检测到未保存的更改
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <section className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Sparkles className="h-4 w-4 text-blue-500" /> 基本信息
                </p>
                <span className="text-xs text-slate-500">用于客户端展示与生成链接的基础字段。</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serverName">服务器名称 *</Label>
                <Input id="serverName" {...form.register('serverName')} placeholder="输入服务器名称" />
                {errors.serverName && <p className="text-xs text-red-500">{errors.serverName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalUrl">外部访问 URL</Label>
                <Input id="externalUrl" {...form.register('externalUrl')} placeholder="https://your-domain.com" />
                {errors.externalUrl && <p className="text-xs text-red-500">{errors.externalUrl.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUploadSize" className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-slate-500" /> 最大上传大小 (MB)
                </Label>
                <Input
                  id="maxUploadSize"
                  type="number"
                  {...form.register('maxUploadSize', { valueAsNumber: true })}
                  placeholder="100"
                />
                {errors.maxUploadSize && <p className="text-xs text-red-500">{errors.maxUploadSize.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout" className="flex items-center gap-2">
                  <Clock4 className="h-4 w-4 text-slate-500" /> 会话超时时间 (分钟)
                </Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  {...form.register('sessionTimeout', { valueAsNumber: true })}
                  placeholder="1440"
                />
                {errors.sessionTimeout && <p className="text-xs text-red-500">{errors.sessionTimeout.message}</p>}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-slate-500" /> 默认语言
                </Label>
                <Select
                  value={form.watch('defaultLanguage')}
                  onValueChange={(value) => form.setValue('defaultLanguage', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择默认语言" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock4 className="h-4 w-4 text-slate-500" /> 默认时区
                </Label>
                <Select value={form.watch('timezone')} onValueChange={(value) => form.setValue('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择时区" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-sm">
            <header className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> 功能开关
              </p>
              <span className="text-xs text-slate-500">启用或关闭特性以匹配当前运营阶段。</span>
            </header>

            <div className="grid gap-4">
              {toggleFields.map(({ key, label, description, icon }) => (
                <div
                  key={key}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 transition hover:border-slate-300 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      {icon}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-700">{label}</p>
                      <p className="text-xs text-slate-500">{description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.watch(key)}
                    onCheckedChange={(checked) => form.setValue(key, checked)}
                  />
                </div>
              ))}
            </div>

            {form.watch('maintenanceMode') && (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <Label htmlFor="maintenanceMessage" className="flex items-center gap-2 text-sm font-medium text-amber-700">
                  <RefreshCcw className="h-4 w-4" /> 维护提示信息
                </Label>
                <Textarea
                  id="maintenanceMessage"
                  {...form.register('maintenanceMessage')}
                  placeholder="系统正在维护中，请稍后再试..."
                  rows={3}
                />
                {errors.maintenanceMessage && (
                  <p className="text-xs text-red-500">{errors.maintenanceMessage.message}</p>
                )}
              </div>
            )}
          </section>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-end">
            <div className="flex-1 text-xs text-slate-400 md:text-right">
              保存后将在数秒内同步至服务器，建议在重大改动前备份配置文件。
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                重置
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : '保存配置'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
