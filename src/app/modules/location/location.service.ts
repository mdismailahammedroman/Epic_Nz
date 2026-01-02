import { Types } from "mongoose";
import Location from "./location.model";
import { v4 as uuidv4 } from "uuid";
import { getPlaceName } from "../../utils/getLocation";

import AppError from "../../errorHelper/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { CategoryEnum } from "./location.interface";
import User from "../user/user.model";

const submitLocation = async (
  userId: string,
  name: string,
  latitude: number,
  longitude: number,
  imageUrl: string,
  categoryName: string // New parameter
) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    throw new AppError(400, "Invalid coordinates provided");
  }

  let addressName = "";
  try {
    addressName = await getPlaceName(lat, lon);
  } catch (error) {
    addressName = "Unknown Location";
  }

  const newLocation = new Location({
    userId: userId, // Use 'userId' to match your schema
    imageUrl: imageUrl,
    name: name,
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
  const user = await User.findById(userId);
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
    select: "_id placeName imageUrl coordinates",
  });
  return;
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
    (id) => id.toString() !== locationId
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

  const deepLink = `http://localhost:5000/api/v1/locations/${locationId}?shareId=${shareLinkId}`;

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
    }
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
  userId: string
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
    (r) => r.userId.toString() === userId
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

export const locationServices = {
  submitLocation,
  getAllActivities,
  getHikes,
  getCampgrounds,
  getFreedomCampingLocations,
  getEpicPhotoSpots,
  locationDetailsById,
  saveLocationForUser,
  unsaveLocationForUser,
  shareLocation,
  locationRating,
};
