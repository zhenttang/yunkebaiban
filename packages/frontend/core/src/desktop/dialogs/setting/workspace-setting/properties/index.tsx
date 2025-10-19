import { Button, Menu } from '@yunke/component';
import { SettingHeader } from '@yunke/component/setting-components';
import { useWorkspaceInfo } from '@yunke/core/components/hooks/use-workspace-info';
import { WorkspacePropertyManager } from '@yunke/core/components/properties/manager';
import { CreatePropertyMenuItems } from '@yunke/core/components/properties/menu/create-doc-property';
import type { DocCustomPropertyInfo } from '@yunke/core/modules/db';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { Trans, useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import { FrameworkScope, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import * as styles from './styles.css';

const WorkspaceSettingPropertiesMain = () => {
  const t = useI18n();

  const onCreated = useCallback((property: DocCustomPropertyInfo) => {
    track.$.settingsPanel.workspace.addProperty({
      type: property.type,
      control: 'at menu',
    });
  }, []);

  const onPropertyInfoChange = useCallback(
    (property: DocCustomPropertyInfo, field: string) => {
      track.$.settingsPanel.workspace.editPropertyMeta({
        type: property.type,
        field,
      });
    },
    []
  );

  return (
    <div className={styles.main}>
      <div className={styles.listHeader}>
        <Menu items={<CreatePropertyMenuItems onCreated={onCreated} />}>
          <Button variant="primary">
            {t['com.affine.settings.workspace.properties.add_property']()}
          </Button>
        </Menu>
      </div>
      <WorkspacePropertyManager onPropertyInfoChange={onPropertyInfoChange} />
    </div>
  );
};

export const WorkspaceSettingProperties = () => {
  const t = useI18n();
  const workspace = useService(WorkspaceService).workspace;
  const workspaceInfo = useWorkspaceInfo(workspace);
  const title = workspaceInfo?.name || '未命名';

  if (workspace === null) {
    return null;
  }

  return (
    <FrameworkScope scope={workspace.scope}>
      <SettingHeader
        title={t['com.affine.settings.workspace.properties.header.title']()}
        subtitle={
          <Trans
            values={{
              name: title,
            }}
            i18nKey="com.affine.settings.workspace.properties.header.subtitle"
          >
            管理工作区 <strong>name</strong> 属性
          </Trans>
        }
      />
      <WorkspaceSettingPropertiesMain />
    </FrameworkScope>
  );
};
