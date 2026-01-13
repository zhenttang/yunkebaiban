import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yunke/admin/components/ui/tabs';
import { cn } from '@yunke/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { Brain, Link2, PieChart, RefreshCw, Settings, Sparkles, Wand2, Loader2 } from 'lucide-react';

import { Header } from '../../header';
import { ProviderCard } from './components/provider-card';
import { IntegrationCard } from './components/integration-card';
import { StorageCard } from './components/storage-card';
import { useCopilotConfig } from './hooks/use-copilot-config';

const TAB_ITEMS = [
  { value: 'overview', label: '概览', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'providers', label: '模型提供商', icon: <Brain className="h-4 w-4" /> },
  { value: 'integrations', label: '集成服务', icon: <Link2 className="h-4 w-4" /> },
  { value: 'storage', label: '存储配置', icon: <Settings className="h-4 w-4" /> },
];

function CopilotSettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TAB_ITEMS)[number]['value']>('overview');
  const {
    config,
    loading,
    error,
    saving,
    providerList,
    setEnabled,
    updateProvider,
    updateUnsplash,
    updateExa,
    updateStorage,
    refresh,
  } = useCopilotConfig();

  if (error) {
    return (
      <div className="flex h-screen flex-1 flex-col">
        <Header title="AI Copilot" />
        <div className="flex flex-1 items-center justify-center text-sm text-rose-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={value => setActiveTab(value as typeof activeTab)} className="flex h-screen flex-1 flex-col">
      <Header
        title="AI Copilot"
        endFix={
          <div className="flex items-center gap-3">
            <TabsList className="hidden rounded-full bg-slate-100/80 p-1 text-slate-500 shadow-inner md:flex">
              {TAB_ITEMS.map(item => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:text-slate-900"
                >
                  <span className="mr-1 inline-flex items-center gap-1 text-xs">
                    {item.icon}
                    {item.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:border-slate-300 hover:bg-white/80 md:inline-flex"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              刷新数据
            </Button>
          </div>
        }
      />

      <ScrollAreaPrimitive.Root className={cn('relative flex-1 overflow-hidden')}>
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
          <div className="relative min-h-full w-full">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.1),transparent_60%)]" />
            <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8 px-4 pb-12 pt-8 md:px-8">
              <div className="flex flex-col gap-4 md:hidden">
                <TabsList className="flex rounded-xl bg-white/80 p-1 shadow-sm">
                  {TAB_ITEMS.map(item => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="flex-1 rounded-lg data-[state=active]:bg-blue-500/10 data-[state=active]:font-semibold data-[state=active]:text-blue-600"
                    >
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Button variant="outline" size="sm" className="justify-center" onClick={refresh} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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

              <TabsContent value="overview" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-blue-200 bg-blue-50/70 text-blue-600">
                    <Sparkles className="h-3.5 w-3.5" /> 服务状态
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">Copilot 总览</h2>
                  <p className="text-sm text-slate-500">
                    控制 Copilot 是否启用，并查看当前各项能力的准备情况。
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <StatusCard
                    title="Copilot 状态"
                    description="开启后即可在产品内使用 AI 助手与生成能力。"
                    icon={<Sparkles className="h-4 w-4" />}
                    enabled={config.enabled}
                    onToggle={setEnabled}
                    loading={loading || saving}
                  />
                  <StatusBadge
                    title="已配置提供商"
                    value={`${providerList.filter(p => p.config?.apiKey).length}/${providerList.length}`}
                    icon={<Wand2 className="h-4 w-4" />}
                    description="建议至少配置一个主力模型提供商"
                  />
                  <StatusBadge
                    title="图片/搜索集成"
                    value={`${config.unsplash?.key ? 1 : 0} / ${config.exa?.apiKey ? 1 : 0}`}
                    icon={<Link2 className="h-4 w-4" />}
                    description="为生成内容补充图片或外部知识"
                  />
                </div>
              </TabsContent>

              <TabsContent value="providers" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-purple-200 bg-purple-50/70 text-purple-600">
                    <Brain className="h-3.5 w-3.5" /> 模型提供商
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">配置模型与 API 密钥</h2>
                  <p className="text-sm text-slate-500">
                    支持多个模型提供商，可按需启用并设置默认模型或自定义 Base URL。
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {providerList.map(provider => (
                    <ProviderCard
                      key={provider.id}
                      id={provider.id}
                      name={provider.name}
                      docs={provider.docs}
                      config={provider.config}
                      saving={saving}
                      onSave={payload => updateProvider(provider.id, payload)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-emerald-200 bg-emerald-50/70 text-emerald-600">
                    <Link2 className="h-3.5 w-3.5" /> 外部集成
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">内容增强服务</h2>
                  <p className="text-sm text-slate-500">
                    配置图片搜索与知识检索服务，用于增强生成效果。
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <IntegrationCard
                    title="Unsplash"
                    description="提供高质量图片搜索，用于生成内容插图。"
                    placeholder="Unsplash Access Key"
                    value={config.unsplash?.key ?? ''}
                    saving={saving}
                    onSave={updateUnsplash}
                  />
                  <IntegrationCard
                    title="Exa"
                    description="检索最新网站与资料，为回答提供实时上下文。"
                    placeholder="Exa API Key"
                    value={config.exa?.apiKey ?? ''}
                    saving={saving}
                    onSave={updateExa}
                  />
                </div>
              </TabsContent>

              <TabsContent value="storage" className="space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="gap-2 rounded-full border-slate-200 bg-white/70 text-slate-600">
                    <PieChart className="h-3.5 w-3.5" /> 存储配置
                  </Badge>
                  <h2 className="text-2xl font-semibold text-slate-900">模型产物存储</h2>
                  <p className="text-sm text-slate-500">
                    指定 Copilot 在上传、生成附件与缓存素材时使用的对象存储。支持本地与云端方案。
                  </p>
                </div>
                <StorageCard storage={config.storage} saving={saving} onSave={updateStorage} />
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

interface StatusCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  enabled: boolean;
  loading: boolean;
  onToggle: (value: boolean) => Promise<void> | void;
}

function StatusCard({ title, description, icon, enabled, onToggle, loading }: StatusCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-500">
        <span>{enabled ? 'Copilot 正在运行' : 'Copilot 已关闭'}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => onToggle(!enabled)}
          className="flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {enabled ? '关闭' : '开启'}
        </Button>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  title: string;
  value: string;
  icon: ReactNode;
  description: string;
}

function StatusBadge({ title, value, icon, description }: StatusBadgeProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          {icon}
        </span>
        {title}
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export { CopilotSettingsPage as Component };
