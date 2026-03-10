import { CatchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { OTPService } from "./otp.service";
import { sendResponse } from "../../utils/SendResponse";

const sendVerificationOtpHandler = CatchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    await OTPService.sendOTP(email);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Verification OTP sent successfully!",
    });
  }
);

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
  }
);

const resendOtpHandler = CatchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await OTPService.sendOTP(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP resent successfully!",
  });
});

export const otpController = {
  sendVerificationOtpHandler,
  verifyOtpHandler,
  sendForgotOtpHandler,
  resendOtpHandler,
  verifyForgotOtpHandler,
};
