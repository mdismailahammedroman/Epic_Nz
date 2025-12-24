import { NextFunction, Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";

const login = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("login user");
  }
);

export const authController = { login };
