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

const credentialLogin = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);

      if (!user) {
        return next(new AppError(StatusCodes.FORBIDDEN, info.message));
      }

      const userTokens = createUserTokens(user);
      setAuthCookie(res, userTokens);
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Login success",
        data: userTokens,
      });
    })(req, res, next);
  }
);
const logout = (req: Request, res: Response) => {
  // Clear cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    path: "/",
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Logged out successfully",
    data: null,
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
  const { email } = req.params;
  await authService.forgetPassword(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password reset email sent",
    data: null,
  });
});

// Reset Password (using OTP/email)
const resetPassword = CatchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.params;
  const { newPassword } = req.body;

  await authService.resetPassword(email, otp, newPassword);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password reset successfully",
    data: null,
  });
});

export const authController = {
  credentialLogin,
  logout,
  refreshToken,
  changePassword,
  forgetPassword,
  resetPassword,
};
