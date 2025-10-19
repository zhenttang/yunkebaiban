import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Button } from '@yunke/admin/components/ui/button';
import { Input } from '@yunke/admin/components/ui/input';
import { Label } from '@yunke/admin/components/ui/label';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yunke/admin/components/ui/tabs';
import { Separator } from '@yunke/admin/components/ui/separator';
import { Loader2, RefreshCw, Mail } from 'lucide-react';
import { toast } from 'sonner';

import { useEmailTemplates } from '../hooks/use-email-templates';
import type { MailTemplateDto } from '../types';

interface TemplatePreviewProps {
  template: MailTemplateDto;
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const { previewTemplate, testTemplate } = useEmailTemplates();
  const [previewData, setPreviewData] = useState<{ html: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  // 初始化变量值
  useEffect(() => {
    const initialVariables: Record<string, string> = {};
    template.variables.forEach(variable => {
      const varName = variable.replace(/[{}]/g, '');
      initialVariables[varName] = getSampleValue(varName);
    });
    setVariables(initialVariables);
  }, [template.variables]);

  // 获取变量的示例值
  const getSampleValue = (varName: string): string => {
    const sampleValues: Record<string, string> = {
      username: 'John Doe',
      email: 'john.doe@example.com',
      company: 'AFFiNE',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      verificationCode: '123456',
      resetLink: 'https://example.com/reset?token=abc123',
      inviteLink: 'https://example.com/invite?token=xyz789',
      link: 'https://example.com',
    };
    
    return sampleValues[varName] || `[${varName}]`;
  };

  // 加载预览
  const loadPreview = async () => {
    setLoading(true);
    try {
      const result = await previewTemplate(template.id, variables);
      if (result.success) {
        setPreviewData(result.data);
      } else {
        toast.error(result.error || '预览失败');
        // 生成本地预览
        generateLocalPreview();
      }
    } catch (err) {
      console.error('Preview error:', err);
      generateLocalPreview();
    } finally {
      setLoading(false);
    }
  };

  // 生成本地预览（当后端预览失败时）
  const generateLocalPreview = () => {
    let htmlContent = template.content;
    let textContent = template.content;

    // 替换变量
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // 简单的HTML格式化
    htmlContent = htmlContent.replace(/\n/g, '<br>');

    setPreviewData({
      html: htmlContent,
      text: textContent
    });
  };

  // 初始加载
  useEffect(() => {
    loadPreview();
  }, [template.id, variables]);

  // 发送测试邮件
  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('请输入测试邮箱');
      return;
    }

    setSending(true);
    try {
      const result = await testTemplate(template.id, testEmail, variables);
      if (result.success) {
        toast.success('测试邮件发送成功');
      } else {
        toast.error(result.error || '发送失败');
      }
    } catch (err) {
      toast.error('发送测试邮件时发生错误');
    } finally {
      setSending(false);
    }
  };

  // 更新变量值
  const handleVariableChange = (varName: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* 模板信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription className="mt-1">
                主题: {template.subject}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={template.isActive ? "default" : "secondary"}>
                {template.isActive ? '启用' : '禁用'}
              </Badge>
              <Badge variant="outline">
                {template.type}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 变量配置 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">变量设置</CardTitle>
              <CardDescription>
                设置模板变量的预览值
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.variables.length > 0 ? (
                template.variables.map((variable) => {
                  const varName = variable.replace(/[{}]/g, '');
                  return (
                    <div key={varName} className="space-y-2">
                      <Label htmlFor={`var-${varName}`} className="text-sm">
                        {variable}
                      </Label>
                      <Input
                        id={`var-${varName}`}
                        value={variables[varName] || ''}
                        onChange={(e) => handleVariableChange(varName, e.target.value)}
                        placeholder={`输入 ${varName} 的值`}
                      />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">此模板没有变量</p>
              )}
              
              <Separator />
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">测试邮件</Label>
                <Input
                  type="email"
                  placeholder="输入测试邮箱"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <Button 
                  onClick={handleSendTest} 
                  disabled={!testEmail || sending}
                  className="w-full"
                >
                  {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Mail className="mr-2 h-4 w-4" />
                  发送测试邮件
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 预览内容 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">邮件预览</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadPreview}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>生成预览中...</span>
                  </div>
                </div>
              ) : previewData ? (
                <Tabs defaultValue="html" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="html">HTML 预览</TabsTrigger>
                    <TabsTrigger value="text">文本预览</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="html" className="mt-4">
                    <div className="border rounded-lg">
                      {/* 邮件头部 */}
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <div className="space-y-1 text-sm">
                          <div><strong>主题:</strong> {template.subject}</div>
                          <div><strong>发送至:</strong> {testEmail || 'test@example.com'}</div>
                          <div><strong>发送方:</strong> AFFiNE &lt;noreply@affine.pro&gt;</div>
                        </div>
                      </div>
                      
                      {/* 邮件内容 */}
                      <div 
                        className="p-4 bg-white min-h-[400px] overflow-auto"
                        dangerouslySetInnerHTML={{ __html: previewData.html }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="text" className="mt-4">
                    <div className="border rounded-lg">
                      {/* 邮件头部 */}
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <div className="space-y-1 text-sm">
                          <div><strong>主题:</strong> {template.subject}</div>
                          <div><strong>发送至:</strong> {testEmail || 'test@example.com'}</div>
                          <div><strong>发送方:</strong> AFFiNE &lt;noreply@affine.pro&gt;</div>
                        </div>
                      </div>
                      
                      {/* 文本内容 */}
                      <pre className="p-4 bg-white text-sm whitespace-pre-wrap min-h-[400px] overflow-auto">
                        {previewData.text}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">无法生成预览</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadPreview}
                      className="mt-2"
                    >
                      重试
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}