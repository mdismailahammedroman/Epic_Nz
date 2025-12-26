import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { generateToken, verifyToken } from "./jwt";
import AppError from "../errorHelper/AppError";
import { envVar } from "../config/envVar";
import { IUser, Role, userStatus } from "../modules/user/user.interface"; // Corrected import for userStatus
import { User } from "../modules/user/user.model";

export const createUserTokens = (user: Partial<IUser>) => {
  if (!user || !user._id) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "User ID is missing");
  }

  // Handle ObjectId or string _id safely
  const userId =
    typeof user._id === "string"
      ? user._id
      : (user._id as Types.ObjectId).toString();

  const jwtPayload: JwtPayload & {
    userId: string;
    email: string;
    role: Role;
    status: userStatus;
  } = {
    userId,
    email: user.email as string,
    role: user.role as Role,
    status: user.IsActive as userStatus,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVar.JWT_SECRET,
    envVar.JWT_EXPIRATION
  );
  const refreshToken = generateToken(
    jwtPayload,
    envVar.JWT_REFRESH_SECRET,
    envVar.JWT_REFRESH_EXPIRATION
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string
) => {
  const verifiedRefreshToken = verifyToken(
    refreshToken,
    envVar.JWT_REFRESH_SECRET
  ) as JwtPayload & {
    email: string;
  };

  const isUserExist = await User.findOne({ email: verifiedRefreshToken.email });

  if (!isUserExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
  }

  // Corrected userStatus check (replace IsActive with userStatus)
  if (
    isUserExist.IsActive === userStatus.INACTIVE ||
    isUserExist.IsActive === userStatus.BANNED
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `User is ${isUserExist.IsActive}`
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
    envVar.JWT_EXPIRATION
  );
  return accessToken;
};
