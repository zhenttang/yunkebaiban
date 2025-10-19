import { Button } from '@yunke/admin/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@yunke/admin/components/ui/dialog';

export const DiscardChanges = ({
  open,
  onClose,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:w-[460px]">
        <DialogHeader>
          <DialogTitle>放弃更改</DialogTitle>
          <DialogDescription className="leading-6 text-[15px]">
            对此用户的更改将不会保存。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <div className="flex justify-end gap-2 items-center w-full">
            <Button type="button" onClick={onClose} variant="outline">
              <span>取消</span>
            </Button>
            <Button type="button" onClick={onConfirm} variant="destructive">
              <span>放弃</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
