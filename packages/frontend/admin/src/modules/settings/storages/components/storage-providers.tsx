import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Button } from '@yunke/admin/components/ui/button';
import { Input } from '@yunke/admin/components/ui/input';
import { Label } from '@yunke/admin/components/ui/label';
import { Switch } from '@yunke/admin/components/ui/switch';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Alert, AlertDescription } from '@yunke/admin/components/ui/alert';
import {
  CloudBubbleIcon
} from '@blocksuite/icons/rc';
import { CheckCircle as CheckCircleIcon, XCircle as XCircleIcon, RefreshCw as RefreshIcon, TestTube as TestIcon, CloudIcon, HardDriveIcon, ServerIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { useStorageConfig } from '../hooks/use-storage-config';
import type { StorageConfigDto, StorageProvider } from '../types';

interface ProviderMeta {
  readonly id: StorageProvider;
  readonly name: string;
  readonly description: string;
  readonly icon: JSX.Element;
  readonly features: string[];
}

interface ProviderField {
  readonly id: keyof StorageConfigDto | 'endpoint';
  readonly label: string;
  readonly type?: 'text' | 'password' | 'number';
  readonly placeholder?: string;
  readonly helperText?: string;
  readonly required?: boolean;
}

const STORAGE_PROVIDERS: ProviderMeta[] = [
  {
    id: 'fs',
    name: '本地文件系统',
    description: '将文件存储在服务器本地磁盘',
    icon: <HardDriveIcon className="h-5 w-5" />,
    features: ['简单配置', '无额外费用', '快速访问'],
  },
  {
    id: 'aws-s3',
    name: 'Amazon S3',
    description: 'AWS云存储服务',
    icon: <CloudIcon className="h-5 w-5" />,
    features: ['高可用性', '全球CDN', '弹性扩展'],
  },
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    description: 'Cloudflare对象存储',
    icon: <ServerIcon className="h-5 w-5" />,
    features: ['零出站费用', '全球分布', 'S3兼容'],
  },
  {
    id: 'tencent-cos',
    name: '腾讯云COS',
    description: '腾讯云对象存储',
    icon: <CloudIcon className="h-5 w-5" />,
    features: ['国内优化', '高性价比', '便捷集成'],
  }
];

const PROVIDER_FIELDS: Record<StorageProvider, ProviderField[]> = {
  fs: [
    {
      id: 'bucket',
      label: '存储路径',
      placeholder: '/var/lib/yunke/storage',
      required: true,
    },
  ],
  'aws-s3': [
    {
      id: 'accessKey',
      label: 'Access Key',
      type: 'password',
      required: true,
    },
    {
      id: 'secretKey',
      label: 'Secret Key',
      type: 'password',
      required: true,
    },
    {
      id: 'bucket',
      label: 'Bucket',
      placeholder: 'yunke-storage',
      required: true,
    },
    {
      id: 'region',
      label: '区域',
      placeholder: 'us-east-1',
      required: true,
    },
  ],
  'cloudflare-r2': [
    {
      id: 'accessKey',
      label: 'Access Key',
      type: 'password',
      required: true,
    },
    {
      id: 'secretKey',
      label: 'Secret Key',
      type: 'password',
      required: true,
    },
    {
      id: 'bucket',
      label: 'Bucket',
      placeholder: 'yunke-storage',
      required: true,
    },
    {
      id: 'endpoint',
      label: 'Endpoint',
      placeholder: 'https://your-account.r2.cloudflarestorage.com',
      helperText: '可选，自定义兼容 S3 的访问域名',
    },
  ],
  'tencent-cos': [
    {
      id: 'accessKey',
      label: 'SecretId',
      type: 'password',
      required: true,
    },
    {
      id: 'secretKey',
      label: 'SecretKey',
      type: 'password',
      required: true,
    },
    {
      id: 'bucket',
      label: 'Bucket',
      placeholder: 'yunke-storage-1250000000',
      required: true,
    },
    {
      id: 'region',
      label: '区域',
      placeholder: 'ap-beijing',
      required: true,
    },
  ],
};

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

  const missingRequiredFields = useMemo(() => {
    if (!formData.provider) return [] as ProviderField[];
    const fields = PROVIDER_FIELDS[formData.provider] ?? [];
    return fields.filter(field => field.required && !formData[field.id as keyof StorageConfigDto]);
  }, [formData]);

  const handleSave = async () => {
    if (!formData.provider) {
      toast.error('请选择存储提供商');
      return;
    }
    if (missingRequiredFields.length > 0) {
      toast.error(`请填写必填项：${missingRequiredFields.map(field => field.label).join('、')}`);
      return;
    }
    
    const result = await updateConfig(formData);
    if (result.success) {
      setHasUnsavedChanges(false);
      toast.success('存储配置保存成功');
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const handleTest = async () => {
    if (!formData.provider) {
      toast.error('请先选择存储提供商');
      return;
    }
    if (missingRequiredFields.length > 0) {
      toast.error(`请先完善必填项：${missingRequiredFields.map(field => field.label).join('、')}`);
      return;
    }

    const result = await testConnection(formData);
    setTestResult(result);
    if (result.success) {
      toast.success('连接测试成功');
    } else {
      toast.error(result.message);
    }
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
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <span className="rounded-full bg-blue-50 p-2 text-blue-600">
                    {provider.icon}
                  </span>
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
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(PROVIDER_FIELDS[selectedProvider.id] ?? []).map(field => (
                <div key={field.id as string} className="space-y-1">
                  <Label htmlFor={`field-${field.id}`}>
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </Label>
                  <Input
                    id={`field-${field.id}`}
                    type={field.type ?? 'text'}
                    value={(formData[field.id as keyof StorageConfigDto] as string | number | undefined) ?? ''}
                    onChange={(event) => handleInputChange(field.id as keyof StorageConfigDto, field.type === 'number' ? Number(event.target.value) : event.target.value)}
                    placeholder={field.placeholder}
                  />
                  {field.helperText && (
                    <p className="text-xs text-gray-500">{field.helperText}</p>
                  )}
                </div>
              ))}
            </div>

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

              <div>
                <Label htmlFor="allowedFileTypes">允许的文件类型</Label>
                <Input
                  id="allowedFileTypes"
                  placeholder="例如: png,jpg,pdf"
                  value={(formData.allowedFileTypes ?? []).join(',')}
                  onChange={(event) => {
                    const value = event.target.value
                      .split(',')
                      .map(token => token.trim())
                      .filter(Boolean);
                    handleInputChange('allowedFileTypes', value);
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">留空代表允许所有类型</p>
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
            disabled={!hasUnsavedChanges || !formData.provider || missingRequiredFields.length > 0}
          >
            保存配置
          </Button>
          {hasUnsavedChanges && (
            <Badge variant="secondary">有未保存的更改</Badge>
          )}
          {missingRequiredFields.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              待完善：{missingRequiredFields.map(field => field.label).join('、')}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
