// src/services/location.services.ts

import { ILocation } from "./location.interface";

// Create a new location
const getLocationsByCategoryController = async (
  category: string,
  page: number,
  limit: number
): Promise<ILocation[]> => {
  const query: any = {};

  if (category) {
    query.type = category; // Filter by the category if it's provided
  }

  // Fetch the locations with pagination
  return await Location.find(query)
    .skip((page - 1) * limit) // Pagination logic
    .limit(limit); // Limit results to the specified page size
};
export const locationServices = {
  getLocationsByCategoryController,
};
