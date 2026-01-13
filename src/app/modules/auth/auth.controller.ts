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
import { IUser } from "../user/user.interface";
import { JwtPayload } from "jsonwebtoken";

const credentialLogin = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return next(new AppError(StatusCodes.FORBIDDEN, info.message));
      }
      const userTokens = createUserTokens(user);
      setAuthCookie(res, userTokens);

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
  }
);

// Add googleCallback handler
const googleCallbackController = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let redirectTo = typeof req.query.state === "string" ? req.query.state : "";

    // Remove leading slash
    if (redirectTo.startsWith("/")) {
      redirectTo = redirectTo.slice(1);
    }

    // Prevent open redirects
    if (redirectTo.includes("://") || redirectTo.startsWith("//")) {
      redirectTo = "";
    }

    const user = req.user as IUser | undefined;

    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }

    const tokenInfo = createUserTokens(user);

    setAuthCookie(res, tokenInfo);

    const redirectUrl = redirectTo
      ? `${envVar.FRONTEND_URL}/${encodeURI(redirectTo)}`
      : envVar.FRONTEND_URL;

    return res.redirect(redirectUrl);
  }
);

const logout = (req: Request, res: Response) => {
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

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Refresh Token
const refreshToken = CatchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.headers.authorization;
  if (!refreshToken)
    throw new AppError(StatusCodes.UNAUTHORIZED, "Refresh token not provided");

  const newAccessToken = await createNewAccessTokenWithRefreshToken(
    refreshToken
  );
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

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password reset email sent",
    data: null,
  });
});

// Reset Password (using OTP/email)
const resetPassword = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const decodedToken = req.user as JwtPayload;

    await authService.resetUserPassword(req.body, decodedToken);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Password reset successfully",
      data: null,
    });
  }
);

const setPassword = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, newPassword, confirmPassword } = req.body;

    // Validate the input fields
    if (!email || !newPassword || !confirmPassword) {
      throw new AppError(
        400,
        "Email, password, and confirm password are required"
      );
    }

    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      throw new AppError(400, "Password and confirm password do not match");
    }

    // Call the service to set the password
    await authService.setPassword(email, newPassword);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Password set successfully.",
    });
  }
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
