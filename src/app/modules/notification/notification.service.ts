import httpStatus from "http-status-codes";
import { INotifyPreference } from "./notification.interface";
import { Notification, NotificationPreference } from "./notification.model";
import AppError from "../../errorHelper/AppError";
import { fcm } from "../../config/firebase.config";
import User from "../user/user.model";

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
// Service to send push notifications
const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens provided. Skipping notification.");
    return; // Early return if no tokens are provided
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      tokens,
    };

    // Send notifications to all tokens using Firebase Cloud Messaging (FCM)
    const response = await fcm.sendEachForMulticast(message);

    // Log the response from FCM
    console.log("Successfully sent message:", response);

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]); // Collect failed tokens
        }
      });

      console.log(
        "List of tokens that caused failures: " + failedTokens.join(", ")
      );
    } else {
      console.log("All notifications were sent successfully!");
    }

    return response;
  } catch (error) {
    console.error("Error sending push notification:", error); // Improved error logging
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to send push notification"
    );
  }
};

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
    await NotificationService.sendPushNotification(
      uniqueTokens,
      title,
      body,
      data
    );
  } else {
    console.log("No nearby users found to notify.");
  }
};

export const NotificationService = {
  getUserNotificationPreferences,
  updateNotificationPreferences,
  getusersNotificationService,
  sendPushNotification,
  notifyNearbyUsers,
};
