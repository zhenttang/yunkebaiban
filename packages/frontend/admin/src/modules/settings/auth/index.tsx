import { useCallback, useMemo, useState } from 'react';
import { cn } from '@yunke/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yunke/admin/components/ui/tabs';
import { Alert, AlertDescription } from '@yunke/admin/components/ui/alert';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Activity, History, Loader2, Lock, RefreshCw, Shield } from 'lucide-react';

import { Header } from '../../header';
import { useAuthConfig, usePasswordPolicy } from './hooks/use-auth-config';
import { useSecurityEvents } from './hooks/use-security-events';
import { PasswordPolicy } from './components/password-policy';
import { LoginSettings } from './components/login-settings';
import { SecurityEvents } from './components/security-events';

type TabValue = 'login' | 'password' | 'events';

function AuthSettingsPage() {
  const {
    config,
    loading: configLoading,
    error: configError,
    saving: configSaving,
    refetch: refetchConfig,
    updateConfig,
    testLoginProtection,
  } = useAuthConfig();

  const {
    policy,
    loading: policyLoading,
    error: policyError,
    saving: policySaving,
    refetch: refetchPolicy,
    updatePolicy,
  } = usePasswordPolicy();

  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useSecurityEvents();

  const handleRefresh = useCallback(() => {
    refetchConfig();
    refetchPolicy();
    refetchEvents();
  }, [refetchConfig, refetchPolicy, refetchEvents]);

  const hasCriticalError = configError || policyError;
  const overallLoading = useMemo(
    () => configLoading || policyLoading || eventsLoading,
    [configLoading, policyLoading, eventsLoading],
  );
  const [activeTab, setActiveTab] = useState<TabValue>('login');

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  if (hasCriticalError) {
    return (
      <div className="h-screen flex-1 flex-col flex">
        <Header title="认证授权" />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md space-y-4 text-center">
            <Alert variant="destructive">
              <AlertDescription>{configError || policyError}</AlertDescription>
            </Alert>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              {overallLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              重试
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex h-screen flex-1 flex-col"
    >
      <Header
        title="认证授权"
        endFix={
          <div className="flex items-center gap-3">
            <TabsList className="hidden rounded-full bg-slate-100/80 p-1 text-slate-500 shadow-inner md:flex">
              <TabsTrigger
                value="login"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                登录设置
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                密码策略
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                安全事件
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:border-slate-300 hover:bg-white/80 md:inline-flex"
              onClick={handleRefresh}
              disabled={overallLoading}
            >
              {overallLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              刷新数据
            </Button>
          </div>
        }
      />

      <ScrollAreaPrimitive.Root className={cn('relative flex-1 overflow-hidden')}>
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
          <div className="relative min-h-full w-full">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.08),transparent_60%)]" />
            <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8 px-4 pb-12 pt-8 md:px-8">
              <div className="flex flex-col gap-4 md:hidden">
                <TabsList className="flex rounded-xl bg-white/80 p-1 shadow-sm">
                  <TabsTrigger
                    value="login"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    登录设置
                  </TabsTrigger>
                  <TabsTrigger
                    value="password"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    密码策略
                  </TabsTrigger>
                  <TabsTrigger
                    value="events"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    安全事件
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-center"
                  onClick={handleRefresh}
                  disabled={overallLoading}
                >
                  {overallLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      正在刷新
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      重新获取数据
                    </>
                  )}
                </Button>
              </div>

              <TabsContent value="login" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-blue-200 bg-blue-50/70 text-blue-600">
                    <Shield className="h-3.5 w-3.5" />
                    登录安全
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">登录设置</h2>
                  <p className="text-sm text-slate-500">
                    配置登录保护、双因素认证与访问控制，保障账户安全。
                  </p>
                </div>
                {config && (
                  <LoginSettings
                    config={config}
                    onSave={updateConfig}
                    onTest={testLoginProtection}
                    saving={configSaving}
                  />
                )}
              </TabsContent>

              <TabsContent value="password" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-purple-200 bg-purple-50/70 text-purple-600">
                    <Lock className="h-3.5 w-3.5" />
                    密码策略
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">密码复杂度与生命周期</h2>
                  <p className="text-sm text-slate-500">
                    设定密码复杂度、历史记录与过期策略，防止弱口令风险。
                  </p>
                </div>
                {policy && (
                  <PasswordPolicy
                    policy={policy}
                    onUpdate={updatePolicy}
                    loading={policySaving}
                  />
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-emerald-200 bg-emerald-50/70 text-emerald-600">
                    <Activity className="h-3.5 w-3.5" />
                    安全审计
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">安全事件追踪</h2>
                  <p className="text-sm text-slate-500">
                    监控登录失败、异常行为与策略变更，及时响应潜在风险。
                  </p>
                </div>
                <SecurityEvents
                  events={events || []}
                  loading={eventsLoading}
                  error={eventsError}
                  onRefresh={refetchEvents}
                />
              </TabsContent>
            </div>
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.ScrollAreaScrollbar
          className={cn(
            'flex touch-none select-none transition-colors',
            'h-full w-2.5 border-l border-l-transparent p-[1px]'
          )}
        >
          <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </Tabs>
  );
}

export { AuthSettingsPage as Component };
