import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@yunke/admin/components/ui/button';
import { Input } from '@yunke/admin/components/ui/input';
import { Label } from '@yunke/admin/components/ui/label';
import { Textarea } from '@yunke/admin/components/ui/textarea';
import { Switch } from '@yunke/admin/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yunke/admin/components/ui/select';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yunke/admin/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Separator } from '@yunke/admin/components/ui/separator';
import { Loader2, Eye, Code, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useEmailTemplates } from '../hooks/use-email-templates';
import type { MailTemplateDto } from '../types';

const templateSchema = z.object({
  name: z.string().min(1, '模板名称不能为空').max(100, '模板名称过长'),
  subject: z.string().min(1, '邮件主题不能为空').max(200, '邮件主题过长'),
  content: z.string().min(1, '邮件内容不能为空'),
  type: z.enum(['welcome', 'reset_password', 'invitation', 'notification', 'custom']),
  isActive: z.boolean(),
  variables: z.array(z.string()),
});

type TemplateForm = z.infer<typeof templateSchema>;

interface TemplateEditorProps {
  template?: MailTemplateDto | null;
  onSave: () => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const { createTemplate, updateTemplate, previewTemplate } = useEmailTemplates();
  const [previewData, setPreviewData] = useState<{ html: string; text: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newVariable, setNewVariable] = useState('');

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      subject: '',
      content: '',
      type: 'custom',
      isActive: true,
      variables: [],
    },
  });

  // 模板类型选项
  const templateTypes = [
    { value: 'welcome', label: '欢迎邮件' },
    { value: 'reset_password', label: '重置密码' },
    { value: 'invitation', label: '邀请邮件' },
    { value: 'notification', label: '通知邮件' },
    { value: 'custom', label: '自定义' },
  ];

  // 常用变量建议
  const commonVariables = [
    '{{username}}',
    '{{email}}',
    '{{company}}',
    '{{link}}',
    '{{date}}',
    '{{time}}',
    '{{verificationCode}}',
    '{{resetLink}}',
    '{{inviteLink}}',
  ];

  // 加载现有模板数据
  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        subject: template.subject,
        content: template.content,
        type: template.type,
        isActive: template.isActive,
        variables: template.variables,
      });
    }
  }, [template, form]);

  // 添加变量
  const handleAddVariable = () => {
    if (!newVariable.trim()) return;
    
    const currentVariables = form.getValues('variables');
    const variableToAdd = newVariable.startsWith('{{') && newVariable.endsWith('}}') 
      ? newVariable 
      : `{{${newVariable}}}`;
    
    if (!currentVariables.includes(variableToAdd)) {
      form.setValue('variables', [...currentVariables, variableToAdd]);
      setNewVariable('');
    } else {
      toast.error('变量已存在');
    }
  };

  // 删除变量
  const handleRemoveVariable = (variableToRemove: string) => {
    const currentVariables = form.getValues('variables');
    form.setValue('variables', currentVariables.filter(v => v !== variableToRemove));
  };

  // 添加常用变量
  const handleAddCommonVariable = (variable: string) => {
    const currentVariables = form.getValues('variables');
    if (!currentVariables.includes(variable)) {
      form.setValue('variables', [...currentVariables, variable]);
      toast.success('变量已添加');
    } else {
      toast.error('变量已存在');
    }
  };

  // 预览模板
  const handlePreview = async () => {
    const formData = form.getValues();
    
    setPreviewLoading(true);
    try {
      if (template?.id) {
        const result = await previewTemplate(template.id, {});
        if (result.success) {
          setPreviewData(result.data);
        } else {
          toast.error(result.error || '预览失败');
        }
      } else {
        // 对于新模板，使用本地预览
        setPreviewData({
          html: formData.content.replace(/\n/g, '<br>'),
          text: formData.content
        });
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  // 保存模板
  const handleSave = async (data: TemplateForm) => {
    setSaving(true);
    
    try {
      let result;
      if (template?.id) {
        result = await updateTemplate(template.id, data);
      } else {
        result = await createTemplate(data);
      }
      
      if (result.success) {
        toast.success(template ? '模板更新成功' : '模板创建成功');
        onSave();
      } else {
        toast.error(result.error || '保存失败');
      }
    } catch (err) {
      toast.error('保存时发生错误');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">编辑器</TabsTrigger>
          <TabsTrigger value="preview">预览</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            {/* 基础信息 */}
            <Card>
              <CardHeader>
                <CardTitle>基础信息</CardTitle>
                <CardDescription>配置模板的基本属性</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">模板名称</Label>
                    <Input
                      id="name"
                      placeholder="输入模板名称"
                      {...form.register('name')}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">模板类型</Label>
                    <Select 
                      value={form.watch('type')} 
                      onValueChange={(value) => form.setValue('type', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>启用状态</Label>
                    <p className="text-sm text-muted-foreground">
                      禁用的模板不会被系统使用
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 邮件内容 */}
            <Card>
              <CardHeader>
                <CardTitle>邮件内容</CardTitle>
                <CardDescription>编写邮件的HTML或文本内容</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">邮件内容</Label>
                  <Textarea
                    id="content"
                    placeholder="输入邮件内容，支持HTML格式"
                    rows={12}
                    className="font-mono"
                    {...form.register('content')}
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    支持 HTML 格式，可使用变量（例如 <code>{"{{username}}"}</code>、<code>{"{{verificationCode}}"}</code>）。
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 变量管理 */}
            <Card>
              <CardHeader>
                <CardTitle>模板变量</CardTitle>
                <CardDescription>管理模板中使用的动态变量</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 当前变量 */}
                <div className="space-y-2">
                  <Label>当前变量</Label>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('variables').map((variable, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {variable}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-red-100"
                          onClick={() => handleRemoveVariable(variable)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    {form.watch('variables').length === 0 && (
                      <span className="text-sm text-muted-foreground">暂无变量</span>
                    )}
                  </div>
                </div>

                {/* 添加自定义变量 */}
                <div className="space-y-2">
                  <Label>添加自定义变量</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入变量名称"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddVariable();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddVariable}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 常用变量 */}
                <div className="space-y-2">
                  <Label>常用变量</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonVariables.map((variable) => (
                      <Badge 
                        key={variable} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleAddCommonVariable(variable)}
                      >
                        {variable}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    点击添加常用变量到模板中
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={previewLoading}
              >
                {previewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Eye className="mr-2 h-4 w-4" />
                预览
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="mr-2 h-4 w-4" />
                  取消
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">模板预览</h3>
            <Button onClick={handlePreview} disabled={previewLoading}>
              {previewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              刷新预览
            </Button>
          </div>

          {previewData ? (
            <Card>
              <CardHeader>
                <CardTitle>邮件预览</CardTitle>
                <CardDescription>
                  主题: {form.watch('subject')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg p-4 bg-white min-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: previewData.html }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <div className="text-center">
                  <Code className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">点击"预览"按钮查看邮件效果</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
