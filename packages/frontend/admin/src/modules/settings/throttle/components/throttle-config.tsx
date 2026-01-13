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
import { Textarea } from '@yunke/admin/components/ui/textarea';
import { cn } from '@yunke/admin/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
  Settings,
  Shield,
  ShieldCheck,
  TestTube,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { useThrottleConfig } from '../hooks/use-throttle-config';
import type { ThrottleConfig, ThrottlerConfig } from '../types';

const throttleConfigSchema = z.object({
  enabled: z.boolean(),
  throttlers: z.object({
    default: z.object({
      ttl: z.number().min(1, 'TTL must be greater than 0'),
      limit: z.number().min(1, 'Limit must be greater than 0'),
      ignoreUserAgents: z.array(z.string()).optional(),
      skipIf: z.string().optional(),
      blockDuration: z.number().min(0).optional(),
    }),
    strict: z.object({
      ttl: z.number().min(1, 'TTL must be greater than 0'),
      limit: z.number().min(1, 'Limit must be greater than 0'),
      ignoreUserAgents: z.array(z.string()).optional(),
      skipIf: z.string().optional(),
      blockDuration: z.number().min(0).optional(),
    }),
  }),
});

type ThrottleConfigForm = z.infer<typeof throttleConfigSchema>;

const PRESET_CONFIGS = [
  {
    id: 'lenient',
    name: '宽松模式',
    description: '适合高流量应用，较宽松的限制',
    defaultConfig: { ttl: 60, limit: 100, blockDuration: 60 },
    strictConfig: { ttl: 60, limit: 50, blockDuration: 120 },
  },
  {
    id: 'balanced',
    name: '平衡模式',
    description: '平衡性能和安全的推荐配置',
    defaultConfig: { ttl: 60, limit: 60, blockDuration: 120 },
    strictConfig: { ttl: 60, limit: 30, blockDuration: 300 },
  },
  {
    id: 'strict',
    name: '严格模式',
    description: '高安全要求，严格的访问限制',
    defaultConfig: { ttl: 60, limit: 30, blockDuration: 300 },
    strictConfig: { ttl: 60, limit: 15, blockDuration: 600 },
  },
];

