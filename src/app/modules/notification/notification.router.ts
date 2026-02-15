import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";
import { NotificationController } from "./notification.controller";

const router = Router();

router.get(
  "/me",
  checkAuth(...Object.values(Role)),
  NotificationController.myNotifications,
);
router.patch(
  "/read/:notificationId",
  checkAuth(...Object.values(Role)),
  NotificationController.markRead,
);

router.patch(
  "/read-all",
  checkAuth(...Object.values(Role)),
  NotificationController.markAllRead,
);

router.delete(
  "/delete/:id",
  checkAuth(...Object.values(Role)),
  NotificationController.deleteNotificationController,
);

router.get(
  "/all",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN), // only admin roles
  NotificationController.getAllNotifications,
);

export const notificationRoutes = router;
