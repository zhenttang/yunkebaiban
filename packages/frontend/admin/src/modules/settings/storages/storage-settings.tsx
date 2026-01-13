import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Input } from '@yunke/admin/components/ui/input';
import { Label } from '@yunke/admin/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yunke/admin/components/ui/select';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Alert, AlertDescription } from '@yunke/admin/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yunke/admin/components/ui/tabs';
import { Progress } from '@yunke/admin/components/ui/progress';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  UploadIcon, 
  HardDriveIcon,
  CloudIcon,
  DatabaseIcon,
  RefreshCwIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface StorageProvider {
  provider: string;
  name: string;
  description: string;
  icon: string;
  config: Record<string, any>;
  fields: Record<string, any>;
}

interface StorageConfig {
  provider: string;
  [key: string]: any;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  responseTime?: number;
}

export function StorageSettings() {
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [currentConfig, setCurrentConfig] = useState<StorageConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [usage, setUsage] = useState<Record<string, any> | null>(null);
  const [stats, setStats] = useState<Record<string, any> | null>(null);

  // 获取支持的存储提供商
  const fetchProviders = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/storage/providers');
      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('获取存储提供商失败:', error);
      toast.error('获取存储提供商失败');
    }
  }, []);

  // 获取当前配置
  const fetchCurrentConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/storage/config');
      const data = await response.json();
      if (data.success) {
        setCurrentConfig(data.config);
        // 提取blob配置
        if (data.config.blob) {
          setSelectedProvider(data.config.blob.provider || 'fs');
          setConfig(data.config.blob[data.config.blob.provider] || {});
        }
      }
    } catch (error) {
      console.error('获取存储配置失败:', error);
      toast.error('获取存储配置失败');
    }
  }, []);

  // 获取存储使用情况
  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/storage/usage');
      const data = await response.json();
      if (data.success) {
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('获取存储使用情况失败:', error);
    }
  }, []);

  // 获取存储统计
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/storage/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('获取存储统计失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
    fetchCurrentConfig();
    fetchUsage();
    fetchStats();
  }, [fetchProviders, fetchCurrentConfig, fetchUsage, fetchStats]);

  // 测试连接
  const testConnection = async () => {
    if (!selectedProvider) {
      toast.error('请选择存储提供商');
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const testConfig = {
        provider: selectedProvider,
        ...config
      };

      const response = await fetch('/api/admin/storage/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testConfig)
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast.success('连接测试成功');
      } else {
        toast.error('连接测试失败: ' + data.message);
      }
    } catch (error) {
      console.error('连接测试失败:', error);
      setTestResult({
        success: false,
        message: '连接测试失败: ' + error.message
      });
      toast.error('连接测试失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    if (!selectedProvider) {
      toast.error('请选择存储提供商');
      return;
    }

    setLoading(true);

    try {
      const newConfig = {
        blob: {
          provider: selectedProvider,
          bucket: 'default',
          [selectedProvider]: config
        }
      };

      const response = await fetch('/api/admin/storage/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('存储配置保存成功');
        fetchCurrentConfig();
        fetchUsage();
        fetchStats();
      } else {
        toast.error('保存配置失败: ' + data.message);
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      toast.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取提供商图标
  const getProviderIcon = (iconType: string) => {
    switch (iconType) {
      case 'folder':
        return <HardDriveIcon className="h-5 w-5" />;
      case 'cloud':
        return <CloudIcon className="h-5 w-5" />;
      case 'database':
        return <DatabaseIcon className="h-5 w-5" />;
      default:
        return <CloudIcon className="h-5 w-5" />;
    }
  };

  // 渲染配置字段
  const renderConfigField = (fieldName: string, fieldConfig: any) => {
    const value = config[fieldName] || '';
    const { type, label, placeholder, required } = fieldConfig;

    const handleChange = (newValue: string) => {
      setConfig(prev => ({
        ...prev,
        [fieldName]: newValue
      }));
    };

    return (
      <div key={fieldName} className="space-y-2">
        <Label htmlFor={fieldName}>
          {label || fieldName}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Input
          id={fieldName}
          type={type === 'password' ? 'password' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          required={required}
        />
      </div>
    );
  };

  const selectedProviderInfo = providers.find(p => p.provider === selectedProvider);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">存储服务配置</h2>
          <p className="text-gray-600">配置文件存储服务提供商</p>
        </div>
        <Button 
          onClick={() => {
            fetchUsage();
            fetchStats();
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">配置</TabsTrigger>
          <TabsTrigger value="usage">使用情况</TabsTrigger>
          <TabsTrigger value="test">测试</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          {/* 提供商选择 */}
          <Card>
            <CardHeader>
              <CardTitle>选择存储提供商</CardTitle>
              <CardDescription>
                选择用于存储用户上传文件的服务提供商
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => (
                  <Card 
                    key={provider.provider}
                    className={`cursor-pointer transition-all ${
                      selectedProvider === provider.provider 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedProvider(provider.provider)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        {getProviderIcon(provider.icon)}
                        <div>
                          <h3 className="font-medium">{provider.name}</h3>
                          <p className="text-sm text-gray-600">{provider.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 配置表单 */}
          {selectedProviderInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getProviderIcon(selectedProviderInfo.icon)}
                  <span>{selectedProviderInfo.name} 配置</span>
                </CardTitle>
                <CardDescription>
                  {selectedProviderInfo.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(selectedProviderInfo.fields || {}).map(([fieldName, fieldConfig]) => 
                  renderConfigField(fieldName, fieldConfig)
                )}
                
                <div className="flex space-x-3 pt-4">
                  <Button onClick={testConnection} variant="outline" disabled={loading}>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    测试连接
                  </Button>
                  <Button onClick={saveConfig} disabled={loading}>
                    保存配置
                  </Button>
                </div>

                {/* 测试结果 */}
                {testResult && (
                  <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <div className="flex items-center space-x-2">
                      {testResult.success ? 
                        <CheckCircleIcon className="h-4 w-4 text-green-600" /> : 
                        <XCircleIcon className="h-4 w-4 text-red-600" />
                      }
                      <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                        {testResult.message}
                        {testResult.responseTime && (
                          <span className="ml-2 text-sm">
                            (响应时间: {testResult.responseTime}ms)
                          </span>
                        )}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* 存储使用情况 */}
          {usage && (
            <Card>
              <CardHeader>
                <CardTitle>存储使用情况</CardTitle>
                <CardDescription>
                  当前存储服务的使用统计
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{usage.usedSpace || 'N/A'}</div>
                    <div className="text-sm text-gray-600">已使用</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{usage.freeSpace || 'N/A'}</div>
                    <div className="text-sm text-gray-600">可用空间</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{usage.totalSpace || 'N/A'}</div>
                    <div className="text-sm text-gray-600">总容量</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{usage.fileCount || 'N/A'}</div>
                    <div className="text-sm text-gray-600">文件数量</div>
                  </div>
                </div>

                {usage.usagePercent !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">使用率</span>
                      <span className="text-sm font-medium">{usage.usagePercent}%</span>
                    </div>
                    <Progress value={usage.usagePercent} className="h-2" />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">存储提供商:</span>
                    <Badge variant="outline">{usage.provider || 'Unknown'}</Badge>
                  </div>
                  {usage.rootPath && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">存储路径:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{usage.rootPath}</code>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          {/* 文件上传测试 */}
          <Card>
            <CardHeader>
              <CardTitle>文件上传测试</CardTitle>
              <CardDescription>
                上传测试文件以验证存储服务配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <UploadIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">点击或拖拽文件到此处进行上传测试</p>
                  <input
                    type="file"
                    className="hidden"
                    id="test-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      setLoading(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await fetch('/api/admin/storage/test-upload', {
                          method: 'POST',
                          body: formData
                        });

                        const data = await response.json();
                        if (data.success) {
                          toast.success('文件上传测试成功');
                        } else {
                          toast.error('文件上传测试失败: ' + data.message);
                        }
                      } catch (error) {
                        console.error('文件上传测试失败:', error);
                        toast.error('文件上传测试失败');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('test-upload')?.click()}
                    disabled={loading}
                  >
                    选择测试文件
                  </Button>
                </div>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/storage/test-files', {
                          method: 'DELETE'
                        });
                        const data = await response.json();
                        if (data.success) {
                          toast.success(`清理了 ${data.deletedCount} 个测试文件`);
                        }
                      } catch (error) {
                        toast.error('清理测试文件失败');
                      }
                    }}
                  >
                    清理测试文件
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}