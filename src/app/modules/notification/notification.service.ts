import httpStatus from "http-status-codes";
import { INotifyPreference } from "./notification.interface";
import { Notification, NotificationPreference } from "./notification.model";
import AppError from "../../errorHelper/AppError";

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

export const NotificationService = {
  getUserNotificationPreferences,
  updateNotificationPreferences,
  getusersNotificationService,
};
