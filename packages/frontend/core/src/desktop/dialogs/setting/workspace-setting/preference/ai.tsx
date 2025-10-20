import { Switch } from '@yunke/component';
import {
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { ServerService } from '@yunke/core/modules/cloud';
import { WorkspacePermissionService } from '@yunke/core/modules/permissions';
import { WorkspaceShareSettingService } from '@yunke/core/modules/share-setting';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';

export const AiSetting = () => {
  const t = useI18n();
  const shareSetting = useService(WorkspaceShareSettingService).sharePreview;
  const serverService = useService(ServerService);
  const serverEnableAi = useLiveData(
    serverService.server.features$.map(f => f?.copilot)
  );
  const workspaceEnableAi = useLiveData(shareSetting.enableAi$);
  const loading = useLiveData(shareSetting.isLoading$);
  const permissionService = useService(WorkspacePermissionService);
  const isOwner = useLiveData(permissionService.permission.isOwner$);

  const toggleAi = useAsyncCallback(
    async (checked: boolean) => {
      await shareSetting.setEnableAi(checked);
    },
    [shareSetting]
  );

  if (!isOwner || !serverEnableAi) {
    return null;
  }

  return (
    <SettingWrapper
      title={t['com.yunke.settings.workspace.yunke-ai.title']()}
    >
      <SettingRow
        name={t['com.yunke.settings.workspace.yunke-ai.label']()}
        desc={t['com.yunke.settings.workspace.yunke-ai.description']()}
      >
        <Switch
          checked={!!workspaceEnableAi}
          onChange={toggleAi}
          disabled={loading}
        />
      </SettingRow>
    </SettingWrapper>
  );
};
