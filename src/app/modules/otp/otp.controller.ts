import { CatchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { OTPService } from "./otp.service";
import { sendResponse } from "../../utils/SendResponse";

// Send OTP route
const sendVerificationOtpHandler = CatchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Response instantly
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "OTP request received. Check your email soon.",
  });

  // OTP send in background
  OTPService.sendOTP(email).catch(err => {
    console.error("[OTPService] Failed to send OTP/email:", err);
  });
});


const verifyOtpHandler = CatchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  await OTPService.verifyOTP(email, otp);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP verified successfully!",
  });
});

const sendForgotOtpHandler = CatchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await OTPService.sendForgotPasswordOTP(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Forgot password OTP sent successfully!",
  });
});

const verifyForgotOtpHandler = CatchAsync(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    await OTPService.verifyForgotPasswordOTP(email, otp);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Forgot password OTP verified successfully!",
    });
  },
);
// Resend forgot password OTP
const resendOtpHandler = CatchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Email is required",
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP resend request received.",
  });

  OTPService.sendForgotPasswordOTP(email).catch((err) => {
    console.error("[OTPService] Failed to resend OTP:", err);
  });
});

export const otpController = {
  sendVerificationOtpHandler,
  verifyOtpHandler,
  sendForgotOtpHandler,
  verifyForgotOtpHandler,
  resendOtpHandler,
};
