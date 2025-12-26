import { createNewAccessTokenWithRefreshToken } from "./../../utils/userToken";
import { Router } from "express";
import { authController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";

const router = Router();

// Login & Logout
router.post("/login", authController.credentialLogin);
router.post(
  "/logout",
  checkAuth(...Object.values(Role)),
  authController.logout
);

// Refresh Access Token
router.post("/refresh", createNewAccessTokenWithRefreshToken);

// Change Password (protected)
router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  authController.changePassword
);

// Forget Password (send OTP or reset link)
router.post("/forget-password/:email", authController.forgetPassword);

// Reset Password using email + OTP
router.post("/reset-password/:email/:otp", authController.resetPassword);

export const AuthRouter = router;
