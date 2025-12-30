import { CategoryEnum } from "./location.interface";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { JwtPayload } from "jsonwebtoken";
import { locationServices } from "./location.service";
import AppError from "../../errorHelper/AppError";
import { send } from "node:process";

// location.controller.ts
const submitLocation = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;

  // Destructure category along with coordinates
  const { name, latitude, longitude, category: selectedCategory } = req.body;

  if (!req.file) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No image uploaded");
  }

  const newLocation = await locationServices.submitLocation(
    userId,
    name,
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

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Hikes locations retrieved successfully",
    meta: hikesData.meta,
    data: hikesData.data,
  });
});
const getFreedomCampingLocations = CatchAsync(
  async (req: Request, res: Response) => {
    const query = req.query as Record<string, string>;
    const FreedomCampingLocations =
      await locationServices.getFreedomCampingLocations(query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Hikes locations retrieved successfully",
      data: FreedomCampingLocations.data,
      meta: FreedomCampingLocations.meta,
    });
  }
);
const getCampgrounds = CatchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const Campgrounds = await locationServices.getCampgrounds(query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Hikes locations retrieved successfully",
    data: Campgrounds.data,
    meta: Campgrounds.meta,
  });
});
const getEpicPhotoSpots = CatchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const EpicPhotoSpotsData = await locationServices.getEpicPhotoSpots(query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Hikes locations retrieved successfully",
    data: EpicPhotoSpotsData.data,
    meta: EpicPhotoSpotsData.meta,
  });
});
const locationDetailsById = CatchAsync(async (req: Request, res: Response) => {
  const { locationId } = req.params;
  const locationDetails = await locationServices.locationDetailsById(
    locationId
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location details retrieved successfully",
    data: locationDetails,
  });
});
const saveLocationForUser = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const { locationId } = req.params;
  const result = await locationServices.saveLocationForUser(userId, locationId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location saved for user successfully",
    data: result,
  });
});

// POST /locations/{id}/share – Share a location with others via deep link.
const shareLocation = CatchAsync(async (req: Request, res: Response) => {
  const { locationId } = req.params;
  const userId = req.user as JwtPayload;
  const deepLink = await locationServices.shareLocation(
    locationId,
    userId.userId
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location shared successfully",
    data: { deepLink },
  });
});

const locationRating = CatchAsync(async (req: Request, res: Response) => {
  const userId = req.user as JwtPayload;
  const { locationId } = req.params;
  const { rating } = req.body;
  const updatedLocation = await locationServices.locationRating(
    locationId,
    rating,
    userId.userId
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location rating updated successfully",
    data: updatedLocation,
  });
});

export const locationController = {
  submitLocation,
  getAllActivities,
  getHikes,
  getEpicPhotoSpots,
  getFreedomCampingLocations,
  getCampgrounds,
  locationDetailsById,
  saveLocationForUser,
  shareLocation,
  locationRating,
};
