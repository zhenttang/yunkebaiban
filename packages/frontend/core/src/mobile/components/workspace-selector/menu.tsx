import { Divider, IconButton, Menu, MenuItem } from '@yunke/component';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import {
  RouteLogic,
  useNavigateHelper,
} from '@yunke/core/components/hooks/use-navigate-helper';
import { useWorkspaceInfo } from '@yunke/core/components/hooks/use-workspace-info';
import { WorkspaceAvatar } from '@yunke/core/components/workspace-avatar';
import {
  type AuthAccountInfo,
  AuthService,
  type Server,
  ServersService,
} from '@yunke/core/modules/cloud';
import { GlobalContextService } from '@yunke/core/modules/global-context';
import {
  type WorkspaceMetadata,
  WorkspacesService,
} from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import {
  AccountIcon,
  CloseIcon,
  CollaborationIcon,
  DeleteIcon,
  MoreHorizontalIcon,
  SelfhostIcon,
  SignOutIcon,
} from '@blocksuite/icons/rc';
import { FrameworkScope, useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import React, { type HTMLAttributes, useCallback, useMemo } from 'react';

import * as styles from './menu.css';

const WorkspaceItem = ({
  workspace,
  className,
  ...attrs
}: { workspace: WorkspaceMetadata } & HTMLAttributes<HTMLButtonElement>) => {
  const info = useWorkspaceInfo(workspace);
  const name = info?.name;
  const isOwner = info?.isOwner;

  return (
    <li className={styles.wsItem}>
      <button className={clsx(styles.wsCard, className)} {...attrs}>
        <WorkspaceAvatar
          key={workspace.id}
          meta={workspace}
          rounded={6}
          data-testid="workspace-avatar"
          size={32}
          name={name}
          colorfulFallback
        />
        <div className={styles.wsName}>{name}</div>
        {!isOwner ? <CollaborationIcon fontSize={24} /> : null}
      </button>
    </li>
  );
};

interface WorkspaceListProps {
  items: WorkspaceMetadata[];
  onClick: (workspace: WorkspaceMetadata) => void;
  onSettingClick?: (workspace: WorkspaceMetadata) => void;
  onEnableCloudClick?: (meta: WorkspaceMetadata) => void;
}
export const WorkspaceList = (props: WorkspaceListProps) => {
  const workspaceList = props.items;

  return workspaceList.map(item => (
    <WorkspaceItem
      key={item.id}
      workspace={item}
      onClick={() => props.onClick(item)}
    />
  ));
};

const CloudSignIn = ({ onClick }: { onClick: () => void }) => {
  const t = useI18n();
  return (
    <div className={styles.signInContainer}>
      <button className={styles.signInButton} onClick={onClick}>
        <div className={styles.signInIconLarge}>
          <AccountIcon />
        </div>
        <div className={styles.signInText}>{t['Sign in']()}</div>
      </button>
    </div>
  );
};

const WorkspaceServerInfo = ({
  server,
  name,
  account,
  accountStatus,
  onDeleteServer,
  onSignOut,
}: {
  server: string;
  name: string;
  account?: AuthAccountInfo | null;
  accountStatus?: 'authenticated' | 'unauthenticated';
  onDeleteServer?: () => void;
  onSignOut?: () => void;
}) => {
  const t = useI18n();
  const isCloud = server !== 'local';

  const menuItems = useMemo(
    () =>
      [
        server !== 'yunke-cloud' && server !== 'local' && (
          <MenuItem
            prefixIcon={<DeleteIcon />}
            type="danger"
            key="delete-server"
            onClick={onDeleteServer}
          >
            {t['com.yunke.server.delete']()}
          </MenuItem>
        ),
        accountStatus === 'authenticated' && (
          <MenuItem
            prefixIcon={<SignOutIcon />}
            key="sign-out"
            onClick={onSignOut}
            type="danger"
          >
            {t['Sign out']()}
          </MenuItem>
        ),
      ].filter(Boolean),
    [accountStatus, onDeleteServer, onSignOut, server, t]
  );

  return (
    <div className={styles.serverInfo}>
      <div className={styles.serverName}>{name}</div>
      {isCloud ? (
        <div className={styles.serverAccount}>
          - {account ? account.email : '未登录'}
        </div>
      ) : null}
      <div className={styles.spaceX} />
      {menuItems.length ? (
        <Menu items={menuItems}>
          <IconButton icon={<MoreHorizontalIcon />} />
        </Menu>
      ) : null}
    </div>
  );
};

const LocalWorkspaces = ({
  workspaces,
  onClickWorkspace,
  onClickWorkspaceSetting,
  onClickEnableCloud,
}: {
  workspaces: WorkspaceMetadata[];
  onClickWorkspace: (workspaceMetadata: WorkspaceMetadata) => void;
  onClickWorkspaceSetting?: (workspaceMetadata: WorkspaceMetadata) => void;
  onClickEnableCloud?: (meta: WorkspaceMetadata) => void;
}) => {
  const t = useI18n();
  if (workspaces.length === 0) {
    return null;
  }
  return (
    <>
      <WorkspaceServerInfo
        server="local"
        name={t['com.yunke.workspaceList.workspaceListType.local']()}
      />
      <WorkspaceList
        items={workspaces}
        onClick={onClickWorkspace}
        onSettingClick={onClickWorkspaceSetting}
        onEnableCloudClick={onClickEnableCloud}
      />
    </>
  );
};

const CloudWorkSpaceList = ({
  server,
  workspaces,
  onClickWorkspace,
  onClickEnableCloud,
}: {
  server: Server;
  workspaces: WorkspaceMetadata[];
  onClickWorkspace: (workspaceMetadata: WorkspaceMetadata) => void;
  onClickEnableCloud?: (meta: WorkspaceMetadata) => void;
}) => {
  const globalContextService = useService(GlobalContextService);
  const serverName = useLiveData(server.config$.selector(c => c.serverName));
  const authService = useService(AuthService);
  const serversService = useService(ServersService);
  const account = useLiveData(authService.session.account$);
  const accountStatus = useLiveData(authService.session.status$);
  const { openPage, jumpToSignIn } = useNavigateHelper();

  const currentWorkspaceFlavour = useLiveData(
    globalContextService.globalContext.workspaceFlavour.$
  );

  const handleDeleteServer = useCallback(() => {
    serversService.removeServer(server.id);

    if (currentWorkspaceFlavour === server.id) {
      const otherWorkspace = workspaces.find(w => w.flavour !== server.id);
      if (otherWorkspace) {
        openPage(otherWorkspace.id, 'all');
      }
    }
  }, [
    currentWorkspaceFlavour,
    openPage,
    server.id,
    serversService,
    workspaces,
  ]);

  const handleSignOut = useAsyncCallback(async () => {
    await authService.signOut();
  }, [authService]);

  const handleSignIn = useAsyncCallback(async () => {
    jumpToSignIn(undefined, RouteLogic.PUSH, undefined, {
      server: server.baseUrl,
    });
  }, [jumpToSignIn, server.baseUrl]);

  return (
    <>
      <WorkspaceServerInfo
        server={server.id}
        name={serverName}
        account={account}
        accountStatus={accountStatus}
        onDeleteServer={handleDeleteServer}
        onSignOut={handleSignOut}
      />
      {accountStatus === 'unauthenticated' ? (
        <CloudSignIn onClick={handleSignIn} />
      ) : (
        <WorkspaceList
          items={workspaces}
          onClick={onClickWorkspace}
          onEnableCloudClick={onClickEnableCloud}
        />
      )}
    </>
  );
};

const AddServer = () => {
  const { jumpToSignIn } = useNavigateHelper();

  const onAddServer = useCallback(() => {
    jumpToSignIn(undefined, RouteLogic.PUSH, undefined, {
      step: 'addSelfhosted',
    });
  }, [jumpToSignIn]);

  if (!BUILD_CONFIG.isNative) {
    return null;
  }

  return <IconButton onClick={onAddServer} size="24" icon={<SelfhostIcon />} />;
};

// 简化的登录页面内容组件（在yunke-cloud scope中使用）
const SimplifiedLoginContent = ({
  onSignIn,
  onClose,
  fallback,
}: {
  onSignIn: () => void;
  onClose?: () => void;
  fallback?: React.ReactNode;
}) => {
  const authService = useService(AuthService);
  const accountStatus = useLiveData(authService.session.status$);
  const isUnauthenticated = accountStatus === 'unauthenticated';

  // 只有在未登录时才显示简化登录页面
  // 如果已登录但没有工作区，显示fallback（完整页面）
  if (!isUnauthenticated) {
    return <>{fallback}</>;
  }

  return (
    <div className={styles.rootSimplified}>
      <div className={styles.closeButtonWrapper}>
        <IconButton onClick={onClose} size="24" icon={<CloseIcon />} />
      </div>
      <div className={styles.signInContent}>
        <CloudSignIn onClick={onSignIn} />
      </div>
    </div>
  );
};

export const SelectorMenu = ({ onClose }: { onClose?: () => void }) => {
  const workspacesService = useService(WorkspacesService);
  const workspaces = useLiveData(workspacesService.list.workspaces$);
  const serversService = useService(ServersService);
  const { jumpToPage, jumpToSignIn } = useNavigateHelper();

  // 🚨 关键调试：检查工作区数据和flavour值
  console.log('🔍 SelectorMenu工作区数据调试:');
  console.log('- 总工作区数量:', workspaces.length);
  workspaces.forEach((ws, index) => {
    console.log(`- 工作区${index + 1}:`, {
      id: ws.id,
      flavour: ws.flavour,
      name: ws.meta?.name || 'Unknown'
    });
  });

  const servers = useLiveData(serversService.servers$);
  console.log('🔍 服务器列表调试:', servers.map(s => ({ id: s.id, baseUrl: s.baseUrl })));
  
  const yunkeCloudServer = useMemo(
    () => servers.find(s => s.id === 'yunke-cloud') as Server,
    [servers]
  );
  const selfhostServers = useMemo(
    () => servers.filter(s => s.id !== 'yunke-cloud'),
    [servers]
  );

  const cloudWorkspaces = useMemo(
    () => {
      const filtered = workspaces.filter(
        ({ flavour }) => flavour !== 'local'
      ) as WorkspaceMetadata[];
      console.log('🔍 云端工作区过滤结果:', filtered.length, '个');
      return filtered;
    },
    [workspaces]
  );

  const localWorkspaces = useMemo(
    () => {
      const filtered = workspaces.filter(
        ({ flavour }) => flavour === 'local'
      ) as WorkspaceMetadata[];
      console.log('🔍 本地工作区过滤结果:', filtered.length, '个');
      return filtered;
    },
    [workspaces]
  );

  const handleClickWorkspace = useCallback(
    (workspaceMetadata: WorkspaceMetadata) => {
      const id = workspaceMetadata.id;
      jumpToPage(id, 'home');
      onClose?.();
    },
    [onClose, jumpToPage]
  );

  // 检查是否有工作区
  const hasWorkspaces = workspaces.length > 0;

  // 处理登录
  const handleSignIn = useAsyncCallback(async () => {
    if (yunkeCloudServer) {
      jumpToSignIn(undefined, RouteLogic.PUSH, undefined, {
        server: yunkeCloudServer.baseUrl,
      });
    }
  }, [jumpToSignIn, yunkeCloudServer]);

  // 如果未登录且没有工作区，显示简化的登录页面
  // 需要在yunke-cloud scope中检查登录状态
  if (!hasWorkspaces && yunkeCloudServer) {
    return (
      <FrameworkScope scope={yunkeCloudServer.scope}>
        <SimplifiedLoginContent
          onSignIn={handleSignIn}
          onClose={onClose}
          fallback={
            // 如果已登录但没有工作区，显示完整页面
            <div className={styles.root}>
              <header className={styles.head}>
                工作区
                <div className={styles.headActions}>
                  <AddServer />
                  <IconButton onClick={onClose} size="24" icon={<CloseIcon />} />
                </div>
              </header>
              <div className={styles.divider} />
              <main className={styles.body}>
                <FrameworkScope
                  key={yunkeCloudServer.id}
                  scope={yunkeCloudServer.scope}
                >
                  <CloudWorkSpaceList
                    server={yunkeCloudServer}
                    workspaces={cloudWorkspaces.filter(
                      ({ flavour }) => flavour === yunkeCloudServer.id
                    )}
                    onClickWorkspace={handleClickWorkspace}
                  />
                </FrameworkScope>
              </main>
            </div>
          }
        />
      </FrameworkScope>
    );
  }

  // 原有的完整页面（已登录或有工作区时）
  return (
    <div className={styles.root}>
      <header className={styles.head}>
        工作区
        <div className={styles.headActions}>
          <AddServer />
          <IconButton onClick={onClose} size="24" icon={<CloseIcon />} />
        </div>
      </header>
      <div className={styles.divider} />
      <main className={styles.body}>
        {/* 1. yunke-cloud  */}
        <FrameworkScope
          key={yunkeCloudServer.id}
          scope={yunkeCloudServer.scope}
        >
          <CloudWorkSpaceList
            server={yunkeCloudServer}
            workspaces={cloudWorkspaces.filter(
              ({ flavour }) => flavour === yunkeCloudServer.id
            )}
            onClickWorkspace={handleClickWorkspace}
          />
        </FrameworkScope>
        {(localWorkspaces.length > 0 || selfhostServers.length > 0) && (
          <Divider size="thinner" />
        )}
        <LocalWorkspaces
          workspaces={localWorkspaces}
          onClickWorkspace={handleClickWorkspace}
        />
        {selfhostServers.length > 0 && <Divider size="thinner" />}

        {/* 3. selfhost */}
        {selfhostServers.map((server, index) => (
          <FrameworkScope key={server.id} scope={server.scope}>
            <CloudWorkSpaceList
              server={server}
              workspaces={cloudWorkspaces.filter(
                ({ flavour }) => flavour === server.id
              )}
              onClickWorkspace={handleClickWorkspace}
            />
            {index !== selfhostServers.length - 1 && <Divider size="thinner" />}
          </FrameworkScope>
        ))}
      </main>
    </div>
  );
};
