import { useCallback, useState } from 'react';
import { cn } from '@yunke/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yunke/admin/components/ui/tabs';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Loader2, Mail, PenTool, PieChart, RefreshCw, Send } from 'lucide-react';

import { Header } from '../../header';
import { SmtpConfig } from './components/smtp-config';
import { EmailTemplates } from './components/email-templates';
import { SendTestEmail } from './components/send-test-email';
import { EmailStatistics } from './components/email-statistics';


type TabValue = 'smtp' | 'templates' | 'test' | 'statistics';

function MailerPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('smtp');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('mailer:refresh'));
    setTimeout(() => setIsRefreshing(false), 600);
  }, []);

  const onTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="flex h-screen flex-1 flex-col">
      <Header
        title="邮件通知"
        endFix={
          <div className="flex items-center gap-3">
            <TabsList className="hidden rounded-full bg-slate-100/80 p-1 text-slate-500 shadow-inner md:flex">
              <TabsTrigger
                value="smtp"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                SMTP 配置
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                邮件模板
              </TabsTrigger>
              <TabsTrigger
                value="test"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                测试邮件
              </TabsTrigger>
              <TabsTrigger
                value="statistics"
                className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                统计分析
              </TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:border-slate-300 hover:bg-white/80 md:inline-flex"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              刷新数据
            </Button>
          </div>
        }
      />

      <ScrollAreaPrimitive.Root className={cn('relative flex-1 overflow-hidden')}>
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
          <div className="relative min-h-full w-full">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.08),transparent_60%)]" />
            <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8 px-4 pb-12 pt-8 md:px-8">
              <div className="flex flex-col gap-4 md:hidden">
                <TabsList className="flex rounded-xl bg-white/80 p-1 shadow-sm">
                  <TabsTrigger
                    value="smtp"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    SMTP 配置
                  </TabsTrigger>
                  <TabsTrigger
                    value="templates"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    邮件模板
                  </TabsTrigger>
                  <TabsTrigger
                    value="test"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    测试邮件
                  </TabsTrigger>
                  <TabsTrigger
                    value="statistics"
                    className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                  >
                    统计分析
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-center"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      正在刷新
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      重新获取
                    </>
                  )}
                </Button>
              </div>

              <TabsContent value="smtp" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-blue-200 bg-blue-50/70 text-blue-600">
                    <Mail className="h-3.5 w-3.5" />
                    邮件服务
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">SMTP 配置</h2>
                  <p className="text-sm text-slate-500">
                    配置邮件服务器、凭据与安全选项，为系统通知邮件提供稳定保障。
                  </p>
                </div>
                <SmtpConfig />
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-purple-200 bg-purple-50/70 text-purple-600">
                    <PenTool className="h-3.5 w-3.5" />
                    邮件模板
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">模板管理</h2>
                  <p className="text-sm text-slate-500">
                    创建和维护系统邮件模板，支持预览、复制及快速测试。
                  </p>
                </div>
                <EmailTemplates />
              </TabsContent>

              <TabsContent value="test" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-emerald-200 bg-emerald-50/70 text-emerald-600">
                    <Send className="h-3.5 w-3.5" />
                    测试发送
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">发送测试邮件</h2>
                  <p className="text-sm text-slate-500">
                    验证 SMTP 配置、模板内容与实际投递路径，确保邮件链路可靠。
                  </p>
                </div>
                <SendTestEmail />
              </TabsContent>

              <TabsContent value="statistics" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-slate-200 bg-white/70 text-slate-600">
                    <PieChart className="h-3.5 w-3.5" />
                    发送数据
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">邮件统计与监控</h2>
                  <p className="text-sm text-slate-500">
                    通过趋势、模板使用和发送日志了解邮件系统的稳定性与投递效果。
                  </p>
                </div>
                <EmailStatistics />
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

export { MailerPage as Component };
