import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../helper/validateRequest";
import { FeedbackValidation } from "./feedback.validation";
import { feedbackController } from "./feedback.controller";

const router = Router();

// USER: submit feedback (optional images)
router.post(
  "/",
  checkAuth(Role.USER),
  validateRequest(FeedbackValidation.createFeedbackValidationSchema),
  feedbackController.createFeedback,
);

// USER: my feedbacks
router.get(
  "/me",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  feedbackController.getMyFeedbacks,
);

// ADMIN: list all feedbacks
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  feedbackController.getAllFeedbacks,
);

export const feedbackRoutes = router;
