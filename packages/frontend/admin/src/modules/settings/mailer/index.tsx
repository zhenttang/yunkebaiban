import { cn } from '@affine/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useState } from 'react';

import { Header } from '../../header';
import { SmtpConfig } from './components/smtp-config';
import { EmailTemplates } from './components/email-templates';
import { SendTestEmail } from './components/send-test-email';
import { EmailStatistics } from './components/email-statistics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@affine/admin/components/ui/tabs';

function MailerPage() {
  const [activeTab, setActiveTab] = useState('smtp');

  return (
    <div className="h-screen flex-1 flex-col flex">
      <Header 
        title="邮件通知" 
        endFix={
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              邮件服务配置和管理
            </span>
          </div>
        }
      />
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-h-[calc(100vh-70px)]">
          <ScrollAreaPrimitive.Root
            className={cn('relative overflow-hidden w-full h-full')}
          >
            <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
              <div className="p-6 max-w-6xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="smtp">SMTP配置</TabsTrigger>
                    <TabsTrigger value="templates">邮件模板</TabsTrigger>
                    <TabsTrigger value="test">测试邮件</TabsTrigger>
                    <TabsTrigger value="statistics">统计分析</TabsTrigger>
                  </TabsList>

                  <TabsContent value="smtp" className="space-y-6">
                    <SmtpConfig />
                  </TabsContent>

                  <TabsContent value="templates" className="space-y-6">
                    <EmailTemplates />
                  </TabsContent>

                  <TabsContent value="test" className="space-y-6">
                    <SendTestEmail />
                  </TabsContent>

                  <TabsContent value="statistics" className="space-y-6">
                    <EmailStatistics />
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
      </div>
    </div>
  );
}

export { MailerPage as Component };