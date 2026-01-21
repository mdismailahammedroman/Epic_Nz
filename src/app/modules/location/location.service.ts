/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import Location from "./location.model";
import { v4 as uuidv4 } from "uuid";
import { getPlaceName } from "../../utils/getLocation";

import AppError from "../../errorHelper/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { CategoryEnum, LocationStatus } from "./location.interface";
import User from "../user/user.model";
import { StatusCodes } from "http-status-codes";
import { getAllFcmTokens } from "../../utils/randomFCMToken";
import { sendPushNotification } from "../../utils/notificationUtils";
import { NotificationService } from "../notification/notification.service";

const submitLocation = async (
  userId: string,
  name: string,
  latitude: number,
  longitude: number,
  imageUrl: string[],
  categoryName: string,
  description: string,
) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    throw new AppError(400, "Invalid coordinates provided");
  }

  let addressName = "";
  try {
    addressName = await getPlaceName(lat, lon);
  } catch (error: any) {
    console.error("Error retrieving address:", error);
    addressName = "Unknown Location";
  }

  const newLocation = new Location({
    userId: userId, // Use 'userId' to match your schema
    imageUrl: imageUrl,
    name: name,
    description: description,
    address: addressName,
    coordinates: {
      type: "Point",
      coordinates: [lon, lat],
    },
    // Use the category passed from form-data or a default
    category: categoryName || CategoryEnum,
    status: "PENDING",
  });

  await newLocation.save();

  return newLocation;
};

const getAllActivities = async (query: Record<string, string>) => {
  const locationQuery = new QueryBuilder(Location.find(), query)
    .filter()
    .category()
    .sort()
    .paginate(); // Apply skip and limit here

  const result = await locationQuery.build();
  const meta = await locationQuery.getMeta();

  return {
    meta,
    result,
  };
};

const getUserSubmissions = async (userId: string) => {
  const locations = await Location.find({ userId })
    .select("name imageUrl coordinates address") // Select only relevant fields
    .exec(); // Execute the query

  if (!locations || locations.length === 0) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "No submissions found for this user",
    );
  }

  return locations;
};
const getHikes = async (query: Record<string, string>) => {
  const hikeQuery = new QueryBuilder(Location.find(), {
    ...query, // Merge query params (e.g., { category: 'Hikes' })
    category: CategoryEnum.HIKE, // Force category to 'Hikes'
  })
    .filter() // Apply filtering based on query params
    .sort()
    .paginate(); // Apply pagination

  const data = await hikeQuery.build(); // Build and execute the query
  const meta = await hikeQuery.getMeta(); // Get pagination metadata

  return { data, meta };
};
const getEpicPhotoSpots = async (query: Record<string, string>) => {
  const hikeQuery = new QueryBuilder(Location.find(), {
    ...query, // Merge query params (e.g., { category: 'Hikes' })
    category: CategoryEnum.EPIC_PHOTO_SPOT, // Force category to 'Hikes'
  })
    .filter() // Apply filtering based on query params
    .sort() // Apply sorting if provided
    .paginate(); // Apply pagination

  const data = await hikeQuery.build(); // Build and execute the query
  const meta = await hikeQuery.getMeta(); // Get pagination metadata

  return { data, meta };
};
const getCampgrounds = async (query: Record<string, string>) => {
  const hikeQuery = new QueryBuilder(Location.find(), {
    ...query, // Merge query params (e.g., { category: 'campgrounds' })
    category: CategoryEnum.CAMPGROUND, // Force category to 'campgrounds'
  })
    .filter() // Apply filtering based on query params
    .sort() // Apply sorting if provided
    .paginate(); // Apply pagination

  const data = await hikeQuery.build(); // Build and execute the query
  const meta = await hikeQuery.getMeta(); // Get pagination metadata

  return { data, meta };
};
const getFreedomCampingLocations = async (query: Record<string, string>) => {
  const hikeQuery = new QueryBuilder(Location.find(), {
    ...query, // Merge query params (e.g., { category: 'Hikes' })
    category: CategoryEnum.FREEDOM_CAMPING, // Force category to 'Hikes'
  })
    .filter() // Apply filtering based on query params
    .sort() // Apply sorting if provided
    .paginate(); // Apply pagination

  const data = await hikeQuery.build(); // Build and execute the query
  const meta = await hikeQuery.getMeta(); // Get pagination metadata

  return { data, meta };
};

const locationDetailsById = async (locationId: string) => {
  const location = await Location.findById(locationId);
  if (!location) {
    throw new AppError(404, "Location not found");
  }
  return location;
};

const saveLocationForUser = async (userId: string, locationId: string) => {
  // Implementation to save location for user.
  const user = await User.findById(userId); // Find user by userId
  if (!user) {
    throw new AppError(404, "User not found");
  }
  user.savedLocations = user.savedLocations || [];
  if (user.savedLocations.includes(locationId)) {
    throw new AppError(400, "Location already saved for user");
  }
  user.savedLocations.push(locationId);
  await user.save();

  await user.populate({
    path: "savedLocations",
    select: "_id name placeName imageUrl coordinates category description",
  });

  return user.savedLocations;
};

