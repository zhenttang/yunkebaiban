import { Switch } from '@yunke/component';
import {
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { WorkspacePermissionService } from '@yunke/core/modules/permissions';
import { WorkspaceShareSettingService } from '@yunke/core/modules/share-setting';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';

export const SharingPanel = () => {
  const workspace = useService(WorkspaceService).workspace;
  if (workspace.flavour === 'local') {
    return null;
  }
  return <Sharing />;
};

export const Sharing = () => {
  const t = useI18n();
  const shareSetting = useService(WorkspaceShareSettingService).sharePreview;
  const enableUrlPreview = useLiveData(shareSetting.enableUrlPreview$);
  const loading = useLiveData(shareSetting.isLoading$);
  const permissionService = useService(WorkspacePermissionService);
  const isOwner = useLiveData(permissionService.permission.isOwner$);

  const handleCheck = useAsyncCallback(
    async (checked: boolean) => {
      await shareSetting.setEnableUrlPreview(checked);
    },
    [shareSetting]
  );

  if (!isOwner) {
    return null;
  }

  return (
    <SettingWrapper title={t['com.yunke.settings.workspace.sharing.title']()}>
      <SettingRow
        name={t['com.yunke.settings.workspace.sharing.url-preview.title']()}
        desc={t[
          'com.yunke.settings.workspace.sharing.url-preview.description'
        ]()}
      >
        <Switch
          checked={enableUrlPreview || false}
          onChange={handleCheck}
          disabled={loading}
        />
      </SettingRow>
    </SettingWrapper>
  );
};
