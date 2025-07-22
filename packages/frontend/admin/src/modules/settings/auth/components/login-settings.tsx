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
import { toast } from 'sonner';
import { Shield, Save, RotateCcw, TestTube } from 'lucide-react';
import type { AuthConfigDto } from '../types';

const authConfigSchema = z.object({
  enableLoginLocking: z.boolean(),
  maxLoginAttempts: z.number().min(1, '最大尝试次数不能小于1').max(20, '最大尝试次数不能大于20'),
  lockoutDuration: z.number().min(1, '锁定时间不能小于1分钟').max(10080, '锁定时间不能大于7天'),
  enableTwoFactor: z.boolean(),
  forceTwoFactor: z.boolean(),
  totpValidityMinutes: z.number().min(1, '验证码有效期不能小于1分钟').max(60, '验证码有效期不能大于60分钟'),
  enableRememberMe: z.boolean(),
  rememberMeDays: z.number().min(1, '记住登录时长不能小于1天').max(365, '记住登录时长不能大于365天'),
  enableSso: z.boolean(),
  limitConcurrentSessions: z.boolean(),
  maxConcurrentSessions: z.number().min(1, '最大并发会话数不能小于1').max(100, '最大并发会话数不能大于100'),
  enableIpWhitelist: z.boolean(),
  ipWhitelist: z.string(),
  enableLoginCaptcha: z.boolean(),
  captchaThreshold: z.number().min(0, '验证码触发次数不能小于0').max(10, '验证码触发次数不能大于10'),
  requireEmailVerification: z.boolean(),
  requirePhoneVerification: z.boolean(),
});

type AuthConfigForm = z.infer<typeof authConfigSchema>;

interface LoginSettingsProps {
  config: AuthConfigDto;
  onSave: (config: AuthConfigDto) => Promise<{ success: boolean; error?: string; message?: string }>;
  onTest?: () => Promise<any>;
  saving: boolean;
}

