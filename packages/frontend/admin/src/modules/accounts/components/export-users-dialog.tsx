import { Button } from '@yunke/admin/components/ui/button';
import { Checkbox } from '@yunke/admin/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@yunke/admin/components/ui/dialog';
import { Label } from '@yunke/admin/components/ui/label';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { CopyIcon } from '@blocksuite/icons/rc';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { UserType } from '../schema';
import { type ExportField, useExportUsers } from './use-user-management';

interface ExportUsersDialogProps {
  users: UserType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportUsersDialog({
  users,
  open,
  onOpenChange,
}: ExportUsersDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [fields, setFields] = useState<ExportField[]>([
    {
      id: 'name',
      label: '用户名',
      checked: true,
    },
    {
      id: 'email',
      label: '邮箱',
      checked: true,
    },
  ]);

  const handleFieldChange = useCallback(
    (id: string, checked: boolean) => {
      setFields(
        fields.map(field => (field.id === id ? { ...field, checked } : field))
      );
    },
    [fields]
  );

  const { exportCSV, copyToClipboard } = useExportUsers();

  const handleExport = useAsyncCallback(async () => {
    setIsExporting(true);
    try {
      await exportCSV(users, fields, () => {
        setIsExporting(false);
        onOpenChange(false);
        toast('用户导出成功');
      });
    } catch (error) {
      console.error('导出用户失败', error);
      toast.error('导出用户失败');
      setIsExporting(false);
    }
  }, [exportCSV, fields, onOpenChange, users]);

  const handleCopy = useAsyncCallback(async () => {
    setIsCopying(true);
    try {
      await copyToClipboard(users, fields, () => {
        setIsCopying(false);
        onOpenChange(false);
        toast('用户信息已复制到剪贴板');
      });
    } catch (error) {
              console.error('复制用户失败', error);
      toast.error('复制用户信息失败');
      setIsCopying(false);
    }
  }, [copyToClipboard, fields, onOpenChange, users]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>导出</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {fields.map(field => (
            <div key={field.id} className="flex items-center space-x-2">
              <Checkbox
                id={`export-${field.id}`}
                checked={field.checked}
                onCheckedChange={checked =>
                  handleFieldChange(field.id, !!checked)
                }
              />
              <Label htmlFor={`export-${field.id}`}>{field.label}</Label>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            onClick={handleExport}
            className="w-full text-[15px] px-4 py-2 h-10"
            disabled={isExporting || isCopying}
          >
            {isExporting ? '导出中...' : '下载账户信息'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="p-5"
            onClick={handleCopy}
            disabled={isExporting || isCopying}
          >
            <CopyIcon fontSize={20} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
