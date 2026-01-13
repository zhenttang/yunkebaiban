import { AuthPageContainer } from '@yunke/component/auth-components';
import { UserFriendlyError } from '@yunke/error';
// 本地占位，替代 GraphQL
const ErrorNames = { MEMBER_QUOTA_EXCEEDED: 'MEMBER_QUOTA_EXCEEDED' } as const;
type InviteInfo = {
  workspace: { avatar?: string; name?: string };
};
import { Trans, useI18n } from '@yunke/i18n';

import { Avatar } from '../../ui/avatar';
import * as styles from './styles.css';

export const JoinFailedPage = ({
  inviteInfo,
  error,
}: {
  inviteInfo?: InviteInfo;
  error?: any;
}) => {
  const userFriendlyError = UserFriendlyError.fromAny(error);
  const t = useI18n();
  return (
    <AuthPageContainer
      title={t['com.yunke.fail-to-join-workspace.title']()}
      subtitle={
        userFriendlyError.name === ErrorNames.MEMBER_QUOTA_EXCEEDED ? (
          <div className={styles.lineHeight}>
            <Trans
              i18nKey={'com.yunke.fail-to-join-workspace.description-1'}
              components={{
                1: (
                  <div className={styles.avatarWrapper}>
                    <Avatar
                      url={`data:image/png;base64,${inviteInfo?.workspace.avatar}`}
                      name={inviteInfo?.workspace.name}
                      size={20}
                      colorfulFallback
                    />
                  </div>
                ),
                2: <span className={styles.inviteName} />,
              }}
              values={{
                workspaceName: inviteInfo?.workspace.name,
              }}
            />
            <div>{t['com.yunke.fail-to-join-workspace.description-2']()}</div>
          </div>
        ) : (
          <div>
            {t['error.' + userFriendlyError.name]()}
            <br />
            {userFriendlyError.message}
          </div>
        )
      }
    />
  );
};
