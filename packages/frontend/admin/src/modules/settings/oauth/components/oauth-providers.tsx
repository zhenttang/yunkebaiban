import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@affine/admin/components/ui/badge';
import { Button } from '@affine/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Checkbox } from '@affine/admin/components/ui/checkbox';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Skeleton } from '@affine/admin/components/ui/skeleton';
import { Switch } from '@affine/admin/components/ui/switch';
import { Textarea } from '@affine/admin/components/ui/textarea';
import { cn } from '@affine/admin/utils';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  TestTube2,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  BatchToggleRequest,
  BatchToggleResult,
  OAuthProvider,
  OAuthTestResult,
} from '../types';

interface OAuthProvidersProps {
  providers: OAuthProvider[];
  loading: boolean;
  onUpdate: (provider: string, config: Partial<OAuthProvider>) => Promise<{ success: boolean; error?: string }>;
  onTest: (provider: string) => Promise<OAuthTestResult>;
  onBatchToggle: (request: BatchToggleRequest) => Promise<BatchToggleResult>;
  onRefresh: () => Promise<void>;
}

interface ProviderFormData {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  issuer?: string;
  claimId?: string;
  claimEmail?: string;
  claimName?: string;
}

const fallbackFormData: ProviderFormData = {
  clientId: '',
  clientSecret: '',
  authUrl: '',
  tokenUrl: '',
  userInfoUrl: '',
  scope: '',
  issuer: '',
  claimId: '',
  claimEmail: '',
  claimName: '',
};

const providerLabels: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Microsoft',
  apple: 'Apple',
  oidc: 'OIDC',
};

const providerEmojis: Record<string, string> = {
  google: '🔍',
  github: '🐱',
  microsoft: '🪟',
  apple: '🍎',
  oidc: '🔐',
};

type StatusMeta = {
  label: string;
  description: string;
  className: string;
};

const getStatusMeta = (provider: OAuthProvider): StatusMeta => {
  if (!provider.enabled) {
    return {
      label: '已禁用',
      description: '提供商未启用，用户无法使用该方式登录',
      className: 'bg-slate-100 text-slate-600 border border-slate-200',
    };
  }

  if (!provider.configured) {
    return {
      label: '未配置',
      description: '缺少必要的凭证或回调地址，请完善配置后再启用',
      className: 'bg-amber-50 text-amber-600 border border-amber-200',
    };
  }

  if (provider.connectionStatus === 'connected') {
    return {
      label: '已连接',
      description: '连接测试通过，第三方登录可正常使用',
      className: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    };
  }

  return {
    label: '连接异常',
    description: '最近一次测试失败，建议重新测试或检查凭证',
    className: 'bg-rose-50 text-rose-600 border border-rose-200',
  };
};

