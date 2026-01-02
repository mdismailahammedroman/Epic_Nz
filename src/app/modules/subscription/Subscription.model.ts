import { Schema, model } from "mongoose";
import {
  ISubscription,
  Plan,
  SubscriptionStatus,
} from "./subscription.interface";

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    plan_type: {
      type: String,
      enum: Object.values(Plan),
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
    ai_features_access: { type: Boolean, default: false },
    ads_free: { type: Boolean, default: false },
    renewal_date: Date,
    total_spent: { type: Number, default: 0 },
    auto_renew: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<ISubscription>("Subscription", subscriptionSchema);
