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
import { Progress } from '@yunke/admin/components/ui/progress';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ClipboardCheck,
  Hourglass,
  RefreshCcw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldMinus,
} from 'lucide-react';

import type { PasswordPolicyDto } from '../types';

const passwordPolicySchema = z.object({
  enablePasswordPolicy: z.boolean(),
  minLength: z.number().min(1, '密码最小长度不能小于1').max(128, '密码最小长度不能大于128'),
  maxLength: z.number().min(1, '密码最大长度不能小于1').max(255, '密码最大长度不能大于255'),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  allowedSpecialChars: z.string(),
  forbidCommonPasswords: z.boolean(),
  forbidUserInfo: z.boolean(),
  passwordHistory: z.number().min(0, '密码历史不能小于0').max(20, '密码历史不能大于20'),
  passwordExpireDays: z.number().min(0, '密码过期天数不能小于0').max(365, '密码过期天数不能大于365'),
  passwordExpireWarningDays: z.number().min(0, '提醒天数不能小于0').max(30, '提醒天数不能大于30'),
  forceChangeOnFirstLogin: z.boolean(),
  passwordRetryDelay: z.number().min(0, '重试延迟不能小于0').max(60, '重试延迟不能大于60'),
});

type PasswordPolicyForm = z.infer<typeof passwordPolicySchema>;

interface PasswordPolicyProps {
  policy: PasswordPolicyDto;
  onUpdate: (policy: PasswordPolicyDto) => Promise<{ success: boolean; error?: string; message?: string }>;
  loading: boolean;
}

