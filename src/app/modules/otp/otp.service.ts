import User from "../user/user.model";
import { redisClient } from "../../config/redisConfig";
import AppError from "../../errorHelper/AppError";
import { sendEmail } from "../../utils/sendMail";
import { randomOTP } from "../../utils/randomOpt";

const OTP_EXPIRATION = 2 * 60; // 2 minutes

// Send verification OTP
export const sendOTP = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(404, "User not found");
  if (user.is_verified) throw new AppError(400, "User already verified");

  const otp = randomOTP();
  const redisKey = `otp:${email}`;

  await redisClient.set(redisKey, otp, { EX: OTP_EXPIRATION });

  await sendEmail({
    to: email,
    subject: "Verify Your Email",
    templateName: "otp",
    templateData: { name: user.full_name || "User", otp },
  });

  return true;
};

// Verify verification OTP
export const verifyOTP = async (email: string, otp: string) => {
  const redisKey = `otp:${email}`;
  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp || savedOtp !== otp) {
    throw new AppError(401, "Invalid or expired OTP");
  }

  await User.updateOne({ email }, { $set: { is_verified: true } });
  await redisClient.del(redisKey);
  return true;
};

// Send forgot password OTP
export const sendForgotPasswordOTP = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError(404, "User not found");
  if (!user.is_verified) throw new AppError(400, "User not verified");

  const otp = randomOTP();
  const redisKey = `otp:forgot-password:${email}`;

  await redisClient.set(redisKey, otp, { EX: OTP_EXPIRATION });

  await sendEmail({
    to: email,
    subject: "Forgot Password OTP",
    templateName: "otp",
    templateData: { name: user.full_name || "User", otp },
  });

  return true;
};

// Verify forgot password OTP
export const verifyForgotPasswordOTP = async (email: string, otp: string) => {
  const redisKey = `otp:forgot-password:${email}`;
  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp || savedOtp !== otp) {
    throw new AppError(401, "Invalid or expired OTP");
  }

  await redisClient.del(redisKey);
  return true;
};

export const OTPService = {
  sendOTP,
  verifyOTP,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
};
