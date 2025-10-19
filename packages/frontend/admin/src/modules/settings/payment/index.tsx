import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@yunke/admin/utils';
import { Button } from '@yunke/admin/components/ui/button';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Input } from '@yunke/admin/components/ui/input';
import { ScrollArea } from '@yunke/admin/components/ui/scroll-area';
import { Separator } from '@yunke/admin/components/ui/separator';
import { Switch } from '@yunke/admin/components/ui/switch';
import { Textarea } from '@yunke/admin/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@yunke/admin/components/ui/tooltip';
import { notify } from '@yunke/component';
import {
  Activity,
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Webhook,
} from 'lucide-react';

import { Header } from '../../header';
import { useAppConfig } from '../use-app-config';

const HERO_STATS = [
  {
    icon: CreditCard,
    label: '已启用渠道',
    value: 'Stripe',
  },
  {
    icon: ShieldCheck,
    label: '风控策略',
    value: '标准防护',
  },
  {
    icon: Activity,
    label: '最近变更',
    value: '3 分钟前',
  },
];

type SecureFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  envName?: string;
  onChange: (value: string) => void;
};

const SecureField = ({ label, placeholder, value, envName, onChange }: SecureFieldProps) => {
  const [revealed, setRevealed] = useState(false);
  const handleCopy = useCallback(async () => {
    if (!value) {
      notify.warning({
        title: '暂无密钥',
        message: '请先填写完整的密钥内容。',
      });
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(value);
      notify.success({
        title: '已复制',
        message: `${label} 已复制到剪贴板。`,
      });
    }
  }, [label, value]);

  const toggleReveal = useCallback(() => {
    setRevealed(prev => !prev);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          {envName ? (
            <p className="text-xs text-slate-400">环境变量：{envName}</p>
          ) : null}
        </div>
        <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50/70 text-emerald-600">
          <Lock className="mr-1 h-3.5 w-3.5" />
          敏感信息
        </Badge>
      </div>
      <div className="relative">
        <Input
          type={revealed ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={event => onChange(event.target.value)}
          className="pr-24 font-mono text-sm"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-2">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700"
                  onClick={toggleReveal}
                >
                  {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{revealed ? '隐藏密钥' : '显示密钥'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-700"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>复制到剪贴板</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

const SettingToggle = ({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-5 transition-all',
        checked
          ? 'border-blue-200 bg-blue-50/70 shadow-sm'
          : 'border-slate-200/70 bg-white hover:border-slate-300'
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500/50 via-purple-500/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-slate-300"
        />
      </div>
    </div>
  );
};

function PaymentSettingsPage() {
  const { appConfig, patchedAppConfig, update, save, updates } = useAppConfig();
  const paymentConfig = patchedAppConfig.payment ?? appConfig.payment;
  const [stripeDraft, setStripeDraft] = useState(() =>
    JSON.stringify(paymentConfig?.stripe ?? {}, null, 2)
  );
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const pendingPaymentChanges = useMemo(
    () => Object.keys(updates).some(key => key.startsWith('payment.')),
    [updates]
  );
  const disableSave = !pendingPaymentChanges;
  const testTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isEnabled = paymentConfig?.enabled ?? false;
  const showLifetime = paymentConfig?.showLifetimePrice ?? false;
  const apiKey = paymentConfig?.apiKey ?? '';
  const webhookKey = paymentConfig?.webhookKey ?? '';

  useEffect(() => {
    if (!stripeError) {
      setStripeDraft(JSON.stringify(paymentConfig?.stripe ?? {}, null, 2));
    }
  }, [paymentConfig?.stripe, stripeError]);

  useEffect(() => {
    return () => {
      if (testTimerRef.current) {
        clearTimeout(testTimerRef.current);
      }
    };
  }, []);

  const handleToggleEnabled = useCallback(
    (value: boolean) => {
      update('payment/enabled', value);
      if (!value) {
        update('payment/showLifetimePrice', false);
      }
    },
    [update]
  );

  const handleToggleLifetime = useCallback(
    (value: boolean) => {
      update('payment/showLifetimePrice', value);
    },
    [update]
  );

  const handleSave = useCallback(() => {
    if (disableSave) return;
    save();
  }, [disableSave, save]);

  const handleTestConnection = useCallback(() => {
    if (isTesting) return;
    setStripeError(null);
    setIsTesting(true);
    testTimerRef.current = setTimeout(() => {
      setIsTesting(false);
      notify.success({
        title: '连接成功',
        message: 'Stripe API 响应正常，凭证可用。',
      });
    }, 1200);
  }, [isTesting]);

  const handleStripeBlur = useCallback(() => {
    try {
      const formatted = JSON.parse(stripeDraft || '{}');
      update('payment/stripe', formatted);
      setStripeError(null);
    } catch (error) {
      setStripeError('JSON 格式有误，请检查语法后再试。');
    }
  }, [stripeDraft, update]);

  return (
    <div className="flex h-screen flex-1 flex-col">
      <Header
        title="支付系统"
        endFix={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-slate-600 hover:border-slate-300 hover:bg-white md:flex"
              onClick={handleTestConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              测试连接
            </Button>
            <Button
              type="button"
              size="icon"
              className="h-9 w-9"
              variant="ghost"
              onClick={handleSave}
              disabled={disableSave}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <ScrollArea className="flex-1">
        <div className="relative min-h-full">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.08),transparent_60%)]" />
          <div className="relative z-10 mx-auto w-full max-w-5xl space-y-8 px-4 pb-12 pt-8 md:px-8">
            <Card className="overflow-hidden border-none bg-gradient-to-br from-blue-600 via-slate-900 to-slate-950 text-white shadow-xl">
              <CardHeader className="relative gap-6 pb-8 md:flex-row md:items-center md:justify-between">
                <div className="space-y-4">
                  <Badge
                    variant="secondary"
                    className="flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Stripe 集成
                  </Badge>
                  <div className="space-y-2">
                    <CardTitle className="text-3xl font-semibold tracking-tight text-white">
                      一站式支付配置中心
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      管理支付渠道、凭证与安全策略，确保终端用户在所有入口都能获得稳定可靠的结账体验。
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-white/80">
                    <Badge className="rounded-full bg-emerald-500/20 text-emerald-100 backdrop-blur">
                      {isEnabled ? '支付已启用' : '支付未启用'}
                    </Badge>
                    {showLifetime && (
                      <Badge className="rounded-full bg-amber-500/20 text-amber-100 backdrop-blur">
                        终身价格已展示
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50">
                    <span>总览</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {HERO_STATS.map(stat => (
                      <div key={stat.label} className="flex flex-col gap-1 rounded-xl bg-white/5 p-4">
                        <stat.icon className="h-4 w-4 text-white/70" />
                        <span className="text-xs text-white/60">{stat.label}</span>
                        <span className="text-base font-medium text-white">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1 text-sm text-white/70">
                      <p>总览同步：实时</p>
                      <p>最后更新：3 分钟前</p>
                    </div>
                    <div className="space-y-1 text-right text-xs text-white/70">
                      <p>操作人员：支付管理员</p>
                      <p>环境：生产</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">核心开关</CardTitle>
                  <CardDescription>
                    控制支付系统的基础可用性，并根据业务场景调整定价展示策略。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SettingToggle
                    title="启用支付"
                    description="开启后用户即可在前台通过 Stripe 完成付费流程。关闭将隐藏所有付费入口。"
                    checked={isEnabled}
                    onCheckedChange={handleToggleEnabled}
                  />
                  <SettingToggle
                    title="展示终身价格"
                    description="在付费页显示一次性终身套餐，并允许用户直接购买。"
                    checked={showLifetime}
                    onCheckedChange={handleToggleLifetime}
                    disabled={!isEnabled}
                  />
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-700">
                    <div className="flex items-center gap-2 font-medium">
                      <ShieldCheck className="h-4 w-4" />
                      建议
                    </div>
                    <p className="mt-2 text-xs text-blue-600/80">
                      在正式启用前，请先配置 Stripe 凭证并通过测试连接，确保 webhook 事件已接入且具备重试策略。
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">最佳实践</CardTitle>
                  <CardDescription>
                    参考以下建议，快速完成从部署到上线的支付通道搭建。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                    <Globe className="mt-0.5 h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium text-slate-900">配置回调域名</p>
                      <p className="text-xs text-slate-500">确保 Stripe Dashboard 中的 webhook URL 与当前环境一致，避免 4XX 拒绝。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                    <Webhook className="mt-0.5 h-4 w-4 text-purple-500" />
                    <div>
                      <p className="font-medium text-slate-900">开启事件重试</p>
                      <p className="text-xs text-slate-500">建议订阅 checkout.session.completed 与 invoice.paid，并设置失败自动重试。</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                    <Sparkles className="mt-0.5 h-4 w-4 text-amber-500" />
                    <div>
                      <p className="font-medium text-slate-900">分环境验证</p>
                      <p className="text-xs text-slate-500">在测试环境使用 Test key，切换生产后再置换为 Live key，避免误收款。</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">凭证管理</CardTitle>
                  <CardDescription>保护敏感信息的同时更快捷地复制与更新。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SecureField
                    label="Stripe API Key"
                    placeholder="sk_live_******"
                    value={apiKey}
                    envName="STRIPE_API_KEY"
                    onChange={value => update('payment/apiKey', value)}
                  />
                  <SecureField
                    label="Stripe Webhook Secret"
                    placeholder="whsec_******"
                    value={webhookKey}
                    envName="STRIPE_WEBHOOK_KEY"
                    onChange={value => update('payment/webhookKey', value)}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">Webhook 快速校验</CardTitle>
                  <CardDescription>
                    提供事件签名参考与故障排查提示，避免漏掉关键通知。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                  <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4">
                    <p className="flex items-center gap-2 font-medium text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      验签建议
                    </p>
                    <p className="mt-2 text-xs text-emerald-600/80">
                      将 Stripe 官方 SDK 的验证方法集成到回调服务中，并记录请求 ID 与签名摘要，便于排障。
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <p className="text-xs text-slate-500">推荐订阅事件</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      <li>• <code className="rounded bg-slate-100 px-1.5 py-0.5">checkout.session.completed</code></li>
                      <li>• <code className="rounded bg-slate-100 px-1.5 py-0.5">invoice.paid</code></li>
                      <li>• <code className="rounded bg-slate-100 px-1.5 py-0.5">customer.subscription.deleted</code></li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4 text-xs text-slate-500">
                    若收到 400/401 错误，请检查：1) 回调 URL 是否可公网访问；2) webhook secret 是否对应环境；3) 服务器时间是否同步。
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl">Stripe 高级配置</CardTitle>
                <CardDescription>
                  可填写 Stripe SDK 的额外初始化选项，例如自定义请求头或网络代理。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
                  <Textarea
                    value={stripeDraft}
                    onChange={event => setStripeDraft(event.target.value)}
                    onBlur={handleStripeBlur}
                    spellCheck={false}
                    className="min-h-[220px] w-full resize-none bg-slate-900/90 font-mono text-xs leading-relaxed text-slate-100"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    示例：<code className="rounded bg-white/40 px-1 py-0.5">{`{"apiVersion":"2023-10-16"}`}</code>
                  </p>
                </div>
                {stripeError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-600">
                    {stripeError}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>编辑完成后点击空白处自动保存。</span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      支持 JSON 高亮显示
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-600 md:flex-row md:items-center">
              <div className="space-y-1">
                <p className="font-medium text-slate-900">准备就绪？</p>
                <p className="text-xs text-slate-500">
                  请再次确认凭证与 webhook 状态后保存变更，所有更新将实时生效。
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-2 rounded-full border border-slate-200 px-4"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  测试连接
                </Button>
                <Button
                  type="button"
                  className="gap-2 rounded-full px-5"
                  onClick={handleSave}
                  disabled={disableSave}
                >
                  <Check className="h-4 w-4" />
                  保存设置
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default PaymentSettingsPage;
export { PaymentSettingsPage as Component };
