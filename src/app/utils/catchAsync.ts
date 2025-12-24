import { NextFunction, Request, Response } from "express";

// Utility to handle async errors in route handlers
export const CatchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next); // Execute the passed function
    } catch (error) {
      next(error); // Forward the error to the global error handler
    }
  };
};
