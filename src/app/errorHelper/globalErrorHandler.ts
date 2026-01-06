/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as any).status === 400 &&
    "body" in err
  ) {
    return res.status(400).send({
      success: false,
      message: "Bad JSON formatting or incorrect Content-Type header",
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
