import { ScrollableContainer } from '@yunke/component';
import { MenuItem } from '@yunke/component/ui/menu';
import { AuthService } from '@yunke/core/modules/cloud';
import { GlobalDialogService, WorkspaceDialogService } from '@yunke/core/modules/dialogs';
import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { type WorkspaceMetadata } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { CloudWorkspaceIcon, Logo1Icon, SettingsIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { AddWorkspace } from './add-workspace';
import * as addWorkspaceStyles from './add-workspace/index.css';
import * as styles from './index.css';
import { YUNKEWorkspaceList } from './workspace-list';

export const SignInItem = () => {
  const globalDialogService = useService(GlobalDialogService);

  const t = useI18n();

  const onClickSignIn = useCallback(() => {
    track.$.navigationPanel.workspaceList.requestSignIn();
    globalDialogService.open('sign-in', {});
  }, [globalDialogService]);

  return (
    <MenuItem
      className={styles.menuItem}
      onClick={onClickSignIn}
      data-testid="cloud-signin-button"
    >
      <div className={styles.signInWrapper}>
        <div className={styles.iconContainer}>
          <Logo1Icon />
        </div>

        <div className={styles.signInTextContainer}>
          <div className={styles.signInTextPrimary}>
            {t['com.yunke.workspace.cloud.auth']()}
          </div>
          <div className={styles.signInTextSecondary}>
            {t['com.yunke.workspace.cloud.description']()}
          </div>
        </div>
      </div>
    </MenuItem>
  );
};

interface UserWithWorkspaceListProps {
  onEventEnd?: () => void;
  onClickWorkspace?: (workspace: WorkspaceMetadata) => void;
  onCreatedWorkspace?: (payload: {
    metadata: WorkspaceMetadata;
    defaultDocId?: string;
  }) => void;
  showEnableCloudButton?: boolean;
}

export const UserWithWorkspaceList = ({
  onEventEnd,
  onClickWorkspace,
  onCreatedWorkspace,
  showEnableCloudButton,
}: UserWithWorkspaceListProps) => {
  const globalDialogService = useService(GlobalDialogService);
  const workspaceDialogService = useService(WorkspaceDialogService);
  const session = useLiveData(useService(AuthService).session.session$);
  const featureFlagService = useService(FeatureFlagService);
  const t = useI18n();

  const isAuthenticated = session.status === 'authenticated';

  const openSignInModal = useCallback(() => {
    globalDialogService.open('sign-in', {});
  }, [globalDialogService]);

  const onNewWorkspace = useCallback(() => {
    if (
      !isAuthenticated &&
      !featureFlagService?.flags?.enable_local_workspace?.value
    ) {
      return openSignInModal();
    }
    track.$.navigationPanel.workspaceList.createWorkspace();
    globalDialogService.open('create-workspace', {}, payload => {
      if (payload) {
        onCreatedWorkspace?.(payload);
      }
    });
    onEventEnd?.();
  }, [
    globalDialogService,
    featureFlagService,
    isAuthenticated,
    onCreatedWorkspace,
    onEventEnd,
    openSignInModal,
  ]);

  const onAddWorkspace = useCallback(() => {
    track.$.navigationPanel.workspaceList.createWorkspace({
      control: 'import',
    });
    globalDialogService.open('import-workspace', undefined, payload => {
      if (payload) {
        onCreatedWorkspace?.({ metadata: payload.workspace });
      }
    });
    onEventEnd?.();
  }, [globalDialogService, onCreatedWorkspace, onEventEnd]);

  const onOpenSettings = useCallback(() => {
    track.$.navigationPanel.$.openSettings();
    workspaceDialogService.open('setting', {
      activeTab: BUILD_CONFIG.isElectron ? 'offline' : 'appearance',
    });
    onEventEnd?.();
  }, [onEventEnd, workspaceDialogService]);

  const onSignInCloud = useCallback(() => {
    track.$.navigationPanel.workspaceList.requestSignIn();
    globalDialogService.open('sign-in', {});
    onEventEnd?.();
  }, [globalDialogService, onEventEnd]);

  return (
    <>
      <ScrollableContainer
        className={styles.workspaceScrollArea}
        viewPortClassName={styles.workspaceScrollAreaViewport}
        scrollBarClassName={styles.scrollbar}
        scrollThumbClassName={styles.scrollbarThumb}
      >
        <YUNKEWorkspaceList
          onEventEnd={onEventEnd}
          onClickWorkspace={onClickWorkspace}
          showEnableCloudButton={showEnableCloudButton}
        />
      </ScrollableContainer>
      <div className={styles.workspaceFooter}>
        <AddWorkspace
          onAddWorkspace={onAddWorkspace}
          onNewWorkspace={onNewWorkspace}
        />
        {/* 未登录时显示登录云端按钮 */}
        {!isAuthenticated && (
          <MenuItem
            block={true}
            prefixIcon={<CloudWorkspaceIcon />}
            prefixIconClassName={addWorkspaceStyles.prefixIcon}
            onClick={onSignInCloud}
            data-testid="workspace-list-sign-in-cloud"
            className={addWorkspaceStyles.ItemContainer}
          >
            <div className={addWorkspaceStyles.ItemText}>
              {t['com.yunke.workspace.cloud.auth']?.() ?? '登录云端'}
            </div>
          </MenuItem>
        )}
        <MenuItem
          block={true}
          prefixIcon={<SettingsIcon />}
          prefixIconClassName={addWorkspaceStyles.prefixIcon}
          onClick={onOpenSettings}
          data-testid="workspace-list-open-settings"
          className={addWorkspaceStyles.ItemContainer}
        >
          <div className={addWorkspaceStyles.ItemText}>
            {t['com.yunke.settingSidebar.title']?.() ?? '设置'}
          </div>
        </MenuItem>
      </div>
    </>
  );
};
