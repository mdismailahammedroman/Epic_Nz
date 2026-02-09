/* eslint-disable @typescript-eslint/no-explicit-any */
import { stripe } from "../../helper/stripe";
import { envVar } from "../../config/envVar";

import AppError from "../../errorHelper/AppError";
import Stripe from "stripe";
import Subscription from "./Subscription.model";
import { Plan, SubscriptionStatus } from "./subscription.interface";
import { StatusCodes } from "http-status-codes";
import User from "../user/user.model";

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

// createTrialSubscription

const createTrialSubscription = async (userId: string) => {
  const existing = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });

  if (existing) {
    throw new AppError(400, "Already have an active subscription");
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  const trial = await Subscription.create({
    userId,
    plan_type: Plan.TRIAL,
    stripeSubscriptionId: "TRIAL",
    stripeCustomerId: "TRIAL",
    start_date: startDate,
    end_date: endDate,
    status: SubscriptionStatus.ACTIVE,
    ai_features_access: true,
    ads_free: false,
    auto_renew: false,
    total_spent: 0,
  });

  return trial;
};

// Upgrade Subscription Logic
const upgradeSubscription = async (userId: string, newPlan: Plan) => {
  // 1️⃣ Fetch current active subscription
  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });

  if (!subscription) {
    throw new AppError(StatusCodes.NOT_FOUND, "No active subscription found");
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  let customerId = subscription.stripeCustomerId;

  // 2️⃣ Create Stripe customer if missing or TRIAL
  if (!customerId || customerId === "TRIAL") {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: { userId },
    });
    customerId = customer.id;
    subscription.stripeCustomerId = customerId;
    await subscription.save();
  }

  // 3️⃣ Check default payment method
  const stripeCustomer = await stripe.customers.retrieve(customerId);
  const defaultPaymentMethod = (stripeCustomer as any).invoice_settings
    ?.default_payment_method;

  if (!defaultPaymentMethod) {
    return {
      status: "requires_payment_method",
      message:
        "No payment method attached. Please attach a card to upgrade subscription.",
      customerId,
    };
  }

  const priceId =
    newPlan === Plan.MONTHLY ? envVar.PRICE_MONTHLY : envVar.PRICE_YEARLY;

  // 4️⃣ Trial → Paid upgrade
  if (subscription.plan_type === Plan.TRIAL) {
    const stripeSub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId, plan_type: newPlan },
      default_payment_method: defaultPaymentMethod,
    });

    const invoice = stripeSub.latest_invoice as Stripe.Invoice;
    const paymentIntent = (invoice as any)
      .payment_intent as Stripe.PaymentIntent;

    subscription.plan_type = newPlan;
    subscription.stripeSubscriptionId = stripeSub.id;
    subscription.status = SubscriptionStatus.PENDING;
    subscription.start_date = new Date();
    subscription.end_date =
      newPlan === Plan.MONTHLY
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await subscription.save();

    return {
      stripeSubscriptionId: stripeSub.id,
      clientSecret: paymentIntent.client_secret,
      plan: newPlan,
      end_date: subscription.end_date,
      status: subscription.status,
      message:
        "Trial upgraded to paid subscription. Complete payment to activate.",
    };
  }

  // 5️⃣ Monthly → Yearly upgrade
  if (subscription.plan_type === Plan.MONTHLY && newPlan === Plan.YEARLY) {
    // Retrieve current subscription from Stripe
    const stripeSub = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );

    // Update subscription with new price
    const updatedSub = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{ id: stripeSub.items.data[0].id, price: priceId }],
        proration_behavior: "create_prorations",
        expand: ["latest_invoice.payment_intent"],
        metadata: { userId, plan_type: newPlan },
        default_payment_method: defaultPaymentMethod,
      },
    );

    const invoice = updatedSub.latest_invoice as Stripe.Invoice;
    const paymentIntent = (invoice as any)
      .payment_intent as Stripe.PaymentIntent;

    // Update DB immediately as PENDING
    subscription.plan_type = newPlan;
    subscription.stripeSubscriptionId = updatedSub.id;
    subscription.start_date = new Date();
    subscription.end_date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    subscription.status =
      paymentIntent.status === "succeeded"
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.PENDING;

    await subscription.save();

    return {
      stripeSubscriptionId: updatedSub.id,
      clientSecret: paymentIntent.client_secret,
      plan: newPlan,
      end_date: subscription.end_date,
      status: subscription.status,
      message:
        paymentIntent.status === "succeeded"
          ? "Monthly subscription upgraded to yearly successfully!"
          : "Payment required to complete yearly upgrade",
    };
  }

  // 6️⃣ Already on requested plan
  if (subscription.plan_type === newPlan) {
    return {
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      plan: subscription.plan_type,
      end_date: subscription.end_date,
      status: subscription.status,
      message: `Already on ${newPlan} plan`,
    };
  }

  // 7️⃣ Invalid downgrade
  throw new AppError(
    StatusCodes.BAD_REQUEST,
    "Invalid subscription upgrade request",
  );
};

// ================= Stripe Webhook Handler =================
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

// STRIPE WEBHOOK HANDLER
// const stripeWebhookHandler = async (event: Stripe.Event) => {
//   // if (event.type === "checkout.session.completed") {
//   //   const session = event.data.object as Stripe.Checkout.Session;
//   //   const userId = session.metadata?.userId;
//   //   const plan_type = session.metadata?.plan_type as Plan;

//   //   if (!userId || !plan_type) return;

//   //   const stripeSubscriptionId = session.subscription as string;
//   //   const startDate = new Date();

//   //   const endDate =
//   //     plan_type === Plan.MONTHLY
//   //       ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
//   //       : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

//   //   await Subscription.findOneAndUpdate(
//   //     { userId },
//   //     {
//   //       userId,
//   //       stripeSubscriptionId,
//   //       stripeCustomerId: session.customer as string,
//   //       plan_type,
//   //       status: SubscriptionStatus.ACTIVE,
//   //       ai_features_access: true,
//   //       start_date: startDate,
//   //       end_date: endDate,
//   //     },
//   //     { upsert: true, new: true },
//   //   );

//   //   console.log(`✔ Subscription stored for user ${userId}`);
//   // } else
//   if (event.type === "invoice.payment_succeeded") {
//     const invoice = event.data.object as Stripe.Invoice;
//     const subscriptionId = (invoice as any).subscription as string;

//     if (!subscriptionId) return;

//     const subscription = await Subscription.findOne({
//       stripeSubscriptionId: subscriptionId,
//     });
//     if (subscription) {
//       await Subscription.findByIdAndUpdate(subscription._id, {
//         status: SubscriptionStatus.ACTIVE,
//         ai_features_access: true,
//         ads_free: true,
//         total_spent: subscription.total_spent + invoice.amount_paid / 100,
//       });
//     }
//   }
// };

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

  // 🛑 TRIAL হলে Stripe call করবে না
  if (
    subscription.plan_type === Plan.TRIAL ||
    subscription.stripeSubscriptionId === "TRIAL"
  ) {
    subscription.auto_renew = false;
    await subscription.save();

    return {
      message: "Trial subscription auto-renew already disabled",
      end_date: subscription.end_date,
    };
  }

  // ✅ PAID subscription
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // ✅ Update DB immediately
  subscription.auto_renew = false;
  await subscription.save();

  return {
    message: "Auto-renew turned off successfully",
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

export const subscriptionService = {
  createTrialSubscription,
  createPaymentIntent,
  stripeWebhookHandler,
  upgradeSubscription,
  getMySubscriptions,
  turnOffAutoRenew,
  getAllSubscriptions,
  restoreSubscription,
};
