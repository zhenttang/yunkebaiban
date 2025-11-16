import { Avatar, Skeleton } from '@yunke/component';
import { AuthService } from '@yunke/core/modules/cloud';
import { useLiveData, useService } from '@toeverything/infra';

import * as styles from './index.css';

export const Account = () => {
  const account = useLiveData(useService(AuthService).session.account$);
  if (!account) {
    return (
      <div className={styles.account}>
        <Skeleton height={28} width={28} style={{ borderRadius: '50%' }} />
        <div className={styles.content}>
          <Skeleton height={18} />
          <Skeleton height={14} />
        </div>
      </div>
    );
  }
  return (
    <div data-testid="user-info-card" className={styles.account}>
      <Avatar
        size={28}
        rounded={50}
        name={account.label}
        url={account.avatar}
      />

      <div className={styles.content}>
        <div
          className={styles.name}
          title={account.label}
          content={account.label}
        >
          {account.label}
        </div>
        <div
          className={styles.email}
          title={account.email}
          content={account.email}
        >
          {account.email}
        </div>
      </div>
    </div>
  );
};
