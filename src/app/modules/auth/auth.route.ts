import { createNewAccessTokenWithRefreshToken } from "./../../utils/userToken";
import { authController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth.middleware";
import { Role } from "../user/user.interface";
import passport from "passport";
import { NextFunction, Request, Response, Router } from "express";
import { envVar } from "../../config/envVar";

const router = Router();

// Login & Logout
router.post("/login", authController.credentialLogin);

// Google OAuth
router.get(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect as string,
    })(req, res, next);
  }
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${envVar.FRONTEND_URL}/login?error=There is some issues with your account. Please contact with out support team!`,
  }),
  authController.googleCallbackController
);

// Logout
router.post("/logout", authController.logout);

// Refresh Access Token
router.post("/refresh", createNewAccessTokenWithRefreshToken);

// Change Password (protected)
router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  authController.changePassword
);

// Forget Password (send OTP or reset link)
router.post("/forget-password", authController.forgetPassword);

// Reset Password using email + OTP
router.post(
  "/reset-password",

  authController.resetPassword
);
// set Password using email + OTP
router.post(
  "/set-password",
  checkAuth(...Object.values(Role)),
  authController.setPassword
);

export const AuthRouter = router;
