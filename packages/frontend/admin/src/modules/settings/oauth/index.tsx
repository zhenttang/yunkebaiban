import { Button } from '@yunke/admin/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yunke/admin/components/ui/tabs';
import { cn } from '@yunke/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { Loader2, RefreshCcw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Header } from '../../header';
import { useOAuthConfig } from './hooks/use-oauth-config';
import { OAuthProviders } from './components/oauth-providers';
import { OAuthStatistics } from './components/oauth-statistics';
import { OAuthSettings } from './components/oauth-settings';

type TabValue = 'providers' | 'statistics' | 'settings';

function OAuthSettingsPage() {
  const { 
    providers, 
    statistics,
    callbackUrls,
    loading, 
    error, 
    updateProvider,
    testProvider,
    batchToggleProviders,
    refreshAll
  } = useOAuthConfig();

  const [activeTab, setActiveTab] = useState<TabValue>('providers');
  const [refreshing, setRefreshing] = useState(false);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) {
      return;
    }
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, [refreshAll, refreshing]);

  const overallLoading = useMemo(() => loading || refreshing, [loading, refreshing]);

  if (error) {
    return (
      <div className="h-screen flex-1 flex-col flex">
        <Header title="第三方登录" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4 text-lg">加载失败</div>
            <div className="text-gray-700 mb-4">{error}</div>
            <button 
              onClick={refreshAll}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重试
            </button>
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
        title="第三方登录" 
        endFix={
          <div className="flex items-center gap-3">
            <TabsList className="hidden rounded-full bg-slate-100/80 p-1 text-slate-500 shadow-inner md:flex">
              <TabsTrigger value="providers" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900">
                提供商配置
              </TabsTrigger>
              <TabsTrigger value="statistics" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900">
                使用统计
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900">
                全局设置
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:border-slate-300 hover:bg-white/80 md:inline-flex"
              onClick={handleRefresh}
              disabled={overallLoading}
            >
              {overallLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              刷新数据
            </Button>
          </div>
        }
      />

      <ScrollAreaPrimitive.Root
        className={cn('relative flex-1 overflow-hidden')}
      >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
          <div className="relative min-h-full w-full">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.08),transparent_60%)]" />
            <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8 px-4 pb-12 pt-8 md:px-8">
              <div className="flex flex-col gap-4 md:hidden">
                <TabsList className="flex rounded-xl bg-white/80 p-1 shadow-sm">
                  <TabsTrigger value="providers" className="rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600">
                    提供商配置
                  </TabsTrigger>
                  <TabsTrigger value="statistics" className="rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600">
                    使用统计
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600">
                    全局设置
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
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      重新获取数据
                    </>
                  )}
                </Button>
              </div>

              <TabsContent value="providers" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">OAuth提供商配置</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    管理各类第三方登录的连接状态与凭据，支持批量启用、测试连接与快速刷新。
                  </p>
                </div>
                <OAuthProviders 
                  providers={providers}
                  loading={overallLoading}
                  onUpdate={updateProvider}
                  onTest={testProvider}
                  onBatchToggle={batchToggleProviders}
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="statistics" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">OAuth使用统计</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    快速洞察整体启用率、配置完成度与用户分布，掌握第三方登录的使用情况。
                  </p>
                </div>
                <OAuthStatistics 
                  statistics={statistics}
                  providers={providers}
                  loading={overallLoading}
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">OAuth全局设置</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    统一查看回调地址、配置指南与安全建议，确保集成流程简单可靠。
                  </p>
                </div>
                <OAuthSettings 
                  callbackUrls={callbackUrls}
                  loading={overallLoading}
                  onRefresh={handleRefresh}
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

export { OAuthSettingsPage as Component };
