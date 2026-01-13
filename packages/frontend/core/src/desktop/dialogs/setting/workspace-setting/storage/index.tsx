import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { WorkspacePermissionService } from '@yunke/core/modules/permissions';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';

import { EnableCloudPanel } from '../preference/enable-cloud';
import { BlobManagementPanel } from './blob-management';
import { DocSizePanel } from './doc-size-panel';
import { DesktopExportPanel } from './export';
import { WorkspaceQuotaPanel } from './workspace-quota';

export const WorkspaceSettingStorage = ({
  onCloseSetting,
}: {
  onCloseSetting: () => void;
}) => {
  const t = useI18n();
  const workspace = useService(WorkspaceService).workspace;
  const workspacePermissionService = useService(
    WorkspacePermissionService
  ).permission;
  const isTeam = useLiveData(workspacePermissionService.isTeam$);
  const isOwner = useLiveData(workspacePermissionService.isOwner$);
  const isLocalWorkspace = workspace.flavour === 'local';
  const storageLocationTitle = isLocalWorkspace
    ? '保存位置：本地'
    : '保存位置：云端';
  const storageLocationDesc = isLocalWorkspace
    ? '数据写入本机存储（IndexedDB/SQLite），离线可用；可在此页启用云端同步。'
    : '数据写入云端服务器，需要联网；如需离线使用，请创建本地工作区。';

  const canExport = !isTeam || isOwner;
  return (
    <>
      <SettingHeader
        title={t['Storage']()}
        subtitle={t['com.yunke.settings.workspace.storage.subtitle']()}
      />
      <SettingWrapper>
        <SettingRow name={storageLocationTitle} desc={storageLocationDesc} />
      </SettingWrapper>
      {workspace.flavour === 'local' ? (
        <>
          <EnableCloudPanel onCloseSetting={onCloseSetting} />{' '}
          {BUILD_CONFIG.isElectron && (
            <SettingWrapper>
              <DesktopExportPanel workspace={workspace} />
            </SettingWrapper>
          )}
        </>
      ) : (
        <>
            <SettingWrapper>
              <WorkspaceQuotaPanel />
            </SettingWrapper>

          {BUILD_CONFIG.isElectron && canExport && (
            <SettingWrapper>
              <DesktopExportPanel workspace={workspace} />
            </SettingWrapper>
          )}

          <SettingWrapper>
            <BlobManagementPanel />
          </SettingWrapper>
          
          <SettingWrapper>
            <DocSizePanel />
          </SettingWrapper>
        </>
      )}
    </>
  );
};
