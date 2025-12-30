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
import { getPlaceName } from "../../utils/getLocation";

const credentialLogin = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return next(new AppError(StatusCodes.FORBIDDEN, info.message));
      }

      // Initialize placeName variable
      // let placeName = "";

      // // Get latitude and longitude from the request body
      // const { latitude, longitude } = req.body;

      // if (latitude && longitude) {
      //   try {
      //     // Call the getPlaceName function to fetch the place name using latitude and longitude
      //     placeName = await getPlaceName(latitude, longitude);

      //     // Check if placeName is valid before assigning it to the user
      //     if (placeName) {
      //       user.location = { lat: latitude, long: longitude, placeName };
      //       await user.save();
      //     } else {
      //       console.error(
      //         "Place name not found for coordinates:",
      //         latitude,
      //         longitude
      //       );
      //     }
      //   } catch (error) {
      //     console.error("Error getting place name:", error);
      //   }
      // } else {
      //   console.log("No latitude or longitude provided.");
      // }

      // Generate access and refresh tokens for the user
      const userTokens = createUserTokens(user);

      // Set authentication cookies with the user tokens
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
