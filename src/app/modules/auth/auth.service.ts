import bcrypt from "bcryptjs";
import User from "../user/user.model";
import AppError from "../../errorHelper/AppError";
import { StatusCodes } from "http-status-codes";
import { envVar } from "../../config/envVar";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userToken";
import { OTPService } from "../otp/otp.service";
import { redisClient } from "../../config/redisConfig";

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(
    refreshToken
  );

  return {
    accessToken: newAccessToken,
  };
};
const forgetPassword = async (email: string) => {
  const isUserExist = await User.findOne({ email });
  if (!isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
  }
  if (!isUserExist.is_verified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not verified");
  }

  if (isUserExist.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
  }
  OTPService.sendForgotPasswordOTP(isUserExist.email);
  return { message: "OTP sent successfully" };
};

const resetUserPassword = async (email: string, newPassword: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(404, "User does not exist");
  }
  const otpVerified = await redisClient.set(`otp-verified:${email}`, "true", {
    EX: 300,
  });
  if (!otpVerified) {
    throw new AppError(401, "OTP not verified. Please verify your OTP first.");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(envVar.BCRYPT_SALT_ROUND || 10)
  );

  user.password = hashedPassword;
  await user.save();

  await redisClient.del(`otp-verified:${email}`);

  return true;
};

const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isMatch = bcrypt.compareSync(oldPassword, user.password || "");
  if (!isMatch) throw new Error("Old password is incorrect");

  user.password = bcrypt.hashSync(newPassword, 10);
  await user.save();
};
const setPassword = async (email: string, password: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (!user.is_verified) {
    throw new AppError(403, "OTP not verified");
  }

  if (user.password && user.password !== "") {
    throw new AppError(400, "Password already set");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  await user.save();

  return user;
};

export const authService = {
  getNewAccessToken,
  forgetPassword,
  resetUserPassword,
  changePassword,
  setPassword,
};
