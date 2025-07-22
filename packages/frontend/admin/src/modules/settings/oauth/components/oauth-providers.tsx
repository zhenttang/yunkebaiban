import { useState, useCallback } from 'react';
import { Input } from '@affine/admin/components/ui/input';
import { Button } from '@affine/admin/components/ui/button';
import { Switch } from '@affine/admin/components/ui/switch';
import { Badge } from '@affine/admin/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Textarea } from '@affine/admin/components/ui/textarea';
import { cn } from '@affine/admin/utils';
import type { OAuthProvider, OAuthTestResult, BatchToggleRequest } from '../types';

interface OAuthProvidersProps {
  providers: OAuthProvider[];
  loading: boolean;
  onUpdate: (provider: string, config: Partial<OAuthProvider>) => Promise<{ success: boolean; error?: string }>;
  onTest: (provider: string) => Promise<OAuthTestResult>;
  onBatchToggle: (request: BatchToggleRequest) => Promise<any>;
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

export function OAuthProviders({ 
  providers, 
  loading, 
  onUpdate, 
  onTest, 
  onBatchToggle,
  onRefresh 
}: OAuthProvidersProps) {
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>({
    clientId: '',
    clientSecret: '',
    authUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    scope: '',
    issuer: '',
    claimId: '',
    claimEmail: '',
    claimName: ''
  });
  const [testResults, setTestResults] = useState<Record<string, OAuthTestResult>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const handleEdit = useCallback((provider: OAuthProvider) => {
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
      claimName: provider.claimName || ''
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingProvider) return;
    
    setSaving(editingProvider);
    try {
      const result = await onUpdate(editingProvider, formData);
      if (result.success) {
        setEditingProvider(null);
      }
    } finally {
      setSaving(null);
    }
  }, [editingProvider, formData, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditingProvider(null);
    setFormData({
      clientId: '',
      clientSecret: '',
      authUrl: '',
      tokenUrl: '',
      userInfoUrl: '',
      scope: '',
      issuer: '',
      claimId: '',
      claimEmail: '',
      claimName: ''
    });
  }, []);

  const handleTest = useCallback(async (providerName: string) => {
    setTesting(providerName);
    try {
      const result = await onTest(providerName);
      setTestResults(prev => ({ ...prev, [providerName]: result }));
    } finally {
      setTesting(null);
    }
  }, [onTest]);

  const handleToggleProvider = useCallback(async (providerName: string, enabled: boolean) => {
    setSaving(providerName);
    try {
      await onUpdate(providerName, { enabled });
    } finally {
      setSaving(null);
    }
  }, [onUpdate]);