const ProviderSkeleton = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    {[1, 2].map(index => (
      <Card key={index} className="overflow-hidden border border-slate-200/60 bg-white/80 backdrop-blur">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const EmptyState = ({ onRefresh }: { onRefresh: () => Promise<void> }) => (
  <Card className="overflow-hidden border border-dashed border-slate-300 bg-gradient-to-br from-white via-white to-slate-50">
    <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-3xl">🔌</div>
      <div className="space-y-2">
        <p className="text-lg font-semibold text-slate-800">尚未配置任何提供商</p>
        <p className="text-sm text-slate-500">
          立即同步后端配置或参考下方指南完成初始化。
        </p>
      </div>
      <Button onClick={onRefresh} variant="outline" className="gap-2">
        <RefreshCcw className="h-4 w-4" />
        重新加载配置
      </Button>
    </CardContent>
  </Card>
);

export function OAuthProviders({
  providers,
  loading,
  onUpdate,
  onTest,
  onBatchToggle,
  onRefresh,
}: OAuthProvidersProps) {
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>(fallbackFormData);
  const [testResults, setTestResults] = useState<Record<string, OAuthTestResult>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const sortedProviders = useMemo(
    () => [...providers].sort((a, b) => a.provider.localeCompare(b.provider)),
    [providers]
  );

  const clearForm = useCallback(() => {
    setFormData(fallbackFormData);
    setEditingProvider(null);
  }, []);

  const handleSelect = useCallback((providerName: string, checked: boolean) => {
    setSelectedProviders(prev =>
      checked ? Array.from(new Set([...prev, providerName])) : prev.filter(p => p !== providerName)
    );
  }, []);

  const handleEdit = useCallback((provider: OAuthProvider) => {
    setExpandedProvider(provider.provider);
    setEditingProvider(provider.provider);
    setFormData({
      clientId: provider.clientId || '',
      clientSecret: provider.clientSecret || '',
      authUrl: provider.authUrl || '',
      tokenUrl: provider.tokenUrl || '',
      userInfoUrl: provider.userInfoUrl || '',
      scope: provider.scope || '',
      issuer: provider.issuer || '',
      claimId: provider.claimId || '',
      claimEmail: provider.claimEmail || '',
      claimName: provider.claimName || '',
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingProvider) return;

    setSaving(editingProvider);
    const toastId = toast.loading('正在保存配置...');
    try {
      const result = await onUpdate(editingProvider, formData);
      if (result.success) {
        toast.success('配置已更新', { id: toastId });
        clearForm();
      } else {
        toast.error(result.error ?? '保存失败，请稍后再试', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('保存失败，请检查网络或日志', { id: toastId });
    } finally {
      setSaving(null);
    }
  }, [clearForm, editingProvider, formData, onUpdate]);

  const handleCancel = useCallback(() => {
    clearForm();
  }, [clearForm]);

  const handleTest = useCallback(async (providerName: string) => {
    setTesting(providerName);
    const toastId = toast.loading('正在测试连接...');
    try {
      const result = await onTest(providerName);
      setTestResults(prev => ({ ...prev, [providerName]: result }));
      if (result.success) {
        toast.success(result.message || '连接成功', { id: toastId });
      } else {
        toast.error(result.message || '连接失败', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('测试失败，请稍后重试', { id: toastId });
    } finally {
      setTesting(null);
    }
  }, [onTest]);

  const handleToggleProvider = useCallback(async (providerName: string, enabled: boolean) => {
    setSaving(providerName);
    const toastId = toast.loading(enabled ? '正在启用...' : '正在禁用...');
    try {
      const result = await onUpdate(providerName, { enabled });
      if (result.success) {
        toast.success(enabled ? '已启用该提供商' : '已禁用该提供商', { id: toastId });
      } else {
        toast.error(result.error ?? '操作失败', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('操作失败，请稍后再试', { id: toastId });
    } finally {
      setSaving(null);
    }
  }, [onUpdate]);

  const handleBatchToggle = useCallback(
    async (enabled: boolean) => {
      if (selectedProviders.length === 0) return;

      setSaving('batch');
      const toastId = toast.loading(enabled ? '批量启用中...' : '批量禁用中...');
      try {
        const result = await onBatchToggle({ providers: selectedProviders, enabled });
        if (result.successCount !== undefined) {
          const failed = (result.failedProviders ?? []).length;
          toast.success(
            failed > 0
              ? `成功处理 ${result.successCount}/${result.totalCount} 个提供商`
              : '批量操作完成',
            { id: toastId }
          );
        } else {
          toast.success('批量操作完成', { id: toastId });
        }
        setSelectedProviders([]);
      } catch (err) {
        console.error(err);
        toast.error('批量操作失败，请检查网络或日志', { id: toastId });
      } finally {
        setSaving(null);
      }
    },
    [onBatchToggle, selectedProviders]
  );

  const toggleExpanded = useCallback((providerName: string) => {
    setExpandedProvider(prev => (prev === providerName ? null : providerName));
    if (editingProvider && editingProvider !== providerName) {
      clearForm();
    }
  }, [clearForm, editingProvider]);

  const showSkeleton = loading && providers.length === 0;
  const showEmpty = !loading && providers.length === 0;
  const isSavingBatch = saving === 'batch';

  return (
    <div className="space-y-6">
      {selectedProviders.length > 0 && (
        <Card className="border border-blue-200/60 bg-blue-50/30 shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              已选择 <span className="font-semibold text-blue-600">{selectedProviders.length}</span> 个提供商
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleBatchToggle(true)}
                disabled={isSavingBatch}
                className="gap-2"
              >
                {isSavingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                批量启用
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBatchToggle(false)}
                disabled={isSavingBatch}
                className="gap-2"
              >
                {isSavingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
                批量禁用
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedProviders([])}>
                清除选择
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showSkeleton && <ProviderSkeleton />}

      {!showSkeleton && showEmpty && <EmptyState onRefresh={onRefresh} />}

      {!showSkeleton && !showEmpty && (
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedProviders.map(provider => {
            const statusMeta = getStatusMeta(provider);
            const isExpanded = expandedProvider === provider.provider || editingProvider === provider.provider;
            const isEditing = editingProvider === provider.provider;
            const testResult = testResults[provider.provider];
            const isSavingCurrent = saving === provider.provider;
            const toggleDisabled = isSavingCurrent || loading;

            return (
              <Card
                key={provider.provider}
                className={cn(
                  'relative overflow-hidden border border-slate-200/70 bg-white/90 backdrop-blur transition-shadow hover:shadow-lg',
                  isExpanded && 'ring-1 ring-blue-200'
                )}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-blue-50 via-transparent to-purple-50" />
                <CardHeader className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedProviders.includes(provider.provider)}
                        onCheckedChange={checked => handleSelect(provider.provider, checked === true)}
                        className="mt-1"
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                        {providerEmojis[provider.provider.toLowerCase()] ?? '🔗'}
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold capitalize text-slate-900">
                          {providerLabels[provider.provider.toLowerCase()] ?? provider.provider}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>回调地址：</span>
                          <span className="max-w-[220px] truncate font-mono text-[11px]">
                            {provider.callbackUrl || '未设置'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={cn('px-3 py-1 text-xs font-medium', statusMeta.className)}>
                        {statusMeta.label}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">启用</span>
                        <Switch
                          checked={provider.enabled}
                          onCheckedChange={checked => handleToggleProvider(provider.provider, checked)}
                          disabled={toggleDisabled}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-inner">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                      {statusMeta.description}
                    </div>
                    {provider.scope && (
                      <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1">
                        <span className="text-[11px] text-slate-500">Scope:</span>
                        <span className="max-w-[180px] truncate font-mono text-[11px] text-slate-600">
                          {provider.scope}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleEdit(provider)}
                      disabled={isSavingCurrent || loading}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {isEditing ? '编辑中' : '配置' }
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleTest(provider.provider)}
                      disabled={testing === provider.provider || !provider.configured || loading}
                    >
                      {testing === provider.provider ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube2 className="h-4 w-4" />
                      )}
                      测试连接
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => toggleExpanded(provider.provider)}
                    >
                      详情
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {testResult && (
                    <div
                      className={cn(
                        'flex flex-col gap-1 rounded-xl px-4 py-3 text-sm shadow-sm',
                        testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                      )}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        {testResult.success ? '连接测试成功' : '连接测试失败'}
                      </div>
                      <span className="text-xs opacity-80">{testResult.message}</span>
                      {testResult.responseTime && (
                        <span className="text-xs opacity-80">响应时间：{testResult.responseTime} ms</span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {testResult.testedAt ? new Date(testResult.testedAt).toLocaleString() : '刚刚'}
                      </span>
                    </div>
                  )}
                </CardHeader>

                {isExpanded && (
                  <CardContent className="relative z-10 space-y-6 border-t border-dashed border-slate-200 bg-white/80 pt-6">
                    {isEditing ? (
                      <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-sm">Client ID</Label>
                            <Input
                              value={formData.clientId}
                              onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                              placeholder="输入 Client ID"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Client Secret</Label>
                            <Input
                              type="password"
                              value={formData.clientSecret}
                              onChange={e => setFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
                              placeholder="输入 Client Secret"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">授权 URL</Label>
                            <Input
                              value={formData.authUrl}
                              onChange={e => setFormData(prev => ({ ...prev, authUrl: e.target.value }))}
                              placeholder="https://"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Token URL</Label>
                            <Input
                              value={formData.tokenUrl}
                              onChange={e => setFormData(prev => ({ ...prev, tokenUrl: e.target.value }))}
                              placeholder="https://"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm">用户信息 URL</Label>
                            <Input
                              value={formData.userInfoUrl}
                              onChange={e => setFormData(prev => ({ ...prev, userInfoUrl: e.target.value }))}
                              placeholder="https://"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm">Scope</Label>
                            <Textarea
                              value={formData.scope}
                              onChange={e => setFormData(prev => ({ ...prev, scope: e.target.value }))}
                              placeholder="权限范围，使用空格或换行分隔"
                              rows={3}
                            />
                          </div>
                          {provider.provider.toLowerCase() === 'oidc' && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-sm">Issuer (OIDC)</Label>
                                <Input
                                  value={formData.issuer}
                                  onChange={e => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                                  placeholder="https://"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">用户 ID 字段</Label>
                                <Input
                                  value={formData.claimId}
                                  onChange={e => setFormData(prev => ({ ...prev, claimId: e.target.value }))}
                                  placeholder="默认: sub"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">邮箱字段</Label>
                                <Input
                                  value={formData.claimEmail}
                                  onChange={e => setFormData(prev => ({ ...prev, claimEmail: e.target.value }))}
                                  placeholder="默认: email"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">姓名字段</Label>
                                <Input
                                  value={formData.claimName}
                                  onChange={e => setFormData(prev => ({ ...prev, claimName: e.target.value }))}
                                  placeholder="默认: name"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            size="sm"
                            className="min-w-[96px]"
                          >
                            取消
                          </Button>
                          <Button
                            onClick={handleSave}
                            disabled={saving === editingProvider}
                            size="sm"
                            className="min-w-[120px] gap-2"
                          >
                            {saving === editingProvider ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            保存配置
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-sm">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl bg-slate-50/80 p-3">
                            <Label className="text-xs text-slate-500">Client ID</Label>
                            <p className="mt-1 font-mono text-xs text-slate-700">
                              {provider.clientId ? `${provider.clientId.slice(0, 18)}...` : '未配置'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50/80 p-3">
                            <Label className="text-xs text-slate-500">用户信息 URL</Label>
                            <p className="mt-1 truncate font-mono text-xs text-slate-700">
                              {provider.userInfoUrl || '未配置'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50/80 p-3">
                            <Label className="text-xs text-slate-500">授权 URL</Label>
                            <p className="mt-1 truncate font-mono text-xs text-slate-700">
                              {provider.authUrl || '未配置'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50/80 p-3">
                            <Label className="text-xs text-slate-500">Token URL</Label>
                            <p className="mt-1 truncate font-mono text-xs text-slate-700">
                              {provider.tokenUrl || '未配置'}
                            </p>
                          </div>
                        </div>
                        {provider.provider.toLowerCase() === 'oidc' && (
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-xl bg-slate-50/80 p-3">
                              <Label className="text-xs text-slate-500">Issuer</Label>
                              <p className="mt-1 truncate font-mono text-xs text-slate-700">
                                {provider.issuer || '未配置'}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50/80 p-3">
                              <Label className="text-xs text-slate-500">Claim ID</Label>
                              <p className="mt-1 font-mono text-xs text-slate-700">
                                {provider.claimId || '默认: sub'}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50/80 p-3">
                              <Label className="text-xs text-slate-500">Claim Email</Label>
                              <p className="mt-1 font-mono text-xs text-slate-700">
                                {provider.claimEmail || '默认: email'}
                              </p>
                            </div>
                            <div className="rounded-xl bg-slate-50/80 p-3">
                              <Label className="text-xs text-slate-500">Claim Name</Label>
                              <p className="mt-1 font-mono text-xs text-slate-700">
                                {provider.claimName || '默认: name'}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 p-3">
                          <AlertCircle className="mt-0.5 h-4 w-4 text-slate-400" />
                          <p className="text-xs leading-relaxed text-slate-500">
                            如需修改配置，请点击上方「配置」按钮，保存后可立即测试连接。
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
