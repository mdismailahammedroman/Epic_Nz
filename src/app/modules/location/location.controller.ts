import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { JwtPayload } from "jsonwebtoken";
import { locationServices } from "./location.service";
import AppError from "../../errorHelper/AppError";

// location.controller.ts
const submitLocation = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;

  // Destructure category along with coordinates
  const { latitude, longitude, category: selectedCategory } = req.body;

  if (!req.file) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No image uploaded");
  }

  const newLocation = await locationServices.submitLocation(
    userId,
    latitude,
    longitude,
    req.file.path,
    selectedCategory // Pass the category from form-data to the service
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Location submitted successfully",
    data: newLocation,
  });
});

const getAllLocations = CatchAsync(async (req: Request, res: Response) => {
  const QueryBuilder = req.query as Record<string, string>;

  const locationsData = await locationServices.getAllLocations(QueryBuilder);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Locations retrieved successfully",
    data: locationsData,
  });
});
export const locationController = {
  submitLocation, 
  getAllLocations,
};