export function PasswordPolicy({ policy, onUpdate, loading }: PasswordPolicyProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<PasswordPolicyForm>({
    resolver: zodResolver(passwordPolicySchema),
    defaultValues: {
      enablePasswordPolicy: policy.enablePasswordPolicy ?? true,
      minLength: policy.minLength || 8,
      maxLength: policy.maxLength || 128,
      requireUppercase: policy.requireUppercase ?? true,
      requireLowercase: policy.requireLowercase ?? true,
      requireNumbers: policy.requireNumbers ?? true,
      requireSpecialChars: policy.requireSpecialChars ?? false,
      allowedSpecialChars: policy.allowedSpecialChars || '!@#$%^&*()_+-=[]{}|;:,.<>?',
      forbidCommonPasswords: policy.forbidCommonPasswords ?? true,
      forbidUserInfo: policy.forbidUserInfo ?? true,
      passwordHistory: policy.passwordHistory || 5,
      passwordExpireDays: policy.passwordExpireDays || 0,
      passwordExpireWarningDays: policy.passwordExpireWarningDays || 7,
      forceChangeOnFirstLogin: policy.forceChangeOnFirstLogin ?? false,
      passwordRetryDelay: policy.passwordRetryDelay || 0,
    },
  });

  const { watch, handleSubmit, reset, formState } = form;
  const { errors, defaultValues } = formState;
  const watchedValues = watch();

  useEffect(() => {
    const changed = Object.keys(watchedValues).some((key) => {
      const field = key as keyof PasswordPolicyForm;
      return watchedValues[field] !== defaultValues?.[field];
    });
    setHasChanges(changed);
  }, [watchedValues, defaultValues]);

  const handleReset = () => {
    reset();
    setHasChanges(false);
    toast.info('已恢复为原始策略');
  };

  const onSubmit = async (data: PasswordPolicyForm) => {
    setSaving(true);
    try {
      const result = await onUpdate({ ...policy, ...data });
      if (result.success) {
        toast.success(result.message || '密码策略保存成功');
        setHasChanges(false);
        reset(data);
      } else {
        toast.error(result.error || '密码策略保存失败');
      }
    } catch (error) {
      console.error('Save password policy error:', error);
      toast.error('保存策略时发生错误');
    } finally {
      setSaving(false);
    }
  };

  const policyEnabled = watch('enablePasswordPolicy');

  const complexityScore = useMemo(() => {
    let score = 0;
    if (watch('requireUppercase')) score += 25;
    if (watch('requireLowercase')) score += 25;
    if (watch('requireNumbers')) score += 25;
    if (watch('requireSpecialChars')) score += 25;
    return score;
  }, [watch]);

  const complexityLabel = useMemo(() => {
    if (complexityScore >= 90) return '严格';
    if (complexityScore >= 65) return '稳妥';
    if (complexityScore >= 40) return '基础';
    return '较弱';
  }, [complexityScore]);

  return (
    <Card className="overflow-hidden border border-slate-200/70 bg-white/90 backdrop-blur">
      <CardContent className="space-y-10 p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="gap-2 rounded-full border-slate-200 bg-slate-50 text-slate-600">
              <Shield className="h-3.5 w-3.5" />
              密码安全
            </Badge>
            <h3 className="text-xl font-semibold text-slate-900">密码复杂度与生命周期</h3>
            <p className="text-sm text-slate-500">
              设置密码长度、字符要求以及过期提醒，避免弱口令与重复使用。
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            当前复杂度评估：<span className="font-semibold text-slate-800">{complexityLabel}</span>
            <Progress value={complexityScore} className="h-1 w-20 bg-slate-200" />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <section className="space-y-4 rounded-2xl border border-purple-100 bg-purple-50/40 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-500 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700">启用密码策略</p>
                  <span className="text-xs text-purple-600/80">关闭后系统将仅校验密码长度，风险较高。</span>
                </div>
              </div>
              <Switch
                checked={policyEnabled}
                onCheckedChange={(checked) => form.setValue('enablePasswordPolicy', checked)}
                disabled={loading}
              />
            </div>
          </section>

          {policyEnabled ? (
            <>
              <section className="space-y-6 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
                <header className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">长度与复杂度</p>
                    <span className="text-xs text-slate-500">设定密码长度范围，并要求包含多种字符类型。</span>
                  </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">最小长度</Label>
                    <Input
                      id="minLength"
                      type="number"
                      {...form.register('minLength', { valueAsNumber: true })}
                      placeholder="8"
                      disabled={loading}
                    />
                    {errors.minLength && (
                      <p className="text-xs text-red-500">{errors.minLength.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLength">最大长度</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      {...form.register('maxLength', { valueAsNumber: true })}
                      placeholder="128"
                      disabled={loading}
                    />
                    {errors.maxLength && (
                      <p className="text-xs text-red-500">{errors.maxLength.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  {[{
                    key: 'requireUppercase' as const,
                    title: '至少一个大写字母',
                    desc: '防止全小写密码，提高复杂度',
                  }, {
                    key: 'requireLowercase' as const,
                    title: '至少一个小写字母',
                    desc: '避免密码被限定为纯数字或符号',
                  }, {
                    key: 'requireNumbers' as const,
                    title: '至少一个数字',
                    desc: '增加解密组合，提高破解成本',
                  }, {
                    key: 'requireSpecialChars' as const,
                    title: '至少一个特殊字符',
                    desc: '推荐开启，可有效抵御撞库',
                  }].map(({ key, title, desc }) => (
                    <div
                      key={key}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">{title}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      <Switch
                        checked={watch(key)}
                        onCheckedChange={(checked) => form.setValue(key, checked)}
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>

                {watch('requireSpecialChars') && (
                  <div className="space-y-2">
                    <Label htmlFor="allowedSpecialChars">允许使用的特殊字符集合</Label>
                    <Textarea
                      id="allowedSpecialChars"
                      rows={2}
                      {...form.register('allowedSpecialChars')}
                      disabled={loading}
                    />
                  </div>
                )}
              </section>

              <section className="space-y-6 rounded-2xl border border-amber-100 bg-amber-50/40 p-6 shadow-sm">
                <header className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-700">弱口令与历史</p>
                    <span className="text-xs text-amber-600/80">限制常见密码，自定义历史回滚与首次登录要求。</span>
                  </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">禁止常见弱密码</p>
                      <p className="text-xs text-slate-500">从字典库中校验常见弱口令，防止被轻易猜测。</p>
                    </div>
                    <Switch
                      checked={watch('forbidCommonPasswords')}
                      onCheckedChange={(checked) => form.setValue('forbidCommonPasswords', checked)}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">禁止包含个人信息</p>
                      <p className="text-xs text-slate-500">避免使用邮箱、手机号等可公开信息。</p>
                    </div>
                    <Switch
                      checked={watch('forbidUserInfo')}
                      onCheckedChange={(checked) => form.setValue('forbidUserInfo', checked)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="passwordHistory">记住历史次数</Label>
                    <Input
                      id="passwordHistory"
                      type="number"
                      {...form.register('passwordHistory', { valueAsNumber: true })}
                      disabled={loading}
                    />
                    {errors.passwordHistory && (
                      <p className="text-xs text-red-500">{errors.passwordHistory.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordRetryDelay">失败后延迟 (秒)</Label>
                    <Input
                      id="passwordRetryDelay"
                      type="number"
                      {...form.register('passwordRetryDelay', { valueAsNumber: true })}
                      disabled={loading}
                    />
                    {errors.passwordRetryDelay && (
                      <p className="text-xs text-red-500">{errors.passwordRetryDelay.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 rounded-xl border border-white/60 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">首次登录强制修改</p>
                      <p className="text-xs text-slate-500">确保初始密码不会长期使用。</p>
                    </div>
                    <Switch
                      checked={watch('forceChangeOnFirstLogin')}
                      onCheckedChange={(checked) => form.setValue('forceChangeOnFirstLogin', checked)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
                <header className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">
                    <Hourglass className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">密码过期与提醒</p>
                    <span className="text-xs text-emerald-600/80">按周期强制更新密码，并在到期前进行通知。</span>
                  </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="passwordExpireDays">密码过期天数 (0 代表永久有效)</Label>
                    <Input
                      id="passwordExpireDays"
                      type="number"
                      {...form.register('passwordExpireDays', { valueAsNumber: true })}
                      disabled={loading}
                    />
                    {errors.passwordExpireDays && (
                      <p className="text-xs text-red-500">{errors.passwordExpireDays.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordExpireWarningDays">到期提醒天数</Label>
                    <Input
                      id="passwordExpireWarningDays"
                      type="number"
                      {...form.register('passwordExpireWarningDays', { valueAsNumber: true })}
                      disabled={loading}
                    />
                    {errors.passwordExpireWarningDays && (
                      <p className="text-xs text-red-500">{errors.passwordExpireWarningDays.message}</p>
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <ShieldMinus className="h-4 w-4 text-slate-500" />
              已禁用密码策略，系统仅会校验密码长度，请谨慎评估风险。
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-end">
            <div className="flex-1 text-xs text-slate-400 md:text-right">
              建议定期导出安全审计记录，并结合密码策略调整企业整体安全基线。
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || loading || saving}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                重置
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || loading || saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? '保存中...' : '保存策略'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
