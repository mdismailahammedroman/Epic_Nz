import { Types } from "mongoose";

export enum Plan {
  TRIAL = "TRIAL",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
}

export interface ISubscription {
  userId: Types.ObjectId | string;
  plan_type: Plan;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  start_date: Date;
  end_date: Date;
  status: SubscriptionStatus;
  ai_features_access: boolean;
  ads_free: boolean;
  renewal_date?: Date;
  total_spent: number;
  auto_renew: boolean;
}

export interface ICreateCheckoutSession {
  userId: string;
  plan_type: Plan;
}
