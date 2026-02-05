import { checkAuth } from "./../../middleware/checkAuth.middleware";
import { Router } from "express";
import { activityLogController } from "./activityLog.controller";
import { Role } from "../user/user.interface";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN),
  activityLogController.getActivityLogList,
);

export const activityLogRoute = router;
