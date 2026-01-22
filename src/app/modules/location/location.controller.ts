import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { JwtPayload } from "jsonwebtoken";
import { locationServices } from "./location.service";
import AppError from "../../errorHelper/AppError";
import { LocationStatus } from "./location.interface";

const submitLocation = CatchAsync(async (req: Request, res: Response) => {
  // Check if files are uploaded and handle the image paths
  const imageUrls = req.files
    ? (req.files as Express.Multer.File[]).map((file) => file.path) // Extract file paths from Cloudinary
    : []; // Default to an empty array if no files are uploaded

  // If no files are uploaded, handle the error
  if (imageUrls.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No image uploaded");
  }

  const { userId } = req.user as JwtPayload;
  const {
    name,
    latitude,
    longitude,
    category: selectedCategory,
    description,
  } = req.body;

  // Use the extracted image URLs for the location submission
  const newLocation = await locationServices.submitLocation(
    userId,
    name,
    latitude,
    longitude,
    imageUrls, // Pass the array of image URLs to the service
    selectedCategory,
    description,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Location submitted successfully with images",
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

const getUserSubmissions = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload; // Get userId from the authenticated user (via JWT)

  // Fetch the user's submitted locations from the service
  const submissions = await locationServices.getUserSubmissions(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User's submissions fetched successfully",
    data: submissions,
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
  },
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
  const locationDetails =
    await locationServices.locationDetailsById(locationId);
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

const unsaveLocationForUser = CatchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.user as JwtPayload;
    const { locationId } = req.params;

    const updatedSavedLocations = await locationServices.unsaveLocationForUser(
      userId,
      locationId,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Location removed from saved locations",
      data: updatedSavedLocations,
    });
  },
);
// POST /locations/{id}/share – Share a location with others via deep link.
const shareLocation = CatchAsync(async (req: Request, res: Response) => {
  const { locationId } = req.params;
  const userId = req.user as JwtPayload;
  const deepLink = await locationServices.shareLocation(
    locationId,
    userId.userId,
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
    userId.userId,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location rating updated successfully",
    data: updatedLocation,
  });
});

const approveLocation = CatchAsync(async (req: Request, res: Response) => {
  const { locationId } = req.params;
  const result = await locationServices.approveLocation(locationId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location approved successfully",
    data: result,
  });
});

const getLocationPins = CatchAsync(async (req: Request, res: Response) => {
  // Call the service to fetch location pins
  const locationPins = await locationServices.getLocationPinsService();

  // Send the response with the location pins
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Location pins fetched successfully!",
    data: locationPins,
  });
});

const rejectLocation = CatchAsync(async (req: Request, res: Response) => {
  const { locationId } = req.params;
  const adminId = (req.user as JwtPayload).userId; // Get admin ID from JWT token

  const location = await locationServices.rejectLocation(locationId, adminId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location rejected successfully",
    data: location,
  });
});

const getLocationsByStatusWise = CatchAsync(
  async (req: Request, res: Response) => {
    const { status } = req.query;

    // Ensure status is valid
    if (
      !status ||
      !Object.values(LocationStatus).includes(status as LocationStatus)
    ) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid or missing status");
    }

    // Fetch locations by status with filters, sorting, and pagination
    const { locations, meta } = await locationServices.getLocationsByStatus(
      status as LocationStatus,
      req.query as Record<string, string>,
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: `Locations with status ${status} retrieved successfully`,
      meta,
      data: locations,
    });
  },
);

export const locationController = {
  submitLocation,
  getAllActivities,
  getUserSubmissions,
  getHikes,
  getEpicPhotoSpots,
  getFreedomCampingLocations,
  getCampgrounds,
  locationDetailsById,
  saveLocationForUser,
  unsaveLocationForUser,
  shareLocation,
  locationRating,
  approveLocation,
  getLocationPins,
  rejectLocation,
  getLocationsByStatusWise,
};
