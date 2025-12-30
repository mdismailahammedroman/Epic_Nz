import { Types } from "mongoose";

interface ICoordinates {
  type: "Point"; // GeoJSON point type
  coordinates: [number, number]; // Array of [longitude, latitude]
}

export enum LocationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum CategoryEnum {
  Hikes = "Hikes",
  epicPhotoSpots = "EPIC_PHOTO_SPOTS",
  campgrounds = "Campgrounds",
  freedomCampingLocations = "Freedom_Camping_Locations",
}
// Defining the ILocation interface for Location schema
export interface ILocation {
  user_id: Types.ObjectId; // User ID associated with this location
  placeAs?: string; // Name of the place
  category: CategoryEnum; // Location category
  name: string;
  coordinates: ICoordinates; // Latitude and Longitude
  address?: string; // Full address of the location
  description?: string; // Optional description of the location
  imageUrl: string; // URL of the uploaded image
  ratings?: {
    userId: Types.ObjectId;
    rating: number;
    createdAt: Date;
  }[]; // Array of ratings
  status: LocationStatus; // Location approval status
  AI_Predictions?: string; // AI-generated data like "Epic Rating" or forecasts
  weatherInfo?: string; // Weather information
  approvedByAdmin?: Types.ObjectId; // Admin ID who approved the location (optional)
  createdAt: Date; // Timestamp when the location was created
  updatedAt: Date; // Timestamp when the location was last updated
}
