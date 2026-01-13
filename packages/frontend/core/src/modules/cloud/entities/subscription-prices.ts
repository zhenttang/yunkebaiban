// import type { PricesQuery } from '@yunke/graphql';
import {
  catchErrorInto,
  effect,
  Entity,
  fromPromise,
  LiveData,
  mapInto,
  onComplete,
  onStart,
  smartRetry,
} from '@toeverything/infra';
import { exhaustMap } from 'rxjs';

import type { ServerService } from '../services/server';
import type { SubscriptionStore } from '../stores/subscription';
import type { PricesQuery } from '../types/subscription';

export class SubscriptionPrices extends Entity {
  prices$ = new LiveData<PricesQuery['prices'] | null>(null);
  isRevalidating$ = new LiveData(false);
  error$ = new LiveData<any | null>(null);

  proPrice$ = this.prices$.map(prices =>
    prices ? prices.find(price => price.plan === 'Pro') : null
  );
  aiPrice$ = this.prices$.map(prices =>
    prices ? prices.find(price => price.plan === 'AI') : null
  );
  teamPrice$ = this.prices$.map(prices =>
    prices ? prices.find(price => price.plan === 'Team') : null
  );

  readableLifetimePrice$ = this.proPrice$.map(price =>
    price?.lifetimeAmount
      ? `$${(price.lifetimeAmount / 100).toFixed(2).replace(/\.0+$/, '')}`
      : ''
  );

  constructor(
    private readonly serverService: ServerService,
    private readonly store: SubscriptionStore
  ) {
    super();
  }

  revalidate = effect(
    exhaustMap(() => {
      return fromPromise(async signal => {
        try {
          const serverConfig = this.serverService.server.features$.value;

          if (!serverConfig?.payment) {
            // No payment feature, no subscription
            return [];
          }
          
          // 临时模拟价格数据，替代GraphQL查询
          // TODO: 当后端恢复时，替换为实际的API调用
          return [
            {
              plan: 'Pro',
              amount: 1000, // $10.00 monthly (in cents)
              yearlyAmount: 9600, // $96.00 yearly (in cents) - 20% discount
              lifetimeAmount: 29900, // $299.00 lifetime (in cents)
            },
            {
              plan: 'Team',
              amount: 2000, // $20.00 monthly per member
              yearlyAmount: 19200, // $192.00 yearly per member - 20% discount
            },
            {
              plan: 'AI',
              amount: 500, // $5.00 monthly
              yearlyAmount: 4800, // $48.00 yearly - 20% discount
            }
          ];
        } catch (error) {
          console.warn('获取价格数据失败:', error);
          // 即使出错也返回默认价格
          return [
            {
              plan: 'Pro',
              amount: 1000,
              yearlyAmount: 9600,
              lifetimeAmount: 29900,
            },
            {
              plan: 'Team',
              amount: 2000,
              yearlyAmount: 19200,
            },
            {
              plan: 'AI',
              amount: 500,
              yearlyAmount: 4800,
            }
          ];
        }
      }).pipe(
        mapInto(this.prices$),
        catchErrorInto(this.error$),
        onStart(() => this.isRevalidating$.next(true)),
        onComplete(() => this.isRevalidating$.next(false))
      );
    })
  );
}
