import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { envVar } from "../config/envVar";
import { verifyToken } from "../utils/jwt";
import AppError from "../errorHelper/AppError";

export const checkAuth =
  (...restRole: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization;
      const verifyUser = verifyToken(
        accessToken as string,
        envVar.JWT_SECRET as string
      ) as JwtPayload;

      /*
      ----------------------------------------------------------------
      // More checking will be execute here based on application need
      ----------------------------------------------------------------
      */

      // CHECK Verified
      if (!verifyUser) {
        throw new AppError(httpStatus.BAD_REQUEST, "Not Authorized");
      }

      if (!restRole.includes(verifyUser.role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You are not permitted to access this route"
        );
      }

      req.user = verifyUser; // Set an global type for this line see on: interface > intex.d.ts
      next();
    } catch (error) {
      next(error);
    }
  };
