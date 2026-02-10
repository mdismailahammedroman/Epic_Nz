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
  // ✅ Only allow MONTHLY → YEARLY
  if (newPlan !== Plan.YEARLY) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only yearly upgrade is allowed",
    );
  }

  // 1️⃣ Get active subscription
  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
    plan_type: Plan.MONTHLY,
  });

  if (!subscription) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Active monthly subscription required",
    );
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  // 2️⃣ Stripe customer must exist
  if (
    !subscription.stripeCustomerId ||
    subscription.stripeCustomerId === "TRIAL"
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Stripe customer not found. Please add payment method first",
    );
  }

  const customerId = subscription.stripeCustomerId;

  // 3️⃣ Check default payment method
  const stripeCustomer = await stripe.customers.retrieve(customerId);
  const defaultPaymentMethod = (stripeCustomer as any).invoice_settings
    ?.default_payment_method;

  if (!defaultPaymentMethod) {
    return {
      status: "requires_payment_method",
      message: "Please attach a card to upgrade subscription",
      customerId,
    };
  }

  // 4️⃣ Retrieve Stripe subscription
  const stripeSub = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
  );

  // 5️⃣ Update Stripe subscription → YEARLY
  const updatedSub = await stripe.subscriptions.update(
    subscription.stripeSubscriptionId,
    {
      items: [
        {
          id: stripeSub.items.data[0].id,
          price: envVar.PRICE_YEARLY,
        },
      ],
      proration_behavior: "create_prorations",
      expand: ["latest_invoice.payment_intent"],
      default_payment_method: defaultPaymentMethod,
      metadata: {
        userId,
        plan_type: Plan.YEARLY,
      },
    },
  );

  const invoice = updatedSub.latest_invoice as Stripe.Invoice;
  const paymentIntent = (invoice as any)
    .payment_intent as Stripe.PaymentIntent | null;

  // 6️⃣ Update DB → PENDING until webhook confirms
  subscription.plan_type = Plan.YEARLY;
  subscription.status =
    paymentIntent?.status === "succeeded"
      ? SubscriptionStatus.ACTIVE
      : SubscriptionStatus.PENDING;

  subscription.start_date = new Date();
  subscription.end_date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await subscription.save();

  return {
    stripeSubscriptionId: updatedSub.id,
    clientSecret: paymentIntent?.client_secret,
    plan: Plan.YEARLY,
    end_date: subscription.end_date,
    status: subscription.status,
    message:
      paymentIntent?.status === "succeeded"
        ? "Subscription upgraded to yearly successfully"
        : "Payment required to complete yearly upgrade",
  };
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
