import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { generateToken, verifyToken } from "./jwt";
import AppError from "../errorHelper/AppError";
import { envVar } from "../config/envVar";
import { IUser, Role, UserStatus } from "../modules/user/user.interface";
import User from "../modules/user/user.model";
import { redisClient } from "../config/redisConfig";

export const createUserTokens = async (user: IUser) => {
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVar.JWT_SECRET,
    envVar.JWT_EXPIRATION,
  );
  const refreshToken = generateToken(
    jwtPayload,
    envVar.JWT_REFRESH_SECRET,
    envVar.JWT_REFRESH_EXPIRATION,
  );

  // ✅ STORE refresh token in Redis
  await redisClient.set(
    `refresh:${user._id}`,
    refreshToken,
    { EX: 60 * 60 * 24 * 14 }, // 14 days
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string,
) => {
  const verifiedRefreshToken = verifyToken(
    refreshToken,
    envVar.JWT_REFRESH_SECRET,
  ) as JwtPayload & {
    email: string;
  };

  // 2️⃣ Check Redis
  const storedToken = await redisClient.get(
    `refresh:${verifiedRefreshToken.userId}`,
  );

  if (!storedToken || storedToken !== refreshToken) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  const isUserExist = await User.findOne({ email: verifiedRefreshToken.email });

  if (!isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
  }

  // Corrected userStatus check (replace IsActive with userStatus)
  if (
    isUserExist.status === UserStatus.INACTIVE ||
    isUserExist.status === UserStatus.BANNED
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `User is ${isUserExist.status} and cannot access the system.`,
    );
  }

  if (isUserExist.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
  }

  const jwtPayload: JwtPayload & {
    userId: string;
    email: string;
    role: Role;
  } = {
    userId: isUserExist._id.toString(),
    email: isUserExist.email,
    role: isUserExist.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVar.JWT_SECRET,
    envVar.JWT_EXPIRATION,
  );
  return accessToken;
};
