import { Document } from "mongoose";

// Define the user interface (for TypeScript typing)
export interface IUser {
  _id: string; // MongoDB ObjectId, or can be string if using string IDs
  email: string;
  role: Role;
  isActive: IsActive; // Enum for user status (active, blocked, inactive)
  isDeleted: boolean; // Whether the user is deleted
}

export enum Role {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum IsActive {
  ACTIVE = "active",
  BLOCKED = "blocked",
  INACTIVE = "inactive",
}
