import { ServerService, SubscriptionService } from '@affine/core/modules/cloud';
// import { SubscriptionPlan } from '@affine/graphql';
import { useLiveData, useServices } from '@toeverything/infra';
import clsx from 'clsx';
import { forwardRef, type HTMLProps, useEffect, useRef } from 'react';

import { tag } from './style.css';

export const UserPlanTag = forwardRef<
  HTMLDivElement,
  HTMLProps<HTMLDivElement>
>(function UserPlanTag({ className, ...attrs }, ref) {
  const { serverService, subscriptionService } = useServices({
    ServerService,
    SubscriptionService,
  });
  const hasRevalidated = useRef(false);
  
  const hasPayment = useLiveData(
    serverService.server.features$.map(r => r?.payment)
  );
  const plan = useLiveData(
    subscriptionService.subscription.pro$.map(subscription =>
      subscription !== null ? subscription?.plan : null
    )
  );
  const isBeliever = useLiveData(subscriptionService.subscription.isBeliever$);
  const isLoading = plan === null;

  useEffect(() => {
    // revalidate subscription to get the latest status, but only once
    if (!hasRevalidated.current) {
      hasRevalidated.current = true;
      subscriptionService.subscription.revalidate();
    }
  }, []); // 空依赖数组，只在组件挂载时执行

  if (!hasPayment) return null;

  if (isLoading) return null;

  const planLabel = isBeliever ? '信念者' : (plan ?? SubscriptionPlan.Free);

  return (
    <div
      ref={ref}
      className={clsx(tag, className)}
      data-is-believer={isBeliever}
      {...attrs}
    >
      {planLabel}
    </div>
  );
});
