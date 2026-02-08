/* eslint-disable @typescript-eslint/no-explicit-any */
import { stripe } from "../../helper/stripe";
import { envVar } from "../../config/envVar";
import User from "../user/user.model";
import AppError from "../../errorHelper/AppError";
import Stripe from "stripe";
import Subscription from "./Subscription.model";
import {
  ICreateCheckoutSession,
  Plan,
  SubscriptionStatus,
} from "./subscription.interface";
import { StatusCodes } from "http-status-codes";

// CREATE CHECKOUT SESSION
const createCheckoutSession = async ({
  userId,
  plan_type,
}: ICreateCheckoutSession) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  const priceId =
    plan_type === Plan.MONTHLY ? envVar.PRICE_MONTHLY : envVar.PRICE_YEARLY;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${envVar.APP_URL}/subscription-success`,
    cancel_url: `${envVar.APP_URL}/subscription-cancel`,
    metadata: { userId, plan_type },
  });

  return { id: session.id, url: session.url };
};

// STRIPE WEBHOOK HANDLER
const stripeWebhookHandler = async (event: Stripe.Event) => {
  // if (event.type === "checkout.session.completed") {
  //   const session = event.data.object as Stripe.Checkout.Session;
  //   const userId = session.metadata?.userId;
  //   const plan_type = session.metadata?.plan_type as Plan;

  //   if (!userId || !plan_type) return;

  //   const stripeSubscriptionId = session.subscription as string;
  //   const startDate = new Date();

  //   const endDate =
  //     plan_type === Plan.MONTHLY
  //       ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  //       : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

  //   await Subscription.findOneAndUpdate(
  //     { userId },
  //     {
  //       userId,
  //       stripeSubscriptionId,
  //       stripeCustomerId: session.customer as string,
  //       plan_type,
  //       status: SubscriptionStatus.ACTIVE,
  //       ai_features_access: true,
  //       start_date: startDate,
  //       end_date: endDate,
  //     },
  //     { upsert: true, new: true },
  //   );

  //   console.log(`✔ Subscription stored for user ${userId}`);
  // } else
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as any).subscription as string;

    if (!subscriptionId) return;

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: subscriptionId,
    });
    if (subscription) {
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: SubscriptionStatus.ACTIVE,
        ai_features_access: true,
        ads_free: true,
      });
      console.log(`✔ Subscription activated for ${subscription.userId}`);
    }
  }
};

// GET MY SUBSCRIPTIONS
const getMySubscriptions = async (userId: string) => {
  return Subscription.find({ userId }).sort({ createdAt: -1 });
};
const turnOffAutoRenew = async (userId: string) => {
  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });

  if (!subscription) {
    throw new AppError(StatusCodes.NOT_FOUND, "Active subscription not found");
  }

  // 1️⃣ Tell Stripe to stop renewing
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // 2️⃣ Update local DB
  subscription.auto_renew = false;
  await subscription.save();

  return {
    message: "Auto-renew turned off. Subscription will expire at period end.",
    end_date: subscription.end_date,
  };
};
const restoreSubscription = async (userId: string) => {
  // Find the canceled subscription
  const subscription = await Subscription.findOne({
    userId,
    status: "canceled", // Assuming a status 'canceled' exists for canceled subscriptions
  });

  if (!subscription) {
    throw new AppError(StatusCodes.NOT_FOUND, "No canceled subscription found");
  }

  // Check if the subscription can be restored (based on business logic)
  if (new Date(subscription.end_date) < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Subscription has expired");
  }

  // Re-activate subscription with Stripe (if applicable)
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  // Update local subscription status
  subscription.status = SubscriptionStatus.ACTIVE; // Or any status indicating it's active
  await subscription.save();

  return {
    message: "Subscription restored successfully",
    subscription,
  };
};

// Fetch all subscriptions for the admin
const getAllSubscriptions = async () => {
  return Subscription.find().sort({ createdAt: -1 }); // You can modify the sorting as per your requirement
};

const createPaymentIntent = async (userId: string, plan: Plan) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  let customerId = user.stripeCustomerId;

  // 1. Create a Stripe Customer if not exists
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: { userId },
    });
    customerId = customer.id;

    // Save customer ID to user
    await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
  }

  const priceId =
    plan === Plan.MONTHLY ? envVar.PRICE_MONTHLY : envVar.PRICE_YEARLY;

  // 2. Create a Subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
    metadata: { userId, plan_type: plan },
  });

  let invoice = subscription.latest_invoice as Stripe.Invoice;
  let paymentIntent = (invoice as any)
    .payment_intent as Stripe.PaymentIntent | null;

  // If payment_intent is missing, try to retrieve the invoice explicitly
  if (!paymentIntent) {
    // console.log("Re-fetching invoice to get payment_intent...");
    const retrievedInvoice = await stripe.invoices.retrieve(invoice.id, {
      expand: ["payment_intent"],
    });
    invoice = retrievedInvoice;
    paymentIntent = (invoice as any)
      .payment_intent as Stripe.PaymentIntent | null;
  }

  if (!paymentIntent) {
    console.error(
      "CRITICAL: Payment Intent missing. Invoice:",
      JSON.stringify(invoice, null, 2),
    );
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to initialize payment.",
    );
  }

  // Save subscription to DB as PENDING
  const startDate = new Date();
  const endDate =
    plan === Plan.MONTHLY
      ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

  await Subscription.create({
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    plan_type: plan,
    status: SubscriptionStatus.PENDING,
    ai_features_access: false,
    start_date: startDate,
    end_date: endDate,
  });

  return {
    subscriptionId: subscription.id,
    clientSecret: paymentIntent.client_secret,
    customerId,
  };
};
export const subscriptionService = {
  createCheckoutSession,
  stripeWebhookHandler,
  getMySubscriptions,
  turnOffAutoRenew,
  getAllSubscriptions,
  restoreSubscription,
  createPaymentIntent,
};
