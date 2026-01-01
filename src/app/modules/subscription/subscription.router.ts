import express from "express";
import { subscriptionController } from "./subscription.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";

const router = express.Router();

router.post(
  "/create-subscription",
  checkAuth(Role.USER),
  subscriptionController.createCheckoutSession
);

router.get(
  "/my",
  checkAuth(Role.USER),
  subscriptionController.getMySubscriptions
);

export const SubscriptionRoute = router;
