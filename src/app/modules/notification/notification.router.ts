import { Router } from "express";
import { notificationController } from "./notification.controller";
import { Role } from "../user/user.interface";
import { checkAuth } from "../../middleware/checkAuth.middleware";

const router = Router();

// Only ADMIN or SUPER_ADMIN can send category-wise notifications
router.post(
  "/send",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),

  notificationController.sendNotification
);

export const notifyRoute = router;
