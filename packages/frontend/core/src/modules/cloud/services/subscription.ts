// import { type CreateCheckoutSessionInput } from '@yunke/graphql';
import { mixpanel } from '@yunke/track';
import { OnEvent, Service } from '@toeverything/infra';

import { Subscription } from '../entities/subscription';
import { SubscriptionPrices } from '../entities/subscription-prices';
import { AccountChanged } from '../events/account-changed';
import type { SubscriptionStore } from '../stores/subscription';
import type { CreateCheckoutSessionInput } from '../types/subscription';

@OnEvent(AccountChanged, e => e.onAccountChanged)
export class SubscriptionService extends Service {
  subscription = this.framework.createEntity(Subscription);
  prices = this.framework.createEntity(SubscriptionPrices);

  constructor(private readonly store: SubscriptionStore) {
    super();
    this.subscription.ai$
      .map(sub => !!sub)
      .distinctUntilChanged()
      .subscribe(ai => {
        mixpanel.people.set({
          ai,
        });
      });
    this.subscription.pro$
      .map(sub => !!sub)
      .distinctUntilChanged()
      .subscribe(pro => {
        mixpanel.people.set({
          pro,
        });
      });
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    return await this.store.createCheckoutSession(input);
  }

  private onAccountChanged() {
    this.subscription.revalidate();
  }
}
