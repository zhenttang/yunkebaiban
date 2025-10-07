import { useCallback, useMemo, useState } from 'react';
import { cn } from '@affine/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@affine/admin/components/ui/tabs';
import { Alert, AlertDescription } from '@affine/admin/components/ui/alert';
import { Badge } from '@affine/admin/components/ui/badge';
import { Button } from '@affine/admin/components/ui/button';
import { Activity, Info, Loader2, RefreshCw, Settings } from 'lucide-react';

import { Header } from '../../header';
import { useServerConfig, useSystemInfo } from './hooks/use-server-config';
import { ServerInfoCard } from './components/server-info-card';
import { BasicSettings } from './components/basic-settings';

type TabValue = 'settings' | 'info' | 'status';

function ServerSettingsPage() {
  const {
    config,
    loading: configLoading,
    error: configError,
    saving,
    refetch: refetchConfig,
    updateConfig,
  } = useServerConfig();

  const {
    systemInfo,
    loading: systemLoading,
    error: systemError,
    refetch: refetchSystemInfo,
  } = useSystemInfo();

  const handleRefresh = useCallback(() => {
    refetchConfig();
    refetchSystemInfo();
  }, [refetchConfig, refetchSystemInfo]);

  const hasError = configError || systemError;
  const overallLoading = useMemo(() => configLoading || systemLoading, [configLoading, systemLoading]);
  const [activeTab, setActiveTab] = useState<TabValue>('settings');

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  if (hasError) {
    return (
      <div className="h-screen flex-1 flex-col flex">
        <Header title="服务器设置" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{configError || systemError}</AlertDescription>
            </Alert>
            <Button
              onClick={handleRefresh}
              className="flex items-center gap-2"
              variant="outline"
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
        title="服务器设置"
        endFix={
          <div className="flex items-center gap-3">
            <TabsList className="hidden rounded-full bg-slate-100/80 p-1 text-slate-500 shadow-inner md:flex">
              <TabsTrigger
                value="settings"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                基础配置
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                系统信息
              </TabsTrigger>
              <TabsTrigger
                value="status"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                运行状态
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
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(79,70,229,0.08),transparent_60%)]" />
            <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8 px-4 pb-12 pt-8 md:px-8">
              <div className="flex flex-col gap-4 md:hidden">
                <TabsList className="flex rounded-xl bg-white/80 p-1 shadow-sm">
                  <TabsTrigger
                    value="settings"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    基础配置
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    系统信息
                  </TabsTrigger>
                  <TabsTrigger
                    value="status"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    运行状态
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

              <TabsContent value="settings" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-blue-200 bg-blue-50/70 text-blue-600">
                    <Settings className="h-3.5 w-3.5" />
                    配置中心
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">基础配置</h2>
                  <p className="text-sm text-slate-500">
                    管理服务器的访问信息、资源限制与关键开关，保存后会立即同步到后端。
                  </p>
                </div>
                {config && (
                  <BasicSettings config={config} onSave={updateConfig} saving={saving} />
                )}
              </TabsContent>

              <TabsContent value="info" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-purple-200 bg-purple-50/70 text-purple-600">
                    <Info className="h-3.5 w-3.5" />
                    运行环境
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">系统信息</h2>
                  <p className="text-sm text-slate-500">
                    快速了解版本、运行时与硬件资源，便于排查部署问题。
                  </p>
                </div>
                {systemInfo && (
                  <ServerInfoCard systemInfo={systemInfo} loading={systemLoading} />
                )}
              </TabsContent>

              <TabsContent value="status" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-emerald-200 bg-emerald-50/70 text-emerald-600">
                    <Activity className="h-3.5 w-3.5" />
                    服务监控
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">运行状态</h2>
                  <p className="text-sm text-slate-500">
                    关注数据库、缓存与存储等核心组件的可用性，辅助运维决策。
                  </p>
                </div>
                {systemInfo && (
                  <div className="grid gap-6">
                    <ServerInfoCard systemInfo={systemInfo} loading={systemLoading} />
                    {/* 可在此补充更多实时监控组件 */}
                  </div>
                )}
              </TabsContent>
            </div>
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.ScrollAreaScrollbar
          className={cn('flex touch-none select-none transition-colors', 'h-full w-2.5 border-l border-l-transparent p-[1px]')}
        >
          <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </Tabs>
  );
}

export { ServerSettingsPage as Component };
