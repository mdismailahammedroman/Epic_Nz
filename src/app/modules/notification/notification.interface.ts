/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export enum NotificationType {
  EPIC_SPOT = "EPIC_SPOT",
  WEATHER_ALERT = "WEATHER_ALERT",
  USER_SUBMISSION = "USER_SUBMISSION",
  PREMIUM_FEATURE = "PREMIUM_FEATURE",
  SUBSCRIPTION_REMINDER = "SUBSCRIPTION_REMINDER",
  SYSTEM = "SYSTEM",
}

export interface IChannel {
  push: boolean;
  email: boolean;
  inApp: boolean;
}

export interface INotification {
  _id?: Types.ObjectId;
  user?: Types.ObjectId;
  eventId?: Types.ObjectId;
  chatId?: Types.ObjectId;
  receiverIds?: Types.ObjectId[];
  type: NotificationType;
  title: string;
  description?: string;
  data?: Record<string, any>;
  isRead?: boolean;
}

export interface INotifyPreference {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  channel: IChannel;
  direct_sms: boolean;
  app: {
    product_updates: boolean;
    special_offers: boolean;
  };
  locationItem: {
    nearbyAlerts: boolean; // Notify when an epic spot is nearby
    weatherAlerts: boolean; // Notify about weather changes at a location
    newSpotRecommendations: boolean; // Notify when new spots are added to a category the user follows
  };
}
