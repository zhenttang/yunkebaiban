import React from 'react';
import { cn } from '@affine/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@affine/admin/components/ui/tabs';
import { Alert, AlertDescription } from '@affine/admin/components/ui/alert';
import { Button } from '@affine/admin/components/ui/button';
import { RefreshCw, Shield, Lock, Settings, History } from 'lucide-react';

import { Header } from '../../header';
import { useAuthConfig, usePasswordPolicy } from './hooks/use-auth-config';
import { useSecurityEvents } from './hooks/use-security-events';
import { PasswordPolicy } from './components/password-policy';
import { LoginSettings } from './components/login-settings';
import { SecurityEvents } from './components/security-events';

function AuthSettingsPage() {
  const { 
    config, 
    loading: configLoading, 
    error: configError, 
    saving: configSaving,
    refetch: refetchConfig, 
    updateConfig,
    testLoginProtection 
  } = useAuthConfig();

  const { 
    policy, 
    loading: policyLoading, 
    error: policyError, 
    saving: policySaving,
    refetch: refetchPolicy, 
    updatePolicy 
  } = usePasswordPolicy();

  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useSecurityEvents();

  const handleRefresh = () => {
    refetchConfig();
    refetchPolicy();
    refetchEvents();
  };

  const hasError = configError || policyError;
  const isLoading = configLoading || policyLoading;

  if (hasError) {
    return (
      <div className="h-screen flex-1 flex-col flex">
        <Header title="认证授权" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Alert className="mb-4">
              <AlertDescription>
                {configError || policyError}
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
        title="认证授权" 
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
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  登录设置
                </TabsTrigger>
                <TabsTrigger value="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  密码策略
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  安全事件
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6">
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
                {policy && (
                  <PasswordPolicy
                    policy={policy}
                    onUpdate={updatePolicy}
                    loading={policySaving}
                  />
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                <SecurityEvents
                  events={events || []}
                  loading={eventsLoading}
                  error={eventsError}
                  onRefresh={refetchEvents}
                />
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

export { AuthSettingsPage as Component };