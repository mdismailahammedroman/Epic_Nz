import User from "../user/user.model";
import {
  NotificationPayload,
  NotificationCategory,
} from "./notification.interface";

const sendNotification = async ({ message, category }: NotificationPayload) => {
  if (!category) throw new Error("Category is required");

  // Find all users who opted-in for this category
  const users = await User.find({
    [`notificationPreferences.category.${category.type}`]: true,
  });

  for (const user of users) {
    await sendPushNotification(user._id.toString(), message, category);
  }

  return { message, category, recipients: users.length };
};

// Type-safe push notification
const sendPushNotification = async (
  userId: string,
  message: string,
  criteria: NotificationCategory
) => {
  console.log(
    `Sent "${message}" to user ${userId} for category ${criteria.type} (priority: ${criteria.priority})`
  );
};

export const notificationService = { sendNotification };
