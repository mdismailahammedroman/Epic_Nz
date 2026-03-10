import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { subscriptionService } from "./subscription.service";
import { sendResponse } from "../../utils/SendResponse";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelper/AppError";
import { JwtPayload } from "jsonwebtoken";
import { envVar } from "../../config/envVar";
import { stripe } from "../../helper/stripe";
import { logActivity } from "../../utils/logActivity.utils";

const createSubscription = CatchAsync(async (req: Request, res: Response) => {

  const userId = (req.user as JwtPayload).userId;
  const { plan } = req.body;

  const result = await subscriptionService.createSubscriptionPayment(
    userId,
    plan
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Subscription initialized",
    data: result,
  });
});

const createTrial = CatchAsync(async (req: Request, res: Response) => {

  const userId = (req.user as JwtPayload).userId;

  const trial = await subscriptionService.createTrialSubscription(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Trial activated",
    data: trial,
  });
});


const stripeWebhook =CatchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

  const event = stripe.webhooks.constructEvent(
    req.body,
    signature,
    envVar.STRIPE_WEBHOOK_SECRET
  );

  await subscriptionService.stripeWebhookHandler(event);

  res.json({ received: true });
});


const getMySubscriptions = CatchAsync(async (req: Request, res: Response) => {
  const subs = await subscriptionService.getMySubscriptions(
    (req.user as JwtPayload).userId,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Subscriptions fetched",
    data: subs,
  });
});

const turnOffAutoRenew = CatchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;

  const result = await subscriptionService.turnOffAutoRenew(userId);

  logActivity({
    actorId: userId,
    actorRole: (req.user as JwtPayload).role,
    action: "turn Off Auto Renew",
    entityType: "Subscription",
    message: "turn Off Auto Renew",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
    meta: { result },
  }).catch(console.error);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: { end_date: result.end_date },
  });
});
// GET /users/me/subscription → Fetch subscription info
const getSubscriptionInfo = CatchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const subscription = await subscriptionService.getMySubscriptions(userId);

  if (!subscription || subscription.length === 0) {
    throw new AppError(StatusCodes.NOT_FOUND, "No subscription found");
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Subscription fetched",
    data: subscription,
  });
});

// POST /users/me/subscription/cancel → Cancel subscription
const cancelSubscription = CatchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;

  const result = await subscriptionService.turnOffAutoRenew(userId);

  logActivity({
    actorId: userId,
    actorRole: (req.user as JwtPayload).role,
    action: "SUBSCRIPTION_CANCELLED",
    entityType: "Subscription",
    message: "Subscription cancelled",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
  }).catch(console.error);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: { end_date: result.end_date },
  });
});

// POST /users/me/subscription/restore → Restore purchase
const restoreSubscription = CatchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;

  const result = await subscriptionService.restoreSubscription(userId);

  logActivity({
    actorId: userId,
    actorRole: (req.user as JwtPayload).role,
    action: "SUBSCRIPTION_RESTORED",
    entityType: "Subscription",
    message: "Subscription restored",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
  }).catch(console.error);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.status === "ACTIVE" ? "Subscription restored" : "Subscription updated",
    data: result,
  });
});

const getAllSubscriptions = CatchAsync(async (req: Request, res: Response) => {
  const subscriptions = await subscriptionService.getAllSubscriptions();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All subscriptions fetched",
    data: subscriptions,
  });
});

export const subscriptionController = {
  createSubscription,
  stripeWebhook,
  getMySubscriptions,
  turnOffAutoRenew,
  getSubscriptionInfo,
  cancelSubscription,
  restoreSubscription,
  getAllSubscriptions,
  createTrial,

};
