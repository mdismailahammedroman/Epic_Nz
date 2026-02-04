/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export enum NotificationType {
  LOCATION_SUBMITTED = "LOCATION_SUBMITTED", // user -> admin
  LOCATION_APPROVED = "LOCATION_APPROVED", // admin -> creator
  NEW_LOCATION_APPROVED = "NEW_LOCATION_APPROVED", // approved location -> other users
  CHAT_MESSAGE = "CHAT_MESSAGE",
  SYSTEM = "SYSTEM",
}

export interface INotificationData {
  locationId?: string;
  chatId?: string;
  senderId?: string;
  receiverId?: string;
  deepLink?: string;
  [key: string]: any;
}

export interface INotification {
  _id?: Types.ObjectId;
  user: Types.ObjectId; // receiver user id
  type: NotificationType;
  title: string;
  body: string;
  data?: INotificationData;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
