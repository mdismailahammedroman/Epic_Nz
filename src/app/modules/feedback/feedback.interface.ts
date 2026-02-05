import { Types } from "mongoose";

export enum FeedbackCategory {
  BUG = "BUG",
  FEATURE_REQUEST = "FEATURE_REQUEST",
  UI_UX = "UI_UX",
  PERFORMANCE = "PERFORMANCE",
  OTHER = "OTHER",
}

export enum FeedbackStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export interface IFeedback {
  _id?: Types.ObjectId;

  user: Types.ObjectId; // who submitted
  category?: FeedbackCategory;

  rating?: number; // 1-5 optional
  title: string;
  message: string;

  // appVersion?: string;
  // platform?: "ANDROID" | "IOS" | "WEB";
  // deviceModel?: string;

  // images?: string[]; // optional screenshots (cloudinary urls)
  // status: FeedbackStatus;

  // resolvedBy?: Types.ObjectId;
  // resolvedNote?: string;

  createdAt?: Date;
  updatedAt?: Date;
}
