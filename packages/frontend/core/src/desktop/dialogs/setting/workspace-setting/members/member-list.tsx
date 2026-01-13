import { Avatar, IconButton, Loading, Menu, notify } from '@yunke/component';
import { Pagination } from '@yunke/component/setting-components';
import { type AuthAccountInfo, AuthService } from '@yunke/core/modules/cloud';
import {
  type Member,
  WorkspaceMembersService,
} from '@yunke/core/modules/permissions';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { UserFriendlyError } from '@yunke/error';
// import { Permission, WorkspaceMemberStatus } from '@yunke/graphql';
import { type I18nString, useI18n } from '@yunke/i18n';
// 本地枚举，替代 GraphQL 类型
enum Permission {
  Owner = 'Owner',
  Admin = 'Admin',
  Collaborator = 'Collaborator',
}
enum WorkspaceMemberStatus {
  Pending = 'PENDING',
  UnderReview = 'UNDER_REVIEW',
  NeedMoreSeat = 'NEED_MORE_SEAT',
  NeedMoreSeatAndReview = 'NEED_MORE_SEAT_AND_REVIEW',
  AllocatingSeat = 'ALLOCATING_SEAT',
  Accepted = 'ACCEPTED',
}
import { MoreVerticalIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { clamp } from 'lodash-es';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConfirmAssignModal } from './confirm-assign-modal';
import { MemberOptions } from './member-option';
import * as styles from './styles.css';

export const MemberList = ({
  isOwner,
  isAdmin,
  goToTeamBilling,
}: {
  isOwner: boolean;
  isAdmin: boolean;
  goToTeamBilling: () => void;
}) => {
  const membersService = useService(WorkspaceMembersService);
  const memberCount = useLiveData(membersService.members.memberCount$);
  const pageNum = useLiveData(membersService.members.pageNum$);
  const isLoading = useLiveData(membersService.members.isLoading$);
  const error = useLiveData(membersService.members.error$);
  const pageMembers = useLiveData(membersService.members.pageMembers$);

  useEffect(() => {
    membersService.members.revalidate();
  }, [membersService]);

  const session = useService(AuthService).session;
  const account = useLiveData(session.account$);

  const handlePageChange = useCallback(
    (_: number, pageNum: number) => {
      membersService.members.setPageNum(pageNum);
      membersService.members.revalidate();
    },
    [membersService]
  );

  if (!account) {
    return null;
  }

  return (
    <div>
      {pageMembers === undefined ? (
        isLoading ? (
          <MemberListFallback
            memberCount={
              memberCount
                ? clamp(
                    memberCount - pageNum * membersService.members.PAGE_SIZE,
                    1,
                    membersService.members.PAGE_SIZE
                  )
                : 1
            }
          />
        ) : (
          <span className={styles.errorStyle}>
            {error
              ? UserFriendlyError.fromAny(error).message
              : '加载成员失败'}
          </span>
        )
      ) : (
        pageMembers?.map(member => (
          <MemberItem
            currentAccount={account}
            key={member.id}
            member={member}
            isOwner={isOwner}
            isAdmin={isAdmin}
            goToTeamBilling={goToTeamBilling}
          />
        ))
      )}
      {memberCount !== undefined &&
        memberCount > membersService.members.PAGE_SIZE && (
          <Pagination
            totalCount={memberCount}
            countPerPage={membersService.members.PAGE_SIZE}
            pageNum={pageNum}
            onPageChange={handlePageChange}
          />
        )}
    </div>
  );
};

const getShouldShow = ({
  member,
  currentAccountId,
  isOwner,
  isAdmin,
}: {
  member: Member;
  currentAccountId: string;
  isOwner: boolean;
  isAdmin: boolean;
}) => {
  if (
    member.id === currentAccountId ||
    member.permission === Permission.Owner
  ) {
    return false;
  } else if (isOwner) {
    return true;
  } else if (isAdmin) {
    return member.permission !== Permission.Admin;
  }
  return false;
};

