import { NextFunction, Request, Response } from "express";
import AppError from "./AppError";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // If the error is not an instance of AppError, it's likely a programming error
  console.error(err); // Log the error for debugging purposes

  // Return a generic 500 Internal Server Error message
  return res.status(500).json({
    status: "error",
    message: "Something went wrong! Please try again later.",
  });
};

export default globalErrorHandler;
