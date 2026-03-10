import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { JwtPayload } from "jsonwebtoken";
import { locationServices } from "./location.service";
import AppError from "../../errorHelper/AppError";
import { LocationStatus } from "./location.interface";
import { logActivity } from "../../utils/logActivity.utils";
import { NotificationService } from "../notification/notification.service";

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
    watererType,
    animalClearance,
    networkQuality,
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
    watererType,
    animalClearance,
    networkQuality,
  );
  await logActivity({
    actorId: userId,
    actorRole: (req.user as JwtPayload).role,
    action: "LOCATION_SUBMITTED",
    entityType: "Location",
    entityId: newLocation._id.toString(),
    message: "Location submitted",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
    meta: {
      targetName: newLocation.name,
      category: newLocation.category,
    },
  });
  await NotificationService.notifyAdminsLocationSubmitted(newLocation);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Location submitted successfully with images",
    data: newLocation,
  });
});

const getAllActivities = CatchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;

  const locationsData = await locationServices.getAllActivities(query);

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
    message: submissions.length
      ? "User's submissions fetched successfully"
      : "No submissions found",
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
  const locationDetails = await locationServices.locationDetailsById(
    locationId as string,
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
  const result = await locationServices.saveLocationForUser(
    userId,
    locationId as string,
  );
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
      locationId as string,
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
    locationId as string,
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
    locationId as string,
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

  const result = await locationServices.approveLocation(locationId as string);

  const creatorNotify =
    await NotificationService.notifyCreatorLocationApproved(result);

  const othersNotify =
    await NotificationService.notifyUsersNewApprovedLocation(result);

  await logActivity({
    actorId: (req.user as JwtPayload).userId,
    actorRole: (req.user as JwtPayload).role,
    action: "SUBMISSION_APPROVED",
    entityType: "Location",
    entityId: locationId as string,
    message: "Submission Approved",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
    meta: { targetName: result?.name ?? locationId },
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location approved successfully",
    data: {
      location: result,
      notified: {
        creator: creatorNotify,
        others: othersNotify,
      },
    },
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

  const location = await locationServices.rejectLocation(
    locationId as string,
    adminId,
  );

  logActivity({
    actorId: (req.user as JwtPayload).userId,
    actorRole: (req.user as JwtPayload).role,
    action: "SUBMISSION_REJECTED",
    entityType: "Location",
    entityId: locationId as string,
    message: "Submission Rejected",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
    meta: { targetName: location?.name ?? locationId },
  }).catch(console.error);

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

const deleteLocation = CatchAsync(async (req: Request, res: Response) => {
  const { locationId } = req.params;
  const user = req.user as JwtPayload; // must contain userId + role

  const result = await locationServices.deleteLocation(
    locationId as string,
    user.userId,
    user.role,
  );

  logActivity({
    actorId: user.userId,
    actorRole: user.role,
    action: "LOCATION_DELETED",
    entityType: "Location",
    entityId: locationId as string,
    message: "Location deleted",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
  }).catch(console.error);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location deleted successfully",
    data: result,
  });
});

const updateLocation = CatchAsync(async (req: Request, res: Response) => {

  const { locationId } = req.params;
  const user = req.user as JwtPayload;

  const updatedLocation = await locationServices.updateLocation(
    locationId as string,
    user.userId,
    user.role,
    req.body
  );

    logActivity({
    actorId: user.userId,
    actorRole: user.role,
    action: "LOCATION_UPDATED",
    entityType: "Location",
    entityId: locationId as string,
    message: "Location Updated",
    ip: req.ip,
    userAgent: req.headers["user-agent"] as string,
  }).catch(console.error);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Location updated successfully",
    data: updatedLocation,
  });
});

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
  deleteLocation,
  updateLocation,
};
