import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Textarea } from '@affine/admin/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@affine/admin/components/ui/select';
import { Switch } from '@affine/admin/components/ui/switch';
import { Alert, AlertDescription } from '@affine/admin/components/ui/alert';
import { Separator } from '@affine/admin/components/ui/separator';
import { Badge } from '@affine/admin/components/ui/badge';
import { 
  Loader2, 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  FileText,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

import { useMailerConfig } from '../hooks/use-mailer-config';
import { useEmailTemplates } from '../hooks/use-email-templates';
import type { SendTestMailRequestDto, MailerTestResultDto } from '../types';

const testEmailSchema = z.object({
  toEmail: z.string().email('请输入有效的邮箱地址'),
  subject: z.string().min(1, '邮件主题不能为空'),
  content: z.string().min(1, '邮件内容不能为空'),
  useCurrentConfig: z.boolean(),
  templateId: z.string().optional(),
});

type TestEmailForm = z.infer<typeof testEmailSchema>;

export function SendTestEmail() {
  const { config, sendTestMail, testConnection } = useMailerConfig();
  const { templates } = useEmailTemplates();
  const [testResult, setTestResult] = useState<MailerTestResultDto | null>(null);
  const [connectionResult, setConnectionResult] = useState<MailerTestResultDto | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const form = useForm<TestEmailForm>({
    resolver: zodResolver(testEmailSchema),
    defaultValues: {
      toEmail: '',
      subject: 'AFFiNE 测试邮件',
      content: '这是一封来自 AFFiNE 的测试邮件。\n\n如果您收到了这封邮件，说明邮件配置正常工作。\n\n发送时间: ' + new Date().toLocaleString(),
      useCurrentConfig: true,
      templateId: '',
    },
  });

  // 处理模板选择
  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      form.setValue('subject', selectedTemplate.subject);
      form.setValue('content', selectedTemplate.content);
      form.setValue('templateId', templateId);
      toast.success('已应用模板内容');
    } else {
      form.setValue('templateId', '');
    }
  };

  // 测试连接
  const handleTestConnection = async () => {
    if (!config) {
      toast.error('请先配置邮件设置');
      return;
    }

    setTestingConnection(true);
    setConnectionResult(null);

    try {
      const result = await testConnection();
      setConnectionResult(result);
      
      if (result.success) {
        toast.success('连接测试成功！');
      } else {
        toast.error('连接测试失败');
      }
    } catch (err) {
      setConnectionResult({
        success: false,
        message: '连接测试时发生错误'
      });
      toast.error('连接测试失败');
    } finally {
      setTestingConnection(false);
    }
  };

  // 发送测试邮件
  const handleSendTestEmail = async (data: TestEmailForm) => {
    setSendingEmail(true);
    setTestResult(null);

    try {
      const request: SendTestMailRequestDto = {
        toEmail: data.toEmail,
        subject: data.subject,
        content: data.content,
        useCurrentConfig: data.useCurrentConfig,
      };

      const result = await sendTestMail(request);
      setTestResult(result);
      
      if (result.success) {
        toast.success('测试邮件发送成功！');
      } else {
        toast.error('测试邮件发送失败');
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: '发送测试邮件时发生错误'
      });
      toast.error('发送测试邮件失败');
    } finally {
      setSendingEmail(false);
    }
  };

  // 快速填充示例内容
  const fillExampleContent = () => {
    form.setValue('subject', 'AFFiNE 邮件服务测试');
    form.setValue('content', `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AFFiNE 测试邮件</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6366f1;">AFFiNE 邮件服务测试</h1>
        
        <p>您好！</p>
        
        <p>这是一封来自 <strong>AFFiNE</strong> 管理后台的测试邮件。</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">测试信息</h3>
            <ul>
                <li>发送时间: ${new Date().toLocaleString()}</li>
                <li>邮件服务: 正常工作</li>
                <li>配置状态: 已验证</li>
            </ul>
        </div>
        
        <p>如果您收到了这封邮件，说明您的邮件配置已经正确设置并且可以正常发送邮件。</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="color: #64748b; font-size: 14px;">
            这是一封自动发送的测试邮件，请勿回复。<br>
            如有问题，请联系系统管理员。
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
            <p style="color: #94a3b8; font-size: 12px;">
                Powered by AFFiNE - The Next-Gen Knowledge Base
            </p>
        </div>
    </div>
</body>
</html>`);
    toast.success('已填充HTML示例内容');
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">发送测试邮件</h2>
          <p className="text-muted-foreground">
            测试邮件配置和发送功能
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config?.enabled ? (
            <Badge variant="default" className="bg-green-100 text-green-700">
              <Mail className="h-3 w-3 mr-1" />
              邮件服务已启用
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              邮件服务未启用
            </Badge>
          )}
        </div>
      </div>

      {/* 连接测试 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            连接测试
          </CardTitle>
          <CardDescription>
            在发送邮件之前，先测试SMTP服务器连接
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMTP连接状态</p>
              <p className="text-sm text-muted-foreground">
                验证邮件服务器的连接和认证设置
              </p>
            </div>
            <Button 
              onClick={handleTestConnection}
              disabled={testingConnection || !config?.enabled}
              variant="outline"
            >
              {testingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Zap className="mr-2 h-4 w-4" />
              测试连接
            </Button>
          </div>

          {connectionResult && (
            <Alert className={connectionResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {connectionResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={connectionResult.success ? 'text-green-800' : 'text-red-800'}>
                <strong>{connectionResult.success ? '连接成功' : '连接失败'}:</strong> {connectionResult.message}
                {connectionResult.details && (
                  <div className="mt-1 text-sm opacity-80">
                    详细信息: {connectionResult.details}
                  </div>
                )}
                {connectionResult.duration && (
                  <div className="mt-1 text-sm opacity-80">
                    耗时: {connectionResult.duration}ms
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 邮件发送测试 */}
      <form onSubmit={form.handleSubmit(handleSendTestEmail)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              邮件发送测试
            </CardTitle>
            <CardDescription>
              发送测试邮件验证完整的邮件发送流程
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 基础设置 */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toEmail">收件人邮箱</Label>
                  <Input
                    id="toEmail"
                    type="email"
                    placeholder="test@example.com"
                    {...form.register('toEmail')}
                  />
                  {form.formState.errors.toEmail && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.toEmail.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="templateId">使用模板（可选）</Label>
                  <Select 
                    value={form.watch('templateId')} 
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择邮件模板或手动编写" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">手动编写</SelectItem>
                      {templates
                        .filter(t => t.isActive)
                        .map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">邮件主题</Label>
                <Input
                  id="subject"
                  placeholder="输入邮件主题"
                  {...form.register('subject')}
                />
                {form.formState.errors.subject && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.subject.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">邮件内容</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fillExampleContent}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    填充示例内容
                  </Button>
                </div>
                <Textarea
                  id="content"
                  placeholder="输入邮件内容，支持HTML格式"
                  rows={10}
                  className="font-mono text-sm"
                  {...form.register('content')}
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.content.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  支持HTML格式，可以包含样式和链接
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>使用当前配置</Label>
                  <p className="text-sm text-muted-foreground">
                    使用已保存的SMTP配置发送邮件
                  </p>
                </div>
                <Switch
                  checked={form.watch('useCurrentConfig')}
                  onCheckedChange={(checked) => form.setValue('useCurrentConfig', checked)}
                />
              </div>
            </div>

            <Separator />

            {/* 发送按钮 */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {!config?.enabled && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    邮件服务未启用，请先在SMTP配置中启用
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={sendingEmail || !config?.enabled}
              >
                {sendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                发送测试邮件
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* 发送结果 */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              发送结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                <div className="space-y-2">
                  <div>
                    <strong>状态:</strong> {testResult.success ? '发送成功' : '发送失败'}
                  </div>
                  <div>
                    <strong>消息:</strong> {testResult.message}
                  </div>
                  {testResult.details && (
                    <div>
                      <strong>详细信息:</strong> {testResult.details}
                    </div>
                  )}
                  {testResult.duration && (
                    <div>
                      <strong>发送耗时:</strong> {testResult.duration}ms
                    </div>
                  )}
                  {testResult.timestamp && (
                    <div>
                      <strong>时间:</strong> {new Date(testResult.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {testResult.success && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">后续步骤</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 检查收件箱（包括垃圾邮件文件夹）</li>
                  <li>• 验证邮件内容和格式是否正确</li>
                  <li>• 如果邮件未收到，请检查收件人邮箱设置</li>
                  <li>• 可以在邮件统计页面查看发送记录</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}