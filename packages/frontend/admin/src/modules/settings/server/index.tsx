import React from 'react';
import { cn } from '@affine/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@affine/admin/components/ui/tabs';
import { Alert, AlertDescription } from '@affine/admin/components/ui/alert';
import { Button } from '@affine/admin/components/ui/button';
import { RefreshCw, Settings, Info, Activity } from 'lucide-react';

import { Header } from '../../header';
import { useServerConfig, useSystemInfo } from './hooks/use-server-config';
import { ServerInfoCard } from './components/server-info-card';
import { BasicSettings } from './components/basic-settings';

function ServerSettingsPage() {
  const { 
    config, 
    loading: configLoading, 
    error: configError, 
    saving, 
    refetch: refetchConfig, 
    updateConfig 
  } = useServerConfig();

  const { 
    systemInfo, 
    loading: systemLoading, 
    error: systemError, 
    refetch: refetchSystemInfo 
  } = useSystemInfo();

  const handleRefresh = () => {
    refetchConfig();
    refetchSystemInfo();
  };

  const hasError = configError || systemError;
  const isLoading = configLoading || systemLoading;

  if (hasError) {
    return (
      <div className="h-screen flex-1 flex-col flex">
        <Header title="服务器设置" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Alert className="mb-4">
              <AlertDescription>
                {configError || systemError}
              </AlertDescription>
            </Alert>
            <Button onClick={handleRefresh} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              重试
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex-1 flex-col flex">
      <Header 
        title="服务器设置" 
        endFix={
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </Button>
          </div>
        }
      />
      
      <ScrollAreaPrimitive.Root
        className={cn('relative overflow-hidden w-full flex-1')}
      >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
          <div className="p-6 max-w-7xl mx-auto">
            <Tabs defaultValue="settings" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  基础配置
                </TabsTrigger>
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  系统信息
                </TabsTrigger>
                <TabsTrigger value="status" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  运行状态
                </TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-6">
                {config && (
                  <BasicSettings
                    config={config}
                    onSave={updateConfig}
                    saving={saving}
                  />
                )}
              </TabsContent>

              <TabsContent value="info" className="space-y-6">
                {systemInfo && (
                  <ServerInfoCard
                    systemInfo={systemInfo}
                    loading={systemLoading}
                  />
                )}
              </TabsContent>

              <TabsContent value="status" className="space-y-6">
                {systemInfo && (
                  <div className="grid gap-6">
                    <ServerInfoCard
                      systemInfo={systemInfo}
                      loading={systemLoading}
                    />
                    {/* 这里可以添加更多状态监控组件 */}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
    </div>
  );
}

export { ServerSettingsPage as Component };