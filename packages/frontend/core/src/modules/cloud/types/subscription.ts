// 统一的订阅相关类型定义
// 临时替代GraphQL类型，当后端恢复时可以替换

export enum SubscriptionPlan {
  Free = 'free',
  Pro = 'pro',
  Team = 'team',
  AI = 'ai',
  SelfHostedTeam = 'selfhost-team'
}

export enum SubscriptionRecurring {
  Monthly = 'monthly',
  Yearly = 'yearly',
  Lifetime = 'lifetime'
}

export enum SubscriptionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Canceled = 'canceled',
  Trialing = 'trialing',
  PastDue = 'past_due'
}

export enum SubscriptionVariant {
  Onetime = 'onetime',
  Recurring = 'recurring',
  EA = 'earlyaccess'
}

export interface CreateCheckoutSessionInput {
  plan: SubscriptionPlan;
  recurring?: SubscriptionRecurring;
  variant?: SubscriptionVariant;
  successCallbackLink?: string;
  coupon?: string;
}

export interface PriceItem {
  plan: string;
  amount: number;
  yearlyAmount: number;
  lifetimeAmount?: number;
}

export interface SubscriptionType {
  plan: SubscriptionPlan;
  recurring: SubscriptionRecurring;
  variant: SubscriptionVariant;
  status?: SubscriptionStatus;
  canceledAt?: string;
  nextBillAt?: string;
}

export interface SubscriptionQuery {
  currentUser: {
    id: string;
    subscriptions: SubscriptionType[];
  } | null;
}

export interface PricesQuery {
  prices: PriceItem[];
}