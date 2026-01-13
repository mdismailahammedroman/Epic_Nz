import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../user/user.model";
import AppError from "../../errorHelper/AppError";
import { StatusCodes } from "http-status-codes";
import { sendEmail } from "../../utils/sendMail";
import { envVar } from "../../config/envVar";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userToken";

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

  const jwtPayload = {
    userId: isUserExist._id,
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const resetToken = jwt.sign(jwtPayload, envVar.JWT_REFRESH_EXPIRATION, {
    expiresIn: "10m",
  });

  const resetUILink = `${envVar.FRONTEND_URL}/reset-password?id=${isUserExist._id}&token=${resetToken}`;

  sendEmail({
    to: isUserExist.email,
    subject: "Password Reset",
    templateName: "otp",
    templateData: {
      name: isUserExist.full_name,
      otp: resetUILink, // REQUIRED
    },
  });
};

const resetUserPassword = async (
  payload: { id: string; newPassword: string },
  decodedToken: JwtPayload
) => {
  if (payload.id !== decodedToken.userId) {
    throw new AppError(401, "You can not reset your password");
  }

  const user = await User.findById(decodedToken.userId);
  if (!user) {
    throw new AppError(401, "User does not exist");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(envVar.BCRYPT_SALT_ROUND)
  );

  user.password = hashedPassword;
  await user.save();
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
