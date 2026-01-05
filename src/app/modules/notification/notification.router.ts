import express from "express";
import { NotificationController } from "./notification.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";
import { NotificationValidation } from "./notification.validation";
import { validateRequest } from "../../helper/validateRequest";

const router = express.Router();

// Get user's notification preferences
router.get(
  "/preferences",
  checkAuth(),
  NotificationController.getUserNotificationPreferences
);

// Update notification preferences (bulk update)
router.patch(
  "/preferences",
  checkAuth(),
  validateRequest(NotificationValidation.updateNotificationPreferencesSchema),
  NotificationController.updateNotificationPreferences
);

router.get(
  "/my_notifications",
  checkAuth(...Object.keys(Role)),
  NotificationController.getUserNotifications
);
router.post(
  "/push_notification",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(NotificationValidation.pushNotificationSchema),
  NotificationController.pushNotification
);
router.post(
  "/notify_nearby_users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(NotificationValidation.notifyNearbyUsersSchema),
  NotificationController.notifyNearbyUsers
);

export const notifyRoute = router;
