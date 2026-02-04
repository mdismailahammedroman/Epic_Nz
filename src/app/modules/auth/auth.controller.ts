/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import passport from "../../config/passport.config";
import AppError from "../../errorHelper/AppError";
import {
  createNewAccessTokenWithRefreshToken,
  createUserTokens,
} from "../../utils/userToken";
import { sendResponse } from "../../utils/SendResponse";
import { setAuthCookie } from "../../utils/SetCookies";
import { authService } from "./auth.service";
import { envVar } from "../../config/envVar";
import { IUser, Role } from "../user/user.interface";
import { JwtPayload } from "jsonwebtoken";
import { logActivity } from "../../utils/logActivity.utils";
import { normalizeTokens } from "../../utils/normalizeTokens";
import User from "../user/user.model";

const credentialLogin = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return next(new AppError(StatusCodes.FORBIDDEN, info.message));
      }

      const { fcmToken, fcmTokens } = req.body;
      const tokens = normalizeTokens(fcmTokens ?? fcmToken);

      // ✅ store token(s) on login (no duplicates)
      if (tokens.length > 0) {
        await User.findByIdAndUpdate(
          user._id,
          { $addToSet: { fcmTokens: { $each: tokens } } },
          { new: false },
        );
      }
      const userTokens = createUserTokens(user);
      setAuthCookie(res, userTokens);

      await logActivity({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: "USER_LOGIN",
        entityType: "Auth",
        message: "User Login",
        ip: req.ip,
        userAgent: req.headers["user-agent"] as string,
        meta: { targetName: "Dashboard" },
      });

      // Send response with the user tokens and location data (placeName)
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Login success",
        data: {
          accessToken: userTokens.accessToken,
          refreshToken: userTokens.refreshToken,
        },
      });
    })(req, res, next);
  },
);

// Add googleCallback handler
const googleCallbackController = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let redirectTo = typeof req.query.state === "string" ? req.query.state : "";
    if (redirectTo.startsWith("/")) {
      redirectTo = redirectTo.slice(1);
    }

    if (redirectTo.includes("://") || redirectTo.startsWith("//")) {
      redirectTo = "";
    }

    const user = req.user as IUser | undefined;
    if (!user) {
      return next(new AppError(StatusCodes.NOT_FOUND, "User not found"));
    }

    const tokenInfo = createUserTokens(user);
    setAuthCookie(res, tokenInfo);

    // // ✅ Activity Log for Google Login
    // await logActivity({
    //   actorId: user._id.toString(),
    //   actorRole: user.role,
    //   action: "USER_LOGIN",
    //   entityType: "Auth",
    //   message: "User Login via Google",
    //   ip: req.ip,
    //   userAgent: req.headers["user-agent"] as string,
    //   meta: { provider: "google" },
    // });

    const redirectUrl = `epicnz://auth?token=${tokenInfo.accessToken}`;
    return res.redirect(redirectUrl);
  },
);

const logout = CatchAsync(async (req: Request, res: Response) => {
  const isProduction = envVar.NODE_ENV === "production";

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  await logActivity({
    actorId: (req.user as JwtPayload).userId,
    actorRole: (req.user as JwtPayload).role,
    action: "USER_LOGOUT",
    entityType: "Auth",
    message: "User Logout",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Logged out successfully",
  });
});

// Refresh Token
const refreshToken = CatchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.headers.authorization;
  if (!refreshToken)
    throw new AppError(StatusCodes.UNAUTHORIZED, "Refresh token not provided");

  const newAccessToken =
    await createNewAccessTokenWithRefreshToken(refreshToken);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Access token refreshed",
    data: { accessToken: newAccessToken },
  });
});

// Change Password (protected)
const changePassword = CatchAsync(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user as string;
  await authService.changePassword(userId, oldPassword, newPassword);

  logActivity({
    actorId: userId,
    actorRole: "USER",
    action: "PASSWORD_CHANGED",
    entityType: "Auth",
    message: "Password changed",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
  }).catch(console.error);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password changed successfully",
    data: null,
  });
});

// Forget Password (send OTP/email)
const forgetPassword = CatchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgetPassword(email);
  logActivity({
    actorId: "000000000000000000000000", // system/guest placeholder (better: allow actorId optional)
    actorRole: "GUEST",
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "Auth",
    message: "Forget password requested",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
    meta: { email },
  }).catch(console.error);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password reset email sent",
    data: null,
  });
});

// Reset Password (using OTP/email)
const resetPassword = CatchAsync(async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  await authService.resetUserPassword(email, newPassword);
  logActivity({
    actorId: (req.user as JwtPayload).userId,
    actorRole: (req.user as JwtPayload).role,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "Auth",
    message: "Password reset",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
  }).catch(console.error);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password reset successfully",
    data: null,
  });
});

const setPassword = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      throw new AppError(
        400,
        "Email, password, and confirm password are required",
      );
    }

    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      throw new AppError(400, "Password and confirm password do not match");
    }

    // Call the service to set the password
    await authService.setPassword(email, newPassword);

    logActivity({
      actorId: (req.user as JwtPayload).userId,
      actorRole: (req.user as JwtPayload).role,
      action: "PASSWORD_SET",
      entityType: "Auth",
      message: "Password set",
      ip: req.ip,
      userAgent: req.headers["user-agent"] as string,
    }).catch(console.error);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Password set successfully.",
    });
  },
);

export const authController = {
  credentialLogin,
  logout,
  refreshToken,
  changePassword,
  forgetPassword,
  resetPassword,
  googleCallbackController,
  setPassword,
};
