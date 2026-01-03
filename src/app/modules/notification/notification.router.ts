import express from "express";
import { NotificationController } from "./notification.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";

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
  // validateRequest(NotificationValidation.updateNotificationPreferencesSchema),
  NotificationController.updateNotificationPreferences
);

router.get(
  "/my_notifications",
  checkAuth(...Object.keys(Role)),
  NotificationController.getUserNotifications
);

export const notifyRoute = router;
