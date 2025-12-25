import { NextFunction, Request, Response } from "express";
import AppError from "./AppError"; // Assuming you have a custom AppError class
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if the error is an instance of AppError (custom error class)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  // Handle JSON Web Token Errors (JWT)
  if (err instanceof JsonWebTokenError) {
    return res.status(401).json({
      status: "error",
      message: "Invalid token. Please login again.",
    });
  }

  // Handle Token Expired Errors
  if (err instanceof TokenExpiredError) {
    return res.status(401).json({
      status: "error",
      message: "Token has expired. Please login again.",
    });
  }

  // If it's a programming error (non-AppError), log it for debugging purposes
  console.error(err); // In development, this shows the full error

  // Production-specific error handling
  if (process.env.NODE_ENV === "production") {
    // In production, hide stack trace and send a generic error message
    return res.status(500).json({
      status: "error",
      message: "Something went wrong! Please try again later.",
    });
  }

  // In development, send stack trace along with the error message (for debugging purposes)
  return res.status(500).json({
    status: "error",
    message: err.message || "Internal Server Error",
    stack: err.stack, // Include stack trace in development
  });
};

export default globalErrorHandler;
