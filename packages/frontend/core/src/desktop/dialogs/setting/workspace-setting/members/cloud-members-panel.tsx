import { Button, Loading, notify, useConfirmModal } from '@yunke/component';
import {
  InviteTeamMemberModal,
  type InviteTeamMemberModalProps,
  MemberLimitModal,
} from '@yunke/component/member-components';
import { SettingRow } from '@yunke/component/setting-components';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { Upload } from '@yunke/core/components/pure/file-upload';
import {
  ServerService,
  SubscriptionService,
  WorkspaceSubscriptionService,
} from '@yunke/core/modules/cloud';
import {
  WorkspaceMembersService,
  WorkspacePermissionService,
} from '@yunke/core/modules/permissions';
import { WorkspaceQuotaService } from '@yunke/core/modules/quota';
import { WorkspaceShareSettingService } from '@yunke/core/modules/share-setting';
import { copyTextToClipboard } from '@yunke/core/utils/clipboard';
import { emailRegex } from '@yunke/core/utils/email-regex';
import { UserFriendlyError } from '@yunke/error';
// import type { WorkspaceInviteLinkExpireTime } from '@yunke/graphql';
type WorkspaceInviteLinkExpireTime = 'ONE_HOUR' | 'ONE_DAY' | 'ONE_WEEK' | 'NEVER';
// import { ServerDeploymentType, SubscriptionPlan } from '@yunke/graphql';
import { ServerDeploymentType } from '../../../../../modules/cloud/types';
import { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { ExportIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { SettingState } from '../../types';
import { MemberList } from './member-list';
import * as styles from './styles.css';

const parseCSV = async (blob: Blob): Promise<string[]> => {
  try {
    const textContent = await blob.text();
    const emails = textContent
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0 && emailRegex.test(email));

    return emails;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('解析 CSV 文件失败');
  }
};

export const CloudWorkspaceMembersPanel = ({
  onChangeSettingState,
  isTeam,
}: {
  onChangeSettingState: (settingState: SettingState) => void;
  isTeam?: boolean;
}) => {
  const workspaceShareSettingService = useService(WorkspaceShareSettingService);
  const subscription = useService(WorkspaceSubscriptionService).subscription;
  const workspaceSubscription = useLiveData(subscription.subscription$);
  const inviteLink = useLiveData(
    workspaceShareSettingService.sharePreview.inviteLink$
  );
  const serverService = useService(ServerService);
  const hasPaymentFeature = useLiveData(
    serverService.server.features$.map(f => f?.payment)
  );
  const isSelfhosted = useLiveData(
    serverService.server.config$.selector(
      c => c.type === ServerDeploymentType.Selfhosted
    )
  );
  const membersService = useService(WorkspaceMembersService);
  const permissionService = useService(WorkspacePermissionService);

  const isOwner = useLiveData(permissionService.permission.isOwner$);
  const isAdmin = useLiveData(permissionService.permission.isAdmin$);
  const isOwnerOrAdmin = isOwner || isAdmin;
  useEffect(() => {
    permissionService.permission.revalidate();
  }, [permissionService]);

  useEffect(() => {
    membersService.members.revalidate();
  }, [membersService]);

  const workspaceQuotaService = useService(WorkspaceQuotaService);
  useEffect(() => {
    workspaceQuotaService.quota.revalidate();
  }, [workspaceQuotaService]);
  const isLoading = useLiveData(workspaceQuotaService.quota.isRevalidating$);
  const error = useLiveData(workspaceQuotaService.quota.error$);
  const workspaceQuota = useLiveData(workspaceQuotaService.quota.quota$);
  const subscriptionService = useService(SubscriptionService);
  const plan = useLiveData(
    subscriptionService.subscription.pro$.map(s => s?.plan)
  );

  const t = useI18n();

  const [openInvite, setOpenInvite] = useState(false);
  const [openMemberLimit, setOpenMemberLimit] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const { openConfirmModal, closeConfirmModal } = useConfirmModal();
  const goToTeamBilling = useCallback(() => {
    onChangeSettingState({
      activeTab: isSelfhosted ? 'workspace:license' : 'workspace:billing',
    });
  }, [isSelfhosted, onChangeSettingState]);
  const [idempotencyKey, setIdempotencyKey] = useState(nanoid());
  const resume = useAsyncCallback(async () => {
    try {
      setIsMutating(true);
      await subscription.resumeSubscription(
        idempotencyKey,
        SubscriptionPlan.Team
      );
      await subscription.waitForRevalidation();
      // refresh idempotency key
      setIdempotencyKey(nanoid());
      closeConfirmModal();
      notify.success({
        title: t['com.yunke.payment.resume.success.title'](),
        message: t['com.yunke.payment.resume.success.team.message'](),
      });
    } catch (err) {
      const error = UserFriendlyError.fromAny(err);
      notify.error({
        title: error.name,
        message: error.message,
      });
    } finally {
      setIsMutating(false);
    }
  }, [subscription, idempotencyKey, closeConfirmModal, t]);
  const openInviteModal = useCallback(() => {
    if (isTeam && workspaceSubscription?.canceledAt) {
      openConfirmModal({
        title: t['com.yunke.payment.member.team.retry-payment.title'](),
        description:
          t[
            `com.yunke.payment.member.team.disabled-subscription.${isOwner ? 'owner' : 'admin'}.description`
          ](),
        confirmText:
          t[
            isOwner
              ? 'com.yunke.payment.member.team.disabled-subscription.resume-subscription'
              : '知道了'
          ](),
        cancelText: t['com.yunke.confirmModal.button.cancel'](),
        cancelButtonOptions: {
          style: {
            visibility: isOwner ? 'visible' : 'hidden',
          },
        },
        onConfirm: isOwner ? resume : undefined,
        confirmButtonOptions: {
          variant: 'primary',
          loading: isMutating,
        },
      });

      return;
    }
    setOpenInvite(true);
  }, [
    isMutating,
    isOwner,
    isTeam,
    openConfirmModal,
    resume,
    t,
    workspaceSubscription?.canceledAt,
  ]);

  const onGenerateInviteLink = useCallback(
    async (expireTime: WorkspaceInviteLinkExpireTime) => {
      const result: any = await membersService.generateInviteLink(expireTime);

      // 兼容多种返回格式:
      // 1) { success: true, inviteLink: { link: '/invite/xxx', expiresAt: '...' } }
      // 2) { success: true, inviteLink: '/invite/xxx' }
      // 3) 直接返回字符串 '/invite/xxx'
      const rawInvite = result?.inviteLink ?? result;
      const rawLink =
        (typeof rawInvite === 'string' && rawInvite) ||
        rawInvite?.link ||
        '';

      if (!rawLink) {
        throw new Error('生成邀请链接失败：后端未返回链接');
      }

      const origin =
        typeof window !== 'undefined' && window.location
          ? window.location.origin
          : '';
      const fullLink = rawLink.startsWith('http')
        ? rawLink
        : `${origin}${rawLink}`;

      const expireTimeRaw: string | undefined =
        rawInvite?.expireTime || rawInvite?.expiresAt;

      // 更新本地 sharePreview 状态，驱动 UI 显示实际邀请链接
      workspaceShareSettingService.sharePreview.inviteLink$.setValue({
        link: fullLink,
        expireTime: expireTimeRaw,
      } as any);

      return fullLink;
    },
    [membersService, workspaceShareSettingService.sharePreview]
  );

  const onRevokeInviteLink = useCallback(async () => {
    const success = await membersService.revokeInviteLink();

    if (success) {
      // 本地清空邀请链接状态
      workspaceShareSettingService.sharePreview.inviteLink$.setValue(null);
    }

    return success;
  }, [membersService, workspaceShareSettingService.sharePreview]);

  const onInviteBatchConfirm = useAsyncCallback(
    async ({
      emails,
    }: Parameters<InviteTeamMemberModalProps['onConfirm']>[0]) => {
      setIsMutating(true);
      const uniqueEmails = deduplicateEmails(emails);
      if (
        !isTeam &&
        workspaceQuota &&
        uniqueEmails.length >
          (workspaceQuota.memberLimit ?? 10) - (workspaceQuota.memberCount ?? 0)
      ) {
        setOpenMemberLimit(true);
        setIsMutating(false);
        return;
      }
      const results = await membersService.inviteMembers(uniqueEmails);
      const unSuccessInvites = results.reduce<string[]>((acc, result) => {
        if (!result.sentSuccess) {
          acc.push(result.email);
        }
        return acc;
      }, []);
      if (results) {
        notify({
          title: t['com.yunke.payment.member.team.invite.notify.title']({
            successCount: (
              uniqueEmails.length - unSuccessInvites.length
            ).toString(),
            failedCount: unSuccessInvites.length.toString(),
          }),
          message: <NotifyMessage unSuccessInvites={unSuccessInvites} />,
        });
        setOpenInvite(false);
        membersService.members.revalidate();
        workspaceQuotaService.quota.revalidate();
      }
      setIsMutating(false);
    },
    [isTeam, membersService, t, workspaceQuota, workspaceQuotaService.quota]
  );

  const onImportCSV = useAsyncCallback(
    async (file: File) => {
      setIsMutating(true);
      const emails = await parseCSV(file);
      onInviteBatchConfirm({ emails });
      setIsMutating(false);
    },
    [onInviteBatchConfirm]
  );

  const handleUpgradeConfirm = useCallback(() => {
    onChangeSettingState({
      activeTab: 'plans',
      scrollAnchor: 'cloudPricingPlan',
    });
    track.$.settingsPanel.workspace.viewPlans({
      control: 'inviteMember',
    });
  }, [onChangeSettingState]);

  const desc = useMemo(() => {
    if (!workspaceQuota) return null;

    if (isTeam) {
      return <span>{t['com.yunke.payment.member.team.description']()}</span>;
    }
    return (
      <span>
        {t['com.yunke.payment.member.description2']()}
        {hasPaymentFeature && isOwner ? (
          <div
            className={styles.goUpgradeWrapper}
            onClick={handleUpgradeConfirm}
          >
            <span className={styles.goUpgrade}>
              {t['com.yunke.payment.member.description.choose-plan']()}
            </span>
          </div>
        ) : null}
      </span>
    );
  }, [
    handleUpgradeConfirm,
    hasPaymentFeature,
    isOwner,
    isTeam,
    t,
    workspaceQuota,
  ]);

  const title = useMemo(() => {
    if (isTeam) {
      return `${t['com.yunke.settings.member.members']()} (${workspaceQuota?.memberCount ?? 0})`;
    }
    return `${t['com.yunke.settings.member.members']()} (${workspaceQuota?.memberCount ?? 0}/${workspaceQuota?.memberLimit ?? 10})`;
  }, [isTeam, t, workspaceQuota?.memberCount, workspaceQuota?.memberLimit]);

  if (workspaceQuota === null) {
    if (isLoading) {
      return <MembersPanelFallback />;
    } else {
      return (
        <span className={styles.errorStyle}>
          {error
            ? UserFriendlyError.fromAny(error).message
            : '加载成员失败'}
        </span>
      );
    }
  }

  return (
    <>
      <SettingRow name={title} desc={desc} spreadCol={!!isOwnerOrAdmin}>
        {isOwnerOrAdmin ? (
          <>
            <Button onClick={openInviteModal}>{t['com.yunke.settings.member.invite']()}</Button>
            {!isTeam ? (
              <MemberLimitModal
                isFreePlan={!plan}
                open={openMemberLimit}
                plan={workspaceQuota.humanReadable?.name ?? 'Free'}
                quota={
                  workspaceQuota.humanReadable?.memberLimit ?? 
                  (workspaceQuota.memberLimit ? String(workspaceQuota.memberLimit) : '10')
                }
                setOpen={setOpenMemberLimit}
                onConfirm={handleUpgradeConfirm}
              />
            ) : null}
            <InviteTeamMemberModal
              open={openInvite}
              setOpen={setOpenInvite}
              onConfirm={onInviteBatchConfirm}
              isMutating={isMutating}
              copyTextToClipboard={copyTextToClipboard}
              onGenerateInviteLink={onGenerateInviteLink}
              onRevokeInviteLink={onRevokeInviteLink}
              importCSV={<ImportCSV onImport={onImportCSV} />}
              invitationLink={inviteLink}
            />
          </>
        ) : null}
      </SettingRow>

      <div className={styles.membersPanel}>
        <MemberList
          isOwner={!!isOwner}
          isAdmin={!!isAdmin}
          goToTeamBilling={goToTeamBilling}
        />
      </div>
    </>
  );
};

const NotifyMessage = ({
  unSuccessInvites,
}: {
  unSuccessInvites: string[];
}) => {
  const t = useI18n();

  if (unSuccessInvites.length === 0) {
    return t['com.yunke.payment.member.team.invite.notify.success']();
  }

  return (
    <div>
      {t['com.yunke.payment.member.team.invite.notify.fail-message']()}
      {unSuccessInvites.map((email, index) => (
        <div key={`${index}:${email}`}>{email}</div>
      ))}
    </div>
  );
};

export const MembersPanelFallback = () => {
  const t = useI18n();

  return (
    <>
      <SettingRow
        name={t['com.yunke.settings.member.members']()}
        desc={t['com.yunke.payment.member.description2']()}
      />
      <div className={styles.membersPanel}>
        <MemberListFallback memberCount={1} />
      </div>
    </>
  );
};

const MemberListFallback = ({ memberCount }: { memberCount?: number }) => {
  // prevent page jitter
  const height = useMemo(() => {
    if (memberCount) {
      // height and margin-bottom
      return memberCount * 58 + (memberCount - 1) * 6;
    }
    return 'auto';
  }, [memberCount]);
  const t = useI18n();

  return (
    <div
      style={{
        height,
      }}
      className={styles.membersFallback}
    >
      <Loading size={20} />
      <span>{t['com.yunke.settings.member.loading']()}</span>
    </div>
  );
};

const ImportCSV = ({ onImport }: { onImport: (file: File) => void }) => {
  const t = useI18n();

  return (
    <Upload accept="text/csv" fileChange={onImport}>
      <Button
        className={styles.importButton}
        prefix={<ExportIcon />}
        variant="secondary"
      >
        {t['com.yunke.payment.member.team.invite.import-csv']()}
      </Button>
    </Upload>
  );
};

function deduplicateEmails(emails: string[]): string[] {
  const seenEmails = new Set<string>();
  return emails.filter(email => {
    const lowerCaseEmail = email.trim().toLowerCase();
    if (seenEmails.has(lowerCaseEmail)) {
      return false;
    } else {
      seenEmails.add(lowerCaseEmail);
      return true;
    }
  });
}