const unsaveLocationForUser = async (userId: string, locationId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  user.savedLocations = user.savedLocations || [];

  // Check if location exists in savedLocations
  if (!user.savedLocations.includes(locationId)) {
    throw new AppError(400, "Location is not saved for user");
  }

  // Remove location
  user.savedLocations = user.savedLocations.filter(
    (id) => id.toString() !== locationId,
  );

  await user.save();

  // Optionally populate savedLocations details
  await user.populate({
    path: "savedLocations",
    select: "_id placeName imageUrl coordinates",
  });

  return user.savedLocations;
};
// POST /locations/{id}/share – Share a location with others via deep link.
const shareLocation = async (locationId: string, userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }
  //
  if (!Types.ObjectId.isValid(locationId)) {
    throw new AppError(400, "Invalid location ID format.");
  }

  const location = await Location.findById(locationId);
  if (!location) {
    throw new AppError(404, "Location not found");
  }

  const shareLinkId = uuidv4();

  const deepLink = `http://localhost:5000/api/v1/location/${locationId}`;

  await Location.updateOne(
    { _id: locationId },
    {
      $push: {
        sharedLinks: {
          shareLinkId: shareLinkId,
          userId: userId,
          createdAt: new Date(),
        },
      },
    },
  );

  return {
    deepLink,
    message: "Location shared successfully!",
    shareLinkId,
  };
};

const locationRating = async (
  locationId: string,
  rating: number,
  userId: string,
) => {
  //
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (!Types.ObjectId.isValid(locationId)) {
    throw new AppError(400, "Invalid location ID format.");
  }

  const location = await Location.findById(locationId);
  if (!location) {
    throw new AppError(404, "Location not found");
  }

  if (!location.ratings) {
    location.ratings = [];
  }

  if (rating < 1 || rating > 5) {
    throw new AppError(400, "Rating must be between 1 and 5");
  }

  const existingRating = location.ratings.find(
    (r) => r.userId.toString() === userId,
  );

  if (existingRating) {
    existingRating.rating = rating;
    existingRating.createdAt = new Date();
  } else {
    location.ratings.push({
      userId: new Types.ObjectId(userId),
      rating: rating,
      createdAt: new Date(),
    });
  }

  await location.save();
  return location;
};

const approveLocation = async (locationId: string) => {
  // Find the location by its ID
  const location = await Location.findById(locationId);

  // If location is not found, throw an error
  if (!location) {
    throw new AppError(StatusCodes.NOT_FOUND, "Location not found");
  }

  // If the location is already approved, throw an error
  if (location.status === LocationStatus.APPROVED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Location is already approved");
  }

  // Update the location's status to APPROVED
  location.status = LocationStatus.APPROVED;
  await location.save(); // Save the updated location

  // 🔔 Notify nearby users
  await NotificationService.notifyNearbyUsers(location); // Send notification to nearby users

  // Optionally, you can also send a push notification to all users (based on your logic)
  const title = "New Location Approved!";
  const body = `The location "${location.name}" has been approved and is now visible to everyone.`;
  const data = { locationId: location._id.toString() };

  // Fetch all FCM tokens (or filtered tokens as needed) and send notifications
  const allTokens = await getAllFcmTokens(); // This can be a function that fetches all user tokens
  if (allTokens.length > 0) {
    sendPushNotification(allTokens, title, body, data);
  }

  return location; // Return the updated location
};

const rejectLocation = async (locationId: string, adminId: Types.ObjectId) => {
  // Find the location by ID
  const location = await Location.findById(locationId);
  if (!location) {
    throw new AppError(StatusCodes.NOT_FOUND, "Location not found");
  }

  // If the location is already rejected, throw an error
  if (location.status === LocationStatus.REJECTED) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Location is already rejected");
  }

  // Update the location's status to REJECTED
  location.status = LocationStatus.REJECTED;
  location.approvedByAdmin = adminId; // Store the admin who rejected the location
  await location.save(); // Save the updated location

  // Notify the creator (user) that the location was rejected
  const creator = await User.findById(location.userId);
  if (!creator) {
    throw new AppError(StatusCodes.NOT_FOUND, "Location creator not found");
  }

  const title = "Your Location was Rejected";
  const body = `The location "${location.name}" has been rejected by the admin.`;
  const data = { locationId: location._id.toString() };

  // Send push notification to the creator
  if (creator.fcmTokens && creator.fcmTokens.length > 0) {
    sendPushNotification(creator.fcmTokens, title, body, data);
  }

  return location;
};

const getLocationPinsService = async () => {
  const locations = await Location.find({
    isDeleted: false, // Only get non-deleted locations
  }).select("coordinates placeName"); // Only select coordinates and placeName for the map

  if (!locations || locations.length === 0) {
    throw new AppError(404, "No locations found");
  }

  // Map locations to pins format (coordinates and placeName)
  const locationPins = locations.map((location) => ({
    coordinates: location.coordinates,
    placeName: Location.name,
  }));

  return locationPins;
};

const getLocationsByStatus = async (status: LocationStatus) => {
  const locations = await Location.find({ status }).sort({ createdAt: -1 });
  if (!locations || locations.length === 0) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      `No locations with status ${status}`,
    );
  }
  return locations;
};

export const locationServices = {
  submitLocation,
  getAllActivities,
  getUserSubmissions,
  getHikes,
  getCampgrounds,
  getFreedomCampingLocations,
  getEpicPhotoSpots,
  locationDetailsById,
  saveLocationForUser,
  unsaveLocationForUser,
  shareLocation,
  locationRating,
  approveLocation,
  rejectLocation,
  getLocationPinsService,
  getLocationsByStatus,
};
