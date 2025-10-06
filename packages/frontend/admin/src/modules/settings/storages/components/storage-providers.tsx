import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Switch } from '@affine/admin/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@affine/admin/components/ui/select';
import { Badge } from '@affine/admin/components/ui/badge';
import { Alert, AlertDescription } from '@affine/admin/components/ui/alert';
import {
  CloudBubbleIcon
} from '@blocksuite/icons/rc';
import { CheckCircle as CheckCircleIcon, XCircle as XCircleIcon, RefreshCw as RefreshIcon, TestTube as TestIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useStorageConfig } from '../hooks/use-storage-config';
import type { StorageConfigDto, StorageProvider } from '../types';

const STORAGE_PROVIDERS = [
  {
    id: 'fs' as StorageProvider,
    name: '本地文件系统',
    description: '将文件存储在服务器本地磁盘',
    icon: '📁',
    features: ['简单配置', '无额外费用', '快速访问'],
    requiresConfig: ['存储路径']
  },
  {
    id: 'aws-s3' as StorageProvider,
    name: 'Amazon S3',
    description: 'AWS云存储服务',
    icon: '☁️',
    features: ['高可用性', '全球CDN', '弹性扩展'],
    requiresConfig: ['Access Key', 'Secret Key', 'Bucket', 'Region']
  },
  {
    id: 'cloudflare-r2' as StorageProvider,
    name: 'Cloudflare R2',
    description: 'Cloudflare对象存储',
    icon: '🔶',
    features: ['零出站费用', '全球分布', 'S3兼容'],
    requiresConfig: ['Access Key', 'Secret Key', 'Bucket', 'Endpoint']
  },
  {
    id: 'tencent-cos' as StorageProvider,
    name: '腾讯云COS',
    description: '腾讯云对象存储',
    icon: '🔵',
    features: ['国内优化', '高性价比', '便捷集成'],
    requiresConfig: ['SecretId', 'SecretKey', 'Bucket', 'Region']
  }
];

export function StorageProviders() {
  const { config, loading, error, updateConfig, testConnection, testing } = useStorageConfig();
  const [formData, setFormData] = useState<Partial<StorageConfigDto>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (config) {
      setFormData(config);
      setHasUnsavedChanges(false);
    }
  }, [config]);

  const handleInputChange = (field: keyof StorageConfigDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!formData.provider) return;
    
    const result = await updateConfig(formData);
    if (result.success) {
      setHasUnsavedChanges(false);
    }
  };

  const handleTest = async () => {
    const result = await testConnection(formData);
    setTestResult(result);
  };

  const selectedProvider = STORAGE_PROVIDERS.find(p => p.id === formData.provider);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>存储提供商配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudBubbleIcon className="h-5 w-5" />
          存储提供商配置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <XCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 提供商选择 */}
        <div>
          <Label className="text-base font-medium">选择存储提供商</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {STORAGE_PROVIDERS.map((provider) => (
              <div
                key={provider.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.provider === provider.id
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('provider', provider.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{provider.name}</h4>
                      {formData.provider === provider.id && (
                        <Badge variant="default" className="text-xs">已选择</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 提供商特定配置 */}
        {selectedProvider && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">{selectedProvider.name} 配置</h4>
            
            {formData.provider === 'fs' && (
              <div>
                <Label htmlFor="bucket">存储路径</Label>
                <Input
                  id="bucket"
                  value={formData.bucket || ''}
                  onChange={(e) => handleInputChange('bucket', e.target.value)}
                  placeholder="/var/lib/affine/storage"
                />
              </div>
            )}

            {(formData.provider === 'aws-s3' || formData.provider === 'cloudflare-r2' || formData.provider === 'tencent-cos') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accessKey">
                      {formData.provider === 'tencent-cos' ? 'SecretId' : 'Access Key'}
                    </Label>
                    <Input
                      id="accessKey"
                      type="password"
                      value={formData.accessKey || ''}
                      onChange={(e) => handleInputChange('accessKey', e.target.value)}
                      placeholder="输入访问密钥"
                    />
                  </div>
                  <div>
                    <Label htmlFor="secretKey">
                      {formData.provider === 'tencent-cos' ? 'SecretKey' : 'Secret Key'}
                    </Label>
                    <Input
                      id="secretKey"
                      type="password"
                      value={formData.secretKey || ''}
                      onChange={(e) => handleInputChange('secretKey', e.target.value)}
                      placeholder="输入密钥"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bucket">存储桶名称</Label>
                    <Input
                      id="bucket"
                      value={formData.bucket || ''}
                      onChange={(e) => handleInputChange('bucket', e.target.value)}
                      placeholder="affine-storage"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">区域</Label>
                    <Input
                      id="region"
                      value={formData.region || ''}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      placeholder={formData.provider === 'aws-s3' ? 'us-east-1' : 'ap-beijing'}
                    />
                  </div>
                </div>

                {formData.provider === 'cloudflare-r2' && (
                  <div>
                    <Label htmlFor="endpoint">自定义端点</Label>
                    <Input
                      id="endpoint"
                      value={formData.endpoint || ''}
                      onChange={(e) => handleInputChange('endpoint', e.target.value)}
                      placeholder="https://your-account.r2.cloudflarestorage.com"
                    />
                  </div>
                )}
              </>
            )}

            {/* 通用配置 */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">启用存储服务</Label>
                  <p className="text-sm text-gray-600">关闭后将暂停文件上传功能</p>
                </div>
                <Switch
                  id="enabled"
                  checked={formData.enabled || false}
                  onCheckedChange={(checked) => handleInputChange('enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="publicRead">公开读取</Label>
                  <p className="text-sm text-gray-600">允许通过直链访问文件</p>
                </div>
                <Switch
                  id="publicRead"
                  checked={formData.publicRead || false}
                  onCheckedChange={(checked) => handleInputChange('publicRead', checked)}
                />
              </div>

              <div>
                <Label htmlFor="maxFileSize">最大文件大小 (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={formData.maxFileSize || 100}
                  onChange={(e) => handleInputChange('maxFileSize', parseInt(e.target.value))}
                  min="1"
                  max="1024"
                />
              </div>
            </div>
          </div>
        )}

        {/* 测试结果 */}
        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <XCircleIcon className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleTest}
            disabled={!formData.provider || testing}
            variant="outline"
          >
            {testing ? (
              <RefreshIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestIcon className="h-4 w-4 mr-2" />
            )}
            测试连接
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || !formData.provider}
          >
            保存配置
          </Button>
          {hasUnsavedChanges && (
            <Badge variant="secondary">有未保存的更改</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}