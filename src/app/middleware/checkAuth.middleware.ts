import httpStatus, { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { envVar } from "../config/envVar";
import { verifyToken } from "../utils/jwt";
import AppError from "../errorHelper/AppError";
import User from "../modules/user/user.model";
import { UserStatus } from "../modules/user/user.interface";

export const checkAuth =
  (...restRole: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const authHeader = req.headers.authorization; // Get the Authorization header
      const authHeader = req.headers.authorization || req.cookies.accessToken;

      // Check if the token exists and starts with 'Bearer '
      if (!authHeader || !authHeader.startsWith("")) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Token not provided!");
      }

      // Extract the token from the Authorization header

      // VERIFY ACCESS TOKEN
      const verifyUser = verifyToken(
        authHeader,
        envVar.JWT_SECRET
      ) as JwtPayload;

      // CHECK Verified
      if (!verifyUser) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token!");
      }

      // Check if the user exists in the database
      const isUser = await User.findById(verifyUser?.userId);

      if (!isUser) {
        throw new AppError(httpStatus.UNAUTHORIZED, "No user found!");
      }

      // Check if the user's status is either INACTIVE or BANNED
      if (
        isUser.status === UserStatus.INACTIVE ||
        isUser.status === UserStatus.BANNED
      ) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `User is ${isUser.status} and cannot access the system.`
        );
      }

      // Check if the user is deleted
      if (isUser.isDeleted) {
        throw new AppError(httpStatus.FORBIDDEN, "The user was deleted!");
      }

      // Check if the user has the required role to access the route
      if (restRole.length && !restRole.includes(verifyUser.role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You are not permitted to access this route!"
        );
      }

      // Add the verified user to the request object
      req.user = verifyUser;

      next();
    } catch (error) {
      next(error);
    }
  };
