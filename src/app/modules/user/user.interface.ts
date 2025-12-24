import mongoose, { Schema, Document, Types, model } from "mongoose";

// Preferences interface
interface Preferences {
  notifications: boolean;
  categories: (
    | "epic photo spots"
    | "Hike"
    | "Campground"
    | "Freedom Camping"
  )[];
}

// Enum for Auth Provider Type
export enum AuthProviderType {
  GOOGLE = "google",
  CREDENTIAL = "credential",
}

// AuthProvider interface
export interface IAuthProvider {
  provider: AuthProviderType; // Google or credential
  providerID: string;
}

// Enum for Roles
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

// Enum for subscription status
export enum subscriptionStatus {
  ACTIVE = "active", // The subscription is active and the user has access
  EXPIRED = "expired", // The subscription has expired
  CANCELLED = "cancelled", // The subscription was cancelled
  SUSPENDED = "suspended", // The subscription is temporarily suspended
}

// Enum for subscription plans
export enum Plan {
  TRIAL = "trial", // Trial plan (usually free for a limited time)
  MONTHLY = "monthly", // Monthly subscription plan
  ANNUAL = "annual", // Annual subscription plan
}

// Interface for Subscription
export interface Subscription {
  plan: Plan; // Plan type (trial, monthly, annual)
  startDate: Date; // Subscription start date
  endDate: Date | null; // Subscription end date (null if ongoing)
  status: subscriptionStatus; // Current status of the subscription
}

// Enum for user status
export enum userStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING", // Adding PENDING status
}

// User interface
export interface IUser {
  _id?: Types.ObjectId | string;
  userId?: Types.ObjectId | string;
  name: string;
  email: string;
  password?: string;
  picture?: string;
  phone?: string;
  address?: string;
  isDeleted?: boolean;
  role: Role;
  userStatus?: userStatus;
  isVerified?: boolean;
  approved?: boolean;
  wallet?: Types.ObjectId;
  auths: IAuthProvider[]; // Array of auth providers
  nationalId?: string;
  profileImage?: string;
  dateOfBirth?: Date;
  commissionRate?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
