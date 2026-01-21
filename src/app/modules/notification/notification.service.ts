import { sendPushNotification } from "./../../utils/notificationUtils";
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import { INotifyPreference } from "./notification.interface";
import { Notification, NotificationPreference } from "./notification.model";
import AppError from "../../errorHelper/AppError";
import User from "../user/user.model";

// Get user's notification preferences (using)
const getUserNotificationPreferences = async (userId: string) => {
  const preferences = await NotificationPreference.findOne({ user: userId });

  if (!preferences) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Notification preferences not found",
    );
  }

  return preferences;
};

// Update notification preferences (using)
const updateNotificationPreferences = async (
  userId: string,
  payload: Partial<INotifyPreference>,
) => {
  const preferences = await NotificationPreference.findOne({ user: userId });

  if (!preferences) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Notification preferences not found",
    );
  }

  const updatedPreferences = await NotificationPreference.findOneAndUpdate(
    { user: userId },
    payload,
    { new: true, runValidators: true },
  );

  return updatedPreferences;
};

// Get user's notification
const getUsersNotificationService = async (
  userId: string,
  query: Record<string, string>,
) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const sort = query.sort || "-createdAt";

  const notifications = await Notification.find({
    $or: [{ user: userId }, { receiverIds: [userId] }],
  })
    .skip(skip)
    .limit(limit)
    .sort(sort);

  return notifications;
};

// Send Push Notification
// Service to send push notifications

// Notify nearby users about a new location
const notifyNearbyUsers = async (location: any) => {
  if (!location.coordinates || !location.coordinates.coordinates) {
    console.log("Location has no coordinates.");
    return;
  }

  const [longitude, latitude] = location.coordinates.coordinates;

  // Find nearby users within a 10 km radius
  const nearbyUsers = await User.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: 10000, // 10 km radius
      },
    },
    "preferences.notifications_enabled": true, // Only notify users with notifications enabled
    fcmTokens: { $exists: true, $not: { $size: 0 } }, // Ensure users have FCM tokens
  }).select("fcmTokens");

  const tokens = nearbyUsers.flatMap((user) => user.fcmTokens || []);
  const uniqueTokens = [...new Set(tokens)];

  if (uniqueTokens.length > 0) {
    const title = "New Location Alert!";
    const body = `A new location "${location.name}" has been approved nearby! Check it out.`;
    const data = { locationId: location._id.toString() };

    // Send push notification to all nearby users
    sendPushNotification(uniqueTokens, title, body, data);
  } else {
    console.log("No nearby users found to notify.");
  }
};

export const NotificationService = {
  getUserNotificationPreferences,
  updateNotificationPreferences,
  getUsersNotificationService,
  notifyNearbyUsers,
};
