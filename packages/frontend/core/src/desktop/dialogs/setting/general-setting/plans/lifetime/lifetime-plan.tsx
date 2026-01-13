import { Button } from '@yunke/component';
import { AuthService, SubscriptionService } from '@yunke/core/modules/cloud';
// import { SubscriptionPlan, SubscriptionRecurring } from '@yunke/graphql';
import { Trans, useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';

import { SignUpAction, Upgrade } from '../plan-card';
import { BelieverCard } from './believer-card';
import { BelieverBenefits } from './benefits';
import * as styles from './style.css';

export const LifetimePlan = () => {
  const t = useI18n();
  const subscriptionService = useService(SubscriptionService);
  const loggedIn =
    useLiveData(useService(AuthService).session.status$) === 'authenticated';

  const readableLifetimePrice = useLiveData(
    subscriptionService.prices.readableLifetimePrice$
  );
  const isBeliever = useLiveData(subscriptionService.subscription.isBeliever$);

  if (!readableLifetimePrice) return null;

  return (
    <BelieverCard type={1}>
      <div className={styles.caption1}>
        {t['com.yunke.payment.lifetime.caption-1']()}
      </div>

      <div className={styles.title}>
        {t['com.yunke.payment.lifetime.title']()}
      </div>

      <div className={styles.price}>{readableLifetimePrice}</div>

      {!loggedIn ? (
        <SignUpAction className={styles.purchase}>
          {t['com.yunke.payment.sign-up-free']()}
        </SignUpAction>
      ) : isBeliever ? (
        <Button className={styles.purchase} size="default" disabled>
          {t['com.yunke.payment.lifetime.purchased']()}
        </Button>
      ) : (
        <Upgrade
          className={styles.purchase}
          recurring={SubscriptionRecurring.Lifetime}
          plan={SubscriptionPlan.Pro}
        >
          {t['com.yunke.payment.lifetime.purchase']()}
        </Upgrade>
      )}

      <div className={styles.caption2}>
        <Trans
          i18nKey="com.yunke.payment.lifetime.caption-2"
          components={{
            a: <a className={styles.userPolicyLink} href="#" />,
          }}
        />
      </div>

      <BelieverBenefits style={{ padding: '8px 6px' }} />
    </BelieverCard>
  );
};
