import { Button, Loading } from '@affine/component';
import { UrlService } from '@affine/core/modules/url';
import { UserFriendlyError } from '@affine/error';
//import {
//   SubscriptionPlan,
//   SubscriptionRecurring,
//   SubscriptionVariant,
//} from '@affine/graphql';

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
import { track } from '@affine/track';
import { effect, fromPromise, useServices } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { switchMap } from 'rxjs';

import { generateSubscriptionCallbackLink } from '../../../components/hooks/affine/use-subscription-notify';
import {
  RouteLogic,
  useNavigateHelper,
} from '../../../components/hooks/use-navigate-helper';
import { AuthService, SubscriptionService } from '../../../modules/cloud';
import * as styles from './subscribe.css';

interface ProductTriple {
  plan: SubscriptionPlan;
  recurring: SubscriptionRecurring;
  variant: SubscriptionVariant | null;
}

const products = {
  ai: 'ai_yearly',
  pro: 'pro_yearly',
  'monthly-pro': 'pro_monthly',
  believer: 'pro_lifetime',
  team: 'team_yearly',
  'monthly-team': 'team_monthly',
  'yearly-selfhost-team': 'selfhost-team_yearly',
  'monthly-selfhost-team': 'selfhost-team_monthly',
  'oneyear-ai': 'ai_yearly_onetime',
  'oneyear-pro': 'pro_yearly_onetime',
  'onemonth-pro': 'pro_monthly_onetime',
};

const allowedPlan = {
  ai: SubscriptionPlan.AI,
  pro: SubscriptionPlan.Pro,
  team: SubscriptionPlan.Team,
  'selfhost-team': SubscriptionPlan.SelfHostedTeam,
};
const allowedRecurring = {
  monthly: SubscriptionRecurring.Monthly,
  yearly: SubscriptionRecurring.Yearly,
  lifetime: SubscriptionRecurring.Lifetime,
};

const allowedVariant = {
  earlyaccess: SubscriptionVariant.EA,
  onetime: SubscriptionVariant.Onetime,
};

function getProductTriple(searchParams: URLSearchParams): ProductTriple {
  const triple: ProductTriple = {
    plan: SubscriptionPlan.Pro,
    recurring: SubscriptionRecurring.Yearly,
    variant: null,
  };

  const productName = searchParams.get('product') as
    | keyof typeof products
    | null;
  let plan = searchParams.get('plan') as keyof typeof allowedPlan | null;
  let recurring = searchParams.get('recurring') as
    | keyof typeof allowedRecurring
    | null;
  let variant = searchParams.get('variant') as
    | keyof typeof allowedVariant
    | null;

  if (productName && products[productName]) {
    // @ts-expect-error safe
    [plan, recurring, variant] = products[productName].split('_');
  }

  if (plan) {
    triple.plan = allowedPlan[plan];
  }

  if (recurring) {
    triple.recurring = allowedRecurring[recurring];
  }
  if (variant) {
    triple.variant = allowedVariant[variant];
  }

  return triple;
}

export const Component = () => {
  const { authService, subscriptionService, urlService } = useServices({
    AuthService,
    SubscriptionService,
    UrlService,
  });
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const { jumpToSignIn } = useNavigateHelper();
  const idempotencyKey = useMemo(() => nanoid(), []);

  const { plan, recurring, variant } = getProductTriple(searchParams);
  const coupon = searchParams.get('coupon');

  useEffect(() => {
    const call = effect(
      switchMap(() => {
        return fromPromise(async signal => {
          retryKey;
          // TODO(@eyhn): i18n
          setMessage('正在检查账户状态…');
          setError('');
          await authService.session.waitForRevalidation(signal);
          const loggedIn =
            authService.session.status$.value === 'authenticated';

          if (!loggedIn) {
            setMessage('正在重定向到登录页面…');
            jumpToSignIn(
              location.pathname + location.search,
              RouteLogic.REPLACE
            );
            return;
          }
          setMessage('正在创建结算会话…');

          try {
            const account = authService.session.account$.value;
            // should never reach
            if (!account) throw new Error('No account');

            track.subscriptionLanding.$.$.checkout({
              control: 'pricing',
              plan,
              recurring,
            });

            const checkout = await subscriptionService.createCheckoutSession({
              idempotencyKey,
              plan,
              recurring,
              variant,
              coupon,
              successCallbackLink: generateSubscriptionCallbackLink(
                account,
                plan,
                recurring
              ),
            });
            setMessage('即将跳转到支付页面…');
            urlService.openExternal(checkout);
          } catch (err) {
            const e = UserFriendlyError.fromAny(err);
            setMessage('');
            setError(e.message);
          }
        });
      })
    );

    call();

    return () => {
      call.unsubscribe();
    };
  }, [
    authService,
    subscriptionService,
    jumpToSignIn,
    idempotencyKey,
    plan,
    recurring,
    retryKey,
    variant,
    coupon,
    urlService,
  ]);

  const isError = Boolean(error);
  const statusTitleText = isError ? '订阅流程遇到问题' : '正在准备订阅';
  const statusDescription = isError
    ? error
    : message || 'AFFiNE 正在为你检查账户状态，请稍候…';

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>
            {isError ? '订阅未完成' : '正在跳转至结算页面'}
          </h1>
          <p className={styles.description}>
            {isError
              ? '你可以点击下方按钮重试。如果问题持续，请稍后再试或联系支持团队。'
              : '为了确保权益同步，我们正在核对账户信息并生成结算链接，请保持页面打开。'}
          </p>
        </div>

        <div
          className={styles.statusCard}
          data-variant={isError ? 'error' : 'info'}
        >
          <div className={styles.statusContent}>
            <span className={styles.statusTitle}>{statusTitleText}</span>
            <span className={styles.statusText}>{statusDescription}</span>
          </div>
          {isError ? (
            <Button
              variant="primary"
              size="small"
              onClick={() => setRetryKey(i => i + 1)}
            >
              重新尝试
            </Button>
          ) : (
            <Loading size={20} />
          )}
        </div>

        <p className={styles.helper}>
          页面完成跳转后如长时间无响应，可关闭此页并从邮件或帐户中心再次发起购买。
        </p>
      </div>
    </div>
  );
};
