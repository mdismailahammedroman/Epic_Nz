import { Query } from "mongoose";
import Location from "./location.model";

import { getPlaceName } from "../../utils/getLocation";

import AppError from "../../errorHelper/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { CategoryEnum } from "./location.interface";

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
  const hikeQuery = await Location.find({ category: CategoryEnum.campgrounds });
  return { data: hikeQuery };
};

export const locationServices = {
  submitLocation,
  getAllActivities,
  getHikes,
};
