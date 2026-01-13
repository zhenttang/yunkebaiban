import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent } from '@yunke/admin/components/ui/card';
import { Input } from '@yunke/admin/components/ui/input';
import { Label } from '@yunke/admin/components/ui/label';
import { Separator } from '@yunke/admin/components/ui/separator';
import { Switch } from '@yunke/admin/components/ui/switch';
import { Textarea } from '@yunke/admin/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Fingerprint,
  Globe2,
  KeyRound,
  Loader2,
  Lock,
  Network,
  RefreshCcw,
  Save,
  ShieldCheck,
  ShieldQuestion,
  Smartphone,
  TestTube,
  Users,
} from 'lucide-react';

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
  onTest?: () => Promise<{ success: boolean; error?: string }>;
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

  const { watch, handleSubmit, reset, formState } = form;
  const { errors, defaultValues } = formState;
  const watchedValues = watch();

  useEffect(() => {
    const changed = Object.keys(watchedValues).some((key) => {
      const field = key as keyof AuthConfigForm;
      return watchedValues[field] !== defaultValues?.[field];
    });
    setHasChanges(changed);
  }, [watchedValues, defaultValues]);

  const onSubmit = async (data: AuthConfigForm) => {
    try {
      const result = await onSave({ ...config, ...data });
      if (result.success) {
        toast.success(result.message || '登录设置保存成功');
        setHasChanges(false);
        reset(data);
      } else {
        toast.error(result.error || '登录设置保存失败');
      }
    } catch (error) {
      console.error('Save auth config error:', error);
      toast.error('保存配置时发生错误');
    }
  };

  const handleReset = () => {
    reset();
    setHasChanges(false);
    toast.info('已恢复为原始配置');
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
      console.error('Test login protection error:', error);
      toast.error('测试失败，请查看控制台日志');
    } finally {
      setTesting(false);
    }
  };

  const loginLockingEnabled = watch('enableLoginLocking');
  const captchaEnabled = watch('enableLoginCaptcha');
  const twoFactorEnabled = watch('enableTwoFactor');
  const rememberMeEnabled = watch('enableRememberMe');
  const limitSessions = watch('limitConcurrentSessions');
  const ipWhitelistEnabled = watch('enableIpWhitelist');
  const rememberMeDays = watch('rememberMeDays');

  const summaryBadges = useMemo(() => {
    return [
      loginLockingEnabled ? '连错锁定' : '无限尝试',
      twoFactorEnabled ? '双因素开启' : '双因素关闭',
      rememberMeEnabled ? `记住登录 ${rememberMeDays} 天` : '记住登录关闭',
      ipWhitelistEnabled ? '启用白名单' : '开放访问',
    ];
  }, [loginLockingEnabled, twoFactorEnabled, rememberMeEnabled, ipWhitelistEnabled, watch]);

  return (
    <Card className="overflow-hidden border border-slate-200/70 bg-white/90 backdrop-blur">
      <CardContent className="space-y-10 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-2 rounded-full border-slate-200 bg-slate-50 text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              登录策略
            </Badge>
            <h3 className="text-xl font-semibold text-slate-900">账户登录安全配置</h3>
            <p className="text-sm text-slate-500">
              通过登录锁定、验证码和双因素认证，为用户提供多层防护。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {summaryBadges.map((badge, index) => (
              <Badge key={index} variant="outline" className="rounded-full border-slate-200 bg-white text-xs text-slate-500">
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <section className="space-y-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-6 shadow-sm">
            <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">登录保护</p>
                  <span className="text-xs text-blue-600/80">
                    防止暴力破解，合理限制登录尝试与验证码触发阈值。
                  </span>
                </div>
              </div>
            </header>

            <div className="grid gap-4">
              <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <ShieldQuestion className="mt-1 h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">启用登录锁定</p>
                    <p className="text-xs text-slate-500">连续失败达到阈值后自动锁定账户，防止密码撞库。</p>
                  </div>
                </div>
                <Switch
                  checked={loginLockingEnabled}
                  onCheckedChange={(checked) => form.setValue('enableLoginLocking', checked)}
                />
              </div>

              {loginLockingEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">最大尝试次数</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      {...form.register('maxLoginAttempts', { valueAsNumber: true })}
                      placeholder="5"
                    />
                    {errors.maxLoginAttempts && (
                      <p className="text-xs text-red-500">{errors.maxLoginAttempts.message}</p>
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
                      <p className="text-xs text-red-500">{errors.lockoutDuration.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">启用登录验证码</p>
                    <p className="text-xs text-slate-500">在多次失败后增加验证码验证，抑制批量尝试。</p>
                  </div>
                </div>
                <Switch
                  checked={captchaEnabled}
                  onCheckedChange={(checked) => form.setValue('enableLoginCaptcha', checked)}
                />
              </div>

              {captchaEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="captchaThreshold">验证码触发次数</Label>
                  <Input
                    id="captchaThreshold"
                    type="number"
                    {...form.register('captchaThreshold', { valueAsNumber: true })}
                    placeholder="3"
                  />
                  {errors.captchaThreshold && (
                    <p className="text-xs text-red-500">{errors.captchaThreshold.message}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border border-purple-100 bg-purple-50/40 p-6 shadow-sm">
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-500 shadow-sm">
                <Fingerprint className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">双因素认证</p>
                <span className="text-xs text-purple-600/80">通过 TOTP 或短信再验证，提升敏感操作安全性。</span>
              </div>
            </header>

            <div className="grid gap-4">
              <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Smartphone className="mt-1 h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">启用双因素认证</p>
                    <p className="text-xs text-slate-500">允许用户绑定动态验证码，提高登录可信度。</p>
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => form.setValue('enableTwoFactor', checked)}
                />
              </div>

              {twoFactorEnabled && (
                <>
                  <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <Users className="mt-1 h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">强制所有用户启用</p>
                        <p className="text-xs text-slate-500">开启后新老用户都必须绑定双因素认证。</p>
                      </div>
                    </div>
                    <Switch
                      checked={form.watch('forceTwoFactor')}
                      onCheckedChange={(checked) => form.setValue('forceTwoFactor', checked)}
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
                      <p className="text-xs text-red-500">{errors.totpValidityMinutes.message}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">会话与 SSO</p>
                <span className="text-xs text-emerald-600/80">配置会话保持策略、并发限制与单点登录。</span>
              </div>
            </header>

            <div className="grid gap-4">
              <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <RefreshCcw className="mt-1 h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">记住登录</p>
                    <p className="text-xs text-slate-500">允许用户在设备上保持登录状态。</p>
                  </div>
                </div>
                <Switch
                  checked={rememberMeEnabled}
                  onCheckedChange={(checked) => form.setValue('enableRememberMe', checked)}
                />
              </div>

              {rememberMeEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="rememberMeDays">记住登录天数</Label>
                  <Input
                    id="rememberMeDays"
                    type="number"
                    {...form.register('rememberMeDays', { valueAsNumber: true })}
                    placeholder="30"
                  />
                  {errors.rememberMeDays && (
                    <p className="text-xs text-red-500">{errors.rememberMeDays.message}</p>
                  )}
                </div>
              )}

              <Separator className="my-2" />

              <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Network className="mt-1 h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">限制并发会话</p>
                    <p className="text-xs text-slate-500">防止账号同时在多处登录，降低共享风险。</p>
                  </div>
                </div>
                <Switch
                  checked={limitSessions}
                  onCheckedChange={(checked) => form.setValue('limitConcurrentSessions', checked)}
                />
              </div>

              {limitSessions && (
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentSessions">最大并发会话数</Label>
                  <Input
                    id="maxConcurrentSessions"
                    type="number"
                    {...form.register('maxConcurrentSessions', { valueAsNumber: true })}
                    placeholder="5"
                  />
                  {errors.maxConcurrentSessions && (
                    <p className="text-xs text-red-500">{errors.maxConcurrentSessions.message}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Globe2 className="mt-1 h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">启用单点登录 (SSO)</p>
                    <p className="text-xs text-slate-500">允许外部身份提供商接入，统一认证入口。</p>
                  </div>
                </div>
                <Switch
                  checked={form.watch('enableSso')}
                  onCheckedChange={(checked) => form.setValue('enableSso', checked)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">访问控制</p>
                <span className="text-xs text-slate-500">根据 IP 白名单、邮箱或手机号验证增强访问限制。</span>
              </div>
            </header>

            <div className="grid gap-4">
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <Globe2 className="mt-1 h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">启用 IP 白名单</p>
                    <p className="text-xs text-slate-500">仅允许白名单中的 IP 段访问管理后台。</p>
                  </div>
                </div>
                <Switch
                  checked={ipWhitelistEnabled}
                  onCheckedChange={(checked) => form.setValue('enableIpWhitelist', checked)}
                />
              </div>

              {ipWhitelistEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="ipWhitelist">允许的 IP 列表 (每行一个)</Label>
                  <Textarea
                    id="ipWhitelist"
                    rows={4}
                    {...form.register('ipWhitelist')}
                    placeholder="127.0.0.1\n192.168.0.0/24"
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <Users className="mt-1 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">要求验证邮箱</p>
                      <p className="text-xs text-slate-500">未验证邮箱的用户无法登录受限资源。</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.watch('requireEmailVerification')}
                    onCheckedChange={(checked) => form.setValue('requireEmailVerification', checked)}
                  />
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <Smartphone className="mt-1 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">要求验证手机号</p>
                      <p className="text-xs text-slate-500">根据业务需求可强制绑定手机号后才能登录。</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.watch('requirePhoneVerification')}
                    onCheckedChange={(checked) => form.setValue('requirePhoneVerification', checked)}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-end">
            <div className="flex-1 text-xs text-slate-400 md:text-right">
              保存后将在几秒内同步到服务端，可配合上方“测试登录保护”快速验证配置效果。
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {onTest && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTest}
                  disabled={testing || saving}
                  className="flex items-center gap-2"
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                  测试登录保护
                </Button>
              )}
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
