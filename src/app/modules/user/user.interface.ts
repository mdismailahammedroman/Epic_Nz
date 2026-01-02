import { ISubscription } from "../subscription/subscription.interface";

// ===== Enums =====
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

// ===== Auth =====
export enum AuthProviderType {
  GOOGLE = "google",
  CREDENTIAL = "credential",
}

export interface IAuthProvider {
  provider: AuthProviderType;
  providerID: string;
}

// ===== Location =====
export interface ICoord {
  lat: number;
  long: number;
  placeName?: string;
}

// ===== Preferences =====
export interface IUserPreferences {
  language: string;
  theme: string;
  app_notifications?: boolean;
  email_notifications?: boolean;
  notifications_enabled?: boolean;
  location_access?: boolean;
}

// ===== Profile Picture Interface =====
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
