import { MenuLinkItem } from '@yunke/core/modules/app-sidebar/views';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { useI18n } from '@yunke/i18n';
import { PenIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';

export const ForumButton = () => {
  const t = useI18n();
  const workbench = useService(WorkbenchService).workbench;
  const location = useLiveData(workbench.location$);
  
  const isActive = location.pathname.includes('/forum');

  return (
    <MenuLinkItem
      data-testid="slider-bar-forum-button"
      active={isActive}
      to={'/forum'}
      icon={<PenIcon />}
      tooltip="社区论坛/博客"
    >
      论坛
    </MenuLinkItem>
  );
};

