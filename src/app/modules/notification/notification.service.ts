import httpStatus from "http-status-codes";
import { INotifyPreference } from "./notification.interface";
import { Notification, NotificationPreference } from "./notification.model";
import AppError from "../../errorHelper/AppError";
import { fcm } from "../../config/firebase.config";
import User from "../user/user.model";
import { ILocation } from "../location/location.interface"; // Assuming ILocation is exported
import Location from "../location/location.model";

// Get user's notification preferences (using)
const getUserNotificationPreferences = async (userId: string) => {
  const preferences = await NotificationPreference.findOne({ user: userId });

  if (!preferences) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Notification preferences not found"
    );
  }

  return preferences;
};

// Update notification preferences (using)
const updateNotificationPreferences = async (
  userId: string,
  payload: Partial<INotifyPreference>
) => {
  const preferences = await NotificationPreference.findOne({ user: userId });

  if (!preferences) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Notification preferences not found"
    );
  }

  const updatedPreferences = await NotificationPreference.findOneAndUpdate(
    { user: userId },
    payload,
    { new: true, runValidators: true }
  );

  return updatedPreferences;
};

// Get user's notification
const getusersNotificationService = async (
  userId: string,
  query: Record<string, string>
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
const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  if (!tokens.length) return;

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };

    const response = await fcm.sendEachForMulticast(message);
    console.log("Successfully sent message:", response);
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log("List of tokens that caused failures: " + failedTokens);
    }
    return response;
  } catch (error) {
    console.log("Error sending message:", error);
    throw error;
  }
};

// Notify nearby users about a new location
const notifyNearbyUsers = async (location: any) => {
  // Find users within 10km (10000 meters)
  // Assuming 'coordinates' in Location is { type: "Point", coordinates: [lon, lat] }
  // And User model has 'location.coordinates' indexed with 2dsphere

  if (!location.coordinates || !location.coordinates.coordinates) {
    console.log("Location has no coordinates");
    return;
  }

  const [longitude, latitude] = location.coordinates.coordinates;

  const nearbyUsers = await User.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: 10000, // 10km
      },
    },
    // Only notify users who have notifications enabled
    "preferences.notifications_enabled": true,
    // Ensure they have FCM tokens
    fcmTokens: { $exists: true, $not: { $size: 0 } },
  }).select("fcmTokens");

  const tokens = nearbyUsers.flatMap((user) => user.fcmTokens || []);
  const uniqueTokens = [...new Set(tokens)];

  if (uniqueTokens.length > 0) {
    return await sendPushNotification(
      uniqueTokens,
      "New Location Alert! 📍",
      `A new location "${location.name}" has been approved nearby! Check it out.`,
      { locationId: location._id.toString() }
    );
  }

  return { message: "No nearby users found to notify" };
};

export const NotificationService = {
  getUserNotificationPreferences,
  updateNotificationPreferences,
  getusersNotificationService,
  sendPushNotification,
  notifyNearbyUsers,
};
