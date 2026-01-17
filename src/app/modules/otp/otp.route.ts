import { Router } from "express";
import { otpController } from "./otp.controller";

const router = Router();

router.post("/send-otp", otpController.sendVerificationOtpHandler);
router.post("/verify-otp", otpController.verifyOtpHandler);
router.post("/forgot-password-send-otp", otpController.sendForgotOtpHandler);
router.post(
  "/forgot-password-verify-otp",
  otpController.verifyForgotOtpHandler
);

export const otpRouter = router;
