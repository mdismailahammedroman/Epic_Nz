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
        total_spent: subscription.total_spent + invoice.amount_paid / 100,
      });
    }
  }
};

// upgradeSubscription

// const upgradeTrialToPaid = async (userId: string, newPlan: Plan) => {
//   const subscription = await Subscription.findOne({
//     userId,
//     status: SubscriptionStatus.ACTIVE,
//   });

//   if (!subscription || subscription.plan_type !== Plan.TRIAL) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       "No active trial subscription found",
//     );
//   }

//   // Fetch the user to get email and name
//   const user = await User.findById(userId);
//   if (!user) {
//     throw new AppError(StatusCodes.NOT_FOUND, "User not found");
//   }

//   // Ensure Stripe customer exists
//   let customerId = subscription.stripeCustomerId;
//   if (!customerId) {
//     const customer = await stripe.customers.create({
//       email: user.email,
//       name: user.full_name,
//       metadata: { userId },
//     });
//     customerId = customer.id;
//     subscription.stripeCustomerId = customerId;
//   }

//   const priceId =
//     newPlan === Plan.MONTHLY ? envVar.PRICE_MONTHLY : envVar.PRICE_YEARLY;

//   // Create Stripe subscription
//   const stripeSub = await stripe.subscriptions.create({
//     customer: customerId,
//     items: [{ price: priceId }],
//     payment_behavior: "default_incomplete",
//     expand: ["latest_invoice.payment_intent"],
//     metadata: { userId, plan_type: newPlan },
//   });

//   const startDate = new Date();
//   const endDate =
//     newPlan === Plan.MONTHLY
//       ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
//       : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

//   subscription.plan_type = newPlan;
//   subscription.stripeSubscriptionId = stripeSub.id;
//   subscription.start_date = startDate;
//   subscription.end_date = endDate;
//   subscription.status = SubscriptionStatus.PENDING; // until payment confirmed
//   subscription.auto_renew = true;

//   await subscription.save();

//   return {
//     stripeSubscriptionId: stripeSub.id,
//     plan: newPlan,
//     end_date: endDate,
//   };
// };

// Upgrade Subscription Logic
const upgradeSubscription = async (userId: string, newPlan: Plan) => {
  // 1️⃣ Get current active subscription
  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE,
  });

  if (!subscription) {
    throw new AppError(StatusCodes.NOT_FOUND, "No active subscription found");
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, "User not found");

  // 2️⃣ Handle Trial → Paid upgrade
  if (subscription.plan_type === Plan.TRIAL) {
    // Create Stripe customer if needed
    let customerId = subscription.stripeCustomerId;
    if (!customerId || customerId === "TRIAL") {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { userId },
      });
      customerId = customer.id;
      subscription.stripeCustomerId = customerId;
    }

    const priceId =
      newPlan === Plan.MONTHLY ? envVar.PRICE_MONTHLY : envVar.PRICE_YEARLY;

    const stripeSub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId, plan_type: newPlan },
    });

    subscription.stripeSubscriptionId = stripeSub.id;
    subscription.plan_type = newPlan;
    subscription.status = SubscriptionStatus.PENDING;
    subscription.start_date = new Date();
    subscription.end_date =
      newPlan === Plan.MONTHLY
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await subscription.save();

    return {
      stripeSubscriptionId: stripeSub.id,
      plan: newPlan,
      end_date: subscription.end_date,
      message: "Trial upgraded to paid subscription",
    };
  }

  // 3️⃣ Handle Monthly → Yearly upgrade
  if (subscription.plan_type === Plan.MONTHLY) {
    if (newPlan === Plan.MONTHLY) {
      return {
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        plan: subscription.plan_type,
        end_date: subscription.end_date,
        message: "Already on monthly plan",
      };
    }

    const stripeSub = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );
    const itemId = stripeSub.items.data[0].id;

    const priceId = envVar.PRICE_YEARLY;

    const updatedStripeSub = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{ id: itemId, price: priceId }],
        proration_behavior: "create_prorations",
        metadata: { userId, plan_type: newPlan },
      },
    );

    subscription.plan_type = newPlan;
    subscription.start_date = new Date();
    subscription.end_date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await subscription.save();

    return {
      stripeSubscriptionId: updatedStripeSub.id,
      plan: newPlan,
      end_date: subscription.end_date,
      message: "Monthly subscription upgraded to yearly",
    };
  }

  // 4️⃣ Already on yearly
  if (subscription.plan_type === Plan.YEARLY) {
    if (newPlan === Plan.YEARLY) {
      return {
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        plan: subscription.plan_type,
        end_date: subscription.end_date,
        message: "Already on yearly plan",
      };
    }
    // Optional: yearly → monthly downgrade if you allow
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Downgrade from yearly to monthly not allowed",
    );
  }

  throw new AppError(StatusCodes.BAD_REQUEST, "Invalid subscription state");
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
