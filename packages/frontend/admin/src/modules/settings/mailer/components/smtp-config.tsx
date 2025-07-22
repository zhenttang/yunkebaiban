import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Switch } from '@affine/admin/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@affine/admin/components/ui/select';
import { Alert, AlertDescription } from '@affine/admin/components/ui/alert';
import { Separator } from '@affine/admin/components/ui/separator';
import { Badge } from '@affine/admin/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Settings, Mail, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { useMailerConfig } from '../hooks/use-mailer-config';
import type { MailerConfigDto } from '../types';

const smtpConfigSchema = z.object({
  enabled: z.boolean(),
  host: z.string().min(1, '主机地址不能为空'),
  port: z.number().min(1, '端口必须大于0').max(65535, '端口必须小于65535'),
  username: z.string().optional(),
  password: z.string().optional(),
  sender: z.string().email('发件人邮箱格式不正确'),
  senderName: z.string().optional(),
  ssl: z.boolean().optional(),
  startTls: z.boolean().optional(),
  ignoreTls: z.boolean().optional(),
  connectionTimeout: z.number().min(1000).optional(),
  readTimeout: z.number().min(1000).optional(),
  debug: z.boolean().optional(),
  provider: z.string().optional(),
  maxQueueSize: z.number().min(1).optional(),
  maxRetries: z.number().min(0).optional(),
  retryInterval: z.number().min(1).optional(),
  queueEnabled: z.boolean().optional(),
});

type SmtpConfigForm = z.infer<typeof smtpConfigSchema>;

