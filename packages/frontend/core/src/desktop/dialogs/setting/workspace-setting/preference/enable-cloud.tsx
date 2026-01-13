import { SettingRow } from '@yunke/component/setting-components';
import { Button } from '@yunke/component/ui/button';
import { useEnableCloud } from '@yunke/core/components/hooks/yunke/use-enable-cloud';
import {
  type Workspace,
  WorkspaceService,
} from '@yunke/core/modules/workspace';
import { UNTITLED_WORKSPACE_NAME } from '@yunke/env/constant';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import * as style from './style.css';

export interface PublishPanelProps {
  workspace: Workspace | null;
}

export const EnableCloudPanel = ({
  onCloseSetting,
}: {
  onCloseSetting?: () => void;
}) => {
  const t = useI18n();
  const confirmEnableCloud = useEnableCloud();

  const workspace = useService(WorkspaceService).workspace;
  const name = useLiveData(workspace.name$);
  const flavour = workspace.flavour;

  const confirmEnableCloudAndClose = useCallback(() => {
    if (!workspace) return;
    confirmEnableCloud(workspace, {
      onSuccess: () => {
        onCloseSetting?.();
      },
    });
  }, [confirmEnableCloud, onCloseSetting, workspace]);

  if (flavour !== 'local') {
    return null;
  }

  return (
    <SettingRow
      name={t['Workspace saved locally']({
        name: name ?? UNTITLED_WORKSPACE_NAME,
      })}
      desc={t['Enable cloud hint']()}
      spreadCol={false}
      className={style.enableCloudRow}
    >
      <Button
        data-testid="publish-enable-yunke-cloud-button"
        variant="primary"
        onClick={confirmEnableCloudAndClose}
        style={{ alignSelf: 'flex-start' }}
      >
        {t['Enable YUNKE Cloud']()}
      </Button>
    </SettingRow>
  );
};
