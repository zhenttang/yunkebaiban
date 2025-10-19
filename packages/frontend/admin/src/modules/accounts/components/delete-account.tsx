import { Button } from '@yunke/admin/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@yunke/admin/components/ui/dialog';
import { Input } from '@yunke/admin/components/ui/input';
import { useCallback, useEffect, useState } from 'react';

export const DeleteAccountDialog = ({
  email,
  open,
  onClose,
  onDelete,
  onOpenChange,
}: {
  email: string;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onOpenChange: (open: boolean) => void;
}) => {
  const [input, setInput] = useState('');
  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setInput(event.target.value);
    },
    [setInput]
  );

  useEffect(() => {
    if (!open) {
      setInput('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>删除账户？</DialogTitle>
          <DialogDescription>
            <span className="font-bold">{email}</span> 将被永久删除。此操作不可逆转，请谨慎操作。
          </DialogDescription>
        </DialogHeader>
        <Input
          type="text"
          value={input}
          onChange={handleInput}
          placeholder="请输入邮箱以确认"
          className="placeholder:opacity-50 mt-4 h-9"
        />
        <DialogFooter className="mt-6">
          <div className="flex justify-end gap-2 items-center w-full">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button
              type="button"
              onClick={onDelete}
              size="sm"
              variant="destructive"
              disabled={input !== email}
            >
              删除
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
