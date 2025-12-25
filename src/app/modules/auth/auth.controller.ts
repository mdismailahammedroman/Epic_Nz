import httpStatus from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import passport from "../../config/passport.config";
import AppError from "../../errorHelper/AppError";
import { createUserTokens } from "../../utils/userToken";
import { sendResponse } from "../../utils/SendResponse";

const credentialLogin = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);

      if (!user) {
        return next(new AppError(httpStatus.FORBIDDEN, info.message));
      }

      const userTokens = createUserTokens(user);

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Login success",
        data: userTokens,
      });
    })(req, res, next);
  }
);

export const authController = { credentialLogin };
