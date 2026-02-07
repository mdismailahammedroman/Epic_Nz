import { createNewAccessTokenWithRefreshToken } from "./../../utils/userToken";
import { authController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";
import passport from "passport";
import { Router } from "express";
import { envVar } from "../../config/envVar";

const router = Router();

// Login & Logout
router.post("/login", authController.credentialLogin);

// Google OAuth start
router.get(
  "/google",
  authController.googleStart, // builds safe state + calls passport.authenticate
);

// Google callback (NO double authenticate)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${envVar.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  authController.googleCallback,
);

// Logout
router.post("/logout", authController.logout);

// Refresh Access Token
router.post("/refresh", createNewAccessTokenWithRefreshToken);

// Change Password (protected)
router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  authController.changePassword,
);

// Forget Password (send OTP or reset link)
router.post("/forget-password", authController.forgetPassword);

// Reset Password using email + OTP
router.post(
  "/reset-password",

  authController.resetPassword,
);
// set Password using email + OTP
router.post(
  "/set-password",
  checkAuth(...Object.values(Role)),
  authController.setPassword,
);

export const AuthRouter = router;
