/* eslint-disable @typescript-eslint/no-explicit-any */
import { stripe } from "../../helper/stripe";
import { envVar } from "../../config/envVar";

import AppError from "../../errorHelper/AppError";
import Stripe from "stripe";
import Subscription from "./Subscription.model";
import { Plan, SubscriptionStatus } from "./subscription.interface";
import { StatusCodes } from "http-status-codes";
import User from "../user/user.model";

/* ------------------------------------------------------- */
/* CREATE PAYMENT INTENT (TRIAL → MONTHLY / YEARLY) */
/* ------------------------------------------------------- */

const createPaymentIntent = async (userId: string, plan: Plan) => {

  const user = await User.findById(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  let customerId = user.stripeCustomerId;

  // Create Stripe Customer if not exists
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

  // Create Stripe Subscription
  const stripeSubscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
    metadata: {
      userId,
      plan_type: plan,
    },
  });

  let invoice = stripeSubscription.latest_invoice as Stripe.Invoice;

  let paymentIntent = (invoice as any)
    .payment_intent as Stripe.PaymentIntent | null;

  // fallback retrieve invoice
  if (!paymentIntent) {

    const retrievedInvoice = await stripe.invoices.retrieve(invoice.id, {
      expand: ["payment_intent"],
    });

    invoice = retrievedInvoice;

    paymentIntent = (invoice as any)
      .payment_intent as Stripe.PaymentIntent | null;
  }

  if (!paymentIntent) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Payment initialization failed"
    );
  }

  const startDate = new Date();

  const endDate =
    plan === Plan.MONTHLY
      ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

  // update or create subscription
  await Subscription.findOneAndUpdate(
    { userId },
    {
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customerId,
      plan_type: plan,
      status: SubscriptionStatus.PENDING,
      ai_features_access: false,
      start_date: startDate,
      end_date: endDate,
    },
    { upsert: true, new: true }
  );

  return {
    subscriptionId: stripeSubscription.id,
    clientSecret: paymentIntent.client_secret,
    customerId,
  };
};

/* ------------------------------------------------------- */
/* CREATE TRIAL SUBSCRIPTION */
/* ------------------------------------------------------- */

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

  const trial = await Subscription.findOneAndUpdate(
    { userId },
    {
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
      total_spent: 0,
    },
    { upsert: true, new: true }
  );

  return trial;
};

/* ------------------------------------------------------- */
/* STRIPE WEBHOOK */
/* ------------------------------------------------------- */

const stripeWebhookHandler = async (event: Stripe.Event) => {

  if (event.type === "invoice.payment_succeeded") {

    const invoice = event.data.object as Stripe.Invoice;

    const subscriptionId = (invoice as any).subscription as string;

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
  }

  if (event.type === "invoice.payment_failed") {

    const invoice = event.data.object as Stripe.Invoice;

    const subscriptionId = (invoice as any).subscription as string;

    if (!subscriptionId) return;

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (!subscription) return;

    subscription.status = SubscriptionStatus.PENDING;

    await subscription.save();
  }
};

/* ------------------------------------------------------- */
/* GET MY SUBSCRIPTIONS */
/* ------------------------------------------------------- */

const getMySubscriptions = async (userId: string) => {

  return Subscription.find({ userId }).sort({ createdAt: -1 });
};

/* ------------------------------------------------------- */
/* TURN OFF AUTO RENEW */
/* ------------------------------------------------------- */

const turnOffAutoRenew = async (userId: string) => {

  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });

  if (!subscription)
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Active subscription not found"
    );

  // TRIAL subscription
  if (
    subscription.plan_type === Plan.TRIAL ||
    subscription.stripeSubscriptionId.startsWith("TRIAL")
  ) {

    subscription.auto_renew = false;

    await subscription.save();

    return {
      message: "Trial subscription auto-renew disabled",
      end_date: subscription.end_date,
    };
  }

  // Paid subscription

  await stripe.subscriptions.update(
    subscription.stripeSubscriptionId,
    {
      cancel_at_period_end: true,
    }
  );

  subscription.auto_renew = false;

  await subscription.save();

  return {
    message: "Auto renew turned off",
    end_date: subscription.end_date,
  };
};

/* ------------------------------------------------------- */
/* RESTORE SUBSCRIPTION */
/* ------------------------------------------------------- */

const restoreSubscription = async (userId: string) => {

  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.CANCELLED,
  });

  if (!subscription)
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "No cancelled subscription found"
    );

  if (new Date(subscription.end_date) < new Date()) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Subscription expired"
    );
  }

  await stripe.subscriptions.update(
    subscription.stripeSubscriptionId,
    {
      cancel_at_period_end: false,
    }
  );

  subscription.status = SubscriptionStatus.ACTIVE;

  await subscription.save();

  return {
    message: "Subscription restored successfully",
    subscription,
  };
};

/* ------------------------------------------------------- */
/* ADMIN: GET ALL SUBSCRIPTIONS */
/* ------------------------------------------------------- */

const getAllSubscriptions = async () => {

  return Subscription.find().sort({ createdAt: -1 });
};

export const subscriptionService = {

  createTrialSubscription,

  createPaymentIntent,

  stripeWebhookHandler,

  getMySubscriptions,

  turnOffAutoRenew,

  getAllSubscriptions,

  restoreSubscription,
};