import { ISubscription } from "../subscription/subscription.interface";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
}

export enum AuthProviderType {
  GOOGLE = "google",
  CREDENTIAL = "credential",
}

export interface IAuthProvider {
  provider: AuthProviderType;
  providerID: string;
}

export interface ICoord {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
  placeName?: string;
  // keeping lat/long for backward compatibility if needed, but ideally we switch to coordinates
  lat?: number;
  long?: number;
}

export interface IUserPreferences {
  language: string;
  theme: string;
  app_notifications?: boolean;
  email_notifications?: boolean;
  notifications_enabled?: boolean;
  location_access?: boolean;
}

interface IFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface IUser {
  email: string;
  full_name: string;
  password?: string;
  profile_picture?: IFile | string;
  auth_providers: IAuthProvider[];
  fcmTokens?: string[];
  location?: ICoord;
  notifications_enabled: boolean;
  preferences?: IUserPreferences;
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
