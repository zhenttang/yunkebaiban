import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Switch } from '@affine/admin/components/ui/switch';
import { toast } from 'sonner';
import { Shield, Save, RotateCcw } from 'lucide-react';
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

  const { watch, handleSubmit, reset, formState: { errors } } = form;

  const watchedValues = watch();
  
  React.useEffect(() => {
    const hasChanged = Object.keys(watchedValues).some(key => {
      const currentValue = watchedValues[key as keyof PasswordPolicyForm];
      const originalValue = form.formState.defaultValues?.[key as keyof PasswordPolicyForm];
      return currentValue !== originalValue;
    });
    setHasChanges(hasChanged);
  }, [watchedValues, form.formState.defaultValues]);

  const onSubmit = async (data: PasswordPolicyForm) => {
    setSaving(true);
    try {
      const result = await onUpdate({
        ...policy,
        ...data,
      });

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

  const handleReset = () => {
    reset();
    setHasChanges(false);
    toast.info('已重置为原始策略');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          密码策略
        </CardTitle>
        <CardDescription>
          配置用户密码的复杂度要求和安全策略
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 策略启用 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>启用密码策略</Label>
              <p className="text-sm text-gray-500">对用户密码进行复杂度验证</p>
            </div>
            <Switch
              checked={form.watch('enablePasswordPolicy')}
              onCheckedChange={(checked) => form.setValue('enablePasswordPolicy', checked)}
              disabled={loading}
            />
          </div>

          {form.watch('enablePasswordPolicy') && (
            <>
              {/* 长度要求 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">长度要求</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="text-sm text-red-500">{errors.minLength.message}</p>
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
                      <p className="text-sm text-red-500">{errors.maxLength.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 复杂度要求 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">复杂度要求</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>要求大写字母</Label>
                      <p className="text-sm text-gray-500">密码必须包含至少一个大写字母</p>
                    </div>
                    <Switch
                      checked={form.watch('requireUppercase')}
                      onCheckedChange={(checked) => form.setValue('requireUppercase', checked)}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>要求小写字母</Label>
                      <p className="text-sm text-gray-500">密码必须包含至少一个小写字母</p>
                    </div>
                    <Switch
                      checked={form.watch('requireLowercase')}
                      onCheckedChange={(checked) => form.setValue('requireLowercase', checked)}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>要求数字</Label>
                      <p className="text-sm text-gray-500">密码必须包含至少一个数字</p>
                    </div>
                    <Switch
                      checked={form.watch('requireNumbers')}
                      onCheckedChange={(checked) => form.setValue('requireNumbers', checked)}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>要求特殊字符</Label>
                      <p className="text-sm text-gray-500">密码必须包含至少一个特殊字符</p>
                    </div>
                    <Switch
                      checked={form.watch('requireSpecialChars')}
                      onCheckedChange={(checked) => form.setValue('requireSpecialChars', checked)}
                      disabled={loading}
                    />
                  </div>

                  {form.watch('requireSpecialChars') && (
                    <div className="space-y-2">
                      <Label htmlFor="allowedSpecialChars">允许的特殊字符</Label>
                      <Input
                        id="allowedSpecialChars"
                        {...form.register('allowedSpecialChars')}
                        placeholder="!@#$%^&*()_+-=[]{}|;:,.<>?"
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 安全策略 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">安全策略</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>禁止常用密码</Label>
                      <p className="text-sm text-gray-500">禁止使用常见的弱密码</p>
                    </div>
                    <Switch
                      checked={form.watch('forbidCommonPasswords')}
                      onCheckedChange={(checked) => form.setValue('forbidCommonPasswords', checked)}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>禁止用户信息</Label>
                      <p className="text-sm text-gray-500">禁止在密码中使用用户名、邮箱等信息</p>
                    </div>
                    <Switch
                      checked={form.watch('forbidUserInfo')}
                      onCheckedChange={(checked) => form.setValue('forbidUserInfo', checked)}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>首次登录强制修改</Label>
                      <p className="text-sm text-gray-500">用户首次登录时必须修改密码</p>
                    </div>
                    <Switch
                      checked={form.watch('forceChangeOnFirstLogin')}
                      onCheckedChange={(checked) => form.setValue('forceChangeOnFirstLogin', checked)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordHistory">密码历史记录</Label>
                    <Input
                      id="passwordHistory"
                      type="number"
                      {...form.register('passwordHistory', { valueAsNumber: true })}
                      placeholder="5"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">记住多少个历史密码以防重复使用</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordExpireDays">密码过期时间 (天)</Label>
                    <Input
                      id="passwordExpireDays"
                      type="number"
                      {...form.register('passwordExpireDays', { valueAsNumber: true })}
                      placeholder="0"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">0表示永不过期</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordExpireWarningDays">过期提醒天数</Label>
                    <Input
                      id="passwordExpireWarningDays"
                      type="number"
                      {...form.register('passwordExpireWarningDays', { valueAsNumber: true })}
                      placeholder="7"
                      disabled={loading || form.watch('passwordExpireDays') === 0}
                    />
                    <p className="text-xs text-gray-500">密码过期前多少天开始提醒</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordRetryDelay">密码重试延迟 (秒)</Label>
                  <Input
                    id="passwordRetryDelay"
                    type="number"
                    {...form.register('passwordRetryDelay', { valueAsNumber: true })}
                    placeholder="0"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">密码错误后的重试延迟时间，0表示无延迟</p>
                </div>
              </div>
            </>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || loading || saving}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
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
        </form>
      </CardContent>
    </Card>
  );
}