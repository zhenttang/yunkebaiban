import { Button, type ButtonProps } from '@yunke/component';
import { generateSubscriptionCallbackLink } from '@yunke/core/components/hooks/yunke/use-subscription-notify';
import { AuthService } from '@yunke/core/modules/cloud';
//import {
//   SubscriptionPlan,
//   SubscriptionRecurring,
//   SubscriptionVariant,
//} from '@yunke/graphql';

// Temporary placeholder enums to fix TypeScript errors
enum SubscriptionPlan {
  Free = 'free',
  Pro = 'pro',
  Team = 'team',
  AI = 'ai',
  SelfHostedTeam = 'selfhost-team'
}

enum SubscriptionRecurring {
  Monthly = 'monthly',
  Yearly = 'yearly',
  Lifetime = 'lifetime'
}

enum SubscriptionVariant {
  Onetime = 'onetime',
  Recurring = 'recurring',
  EA = 'earlyaccess'
}
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import { useService } from '@toeverything/infra';
import { useCallback, useMemo } from 'react';

import { CheckoutSlot } from '../../checkout-slot';

export const AIRedeemCodeButton = (btnProps: ButtonProps) => {
  const t = useI18n();
  const authService = useService(AuthService);

  const onBeforeCheckout = useCallback(() => {
    track.$.settingsPanel.plans.checkout({
      plan: SubscriptionPlan.AI,
      recurring: SubscriptionRecurring.Yearly,
    });
  }, []);
  const checkoutOptions = useMemo(
    () => ({
      recurring: SubscriptionRecurring.Yearly,
      plan: SubscriptionPlan.AI,
      variant: SubscriptionVariant.Onetime,
      coupon: null,
      successCallbackLink: generateSubscriptionCallbackLink(
        authService.session.account$.value,
        SubscriptionPlan.AI,
        SubscriptionRecurring.Yearly
      ),
    }),
    [authService.session.account$.value]
  );

  return (
    <CheckoutSlot
      onBeforeCheckout={onBeforeCheckout}
      checkoutOptions={checkoutOptions}
      renderer={props => (
        <Button variant="primary" {...btnProps} {...props}>
          {t['com.yunke.payment.redeem-code']()}
        </Button>
      )}
    />
  );
};
