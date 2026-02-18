import express from "express";
import { subscriptionController } from "./subscription.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";

const router = express.Router();

router.get(
  "/my",
  checkAuth(Role.USER),
  subscriptionController.getMySubscriptions,
);
router.patch(
  "/auto_renew/off",
  checkAuth(Role.USER),
  subscriptionController.turnOffAutoRenew,
);
router.post(
  "/me/subscription/restore",
  checkAuth(Role.USER),
  subscriptionController.restoreSubscription,
);

router.get(
  "/all",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  subscriptionController.getAllSubscriptions,
);

router.post(
  "/intent",
  checkAuth(Role.USER),
  subscriptionController.createPaymentIntent,
);

router.patch(
  "/upgrade",
  checkAuth(Role.USER),
  subscriptionController.upgradeSubscription,
);

// Create 30-day trial
router.post(
  "/create-trial",
  checkAuth(Role.USER),
  subscriptionController.createTrialSubscriptionController,
);

export const SubscriptionRoute = router;
