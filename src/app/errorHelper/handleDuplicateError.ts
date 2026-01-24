/* eslint-disable @typescript-eslint/no-explicit-any */
import { TGenericsErrorResponse } from "../types/error.types";

export const handleDuplicateError = (err: any): TGenericsErrorResponse => {
  // Match the field and value in the error message
  const matchedArray = err.message.match(/"(.*)"/); // Matching the field name between quotes

  // Ensure the match is successful before trying to access matchedArray[1]
  if (!matchedArray) {
    return {
      statusCode: 400,
      message:
        "Duplicate value error: Unable to determine the field causing the error.",
    };
  }

  // Extract the field causing the duplicate error (e.g., email, username, etc.)
  const fieldName = matchedArray[1];

  return {
    statusCode: 400,
    message: `${fieldName} is already in use!`, // Better error message format
  };
};
