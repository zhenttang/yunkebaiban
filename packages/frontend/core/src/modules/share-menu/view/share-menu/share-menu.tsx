import { Tabs, Tooltip, useConfirmModal } from '@yunke/component';
import { Button } from '@yunke/component/ui/button';
import { Menu } from '@yunke/component/ui/menu';
import { ServerService } from '@yunke/core/modules/cloud';
import { WorkspaceDialogService } from '@yunke/core/modules/dialogs';
import { WorkspacePermissionService } from '@yunke/core/modules/permissions';
import { WorkspaceQuotaService } from '@yunke/core/modules/quota';
import { ShareInfoService } from '@yunke/core/modules/share-doc';
import type { WorkspaceMetadata } from '@yunke/core/modules/workspace';
// import { ServerDeploymentType, SubscriptionPlan } from '@yunke/graphql';
import { ServerDeploymentType } from '../../../cloud/types';

// Temporary placeholder enum since GraphQL backend removed
enum SubscriptionPlan {
  Free = 'free',
  Pro = 'pro',
  Team = 'team',
}
import { useI18n } from '@yunke/i18n';
import type { Store } from '@blocksuite/yunke/store';
import { LockIcon, PublishIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import {
  forwardRef,
  type PropsWithChildren,
  type Ref,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as styles from './index.css';
import { InviteMemberEditor } from './invite-member-editor/invite-member-editor';
import { MemberManagement } from './member-management';
import { ShareCommunity } from './share-community';
import { ShareExport } from './share-export';
import { SharePage } from './share-page';

export interface ShareMenuProps extends PropsWithChildren {
  workspaceMetadata: WorkspaceMetadata;
  currentPage: Store;
  onEnableYunkeCloud: () => void;
  onOpenShareModal?: (open: boolean) => void;
  openPaywallModal?: () => void;
  hittingPaywall?: boolean;
}

export enum ShareMenuTab {
  Share = 'share',
  Export = 'export',
  Community = 'community',
  Invite = 'invite',
  Members = 'members',
}

export const ShareMenuContent = (props: ShareMenuProps) => {
  const t = useI18n();
  const [currentTab, setCurrentTab] = useState(ShareMenuTab.Share);

  const serverService = useService(ServerService);
  const isSelfhosted = useLiveData(
    serverService.server.config$.selector(
      c => c.type === ServerDeploymentType.Selfhosted
    )
  );
  const workspaceQuotaService = useService(WorkspaceQuotaService);
  const quota = useLiveData(workspaceQuotaService.quota.quota$);
  const hittingPaywall = useMemo(() => {
    if (isSelfhosted) {
      return false;
    }
    if (quota) {
      const planName = quota.humanReadable?.name;
      return planName?.toLowerCase() === SubscriptionPlan.Free.toLowerCase();
    }
    return true;
  }, [isSelfhosted, quota]);

  const permissionService = useService(WorkspacePermissionService);
  const isOwner = useLiveData(permissionService.permission.isOwner$);

  const workspaceDialogService = useService(WorkspaceDialogService);

  const onValueChange = useCallback((value: string) => {
    setCurrentTab(value as ShareMenuTab);
  }, []);

  useEffect(() => {
    workspaceQuotaService.quota.revalidate();
  }, [workspaceQuotaService]);

  const { openConfirmModal } = useConfirmModal();

  const onConfirm = useCallback(() => {
    if (!isOwner) {
      return;
    }
    workspaceDialogService.open('setting', {
      activeTab: 'plans',
      scrollAnchor: 'cloudPricingPlan',
    });
    return;
  }, [isOwner, workspaceDialogService]);

  const openPaywallModal = useCallback(() => {
    openConfirmModal({
      title:
        t[
          `com.yunke.share-menu.paywall.${isOwner ? 'owner' : 'member'}.title`
        ](),
      description:
        t[
          `com.yunke.share-menu.paywall.${isOwner ? 'owner' : 'member'}.description`
        ](),
      confirmText:
        t[
          `com.yunke.share-menu.paywall.${isOwner ? 'owner' : 'member'}.confirm`
        ](),
      onConfirm: onConfirm,
      cancelText: t['com.yunke.confirmModal.button.cancel']() || '取消',
      cancelButtonOptions: {
        style: {
          visibility: isOwner ? 'visible' : 'hidden',
        },
      },
      confirmButtonOptions: {
        variant: isOwner ? 'primary' : 'custom',
      },
    });
  }, [isOwner, onConfirm, openConfirmModal, t]);

  if (currentTab === ShareMenuTab.Members) {
    return (
      <MemberManagement
        openPaywallModal={openPaywallModal}
        hittingPaywall={!!hittingPaywall}
        onClickBack={() => {
          setCurrentTab(ShareMenuTab.Share);
        }}
        onClickInvite={() => {
          setCurrentTab(ShareMenuTab.Invite);
        }}
      />
    );
  }
  if (currentTab === ShareMenuTab.Invite) {
    return (
      <InviteMemberEditor
        openPaywallModal={openPaywallModal}
        hittingPaywall={!!hittingPaywall}
        onClickCancel={() => {
          setCurrentTab(ShareMenuTab.Share);
        }}
      />
    );
  }
  return (
    <div className={styles.containerStyle}>
      <Tabs.Root
        defaultValue={ShareMenuTab.Share}
        value={currentTab}
        onValueChange={onValueChange}
      >
        <Tabs.List className={styles.tabList}>
          <Tabs.Trigger value={ShareMenuTab.Share} className={styles.tab}>
            {t['com.yunke.share-menu.shareButton']()}
          </Tabs.Trigger>
          <Tabs.Trigger
            value={ShareMenuTab.Export}
            className={styles.tab}
            style={{
              display: BUILD_CONFIG.isMobileEdition ? 'none' : undefined,
            }}
          >
            {t['com.yunke.share-menu.tab.export']() || '导出'}
          </Tabs.Trigger>
          <Tabs.Trigger
            value={ShareMenuTab.Community}
            className={styles.tab}
            style={{
              display: BUILD_CONFIG.isMobileEdition ? 'none' : undefined,
            }}
          >
            社区
          </Tabs.Trigger>
          <Tabs.Trigger value={ShareMenuTab.Invite} style={{ display: 'none' }}>
            邀请
          </Tabs.Trigger>
          <Tabs.Trigger
            value={ShareMenuTab.Members}
            style={{ display: 'none' }}
          >
            成员
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value={ShareMenuTab.Share}>
          <SharePage
            hittingPaywall={!!hittingPaywall}
            openPaywallModal={openPaywallModal}
            onClickInvite={() => {
              setCurrentTab(ShareMenuTab.Invite);
            }}
            onClickMembers={() => {
              setCurrentTab(ShareMenuTab.Members);
            }}
            {...props}
          />
        </Tabs.Content>
        <Tabs.Content value={ShareMenuTab.Export}>
          <ShareExport />
        </Tabs.Content>
        <Tabs.Content value={ShareMenuTab.Community}>
          <ShareCommunity />
        </Tabs.Content>
        <Tabs.Content value={ShareMenuTab.Invite}>
          <div>null</div>
        </Tabs.Content>
        <Tabs.Content value={ShareMenuTab.Members}>
          <div>null</div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

const DefaultShareButton = forwardRef(function DefaultShareButton(
  _,
  ref: Ref<HTMLButtonElement>
) {
  const t = useI18n();
  const shareInfoService = useService(ShareInfoService);
  const shared = useLiveData(shareInfoService.shareInfo.isShared$);

  useEffect(() => {
    shareInfoService.shareInfo.revalidate();
  }, [shareInfoService]);

  return (
    <Tooltip
      content={
        shared
          ? t['com.yunke.share-menu.option.link.readonly.description']()
          : t['com.yunke.share-menu.option.link.no-access.description']()
      }
    >
      <Button ref={ref} className={styles.button} variant="primary">
        <div className={styles.buttonContainer}>
          {shared ? <PublishIcon fontSize={16} /> : <LockIcon fontSize={16} />}
          {t['com.yunke.share-menu.shareButton']()}
        </div>
      </Button>
    </Tooltip>
  );
});

const LocalShareMenu = (props: ShareMenuProps) => {
  const handleOpenChange = useCallback((open: boolean) => {
    props.onOpenShareModal?.(open);
  }, [props]);

  return (
    <Menu
      items={<ShareMenuContent {...props} />}
      contentOptions={{
        className: styles.localMenuStyle,
        ['data-testid' as string]: 'local-share-menu',
        align: 'end',
      }}
      rootOptions={{
        modal: false,
        onOpenChange: handleOpenChange,
      }}
      noPortal={false}
      portalOptions={{
        // 确保Portal不会导致遮罩层问题
      }}
    >
      <div data-testid="local-share-menu-button">
        {props.children || <DefaultShareButton />}
      </div>
    </Menu>
  );
};

const CloudShareMenu = (props: ShareMenuProps) => {
  const handleOpenChange = useCallback((open: boolean) => {
    props.onOpenShareModal?.(open);
  }, [props]);

  return (
    <Menu
      items={<ShareMenuContent {...props} />}
      contentOptions={{
        className: styles.menuStyle,
        ['data-testid' as string]: 'cloud-share-menu',
        align: 'end',
      }}
      rootOptions={{
        modal: false,
        onOpenChange: handleOpenChange,
      }}
      noPortal={false}
      portalOptions={{
        // 确保Portal不会导致遮罩层问题
      }}
    >
      <div data-testid="cloud-share-menu-button">
        {props.children || <DefaultShareButton />}
      </div>
    </Menu>
  );
};

export const ShareMenu = (props: ShareMenuProps) => {
  const { workspaceMetadata } = props;

  if (workspaceMetadata.flavour === 'local') {
    return <LocalShareMenu {...props} />;
  }
  return <CloudShareMenu {...props} />;
};
