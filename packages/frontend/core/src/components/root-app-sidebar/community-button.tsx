import { MenuLinkItem } from '@yunke/core/modules/app-sidebar/views';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { useI18n } from '@yunke/i18n';
import { SettingsIcon } from '@blocksuite/icons/rc'; // 临时使用SettingsIcon，后续可替换为专门的社区图标
import { useLiveData, useService } from '@toeverything/infra';

export const CommunityButton = () => {
  const t = useI18n();
  const workbench = useService(WorkbenchService).workbench;
  const location = useLiveData(workbench.location$);
  
  const isActive = location.pathname.includes('/community');

  return (
    <MenuLinkItem
      data-testid="slider-bar-community-button"
      active={isActive}
      to={'/community'}
      icon={<SettingsIcon />}
      tooltip="查看社区文档"
    >
      社区
    </MenuLinkItem>
  );
};