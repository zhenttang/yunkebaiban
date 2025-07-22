import { cn } from '@affine/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useState } from 'react';

import { Header } from '../../header';
import { useOAuthConfig } from './hooks/use-oauth-config';
import { OAuthProviders } from './components/oauth-providers';
import { OAuthStatistics } from './components/oauth-statistics';
import { OAuthSettings } from './components/oauth-settings';

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

  const [activeTab, setActiveTab] = useState<'providers' | 'statistics' | 'settings'>('providers');

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
    <div className="h-screen flex-1 flex-col flex">
      <Header 
        title="第三方登录" 
        endFix={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setActiveTab('providers')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === 'providers'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                提供商配置
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === 'statistics'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                使用统计
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === 'settings'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                全局设置
              </button>
            </div>
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        }
      />
      
      <ScrollAreaPrimitive.Root
        className={cn('relative overflow-hidden w-full flex-1')}
      >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
          <div className="p-6 max-w-6xl mx-auto space-y-6">
            {activeTab === 'providers' && (
              <>
                <div className="text-[20px] mb-6">OAuth提供商配置</div>
                <OAuthProviders 
                  providers={providers}
                  loading={loading}
                  onUpdate={updateProvider}
                  onTest={testProvider}
                  onBatchToggle={batchToggleProviders}
                  onRefresh={refreshAll}
                />
              </>
            )}
            
            {activeTab === 'statistics' && (
              <>
                <div className="text-[20px] mb-6">OAuth使用统计</div>
                <OAuthStatistics 
                  statistics={statistics}
                  providers={providers}
                  loading={loading}
                  onRefresh={refreshAll}
                />
              </>
            )}
            
            {activeTab === 'settings' && (
              <>
                <div className="text-[20px] mb-6">OAuth全局设置</div>
                <OAuthSettings 
                  callbackUrls={callbackUrls}
                  loading={loading}
                  onRefresh={refreshAll}
                />
              </>
            )}
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

export { OAuthSettingsPage as Component };