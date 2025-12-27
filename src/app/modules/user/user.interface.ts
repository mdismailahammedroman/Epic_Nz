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

export enum Plan {
  TRIAL = "TRIAL",
  MONTHLY = "MONTHLY",
  ANNUAL = "ANNUAL",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  SUSPENDED = "SUSPENDED",
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
}

// ===== Interfaces =====
export interface IUserPreferences {
  language: string;
  theme: string;
  categories: string[];
}

export interface IUserSubscription {
  plan_type: Plan;
  start_date: Date;
  end_date: Date | null;
  status: SubscriptionStatus;
  ai_features_access: boolean;
  ads_free: boolean;
  payment_method?: string;
  renewal_date?: Date;
  total_spent: number;
  auto_renew: boolean;
}

export interface IUser {
  email: string;
  full_name: string;
  password?: string;
  profile_picture?: string;

  auth_providers: IAuthProvider[]; // 👈 added
  location?: ICoord; // 👈 added (optional)

  notifications_enabled: boolean;
  preferences?: IUserPreferences;

  role: Role;
  status: UserStatus;
  is_verified: boolean;
  isDeleted: boolean;
  subscription: IUserSubscription;

  created_at: Date;
  updated_at: Date;
}
