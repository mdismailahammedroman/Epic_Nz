import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { userServices } from "./user.service";

const userRegister = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.body;
    const createUser = await userServices.createUser(userData);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Users created successful!",
      data: createUser,
    });
  }
);

export const userController = {
  userRegister,
};