  const handleBatchToggle = useCallback(async (enabled: boolean) => {
    if (selectedProviders.length === 0) return;
    
    setSaving('batch');
    try {
      await onBatchToggle({ providers: selectedProviders, enabled });
      setSelectedProviders([]);
    } finally {
      setSaving(null);
    }
  }, [selectedProviders, onBatchToggle]);

  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      google: '🔍',
      github: '🐱',
      microsoft: '🪟',
      apple: '🍎',
      oidc: '🔐'
    };
    return icons[provider.toLowerCase()] || '🔗';
  };

  const getStatusColor = (provider: OAuthProvider) => {
    if (!provider.enabled) return 'bg-gray-100 text-gray-600';
    if (!provider.configured) return 'bg-yellow-100 text-yellow-600';
    if (provider.connectionStatus === 'connected') return 'bg-green-100 text-green-600';
    return 'bg-red-100 text-red-600';
  };

  const getStatusText = (provider: OAuthProvider) => {
    if (!provider.enabled) return '已禁用';
    if (!provider.configured) return '未配置';
    if (provider.connectionStatus === 'connected') return '已连接';
    return '连接失败';
  };

  return (
    <div className="space-y-6">
      {/* 批量操作 */}
      {selectedProviders.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                已选择 {selectedProviders.length} 个提供商
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBatchToggle(true)}
                  disabled={saving === 'batch'}
                >
                  批量启用
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBatchToggle(false)}
                  disabled={saving === 'batch'}
                >
                  批量禁用
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setSelectedProviders([])}
                >
                  取消选择
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 提供商列表 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {providers.map((provider) => (
          <Card key={provider.provider} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedProviders.includes(provider.provider)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProviders(prev => [...prev, provider.provider]);
                      } else {
                        setSelectedProviders(prev => prev.filter(p => p !== provider.provider));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-2xl">{getProviderIcon(provider.provider)}</span>
                  <CardTitle className="capitalize">{provider.provider}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(provider)}>
                    {getStatusText(provider)}
                  </Badge>
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(checked) => handleToggleProvider(provider.provider, checked)}
                    disabled={saving === provider.provider}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {editingProvider === provider.provider ? (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium">Client ID</label>
                      <Input
                        value={formData.clientId}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                        placeholder="输入 Client ID"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Client Secret</label>
                      <Input
                        type="password"
                        value={formData.clientSecret}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
                        placeholder="输入 Client Secret"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">授权 URL</label>
                      <Input
                        value={formData.authUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, authUrl: e.target.value }))}
                        placeholder="授权端点 URL"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Token URL</label>
                      <Input
                        value={formData.tokenUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, tokenUrl: e.target.value }))}
                        placeholder="Token 端点 URL"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">用户信息 URL</label>
                      <Input
                        value={formData.userInfoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, userInfoUrl: e.target.value }))}
                        placeholder="用户信息端点 URL"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Scope</label>
                      <Input
                        value={formData.scope}
                        onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
                        placeholder="权限范围，用空格分隔"
                      />
                    </div>

                    {provider.provider.toLowerCase() === 'oidc' && (
                      <>
                        <div>
                          <label className="text-sm font-medium">Issuer (OIDC)</label>
                          <Input
                            value={formData.issuer}
                            onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
                            placeholder="OIDC Issuer URL"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">用户ID字段</label>
                          <Input
                            value={formData.claimId}
                            onChange={(e) => setFormData(prev => ({ ...prev, claimId: e.target.value }))}
                            placeholder="默认: sub"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">邮箱字段</label>
                          <Input
                            value={formData.claimEmail}
                            onChange={(e) => setFormData(prev => ({ ...prev, claimEmail: e.target.value }))}
                            placeholder="默认: email"
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">姓名字段</label>
                          <Input
                            value={formData.claimName}
                            onChange={(e) => setFormData(prev => ({ ...prev, claimName: e.target.value }))}
                            placeholder="默认: name"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave}
                      disabled={saving === editingProvider}
                      size="sm"
                    >
                      {saving === editingProvider ? '保存中...' : '保存'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      size="sm"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client ID:</span>
                      <span className="font-mono text-xs">
                        {provider.clientId ? `${provider.clientId.slice(0, 8)}...` : '未配置'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">回调 URL:</span>
                      <span className="font-mono text-xs truncate max-w-48">
                        {provider.callbackUrl}
                      </span>
                    </div>
                  </div>
                  
                  {testResults[provider.provider] && (
                    <div className={cn(
                      "p-3 rounded-md text-sm",
                      testResults[provider.provider].success 
                        ? "bg-green-50 text-green-700" 
                        : "bg-red-50 text-red-700"
                    )}>
                      <div className="font-medium">
                        {testResults[provider.provider].success ? '✅ 连接成功' : '❌ 连接失败'}
                      </div>
                      <div className="text-xs mt-1">
                        {testResults[provider.provider].message}
                      </div>
                      {testResults[provider.provider].responseTime && (
                        <div className="text-xs mt-1">
                          响应时间: {testResults[provider.provider].responseTime}ms
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(provider)}
                    >
                      配置
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTest(provider.provider)}
                      disabled={testing === provider.provider || !provider.configured}
                    >
                      {testing === provider.provider ? '测试中...' : '测试连接'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {providers.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-gray-500">暂无OAuth提供商配置</div>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={onRefresh}
            >
              刷新
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}