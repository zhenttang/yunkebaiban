import { AuthPageContainer } from '@yunke/component/auth-components';
type InviteInfo = {
  user: { avatarUrl?: string; name?: string };
  workspace: { avatar?: string; name?: string };
};
import { useI18n } from '@yunke/i18n';

import { Avatar } from '../../ui/avatar';
import { Button } from '../../ui/button';
import * as styles from './styles.css';
export const AcceptInvitePage = ({
  onOpenWorkspace,
  inviteInfo,
}: {
  onOpenWorkspace: () => void;
  inviteInfo: InviteInfo;
}) => {
  const t = useI18n();
  return (
    <AuthPageContainer
      title={t['Successfully joined!']()}
      subtitle={
        <div className={styles.content}>
          <div className={styles.userWrapper}>
            <Avatar
              url={inviteInfo.user?.avatarUrl || ''}
              name={inviteInfo.user?.name}
              size={20}
            />
            <span className={styles.inviteName}>{inviteInfo.user?.name}</span>
          </div>
          <div>{t['invited you to join']()}</div>
          <div className={styles.userWrapper}>
            <Avatar
              url={inviteInfo.workspace?.avatar
                ? `data:image/png;base64,${inviteInfo.workspace.avatar}`
                : ''}
              name={inviteInfo.workspace?.name}
              size={20}
              style={{ marginLeft: 4 }}
              colorfulFallback
            />
            <span className={styles.inviteName}>
              {inviteInfo.workspace?.name}
            </span>
          </div>
        </div>
      }
    >
      <Button variant="primary" size="large" onClick={onOpenWorkspace}>
        {t['Visit Workspace']()}
      </Button>
    </AuthPageContainer>
  );
};
