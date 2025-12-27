import bcrypt from "bcryptjs";
import User from "../user/user.model";

const forgetPassword = async (email: string) => {
  // Generate OTP, save in DB, send email
};

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  // Validate OTP, update password
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

export const authService = { forgetPassword, resetPassword, changePassword };
