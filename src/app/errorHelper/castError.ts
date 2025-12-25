import mongoose from "mongoose";
import { TGenericsErrorResponse } from "../types/error.types";

export const handleCastError = (
  err: mongoose.Error.CastError
): TGenericsErrorResponse => {
  return {
    statusCode: 400,
    message: "Invalid MongoDB objectId. Please provide a valid id!",
  };
};
