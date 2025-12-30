import { Query } from "mongoose";
import Location from "./location.model";

import { getPlaceName } from "../../utils/getLocation";

import AppError from "../../errorHelper/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { CategoryEnum } from "./location.interface";
import User from "../user/user.model";

const submitLocation = async (
  userId: string,
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

  let placeName = "";
  try {
    placeName = await getPlaceName(lat, lon);
  } catch (error) {
    placeName = "Unknown Location";
  }

  const newLocation = new Location({
    userId: userId, // Use 'userId' to match your schema
    imageUrl: imageUrl,

    placeName: placeName,
    coordinates: {
      type: "Point",
      coordinates: [lon, lat],
    },
    // Use the category passed from form-data or a default
    category: categoryName || CategoryEnum.epicPhotoSpots,
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
    category: CategoryEnum.Hikes, // Force category to 'Hikes'
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
    category: CategoryEnum.epicPhotoSpots, // Force category to 'Hikes'
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
    category: CategoryEnum.campgrounds, // Force category to 'campgrounds'
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
    category: CategoryEnum.freedomCampingLocations, // Force category to 'Hikes'
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
  return;
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
};
