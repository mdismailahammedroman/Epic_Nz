import { CategoryEnum } from "./location.interface";
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

const getAllActivities = CatchAsync(async (req: Request, res: Response) => {
  const QueryBuilder = req.query as Record<string, string>;

  const locationsData = await locationServices.getAllActivities(QueryBuilder);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Locations retrieved successfully",
    data: locationsData,
  });
});

const getHikes = CatchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const hikesData = await locationServices.getHikes(query);

  console.log("Hikes Data:", hikesData.data); // Log to verify the data

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Hikes locations retrieved successfully",
    data: hikesData.data,
  });
});

export const locationController = {
  submitLocation,
  getAllActivities,
  getHikes,
};
