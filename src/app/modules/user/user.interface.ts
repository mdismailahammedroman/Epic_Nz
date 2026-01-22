import { Types } from "mongoose";
import { ISubscription } from "../subscription/subscription.interface";

// User roles enumeration
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

// User status enumeration
export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
}

// Auth providers used for user login (e.g., Google, credentials)
export interface IAuthProvider {
  provider: "google" | "credentials"; // "Google", "Credential"
  providerId: string;
}

// User location coordinates
export interface ICoord {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  placeName?: string;
  lat?: number; // Latitude (for backward compatibility)
  long?: number; // Longitude (for backward compatibility)
}

// User preferences interface
export interface IUserPreferences {
  language: string;
  app_notifications?: boolean;
  notifications_enabled?: boolean;
  location_access?: boolean;
}

// User interface
export interface IUser {
  _id?: Types.ObjectId;
  email: string;
  full_name: string;
  password?: string;
  profile_picture?: string;
  coverPicture?: string;
  auth_providers: IAuthProvider[];
  fcmTokens?: string[];
  location?: ICoord;
  notifications_enabled: boolean;
  preferences?: IUserPreferences;
  notification: Notification;
  offline_maps: boolean;
  help_support: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  role: Role;
  status: UserStatus;
  is_verified: boolean;
  isDeleted: boolean;
  subscription: ISubscription;
  savedLocations?: string[];
  created_at: Date;
  updated_at: Date;
}
