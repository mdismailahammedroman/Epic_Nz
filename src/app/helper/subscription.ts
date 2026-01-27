import { SubscriptionStatus } from "../modules/subscription/subscription.interface";
import SubscriptionModel from "../modules/subscription/Subscription.model";

export const hasActiveSubscription = async (userId: string) => {
  const subscription = await SubscriptionModel.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
    end_date: { $gt: new Date() },
  });

  return !!subscription;
};
