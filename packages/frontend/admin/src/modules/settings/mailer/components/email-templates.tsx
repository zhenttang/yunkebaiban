import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Badge } from '@affine/admin/components/ui/badge';
import { Input } from '@affine/admin/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@affine/admin/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@affine/admin/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@affine/admin/components/ui/alert-dialog';
import { 
  Loader2, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Mail, 
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

import { useEmailTemplates } from '../hooks/use-email-templates';
import { TemplateEditor } from './template-editor';
import { TemplatePreview } from './template-preview';
import type { MailTemplateDto } from '../types';

export function EmailTemplates() {
  const { 
    templates, 
    loading, 
    error, 
    deleteTemplate, 
    duplicateTemplate,
    testTemplate 
  } = useEmailTemplates();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<MailTemplateDto | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MailTemplateDto | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<MailTemplateDto | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || template.type === selectedType;
    return matchesSearch && matchesType;
  });

  // 模板类型映射
  const templateTypes = {
    welcome: '欢迎邮件',
    reset_password: '重置密码',
    invitation: '邀请邮件',
    notification: '通知邮件',
    custom: '自定义'
  };

  // 处理删除模板
  const handleDeleteTemplate = async (template: MailTemplateDto) => {
    try {
      const result = await deleteTemplate(template.id);
      if (result.success) {
        toast.success('模板删除成功');
        setDeletingTemplate(null);
      } else {
        toast.error(result.error || '删除模板失败');
      }
    } catch (err) {
      toast.error('删除模板时发生错误');
    }
  };

  // 处理复制模板
  const handleDuplicateTemplate = async (template: MailTemplateDto) => {
    try {
      const result = await duplicateTemplate(template.id);
      if (result.success) {
        toast.success('模板复制成功');
      } else {
        toast.error(result.error || '复制模板失败');
      }
    } catch (err) {
      toast.error('复制模板时发生错误');
    }
  };

  // 处理测试模板
  const handleTestTemplate = async (template: MailTemplateDto, email: string) => {
    try {
      const result = await testTemplate(template.id, email);
      if (result.success) {
        toast.success('测试邮件发送成功');
      } else {
        toast.error(result.error || '发送测试邮件失败');
      }
    } catch (err) {
      toast.error('发送测试邮件时发生错误');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>加载邮件模板中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="text-red-500 mb-2">加载失败</div>
            <div className="text-gray-500">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">邮件模板</h2>
          <p className="text-muted-foreground">
            管理系统邮件模板，自定义邮件内容和样式
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建模板
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索模板名称或主题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {selectedType === 'all' ? '所有类型' : templateTypes[selectedType as keyof typeof templateTypes]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>模板类型</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedType('all')}>
                  所有类型
                </DropdownMenuItem>
                {Object.entries(templateTypes).map(([key, label]) => (
                  <DropdownMenuItem key={key} onClick={() => setSelectedType(key)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                  <CardDescription className="truncate mt-1">
                    {template.subject}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                      <Eye className="h-4 w-4 mr-2" />
                      预览
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                      <Edit className="h-4 w-4 mr-2" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                      <Copy className="h-4 w-4 mr-2" />
                      复制
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeletingTemplate(template)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? '启用' : '禁用'}
                  </Badge>
                  <Badge variant="outline">
                    {templateTypes[template.type as keyof typeof templateTypes]}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <div>变量: {template.variables.length > 0 ? template.variables.join(', ') : '无'}</div>
                  <div>更新时间: {new Date(template.updatedAt).toLocaleDateString()}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setPreviewTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    预览
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>发送测试邮件</DialogTitle>
                        <DialogDescription>
                          使用此模板发送测试邮件
                        </DialogDescription>
                      </DialogHeader>
                      <TestEmailForm 
                        template={template} 
                        onSend={handleTestTemplate}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-center">
              <div className="font-medium">没有找到邮件模板</div>
              <div className="text-sm text-muted-foreground">
                {searchQuery || selectedType !== 'all' 
                  ? '尝试调整搜索条件或筛选器' 
                  : '点击上方按钮创建第一个模板'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 创建/编辑模板对话框 */}
      <Dialog open={showCreateDialog || !!editingTemplate} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingTemplate(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? '编辑邮件模板' : '创建邮件模板'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate ? '修改现有的邮件模板' : '创建新的邮件模板'}
            </DialogDescription>
          </DialogHeader>
          <TemplateEditor
            template={editingTemplate}
            onSave={() => {
              setShowCreateDialog(false);
              setEditingTemplate(null);
            }}
            onCancel={() => {
              setShowCreateDialog(false);
              setEditingTemplate(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => {
        if (!open) setPreviewTemplate(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>模板预览</DialogTitle>
            <DialogDescription>
              预览邮件模板的最终效果
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <TemplatePreview template={previewTemplate} />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => {
        if (!open) setDeletingTemplate(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除模板 "{deletingTemplate?.name}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && handleDeleteTemplate(deletingTemplate)}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 测试邮件表单组件
function TestEmailForm({ 
  template, 
  onSend 
}: { 
  template: MailTemplateDto;
  onSend: (template: MailTemplateDto, email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email) {
      toast.error('请输入邮箱地址');
      return;
    }

    setSending(true);
    try {
      await onSend(template, email);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="test-email" className="text-sm font-medium">
          收件人邮箱
        </label>
        <Input
          id="test-email"
          type="email"
          placeholder="test@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSend}
          disabled={!email || sending}
        >
          {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          发送测试邮件
        </Button>
      </div>
    </div>
  );
}