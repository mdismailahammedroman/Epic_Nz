import { CatchAsync } from "./../../utils/catchAsync";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { OTPService } from "./otp.service";
import { sendResponse } from "../../utils/SendResponse";

const sendOtpHandler = CatchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await OTPService.sendOTP(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP sent successfully!",
    data: null,
  });
});

const verifyOtpHandler = CatchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  await OTPService.verifyOTP(email, otp);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP verified successfully!",
    data: null,
  });
});

export const otpController = {
  sendOtpHandler,
  verifyOtpHandler,
};
