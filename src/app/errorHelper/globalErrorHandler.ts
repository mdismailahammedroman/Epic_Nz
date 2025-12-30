import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import AppError from "./AppError";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Mongoose invalid ObjectId
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      status: "error",
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // JWT errors
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      status: "error",
      message: "Invalid token. Please login again.",
    });
  }

  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      status: "error",
      message: "Token has expired. Please login again.",
    });
  }

  console.error(err);

  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({
      status: "error",
      message: "Something went wrong! Please try again later.",
    });
  }

  return res.status(500).json({
    status: "error",
    message: err.message || "Internal Server Error",
    stack: err.stack,
  });
};

export default globalErrorHandler;
