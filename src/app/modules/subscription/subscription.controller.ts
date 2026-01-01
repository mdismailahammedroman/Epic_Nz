import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { subscriptionService } from "./subscription.service";
import { sendResponse } from "../../utils/SendResponse";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelper/AppError";
import { JwtPayload } from "jsonwebtoken";
import Stripe from "stripe";
import { envVar } from "../../config/envVar";
import { stripe } from "../../helper/stripe";

const createCheckoutSession = CatchAsync(
  async (req: Request, res: Response) => {
    const { plan } = req.body;
    if (!plan) throw new AppError(StatusCodes.BAD_REQUEST, "Plan required");

    const userId = (req.user as JwtPayload).userId;

    const session = await subscriptionService.createCheckoutSession({
      userId,
      plan_type: plan,
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Checkout session created",
      data: session,
    });
  }
);

const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  if (!signature) return res.status(400).send("Missing signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      envVar.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    return res.status(400).send(err.message);
  }

  await subscriptionService.stripeWebhookHandler(event);
  res.json({ received: true });
};

const getMySubscriptions = CatchAsync(async (req: Request, res: Response) => {
  const subs = await subscriptionService.getMySubscriptions(
    (req.user as JwtPayload).userId
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Subscriptions fetched",
    data: subs,
  });
});

export const subscriptionController = {
  createCheckoutSession,
  stripeWebhook,
  getMySubscriptions,
};
