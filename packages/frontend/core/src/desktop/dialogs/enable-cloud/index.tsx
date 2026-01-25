import { Button, Modal, notify } from '@yunke/component';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { ServerSelector } from '@yunke/core/components/server-selector';
import {
  AuthService,
  type Server,
  ServersService,
} from '@yunke/core/modules/cloud';
import { CLOUD_ENABLED_KEY } from '@yunke/core/modules/cloud/constant';
import {
  type DialogComponentProps,
  type GLOBAL_DIALOG_SCHEMA,
  GlobalDialogService,
} from '@yunke/core/modules/dialogs';
import { GlobalStateService } from '@yunke/core/modules/storage/services/global';
import { WorkspacesService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { CloudWorkspaceIcon } from '@blocksuite/icons/rc';
import { FrameworkScope, useLiveData, useService } from '@toeverything/infra';
import { useCallback, useState } from 'react';

import * as styles from './dialog.css';

const Dialog = ({
  workspaceId,
  close,
  selectedServer,
  setSelectedServer,
  serverList,
  openPageId,
}: {
  workspaceId: string;
  serverList: Server[];
  selectedServer: Server;
  setSelectedServer: (server: Server) => void;
  openPageId?: string;
  serverId?: string;
  close?: () => void;
}) => {
  const t = useI18n();
  const authService = useService(AuthService);
  const account = useLiveData(authService.session.account$);
  const loginStatus = useLiveData(useService(AuthService).session.status$);
  const globalDialogService = useService(GlobalDialogService);
  const globalStateService = useService(GlobalStateService);
  const workspacesService = useService(WorkspacesService);
  const workspaceMeta = useLiveData(
    workspacesService.list.workspace$(workspaceId)
  );
  const { workspace } = workspaceMeta
    ? workspacesService.open({ metadata: workspaceMeta })
    : { workspace: undefined };

  const { jumpToPage } = useNavigateHelper();

  const enableCloud = useCallback(async () => {
    try {
      if (!workspace) return;
      if (!account) return;

      globalStateService.globalState.set(CLOUD_ENABLED_KEY, true);
      const { id: newId } = await workspacesService.transformLocalToCloud(
        workspace,
        account.id,
        selectedServer.id
      );
      jumpToPage(newId, openPageId || 'all');
      close?.();
    } catch (e) {
      console.error(e);
      notify.error({
        title: t['com.yunke.workspace.enable-cloud.failed'](),
      });
    }
  }, [
    workspace,
    account,
    workspacesService,
    selectedServer.id,
    jumpToPage,
    openPageId,
    close,
    t,
    globalStateService,
  ]);

  const openSignIn = useCallback(() => {
    globalDialogService.open('sign-in', {
      server: selectedServer.baseUrl,
    });
  }, [globalDialogService, selectedServer.baseUrl]);

  const signInOrEnableCloud = useAsyncCallback(async () => {
    // not logged in, open login modal
    if (loginStatus === 'unauthenticated') {
      openSignIn();
    }

    if (loginStatus === 'authenticated') {
      await enableCloud();
    }
  }, [enableCloud, loginStatus, openSignIn]);
  return (
    <div className={styles.root}>
      <CloudWorkspaceIcon width={'36px'} height={'36px'} />
      <div className={styles.textContainer}>
        <div className={styles.title}>
          {t['com.yunke.enableYunkeCloudModal.custom-server.title']({
            workspaceName: workspace?.name$.value || '未命名',
          })}
        </div>
        <div className={styles.description}>
          {t['com.yunke.enableYunkeCloudModal.custom-server.description']()}
        </div>
      </div>
      <div className={styles.serverSelector}>
        <ServerSelector
          servers={serverList}
          selectedSeverName={`${selectedServer.config$.value.serverName} (${selectedServer.baseUrl})`}
          onSelect={setSelectedServer}
        />
      </div>

      <Button
        className={styles.button}
        onClick={signInOrEnableCloud}
        size="extraLarge"
        variant="primary"
      >
        {t['com.yunke.enableYunkeCloudModal.custom-server.enable']()}
      </Button>
    </div>
  );
};

export const EnableCloudDialog = ({
  workspaceId,
  openPageId,
  serverId,
  close,
}: DialogComponentProps<GLOBAL_DIALOG_SCHEMA['enable-cloud']>) => {
  const serversService = useService(ServersService);
  const serverList = useLiveData(serversService.servers$);
  const [selectedServer, setSelectedServer] = useState<Server>(serverList[0]);

  return (
    <Modal
      open
      modal={true}
      persistent
      contentOptions={{
        className: styles.modal,
      }}
      onOpenChange={() => close()}
    >
      <FrameworkScope key={selectedServer.id} scope={selectedServer.scope}>
        <Dialog
          workspaceId={workspaceId}
          openPageId={openPageId}
          serverId={serverId}
          close={close}
          serverList={serverList}
          selectedServer={selectedServer}
          setSelectedServer={setSelectedServer}
        />
      </FrameworkScope>
    </Modal>
  );
};