export function SmtpConfig() {
  const { 
    config, 
    providers, 
    loading, 
    error, 
    updateConfig, 
    testConnection, 
    validateConfig,
    getProviderPreset 
  } = useMailerConfig();
  
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const form = useForm<SmtpConfigForm>({
    resolver: zodResolver(smtpConfigSchema),
    defaultValues: {
      enabled: false,
      host: '',
      port: 587,
      username: '',
      password: '',
      sender: '',
      senderName: '',
      ssl: false,
      startTls: true,
      ignoreTls: false,
      connectionTimeout: 5000,
      readTimeout: 10000,
      debug: false,
      provider: '',
      maxQueueSize: 100,
      maxRetries: 3,
      retryInterval: 5,
      queueEnabled: true,
    },
  });

  // 监听配置变化，更新表单
  useEffect(() => {
    if (config) {
      form.reset({
        enabled: config.enabled ?? false,
        host: config.host ?? '',
        port: config.port ?? 587,
        username: config.username ?? '',
        password: config.password ?? '',
        sender: config.sender ?? '',
        senderName: config.senderName ?? '',
        ssl: config.ssl ?? false,
        startTls: config.startTls ?? true,
        ignoreTls: config.ignoreTls ?? false,
        connectionTimeout: config.connectionTimeout ?? 5000,
        readTimeout: config.readTimeout ?? 10000,
        debug: config.debug ?? false,
        provider: config.provider ?? '',
        maxQueueSize: config.maxQueueSize ?? 100,
        maxRetries: config.maxRetries ?? 3,
        retryInterval: config.retryInterval ?? 5,
        queueEnabled: config.queueEnabled ?? true,
      });
    }
  }, [config, form]);

  // 处理提供商选择
  const handleProviderSelect = async (providerId: string) => {
    if (!providerId) return;
    
    const preset = await getProviderPreset(providerId);
    if (preset) {
      form.setValue('host', preset.defaultHost);
      form.setValue('port', preset.defaultPort);
      form.setValue('ssl', preset.defaultSsl);
      form.setValue('startTls', preset.defaultStartTls);
      form.setValue('provider', providerId);
      
      toast.success(`已应用 ${preset.name} 预设配置`);
    }
  };

  // 测试连接
  const handleTestConnection = async () => {
    const formData = form.getValues();
    
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const result = await testConnection(formData as MailerConfigDto);
      setTestResult(result);
      
      if (result.success) {
        toast.success('连接测试成功！');
      } else {
        toast.error('连接测试失败');
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: '测试连接时发生错误'
      });
      toast.error('测试连接失败');
    } finally {
      setTestingConnection(false);
    }
  };

  // 验证配置
  const handleValidateConfig = async () => {
    const formData = form.getValues();
    
    try {
      const result = await validateConfig(formData as MailerConfigDto);
      setValidationResult(result);
      
      if (result.valid) {
        toast.success('配置验证通过！');
      } else {
        toast.error('配置验证失败');
      }
    } catch (err) {
      toast.error('验证配置失败');
    }
  };

  // 保存配置
  const handleSave = async (data: SmtpConfigForm) => {
    try {
      const result = await updateConfig(data as MailerConfigDto);
      
      if (result.success) {
        toast.success('邮件配置保存成功！');
        setTestResult(null);
        setValidationResult(null);
      } else {
        toast.error(result.error || '保存配置失败');
      }
    } catch (err) {
      toast.error('保存配置时发生错误');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>加载邮件配置中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <Alert className="w-full max-w-md">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SMTP 配置</h2>
          <p className="text-muted-foreground">
            配置邮件服务器设置以启用邮件通知功能
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config?.enabled && (
            <Badge variant="default" className="bg-green-100 text-green-700">
              <Mail className="h-3 w-3 mr-1" />
              已启用
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        {/* 基础设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              基础设置
            </CardTitle>
            <CardDescription>
              配置邮件服务的基本参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 启用开关 */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>启用邮件服务</Label>
                <p className="text-sm text-muted-foreground">
                  开启后系统将能够发送邮件通知
                </p>
              </div>
              <Switch
                checked={form.watch('enabled')}
                onCheckedChange={(checked) => form.setValue('enabled', checked)}
              />
            </div>

            <Separator />

            {/* 提供商选择 */}
            <div className="space-y-2">
              <Label>邮件服务提供商</Label>
              <Select value={form.watch('provider')} onValueChange={handleProviderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="选择预设配置或手动配置" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">手动配置</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                      {provider.description && (
                        <span className="text-muted-foreground ml-2">
                          - {provider.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SMTP 服务器配置 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="host">SMTP 服务器主机</Label>
                <Input
                  id="host"
                  placeholder="smtp.gmail.com"
                  {...form.register('host')}
                />
                {form.formState.errors.host && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.host.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">端口</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="587"
                  {...form.register('port', { valueAsNumber: true })}
                />
                {form.formState.errors.port && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.port.message}
                  </p>
                )}
              </div>
            </div>

            {/* 认证信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  placeholder="your-email@example.com"
                  {...form.register('username')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="应用专用密码"
                  {...form.register('password')}
                />
              </div>
            </div>

            {/* 发件人信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sender">发件人邮箱</Label>
                <Input
                  id="sender"
                  type="email"
                  placeholder="noreply@example.com"
                  {...form.register('sender')}
                />
                {form.formState.errors.sender && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.sender.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderName">发件人名称</Label>
                <Input
                  id="senderName"
                  placeholder="AFFiNE"
                  {...form.register('senderName')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 安全设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              安全设置
            </CardTitle>
            <CardDescription>
              配置邮件传输的安全选项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用 SSL</Label>
                  <p className="text-xs text-muted-foreground">
                    使用 SSL 加密连接
                  </p>
                </div>
                <Switch
                  checked={form.watch('ssl')}
                  onCheckedChange={(checked) => form.setValue('ssl', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用 STARTTLS</Label>
                  <p className="text-xs text-muted-foreground">
                    使用 STARTTLS 升级连接
                  </p>
                </div>
                <Switch
                  checked={form.watch('startTls')}
                  onCheckedChange={(checked) => form.setValue('startTls', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>忽略 TLS 验证</Label>
                  <p className="text-xs text-muted-foreground">
                    跳过证书验证（不推荐）
                  </p>
                </div>
                <Switch
                  checked={form.watch('ignoreTls')}
                  onCheckedChange={(checked) => form.setValue('ignoreTls', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 高级设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              高级设置
            </CardTitle>
            <CardDescription>
              配置超时、重试和队列选项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="connectionTimeout">连接超时 (毫秒)</Label>
                <Input
                  id="connectionTimeout"
                  type="number"
                  placeholder="5000"
                  {...form.register('connectionTimeout', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="readTimeout">读取超时 (毫秒)</Label>
                <Input
                  id="readTimeout"
                  type="number"
                  placeholder="10000"
                  {...form.register('readTimeout', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxQueueSize">最大队列大小</Label>
                <Input
                  id="maxQueueSize"
                  type="number"
                  placeholder="100"
                  {...form.register('maxQueueSize', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRetries">最大重试次数</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  placeholder="3"
                  {...form.register('maxRetries', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retryInterval">重试间隔 (分钟)</Label>
                <Input
                  id="retryInterval"
                  type="number"
                  placeholder="5"
                  {...form.register('retryInterval', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>启用队列</Label>
                <p className="text-sm text-muted-foreground">
                  启用邮件队列功能以提高发送性能
                </p>
              </div>
              <Switch
                checked={form.watch('queueEnabled')}
                onCheckedChange={(checked) => form.setValue('queueEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>调试模式</Label>
                <p className="text-sm text-muted-foreground">
                  启用详细的调试日志
                </p>
              </div>
              <Switch
                checked={form.watch('debug')}
                onCheckedChange={(checked) => form.setValue('debug', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 测试结果 */}
        {testResult && (
          <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
              <strong>{testResult.success ? '连接成功' : '连接失败'}:</strong> {testResult.message}
              {testResult.details && (
                <div className="mt-1 text-sm opacity-80">
                  详细信息: {testResult.details}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 验证结果 */}
        {validationResult && (
          <Alert className={validationResult.valid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            {validationResult.valid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription>
              <div className="space-y-1">
                {validationResult.errors?.length > 0 && (
                  <div>
                    <strong>错误:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {validationResult.errors.map((error: string, index: number) => (
                        <li key={index} className="text-red-700">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validationResult.warnings?.length > 0 && (
                  <div>
                    <strong>警告:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {validationResult.warnings.map((warning: string, index: number) => (
                        <li key={index} className="text-yellow-700">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testingConnection}
            >
              {testingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              测试连接
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleValidateConfig}
            >
              验证配置
            </Button>
          </div>
          
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存配置
          </Button>
        </div>
      </form>
    </div>
  );
}