import { Router } from "express";
import { otpController } from "./otp.controller";

const router = Router();
router.post("/send-otp", otpController.sendOtpHandler);
router.post("/verify-otp", otpController.verifyOtpHandler);
export const otpRouter = router;