const MemberItem = ({
  member,
  isOwner,
  isAdmin,
  currentAccount,
  goToTeamBilling,
}: {
  member: Member;
  isAdmin: boolean;
  isOwner: boolean;
  currentAccount: AuthAccountInfo;
  goToTeamBilling: () => void;
}) => {
  const t = useI18n();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const membersService = useService(WorkspaceMembersService);
  const workspace = useService(WorkspaceService).workspace;
  const workspaceName = useLiveData(workspace.name$);
  const isEquals = workspaceName === inputValue;

  const show = useMemo(
    () =>
      getShouldShow({
        member,
        currentAccountId: currentAccount.id,
        isOwner,
        isAdmin,
      }),
    [member, currentAccount, isOwner, isAdmin]
  );

  const handleOpenAssignModal = useCallback(() => {
    setInputValue('');
    setOpen(true);
  }, []);

  const confirmAssign = useCallback(() => {
    membersService
      .adjustMemberPermission(member.id, Permission.Owner)
      .then(result => {
        if (result) {
          setOpen(false);
          notify.success({
            title: t['com.yunke.payment.member.team.assign.notify.title'](),
            message: t['com.yunke.payment.member.team.assign.notify.message']({
              name: member.name || member.email || member.id,
            }),
          });
          membersService.members.revalidate();
        }
      })
      .catch(error => {
        notify.error({
          title: '操作失败',
          message: error.message,
        });
      });
  }, [member, t, membersService]);

  const memberStatus = useMemo(() => getMemberStatus(member), [member]);

  return (
    <div
      key={member.id}
      className={styles.memberListItem}
      data-testid="member-item"
    >
      <Avatar
        size={36}
        url={member.avatarUrl}
        name={(member.name ? member.name : member.email) as string}
      />
      <div className={styles.memberContainer}>
        {member.name ? (
          <>
            <div className={styles.memberName}>{member.name}</div>
            <div className={styles.memberEmail}>{member.email}</div>
          </>
        ) : (
          <div className={styles.memberName}>{member.email}</div>
        )}
      </div>
      <div
        className={clsx(styles.roleOrStatus, {
          pending:
            member.status !== WorkspaceMemberStatus.Accepted &&
            member.status !== WorkspaceMemberStatus.NeedMoreSeat,
          error: member.status === WorkspaceMemberStatus.NeedMoreSeat,
        })}
      >
        {t.t(memberStatus)}
      </div>
      <Menu
        items={
          <MemberOptions
            member={member}
            openAssignModal={handleOpenAssignModal}
            isAdmin={isAdmin}
            isOwner={isOwner}
            goToTeamBilling={goToTeamBilling}
          />
        }
      >
        <IconButton
          disabled={!show}
          style={{
            visibility: show ? 'visible' : 'hidden',
            flexShrink: 0,
          }}
        >
          <MoreVerticalIcon />
        </IconButton>
      </Menu>
      <ConfirmAssignModal
        open={open}
        setOpen={setOpen}
        member={member}
        inputValue={inputValue}
        placeholder={workspaceName}
        setInputValue={setInputValue}
        isEquals={isEquals}
        onConfirm={confirmAssign}
      />
    </div>
  );
};

const getMemberStatus = (member: Member): I18nString => {
  switch (member.status) {
    case WorkspaceMemberStatus.NeedMoreSeat:
    case WorkspaceMemberStatus.NeedMoreSeatAndReview:
      return 'insufficient-team-seat';
    case WorkspaceMemberStatus.Pending:
      return 'com.yunke.settings.member.status.pending';
    case WorkspaceMemberStatus.UnderReview:
      return 'com.yunke.settings.member.status.under-review';
    case WorkspaceMemberStatus.AllocatingSeat:
      return 'com.yunke.settings.member.status.allocating-seat';
    case WorkspaceMemberStatus.Accepted:
      switch (member.permission) {
        case Permission.Owner:
          return 'com.yunke.settings.member.role.owner';
        case Permission.Admin:
          return 'com.yunke.settings.member.role.admin';
        case Permission.Collaborator:
          return 'com.yunke.settings.member.role.collaborator';
        default:
          return 'com.yunke.settings.member.role.member';
      }
  }
};

export const MemberListFallback = ({
  memberCount,
}: {
  memberCount?: number;
}) => {
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