export function LoginSettings({ config, onSave, onTest, saving }: LoginSettingsProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [testing, setTesting] = useState(false);

  const form = useForm<AuthConfigForm>({
    resolver: zodResolver(authConfigSchema),
    defaultValues: {
      enableLoginLocking: config.enableLoginLocking ?? true,
      maxLoginAttempts: config.maxLoginAttempts || 5,
      lockoutDuration: config.lockoutDuration || 30,
      enableTwoFactor: config.enableTwoFactor ?? false,
      forceTwoFactor: config.forceTwoFactor ?? false,
      totpValidityMinutes: config.totpValidityMinutes || 5,
      enableRememberMe: config.enableRememberMe ?? true,
      rememberMeDays: config.rememberMeDays || 30,
      enableSso: config.enableSso ?? false,
      limitConcurrentSessions: config.limitConcurrentSessions ?? false,
      maxConcurrentSessions: config.maxConcurrentSessions || 5,
      enableIpWhitelist: config.enableIpWhitelist ?? false,
      ipWhitelist: config.ipWhitelist || '',
      enableLoginCaptcha: config.enableLoginCaptcha ?? false,
      captchaThreshold: config.captchaThreshold || 3,
      requireEmailVerification: config.requireEmailVerification ?? true,
      requirePhoneVerification: config.requirePhoneVerification ?? false,
    },
  });

  const { watch, handleSubmit, reset, formState: { errors } } = form;

  const watchedValues = watch();
  
  React.useEffect(() => {
    const hasChanged = Object.keys(watchedValues).some(key => {
      const currentValue = watchedValues[key as keyof AuthConfigForm];
      const originalValue = form.formState.defaultValues?.[key as keyof AuthConfigForm];
      return currentValue !== originalValue;
    });
    setHasChanges(hasChanged);
  }, [watchedValues, form.formState.defaultValues]);

  const onSubmit = async (data: AuthConfigForm) => {
    try {
      const result = await onSave({
        ...config,
        ...data,
      });

      if (result.success) {
        toast.success(result.message || '认证配置保存成功');
        setHasChanges(false);
        reset(data);
      } else {
        toast.error(result.error || '认证配置保存失败');
      }
    } catch (error) {
      console.error('Save auth config error:', error);
      toast.error('保存配置时发生错误');
    }
  };

  const handleReset = () => {
    reset();
    setHasChanges(false);
    toast.info('已重置为原始配置');
  };

  const handleTest = async () => {
    if (!onTest) return;
    
    setTesting(true);
    try {
      const result = await onTest();
      if (result.success) {
        toast.success('登录保护测试成功');
      } else {
        toast.error(result.error || '登录保护测试失败');
      }
    } catch (error) {
      toast.error('测试失败: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          登录设置
        </CardTitle>
        <CardDescription>
          配置用户登录相关的安全策略和验证机制
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 登录保护 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">登录保护</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用登录锁定</Label>
                  <p className="text-sm text-gray-500">连续登录失败后锁定账户</p>
                </div>
                <Switch
                  checked={form.watch('enableLoginLocking')}
                  onCheckedChange={(checked) => form.setValue('enableLoginLocking', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">最大登录尝试次数</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    {...form.register('maxLoginAttempts', { valueAsNumber: true })}
                    placeholder="5"
                  />
                  {errors.maxLoginAttempts && (
                    <p className="text-sm text-red-500">{errors.maxLoginAttempts.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">锁定时间 (分钟)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    {...form.register('lockoutDuration', { valueAsNumber: true })}
                    placeholder="30"
                  />
                  {errors.lockoutDuration && (
                    <p className="text-sm text-red-500">{errors.lockoutDuration.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>启用登录验证码</Label>
                    <p className="text-sm text-gray-500">多次失败后要求验证码</p>
                  </div>
                  <Switch
                    checked={form.watch('enableLoginCaptcha')}
                    onCheckedChange={(checked) => form.setValue('enableLoginCaptcha', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="captchaThreshold">验证码触发次数</Label>
                  <Input
                    id="captchaThreshold"
                    type="number"
                    {...form.register('captchaThreshold', { valueAsNumber: true })}
                    placeholder="3"
                  />
                  {errors.captchaThreshold && (
                    <p className="text-sm text-red-500">{errors.captchaThreshold.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 双因素认证 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">双因素认证</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用双因素认证</Label>
                  <p className="text-sm text-gray-500">允许用户设置双因素认证</p>
                </div>
                <Switch
                  checked={form.watch('enableTwoFactor')}
                  onCheckedChange={(checked) => form.setValue('enableTwoFactor', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>强制双因素认证</Label>
                  <p className="text-sm text-gray-500">要求所有用户必须启用双因素认证</p>
                </div>
                <Switch
                  checked={form.watch('forceTwoFactor')}
                  onCheckedChange={(checked) => form.setValue('forceTwoFactor', checked)}
                  disabled={!form.watch('enableTwoFactor')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totpValidityMinutes">验证码有效期 (分钟)</Label>
                <Input
                  id="totpValidityMinutes"
                  type="number"
                  {...form.register('totpValidityMinutes', { valueAsNumber: true })}
                  placeholder="5"
                />
                {errors.totpValidityMinutes && (
                  <p className="text-sm text-red-500">{errors.totpValidityMinutes.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* 会话管理 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">会话管理</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>记住登录状态</Label>
                  <p className="text-sm text-gray-500">允许用户选择记住登录</p>
                </div>
                <Switch
                  checked={form.watch('enableRememberMe')}
                  onCheckedChange={(checked) => form.setValue('enableRememberMe', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rememberMeDays">记住登录时长 (天)</Label>
                <Input
                  id="rememberMeDays"
                  type="number"
                  {...form.register('rememberMeDays', { valueAsNumber: true })}
                  placeholder="30"
                  disabled={!form.watch('enableRememberMe')}
                />
                {errors.rememberMeDays && (
                  <p className="text-sm text-red-500">{errors.rememberMeDays.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>限制并发会话</Label>
                  <p className="text-sm text-gray-500">限制每个用户的同时登录数量</p>
                </div>
                <Switch
                  checked={form.watch('limitConcurrentSessions')}
                  onCheckedChange={(checked) => form.setValue('limitConcurrentSessions', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxConcurrentSessions">最大并发会话数</Label>
                <Input
                  id="maxConcurrentSessions"
                  type="number"
                  {...form.register('maxConcurrentSessions', { valueAsNumber: true })}
                  placeholder="5"
                  disabled={!form.watch('limitConcurrentSessions')}
                />
                {errors.maxConcurrentSessions && (
                  <p className="text-sm text-red-500">{errors.maxConcurrentSessions.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* IP白名单 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">IP白名单</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用IP白名单</Label>
                  <p className="text-sm text-gray-500">只允许白名单内的IP地址登录</p>
                </div>
                <Switch
                  checked={form.watch('enableIpWhitelist')}
                  onCheckedChange={(checked) => form.setValue('enableIpWhitelist', checked)}
                />
              </div>

              {form.watch('enableIpWhitelist') && (
                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">IP白名单 (每行一个IP或CIDR)</Label>
                  <Textarea
                    id="ipWhitelist"
                    {...form.register('ipWhitelist')}
                    placeholder="192.168.1.0/24&#10;10.0.0.1&#10;203.0.113.5"
                    rows={5}
                  />
                  <p className="text-xs text-gray-500">
                    支持单个IP地址或CIDR表示法，例如: 192.168.1.100 或 192.168.1.0/24
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 验证要求 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">验证要求</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>要求邮箱验证</Label>
                  <p className="text-sm text-gray-500">新用户注册后必须验证邮箱</p>
                </div>
                <Switch
                  checked={form.watch('requireEmailVerification')}
                  onCheckedChange={(checked) => form.setValue('requireEmailVerification', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>要求手机验证</Label>
                  <p className="text-sm text-gray-500">新用户注册后必须验证手机号</p>
                </div>
                <Switch
                  checked={form.watch('requirePhoneVerification')}
                  onCheckedChange={(checked) => form.setValue('requirePhoneVerification', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用单点登录 (SSO)</Label>
                  <p className="text-sm text-gray-500">允许通过第三方身份提供商登录</p>
                </div>
                <Switch
                  checked={form.watch('enableSso')}
                  onCheckedChange={(checked) => form.setValue('enableSso', checked)}
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              {onTest && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={testing || saving}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {testing ? '测试中...' : '测试保护'}
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}