/* eslint-disable @typescript-eslint/no-explicit-any */

import { stripe } from "../../helper/stripe";
import User from "../user/user.model";
import Subscription from "./Subscription.model";
import { Plan, SubscriptionStatus } from "./subscription.interface";
import AppError from "../../errorHelper/AppError";
import { StatusCodes } from "http-status-codes";
import { envVar } from "../../config/envVar";
import Stripe from "stripe";



const createSubscriptionPayment = async (userId: string, plan: Plan) => {

  const user = await User.findById(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: { userId },
    });

    customerId = customer.id;

    await User.findByIdAndUpdate(userId, {
      stripeCustomerId: customerId,
    });
  }

  const priceId =
    plan === Plan.MONTHLY
      ? envVar.PRICE_MONTHLY
      : envVar.PRICE_YEARLY;

  const stripeSubscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
  });

  // FIX TYPE
  const subscription = stripeSubscription as Stripe.Subscription;

  const invoice = subscription.latest_invoice as unknown as Stripe.Invoice;

  const paymentIntent =
    (invoice as any).payment_intent as Stripe.PaymentIntent;

  if (!paymentIntent) {
    throw new AppError(500, "Payment initialization failed");
  }

  // SAFE DATE
  const startDate = new Date(
    (subscription as any).current_period_start * 1000
  );

  const endDate = new Date(
    (subscription as any).current_period_end * 1000
  );

  await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      plan_type: plan,
      start_date: startDate,
      end_date: endDate,
      status: SubscriptionStatus.PENDING,
      auto_renew: true,
    },
    { upsert: true, new: true }
  );

  return {
    clientSecret: paymentIntent.client_secret,
    subscriptionId: subscription.id,
  };
};

const createTrialSubscription = async (userId: string) => {

  const existing = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });

  if (existing) return existing;

  const startDate = new Date();
  const endDate = new Date(
    startDate.getTime() + 30 * 24 * 60 * 60 * 1000
  );

  const trial = await Subscription.create({
    userId,
    plan_type: Plan.TRIAL,
    stripeSubscriptionId: `TRIAL_${userId}`,
    stripeCustomerId: `TRIAL_${userId}`,
    start_date: startDate,
    end_date: endDate,
    status: SubscriptionStatus.ACTIVE,
    ai_features_access: true,
    ads_free: false,
    auto_renew: false,
  });

  return trial;
};

const stripeWebhookHandler = async (event: Stripe.Event) => {

  switch (event.type) {

    case "invoice.payment_succeeded": {

      const invoice = event.data.object as any;

      const subscriptionId = invoice.subscription;

      if (!subscriptionId) return;

      const subscription = await Subscription.findOne({
        stripeSubscriptionId: subscriptionId,
      });

      if (!subscription) return;

      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.ai_features_access = true;
      subscription.ads_free = true;

      subscription.total_spent += invoice.amount_paid / 100;

      await subscription.save();

      break;
    }

    case "invoice.payment_failed": {

      const invoice = event.data.object as any;

      const subscriptionId = invoice.subscription;

      if (!subscriptionId) return;

      const subscription = await Subscription.findOne({
        stripeSubscriptionId: subscriptionId,
      });

      if (!subscription) return;

      subscription.status = SubscriptionStatus.SUSPENDED;

      await subscription.save();

      break;
    }

    case "customer.subscription.deleted": {

      const sub = event.data.object as Stripe.Subscription;

      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { status: SubscriptionStatus.CANCELLED }
      );

      break;
    }
  }
};

const turnOffAutoRenew = async (userId: string) => {

  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });

  if (!subscription)
    throw new AppError(404, "Active subscription not found");

  if (subscription.plan_type === Plan.TRIAL) {
    subscription.auto_renew = false;
    await subscription.save();

    return {
      message: "Trial auto renew disabled",
      end_date: subscription.end_date,
    };
  }

  await stripe.subscriptions.update(
    subscription.stripeSubscriptionId,
    { cancel_at_period_end: true }
  );

  subscription.auto_renew = false;
  await subscription.save();

  return {
    message: "Auto renew turned off",
    end_date: subscription.end_date,
  };
};

const restoreSubscription = async (userId: string) => {

  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.CANCELLED,
  });

  if (!subscription)
    throw new AppError(404, "Cancelled subscription not found");

  await stripe.subscriptions.update(
    subscription.stripeSubscriptionId,
    { cancel_at_period_end: false }
  );

  subscription.status = SubscriptionStatus.ACTIVE;
  subscription.auto_renew = true;

  await subscription.save();

  return subscription;
};

const getMySubscriptions = async (userId: string) => {
  return Subscription.find({ userId }).sort({ createdAt: -1 });
};

const getAllSubscriptions = async () => {
  return Subscription.find().sort({ createdAt: -1 });
};

export const subscriptionService = {
  createSubscriptionPayment,
  createTrialSubscription,
  stripeWebhookHandler,
  turnOffAutoRenew,
  restoreSubscription,
  getMySubscriptions,
  getAllSubscriptions,
};