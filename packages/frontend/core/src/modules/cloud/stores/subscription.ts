//import type {
//   CreateCheckoutSessionInput,
//   SubscriptionRecurring,
//} from '@yunke/graphql';
//import {
//   cancelSubscriptionMutation,
//   createCheckoutSessionMutation,
//   getWorkspaceSubscriptionQuery,
//   pricesQuery,
//   resumeSubscriptionMutation,
//   SubscriptionPlan,
//   subscriptionQuery,
//   updateSubscriptionMutation,
//} from '@yunke/graphql';
import { Store } from '@toeverything/infra';

import {
  type CreateCheckoutSessionInput,
  SubscriptionPlan,
  SubscriptionRecurring,
} from '../types/subscription';

import type { GlobalCache } from '../../storage';
import type { UrlService } from '../../url';
import type { SubscriptionType } from '../entities/subscription';
import type { ServerService } from '../services/server';

const SUBSCRIPTION_CACHE_KEY = 'subscription:';

// 临时查询定义，替代GraphQL查询
const subscriptionQuery = 'subscription-query';
const pricesQuery = 'prices-query';
const resumeSubscriptionMutation = 'resume-subscription-mutation';
const cancelSubscriptionMutation = 'cancel-subscription-mutation';
const updateSubscriptionMutation = 'update-subscription-mutation';
const createCheckoutSessionMutation = 'create-checkout-session-mutation';
const getWorkspaceSubscriptionQuery = 'get-workspace-subscription-query';

const getDefaultSubscriptionSuccessCallbackLink = (
  baseUrl: string,
  plan?: SubscriptionPlan | null,
  scheme?: string
) => {
  const path =
    plan === SubscriptionPlan.Team
      ? '/upgrade-success/team'
      : plan === SubscriptionPlan.AI
        ? '/ai-upgrade-success'
        : '/upgrade-success';
  const urlString = baseUrl + path;
  const url = new URL(urlString);
  if (scheme) {
    url.searchParams.set('scheme', scheme);
  }
  return url.toString();
};

export class SubscriptionStore extends Store {
  constructor(
    private readonly globalCache: GlobalCache,
    private readonly urlService: UrlService,
    private readonly serverService: ServerService
  ) {
    super();
  }

  async fetchSubscriptions(abortSignal?: AbortSignal) {
    // 临时模拟数据，替代GraphQL查询
    // TODO: 当后端恢复时，替换为实际的GraphQL调用
    try {
      // 模拟一个成功的响应
      return {
        userId: 'mock-user-id',
        subscriptions: [
          // 可以添加一个模拟的Free订阅
          {
            plan: SubscriptionPlan.Free,
            recurring: SubscriptionRecurring.Monthly,
            variant: 'recurring',
            status: 'active'
          }
        ],
      };
    } catch (error) {
      console.warn('模拟fetchSubscriptions出错:', error);
      throw error;
    }
  }

  async fetchWorkspaceSubscriptions(
    workspaceId: string,
    abortSignal?: AbortSignal
  ) {
    // 临时模拟数据，替代GraphQL查询
    // TODO: 当后端恢复时，替换为实际的GraphQL调用
    return {
      workspaceId: workspaceId,
      subscription: null,
    };
  }

  async mutateResumeSubscription(
    idempotencyKey: string,
    plan?: SubscriptionPlan,
    abortSignal?: AbortSignal,
    workspaceId?: string
  ) {
    // 临时模拟数据，替代GraphQL查询
    // TODO: 当后端恢复时，替换为实际的GraphQL调用
    return { success: true };
  }

  async mutateCancelSubscription(
    idempotencyKey: string,
    plan?: SubscriptionPlan,
    abortSignal?: AbortSignal,
    workspaceId?: string
  ) {
    // 临时模拟数据，替代GraphQL查询
    // TODO: 当后端恢复时，替换为实际的GraphQL调用
    return { success: true };
  }

  getCachedSubscriptions(userId: string) {
    return this.globalCache.get<SubscriptionType[]>(
      SUBSCRIPTION_CACHE_KEY + userId
    );
  }

  setCachedSubscriptions(userId: string, subscriptions: SubscriptionType[]) {
    return this.globalCache.set(SUBSCRIPTION_CACHE_KEY + userId, subscriptions);
  }

  getCachedWorkspaceSubscription(workspaceId: string) {
    return this.globalCache.get<SubscriptionType>(
      SUBSCRIPTION_CACHE_KEY + workspaceId
    );
  }

  setCachedWorkspaceSubscription(
    workspaceId: string,
    subscription: SubscriptionType
  ) {
    return this.globalCache.set(
      SUBSCRIPTION_CACHE_KEY + workspaceId,
      subscription
    );
  }

  setSubscriptionRecurring(
    idempotencyKey: string,
    recurring: SubscriptionRecurring,
    plan?: SubscriptionPlan,
    workspaceId?: string
  ) {
    // 临时模拟数据，替代GraphQL查询
    // TODO: 当后端恢复时，替换为实际的GraphQL调用
    return Promise.resolve({ success: true });
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput) {
    // 临时模拟数据，替代GraphQL查询
    // TODO: 当后端恢复时，替换为实际的GraphQL调用
    const mockUrl = 'https://checkout.stripe.com/mock-session';
    return { url: mockUrl };
  }

  async fetchSubscriptionPrices(abortSignal?: AbortSignal) {
    // 临时模拟数据，替代GraphQL查询
    // TODO: 当后端恢复时，替换为实际的GraphQL调用
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
  }
}
