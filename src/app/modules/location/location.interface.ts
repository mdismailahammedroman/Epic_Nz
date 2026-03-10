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
export enum IWaterTheaterType {
  CLOUDY = "Cloudy",
  RAINY = "Rainy",
  SUNNY = "Sunny",
  STORMY = "Stormy",
  WINDY = "Windy",
  FOGGY = "Foggy",
}

// Animal clearance
export enum IAnimalClearance {
  PET_FRIENDLY = "Pet Friendly",
  SERVICE_ANIMALS_ONLY = "Service Animals Only",
  NOT_PET_FRIENDLY = "Not Pet Friendly",
}

// Network quality
export enum INetworkQuality {
  EXCELLENT = "Excellent",
  GOOD = "Good",
  FAIR = "Fair",
  POOR = "Poor",
  BAD = "Bad",
}

export interface ILocation {
  userId: Types.ObjectId;
  placeAs?: string;
  category: CategoryEnum;
  name: string;
  coordinates: ICoordinates;
  address?: string;
  description?: string;
  watererType: IWaterTheaterType;
  animalClearance: IAnimalClearance;
  networkQuality: INetworkQuality;
imageUrl: string[];
  ratings?: {
    userId: Types.ObjectId;
    rating: number;
    createdAt: Date;
  }[];
  status: LocationStatus;
  AI_Predictions?: string;
  weatherInfo?: string;
  approvedByAdmin?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
