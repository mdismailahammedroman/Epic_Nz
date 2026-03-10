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
import { JwtPayload } from "jsonwebtoken";
import { logActivity } from "../../utils/logActivity.utils";
import { redisClient } from "../../config/redisConfig";
import { normalizeTokens } from "../../utils/normalizeTokens";
import { userServices } from "../user/user.service";

function sanitizeRedirect(input: unknown) {
  if (typeof input !== "string") return "/";

  // ✅ allow only your app scheme
  if (input.startsWith("epicnz://callback")) return input;

  // ✅ allow only relative paths for web
  if (!input.startsWith("/")) return "/";
  if (input.startsWith("//")) return "/";
  return input;
}

function encodeState(payload: any) {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8").toString("base64url");
}
function decodeState(state?: string) {
  if (!state) return null;
  try {
    const json = Buffer.from(state, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ✅ Local login
const credentialLogin = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      { session: false },
      async (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user)
          return next(
            new AppError(
              StatusCodes.FORBIDDEN,
              info?.message || "Login failed",
            ),
          );

        const { fcmToken, fcmTokens } = req.body ?? req.query;
        const tokensToAdd = normalizeTokens(fcmTokens ?? fcmToken);
        if (tokensToAdd.length > 0) {
          await userServices.fcmTokenUpdate(
            user._id.toString(),
            undefined,
            tokensToAdd,
          );
        }

        const userTokens = await createUserTokens(user);
        setAuthCookie(res, userTokens);

        await logActivity({
          actorId: user._id.toString(),
          actorRole: user.role,
          action: "USER_LOGIN",
          entityType: "Auth",
          message: "User login via credentials",
          ip: req.ip,
          userAgent: req.headers["user-agent"] as string,
        });

        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: "Login success",
          data: {
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
          },
        });
      },
    )(req, res, next);
  },
);

// ----------------- Google Login Start -----------------
const googleStart = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = sanitizeRedirect(req.query.redirect);
    const state = encodeState({ redirect });

    passport.authenticate("google", {
      session: false,
      scope: ["profile", "email"],
      state,
    })(req, res, next);
  },
);

// ----------------- Google Callback -----------------
const googleCallback = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  if (!user?._id)
    throw new AppError(StatusCodes.FORBIDDEN, "Google login failed");

  const { fcmToken, fcmTokens } = req.query; // app can send via query
  const tokensToAdd = normalizeTokens(fcmTokens ?? fcmToken);
  if (tokensToAdd.length > 0) {
    await userServices.fcmTokenUpdate(
      user._id.toString(),
      undefined,
      tokensToAdd,
    );
  }

  const userTokens = await createUserTokens(user);
  setAuthCookie(res, userTokens);

  await logActivity({
    actorId: user._id.toString(),
    actorRole: user.role,
    action: "USER_LOGIN",
    entityType: "Auth",
    message: "User login via Google",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
  });

  // handle state safely (Google returns state in query)
  const rawState = req.query.state;
  const stateString =
    typeof rawState === "string"
      ? rawState
      : Array.isArray(rawState) && typeof rawState[0] === "string"
        ? rawState[0]
        : undefined;

  const decoded = decodeState(stateString);

  let redirect = decoded?.redirect;

  if (!redirect || !redirect.startsWith("epicnz://")) {
    redirect = "epicnz://callback";
  }

  const redirectUri = `${redirect}?token=${userTokens.accessToken}&userId=${user._id}`;

  res.redirect(redirectUri);
});

// apple login controller

const appleStart = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = sanitizeRedirect(req.query.redirect);
    const state = encodeState({ redirect });
    passport.authenticate("apple", {
      session: false,
      scope: ["name", "email"],
      state, // comes back in req.body (form_post) or req.query
    })(req, res, next);
  },
);

const appleCallback = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  if (!user?._id)
    throw new AppError(StatusCodes.FORBIDDEN, "Apple login failed");

  const { fcmToken, fcmTokens } = req.query; // app can send via query
  const tokensToAdd = normalizeTokens(fcmTokens ?? fcmToken);
  if (tokensToAdd.length > 0) {
    await userServices.fcmTokenUpdate(
      user._id.toString(),
      undefined,
      tokensToAdd,
    );
  }

  const tokens = await createUserTokens(user);
  setAuthCookie(res, tokens);

  // Apple uses response_mode=form_post - state comes in req.body, not req.query
  const rawState = req.body?.state ?? req.query?.state;
  const stateString =
    typeof rawState === "string"
      ? rawState
      : Array.isArray(rawState) && typeof rawState[0] === "string"
        ? rawState[0]
        : undefined;

  const decoded = decodeState(stateString);

  let redirect = decoded?.redirect;

  if (!redirect || !redirect.startsWith("epicnz://")) {
    redirect = "epicnz://callback";
  }

  const redirectUri = `${redirect}?token=${tokens.accessToken}&userId=${user._id}`;

  res.redirect(redirectUri);
});

const logout = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.user as JwtPayload;

  await redisClient.del(`refresh:${payload.userId}`);

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

  const payload = req.user as JwtPayload | undefined;

  if (!payload?.userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  await authService.changePassword(payload.userId, oldPassword, newPassword);

  await logActivity({
    actorId: payload.userId,
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
await logActivity({
  actorRole: "GUEST",
  action: "PASSWORD_RESET_REQUESTED",
  entityType: "Auth",
  message: "Forget password requested",
  ip: req.ip,
  userAgent: req.headers["user-agent"] as string,
  meta: { email },
});

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
    actorRole: "GUEST",
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

    if (newPassword !== confirmPassword) {
      throw new AppError(400, "Password and confirm password do not match");
    }

    // Call the service to set the password
    await authService.setPassword(email, newPassword);

    const payload = req.user as JwtPayload | undefined;

    await logActivity({
      actorId: payload?.userId ?? "SYSTEM", // fallback to SYSTEM if not logged in
      actorRole: payload?.role ?? "GUEST",
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
  googleStart,
  googleCallback,
  appleStart,
  appleCallback,
  logout,
  refreshToken,
  changePassword,
  forgetPassword,
  resetPassword,
  setPassword,
};
