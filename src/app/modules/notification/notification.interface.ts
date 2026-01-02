import { Types } from "mongoose";

// Location-based notification criteria
export interface LocationCriteria {
  locationId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

// Weather-based notification criteria
export interface WeatherCriteria {
  condition?: "clear" | "cloudy" | "rain" | "snow";
  minTemperature?: number;
  maxWindSpeed?: number;
  sunriseQualityScore?: number; // AI-based
}

// Category-based notification
export interface NotificationCategory {
  type: "epic_spot" | "hike" | "campground" | "freedom_camping";
  priority?: "low" | "medium" | "high";
}

// Payload from controller/service
export interface NotificationPayload {
  userId?: string;
  message: string;
  location?: LocationCriteria;
  weather?: WeatherCriteria;
  category?: NotificationCategory;
}

// User notification preferences
export interface NotificationPreferences {
  location: boolean;
  weather: boolean;
  category: boolean;
}

// Push notification payload (FCM/APNS ready)
export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// DB notification entity
export interface INotification {
  id?: string;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: "location" | "weather" | "category" | "system";
  metadata?: Record<string, any>;
  sentAt?: Date;
}
