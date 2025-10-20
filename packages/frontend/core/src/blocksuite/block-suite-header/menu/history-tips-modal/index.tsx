import { OverlayModal } from '@yunke/component';
import { useEnableCloud } from '@yunke/core/components/hooks/yunke/use-enable-cloud';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import TopSvg from './top-svg';

export const HistoryTipsModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const t = useI18n();
  const currentWorkspace = useService(WorkspaceService).workspace;
  const confirmEnableCloud = useEnableCloud();

  const handleConfirm = useCallback(() => {
    setOpen(false);
    confirmEnableCloud(currentWorkspace);
  }, [confirmEnableCloud, currentWorkspace, setOpen]);

  return (
    <OverlayModal
      open={open}
      topImage={<TopSvg />}
      title={t['com.yunke.history-vision.tips-modal.title']()}
      onOpenChange={setOpen}
      description={t['com.yunke.history-vision.tips-modal.description']()}
      cancelText={t['com.yunke.history-vision.tips-modal.cancel']()}
      confirmButtonOptions={{
        variant: 'primary',
      }}
      onConfirm={handleConfirm}
      confirmText={t['com.yunke.history-vision.tips-modal.confirm']()}
    />
  );
};
