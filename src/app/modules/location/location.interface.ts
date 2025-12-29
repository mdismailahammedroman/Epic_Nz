import e from "express";
import { Types } from "mongoose";

interface ICoordinates {
  latitude: number;
  longitude: number;
}
export enum LocationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum category {
  Hikes = "Hikes",
  epicPhotoSpots = "EPIC_PHOTO_SPOTS",
  campgrounds = "Campgrounds",
  freedomCampingLocations = "Freedom_Camping_Locations",
}
// Defining the ILocation interface for Location schema
export interface ILocation {
  user_id: Types.ObjectId; // User ID associated with this location
  placeName?: string; // Name of the place
  category: category; // Location category

  coordinates: ICoordinates; // Latitude and Longitude
  address?: string; // Full address of the location
  description?: string; // Optional description of the location
  imageUrl: string; // URL of the uploaded image

  status: LocationStatus; // Location approval status
  AI_Predictions?: string; // AI-generated data like "Epic Rating" or forecasts
  weatherInfo?: string; // Weather information
  approvedByAdmin?: Types.ObjectId; // Admin ID who approved the location (optional)
  createdAt: Date; // Timestamp when the location was created
  updatedAt: Date; // Timestamp when the location was last updated
}
