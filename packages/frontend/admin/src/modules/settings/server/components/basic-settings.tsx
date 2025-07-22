import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Switch } from '@affine/admin/components/ui/switch';
import { Textarea } from '@affine/admin/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@affine/admin/components/ui/select';
import { toast } from 'sonner';
import { Settings, Save, RotateCcw } from 'lucide-react';
import type { ServerConfigDto } from '../types';

// 表单验证schema
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
      serverName: config.serverName || 'AFFiNE',
      externalUrl: config.externalUrl || '',
      maxUploadSize: config.maxUploadSize || 100,
      sessionTimeout: config.sessionTimeout || 1440, // 24小时
      enableSignup: config.enableSignup ?? true,
      enableInviteCode: config.enableInviteCode ?? false,
      defaultLanguage: config.defaultLanguage || 'zh-CN',
      timezone: config.timezone || 'Asia/Shanghai',
      maintenanceMode: config.maintenanceMode ?? false,
      maintenanceMessage: config.maintenanceMessage || '',
    },
  });

  const { watch, handleSubmit, reset, formState: { errors } } = form;

  // 监听表单变化
  const watchedValues = watch();
  
  // 检查是否有变化
  React.useEffect(() => {
    const hasChanged = Object.keys(watchedValues).some(key => {
      const currentValue = watchedValues[key as keyof ServerConfigForm];
      const originalValue = form.formState.defaultValues?.[key as keyof ServerConfigForm];
      return currentValue !== originalValue;
    });
    setHasChanges(hasChanged);
  }, [watchedValues, form.formState.defaultValues]);

  const onSubmit = async (data: ServerConfigForm) => {
    try {
      const result = await onSave({
        ...config,
        ...data,
      });

      if (result.success) {
        toast.success(result.message || '服务器配置保存成功');
        setHasChanges(false);
        // 更新表单默认值
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

  const languageOptions = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'zh-TW', label: '繁體中文' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
  ];

  const timezoneOptions = [
    { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
    { value: 'UTC', label: '协调世界时 (UTC)' },
    { value: 'America/New_York', label: '美国东部时间 (UTC-5)' },
    { value: 'Europe/London', label: '英国时间 (UTC+0)' },
    { value: 'Asia/Tokyo', label: '日本标准时间 (UTC+9)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          基础设置
        </CardTitle>
        <CardDescription>
          配置服务器的基本信息和运行参数
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">基本信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serverName">服务器名称 *</Label>
                <Input
                  id="serverName"
                  {...form.register('serverName')}
                  placeholder="输入服务器名称"
                />
                {errors.serverName && (
                  <p className="text-sm text-red-500">{errors.serverName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalUrl">外部访问URL</Label>
                <Input
                  id="externalUrl"
                  {...form.register('externalUrl')}
                  placeholder="https://your-domain.com"
                />
                {errors.externalUrl && (
                  <p className="text-sm text-red-500">{errors.externalUrl.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 系统配置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">系统配置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUploadSize">最大上传大小 (MB)</Label>
                <Input
                  id="maxUploadSize"
                  type="number"
                  {...form.register('maxUploadSize', { valueAsNumber: true })}
                  placeholder="100"
                />
                {errors.maxUploadSize && (
                  <p className="text-sm text-red-500">{errors.maxUploadSize.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">会话超时时间 (分钟)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  {...form.register('sessionTimeout', { valueAsNumber: true })}
                  placeholder="1440"
                />
                {errors.sessionTimeout && (
                  <p className="text-sm text-red-500">{errors.sessionTimeout.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">默认语言</Label>
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
                <Label htmlFor="timezone">时区设置</Label>
                <Select
                  value={form.watch('timezone')}
                  onValueChange={(value) => form.setValue('timezone', value)}
                >
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
          </div>

          {/* 功能开关 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">功能开关</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>允许用户注册</Label>
                  <p className="text-sm text-gray-500">允许新用户自主注册账户</p>
                </div>
                <Switch
                  checked={form.watch('enableSignup')}
                  onCheckedChange={(checked) => form.setValue('enableSignup', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用邀请码</Label>
                  <p className="text-sm text-gray-500">用户注册时需要邀请码</p>
                </div>
                <Switch
                  checked={form.watch('enableInviteCode')}
                  onCheckedChange={(checked) => form.setValue('enableInviteCode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>维护模式</Label>
                  <p className="text-sm text-gray-500">启用后系统将进入维护模式</p>
                </div>
                <Switch
                  checked={form.watch('maintenanceMode')}
                  onCheckedChange={(checked) => form.setValue('maintenanceMode', checked)}
                />
              </div>
            </div>

            {form.watch('maintenanceMode') && (
              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">维护提示信息</Label>
                <Textarea
                  id="maintenanceMessage"
                  {...form.register('maintenanceMessage')}
                  placeholder="系统正在维护中，请稍后再试..."
                  rows={3}
                />
                {errors.maintenanceMessage && (
                  <p className="text-sm text-red-500">{errors.maintenanceMessage.message}</p>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
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
        </form>
      </CardContent>
    </Card>
  );
}