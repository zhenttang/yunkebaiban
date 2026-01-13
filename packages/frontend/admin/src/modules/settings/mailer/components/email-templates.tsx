import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@yunke/admin/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@yunke/admin/components/ui/dropdown-menu';
import { Input } from '@yunke/admin/components/ui/input';
import { Skeleton } from '@yunke/admin/components/ui/skeleton';
import { Label } from '@yunke/admin/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@yunke/admin/components/ui/alert-dialog';
import {
  Copy,
  Edit,
  Eye,
  Filter,
  Loader2,
  Mail,
  MoreHorizontal,
  PenSquare,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useEmailTemplates } from '../hooks/use-email-templates';
import type { MailTemplateDto } from '../types';
import { TemplateEditor } from './template-editor';
import { TemplatePreview } from './template-preview';

const templateTypeLabels: Record<string, string> = {
  welcome: '欢迎邮件',
  reset_password: '重置密码',
  invitation: '邀请邮件',
  notification: '系统通知',
  custom: '自定义模板',
};

export function EmailTemplates() {
  const {
    templates,
    loading,
    error,
    refetch,
    deleteTemplate,
    duplicateTemplate,
    testTemplate,
  } = useEmailTemplates();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<MailTemplateDto | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MailTemplateDto | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<MailTemplateDto | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('mailer:refresh', handler);
    return () => window.removeEventListener('mailer:refresh', handler);
  }, [refetch]);

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return templates.filter(template => {
      const matchesQuery =
        !query ||
        template.name.toLowerCase().includes(query) ||
        template.subject.toLowerCase().includes(query);
      const matchesType = selectedType === 'all' || template.type === selectedType;
      return matchesQuery && matchesType;
    });
  }, [templates, searchQuery, selectedType]);

  const activeCount = useMemo(() => templates.filter(t => t.isActive).length, [templates]);

  const handleDeleteTemplate = async (template: MailTemplateDto) => {
    try {
      const result = await deleteTemplate(template.id);
      if (result.success) {
        toast.success('模板已删除');
        setDeletingTemplate(null);
      } else {
        toast.error(result.error || '删除模板失败');
      }
    } catch (err) {
      toast.error('删除失败，请查看控制台');
    }
  };

  const handleDuplicateTemplate = async (template: MailTemplateDto) => {
    const result = await duplicateTemplate(template.id);
    toast[result.success ? 'success' : 'error'](result.success ? '模板复制成功' : result.error || '复制失败');
  };

  const handleTestTemplate = async (template: MailTemplateDto, email: string) => {
    const result = await testTemplate(template.id, email);
    toast[result.success ? 'success' : 'error'](result.success ? '测试邮件已发送' : result.error || '测试失败');
  };

  if (loading) {
    return (
      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-rose-200/60 bg-rose-50/60">
        <CardContent className="flex h-40 items-center justify-center text-sm text-rose-600">
          <AlertTriangle className="mr-2 h-4 w-4" /> {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="gap-2 rounded-full border-slate-200 bg-slate-50 text-slate-600">
              <PenSquare className="h-3.5 w-3.5" /> 模板概览
            </Badge>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span>模板总数：<strong className="text-slate-900">{templates.length}</strong></span>
              <span>启用模板：<strong className="text-emerald-600">{activeCount}</strong></span>
              <span>覆盖场景：<strong className="text-blue-600">{new Set(templates.map(t => t.type)).size}</strong></span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="搜索模板名称或主题"
                className="h-9 w-56 rounded-full border-slate-200 pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full border-slate-200">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedType === 'all' ? '所有类型' : templateTypeLabels[selectedType]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>模板类型</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedType('all')}>所有类型</DropdownMenuItem>
                {Object.entries(templateTypeLabels).map(([key, label]) => (
                  <DropdownMenuItem key={key} onClick={() => setSelectedType(key)}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="rounded-full" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建模板
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredTemplates.length === 0 ? (
        <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <PenSquare className="h-8 w-8 text-slate-300" />
            {templates.length === 0
              ? '还没有邮件模板，点击上方“创建模板”开始创建吧。'
              : '没有符合筛选条件的模板，尝试调整搜索或类型筛选。'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map(template => (
            <Card key={template.id} className="group border border-slate-200/70 bg-white/90 backdrop-blur transition-all hover:shadow-lg">
              <CardHeader className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate text-lg text-slate-900">
                      {template.name}
                    </CardTitle>
                    <p className="truncate text-xs text-slate-500">{template.subject}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                        <Eye className="mr-2 h-4 w-4" /> 预览
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                        <Edit className="mr-2 h-4 w-4" /> 编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                        <Copy className="mr-2 h-4 w-4" /> 复制
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeletingTemplate(template)} className="text-rose-600">
                        <Trash2 className="mr-2 h-4 w-4" /> 删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={template.isActive ? 'default' : 'secondary'} className="rounded-full px-2 py-0.5">
                    {template.isActive ? '启用' : '禁用'}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-slate-500">
                    {templateTypeLabels[template.type] ?? template.type}
                  </Badge>
                  <span className="text-slate-400">最近更新 {new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-500">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">变量</p>
                  <p className="mt-1 text-slate-600">
                    {template.variables.length > 0 ? template.variables.join(', ') : '不需要变量'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewTemplate(template)}>
                    <Eye className="mr-2 h-4 w-4" /> 预览
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Mail className="mr-2 h-4 w-4" /> 测试
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>发送测试邮件</DialogTitle>
                        <DialogDescription>输入收件人邮箱，立即发送该模板的测试邮件。</DialogDescription>
                      </DialogHeader>
                      <TestEmailForm template={template} onSend={handleTestTemplate} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog || !!editingTemplate} onOpenChange={open => {
        if (!open) {
          setShowCreateDialog(false);
          setEditingTemplate(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? '编辑邮件模板' : '创建邮件模板'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? '修改模板内容与元数据' : '为系统添加新的邮件模板'}
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

      <Dialog open={!!previewTemplate} onOpenChange={open => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>模板预览</DialogTitle>
            <DialogDescription>查看邮件内容在收件箱中的呈现效果。</DialogDescription>
          </DialogHeader>
          {previewTemplate && <TemplatePreview template={previewTemplate} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTemplate} onOpenChange={open => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除模板</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除模板 “{deletingTemplate?.name}”？该操作不可撤销，相关邮件将无法继续使用此模板。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={() => deletingTemplate && handleDeleteTemplate(deletingTemplate)}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TestEmailForm({ template, onSend }: { template: MailTemplateDto; onSend: (template: MailTemplateDto, email: string) => Promise<void>; }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email) {
      toast.error('请输入收件人邮箱');
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
      <div className="space-y-2">
        <Label htmlFor="test-recipient">收件人邮箱</Label>
        <Input
          id="test-recipient"
          type="email"
          placeholder="test@example.com"
          value={email}
          onChange={event => setEmail(event.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={!email || sending} className="flex items-center gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          发送测试邮件
        </Button>
      </div>
    </div>
  );
}
