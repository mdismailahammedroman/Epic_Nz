import { Query } from "mongoose";
import Location from "./location.model";

import { getPlaceName } from "../../utils/getLocation";

import AppError from "../../errorHelper/AppError";
import { category } from "./location.interface";

// Assuming the cloudinaryUpload is working and configured properly

// location.service.ts
import { category as CategoryEnum } from "./location.interface"; // Rename to avoid conflict
import { QueryBuilder } from "../../utils/QueryBuilder";

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

const getAllLocations = async (query: Record<string, string>) => {
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

const getHikesLocations = async (Query: Record<string, string>) => {
  const locationQuery = new QueryBuilder(
    Location.find({ category: CategoryEnum.Hikes }),
    Query
  );
  const hikesLocations = await locationQuery.build();

  return hikesLocations;
};
export const locationServices = {
  submitLocation,
  getAllLocations,
  getHikesLocations,
};
