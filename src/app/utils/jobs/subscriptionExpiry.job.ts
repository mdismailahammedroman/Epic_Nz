import {
  Plan,
  SubscriptionStatus,
} from "../../modules/subscription/subscription.interface";
import Subscription from "../../modules/subscription/Subscription.model";

export const expireTrialSubscriptions = async () => {
  await Subscription.updateMany(
    {
      plan_type: Plan.TRIAL,
      status: SubscriptionStatus.ACTIVE,
      end_date: { $lt: new Date() },
    },
    {
      status: SubscriptionStatus.EXPIRED,
      ai_features_access: false,
    },
  );
  console.log("✅ Expired trial subscriptions updated");
};
