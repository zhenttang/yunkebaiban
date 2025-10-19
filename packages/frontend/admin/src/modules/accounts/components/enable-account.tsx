import { Button } from '@yunke/admin/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@yunke/admin/components/ui/dialog';

export const EnableAccountDialog = ({
  open,
  email,
  onClose,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  email: string;
  onClose: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-[460px]">
        <DialogHeader>
          <DialogTitle className="leading-7">启用账户</DialogTitle>
          <DialogDescription className="leading-6">
            您确定要启用该账户吗？启用账户后，
            <span className="font-bold">{email}</span> 邮箱将可以用于登录。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <div className="flex justify-end gap-2 items-center w-full">
            <Button type="button" onClick={onClose} variant="outline">
              <span>取消</span>
            </Button>
            <Button type="button" onClick={onConfirm} variant="default">
              <span>启用</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
