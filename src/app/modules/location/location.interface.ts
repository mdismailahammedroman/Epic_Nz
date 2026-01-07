import { Types } from "mongoose";

interface ICoordinates {
  type: "Point";
  coordinates: [number, number];
}

export enum LocationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum CategoryEnum {
  EPIC_PHOTO_SPOT = "Epic Photo Spot",
  HIKE = "Hike",
  CAMPGROUND = "Campground",
  FREEDOM_CAMPING = "Freedom Camping",
}

export interface ILocation {
  userId: Types.ObjectId;
  placeAs?: string;
  category: CategoryEnum;
  name: string;
  coordinates: ICoordinates;
  address?: string;
  description?: string;
  imageUrl: string;
  ratings?: {
    userId: Types.ObjectId;
    rating: number;
    createdAt: Date;
  }[];
  status: LocationStatus;
  AI_Predictions?: string;
  weatherInfo?: string;
  approvedByAdmin?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