export function ThrottleConfig() {
  const {
    config,
    presets,
    loading,
    error,
    updateConfig,
    validateConfig,
    testThrottle,
    reloadConfig,
    refetch,
  } = useThrottleConfig();

  const [testing, setTesting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors?: string[]; warnings?: string[] } | null>(null);

  const form = useForm<ThrottleConfigForm>({
    resolver: zodResolver(throttleConfigSchema),
    defaultValues: {
      enabled: false,
      throttlers: {
        default: {
          ttl: 60,
          limit: 60,
          ignoreUserAgents: [],
          skipIf: '',
          blockDuration: 120,
        },
        strict: {
          ttl: 60,
          limit: 30,
          ignoreUserAgents: [],
          skipIf: '',
          blockDuration: 300,
        },
      },
    },
  });

  const { watch, reset, formState, handleSubmit, getValues, setValue } = form;

  useEffect(() => {
    if (config) {
      reset({
        enabled: config.enabled ?? false,
        throttlers: {
          default: {
            ttl: config.throttlers?.default?.ttl ?? 60,
            limit: config.throttlers?.default?.limit ?? 60,
            ignoreUserAgents: config.throttlers?.default?.ignoreUserAgents ?? [],
            skipIf: config.throttlers?.default?.skipIf ?? '',
            blockDuration: config.throttlers?.default?.blockDuration ?? 120,
          },
          strict: {
            ttl: config.throttlers?.strict?.ttl ?? 60,
            limit: config.throttlers?.strict?.limit ?? 30,
            ignoreUserAgents: config.throttlers?.strict?.ignoreUserAgents ?? [],
            skipIf: config.throttlers?.strict?.skipIf ?? '',
            blockDuration: config.throttlers?.strict?.blockDuration ?? 300,
          },
        },
      }, { keepDirty: false });
    }
  }, [config, reset]);

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESET_CONFIGS.find(p => p.id === presetId);
    if (preset) {
      setValue('throttlers.default', preset.defaultConfig);
      setValue('throttlers.strict', preset.strictConfig);
      toast.success(`已应用 ${preset.name} 预设配置`);
    }
  };

  const onSave = async (data: ThrottleConfigForm) => {
    const result = await updateConfig(data as ThrottleConfig);
    if (result.success) {
      toast.success('限流配置已保存');
      setTestResult(null);
      setValidationResult(null);
    } else {
      toast.error(result.error ?? '保存失败');
    }
  };

  const onTestThrottle = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testThrottle(getValues() as ThrottleConfig);
    setTesting(false);
    setTestResult(result);
    toast[result.success ? 'success' : 'error'](result.message || (result.success ? '限流测试成功' : '限流测试失败'));
  };

  const onValidateConfig = async () => {
    setValidating(true);
    try {
      const result = await validateConfig(getValues() as ThrottleConfig);
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
  const defaultConfig = watch('throttlers.default');
  const strictConfig = watch('throttlers.strict');

  const summaryTags = useMemo(() => {
    return [
      enabled ? '限流已启用' : '限流关闭',
      `默认: ${defaultConfig.limit}次/${defaultConfig.ttl}秒`,
      `严格: ${strictConfig.limit}次/${strictConfig.ttl}秒`,
      defaultConfig.blockDuration ? `阻断 ${defaultConfig.blockDuration}秒` : '无阻断',
    ];
  }, [enabled, defaultConfig, strictConfig]);

  if (loading) {
    return (
      <Card className="border border-slate-200/70 bg-white/80 backdrop-blur">
        <CardContent className="flex h-40 items-center justify-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" /> 正在加载限流配置...
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
              <Shield className="h-3.5 w-3.5" /> 访问限流
            </Badge>
            <h3 className="text-xl font-semibold text-slate-900">限流配置与策略</h3>
            <p className="text-sm text-slate-500">
              配置API访问频率限制，防止恶意攻击和系统过载，确保服务稳定性。
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
          {/* 基础设置 */}
          <section className="space-y-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-6 shadow-sm">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-500 shadow-sm">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">基础设置</p>
                  <span className="text-xs text-blue-600/80">全局限流开关和预设配置选择。</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">启用访问限流</span>
                <Switch checked={watch('enabled')} onCheckedChange={checked => form.setValue('enabled', checked)} />
              </div>
            </header>

            <div className="space-y-2">
              <Label>预设配置模板</Label>
              <Select onValueChange={handlePresetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="选择预设配置或手动配置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">手动配置</SelectItem>
                  {PRESET_CONFIGS.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name} - {preset.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* 默认限流器配置 */}
          <section className="space-y-6 rounded-2xl border border-green-100 bg-green-50/40 p-6 shadow-sm">
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-green-500 shadow-sm">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">默认限流器</p>
                <span className="text-xs text-green-600/80">适用于大部分API端点的标准限流配置。</span>
              </div>
            </header>

            <ThrottlerConfigSection
              prefix="throttlers.default"
              form={form}
              config={defaultConfig}
            />
          </section>

          {/* 严格限流器配置 */}
          <section className="space-y-6 rounded-2xl border border-orange-100 bg-orange-50/40 p-6 shadow-sm">
            <header className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">严格限流器</p>
                <span className="text-xs text-orange-600/80">用于敏感操作和高风险端点的严格限制。</span>
              </div>
            </header>

            <ThrottlerConfigSection
              prefix="throttlers.strict"
              form={form}
              config={strictConfig}
            />
          </section>

          {testResult && (
            <ResultCallout
              success={testResult.success}
              title={testResult.success ? '限流测试成功' : '限流测试失败'}
              message={testResult.message}
              details={testResult.details}
            />
          )}

          {validationResult && (
            <ResultCallout
              success={validationResult.valid}
              title={validationResult.valid ? '配置验证通过' : '配置存在问题'}
              message={validationResult.valid ? '所有配置项均已通过验证' : '请检查以下错误或警告'}
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
              建议保存后进行测试验证配置有效性；重新加载将应用服务器端的最新配置。
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
                onClick={onTestThrottle}
                disabled={testing}
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                测试限流
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
                {formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                保存配置
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ThrottlerConfigSection({
  prefix,
  form,
  config
}: {
  prefix: string;
  form: any;
  config: ThrottlerConfig;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}.ttl`}>时间窗口 (秒)</Label>
        <Input
          id={`${prefix}.ttl`}
          type="number"
          min="1"
          placeholder="60"
          {...form.register(`${prefix}.ttl`, { valueAsNumber: true })}
        />
        <p className="text-xs text-slate-500">限流统计的时间窗口长度</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}.limit`}>最大请求数</Label>
        <Input
          id={`${prefix}.limit`}
          type="number"
          min="1"
          placeholder="60"
          {...form.register(`${prefix}.limit`, { valueAsNumber: true })}
        />
        <p className="text-xs text-slate-500">时间窗口内允许的最大请求数</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}.blockDuration`}>阻断时长 (秒)</Label>
        <Input
          id={`${prefix}.blockDuration`}
          type="number"
          min="0"
          placeholder="120"
          {...form.register(`${prefix}.blockDuration`, { valueAsNumber: true })}
        />
        <p className="text-xs text-slate-500">超限后的阻断时长，0表示不阻断</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}.skipIf`}>跳过条件</Label>
        <Input
          id={`${prefix}.skipIf`}
          placeholder="req.ip === '127.0.0.1'"
          {...form.register(`${prefix}.skipIf`)}
        />
        <p className="text-xs text-slate-500">满足条件时跳过限流检查</p>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${prefix}.ignoreUserAgents`}>忽略的用户代理</Label>
        <Textarea
          id={`${prefix}.ignoreUserAgents`}
          placeholder="每行一个用户代理模式"
          className="min-h-20"
          value={config.ignoreUserAgents?.join('\n') || ''}
          onChange={(e) => {
            const agents = e.target.value.split('\n').filter(Boolean);
            form.setValue(`${prefix}.ignoreUserAgents`, agents);
          }}
        />
        <p className="text-xs text-slate-500">这些用户代理不受限流限制，每行一个</p>
      </div>
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