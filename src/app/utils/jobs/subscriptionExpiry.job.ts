import {
  Plan,
  SubscriptionStatus,
} from "../../modules/subscription/subscription.interface";
import Subscription from "../../modules/subscription/Subscription.model";

export const expireTrialSubscriptions = async () => {
  const result = await Subscription.updateMany(
    {
      plan_type: Plan.TRIAL,
      status: SubscriptionStatus.ACTIVE,
      end_date: { $lt: new Date() },
    },
    {
      status: SubscriptionStatus.EXPIRED,
      ai_features_access: false,
      ads_free: false,
    },
  );

  console.log(`✅ Trial expiry job ran. Modified: ${result.modifiedCount}`);
};
