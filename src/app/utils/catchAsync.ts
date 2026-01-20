import { Request, Response, NextFunction } from "express";

export const CatchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      fn(req, res, next);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
};
