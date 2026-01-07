import User from "../modules/user/user.model";

export const getAllFcmTokens = async () => {
  // Find all users who have at least one FCM token and notifications enabled
  const usersWithTokens = await User.find({
    "preferences.notifications_enabled": true, // Only get users who have notifications enabled
    fcmTokens: { $exists: true, $not: { $size: 0 } }, // Ensure the user has FCM tokens
  }).select("fcmTokens"); // Select only the fcmTokens field

  // Flatten the array of tokens and ensure no duplicates
  const allTokens = usersWithTokens.flatMap((user) => user.fcmTokens || []);
  const uniqueTokens = [...new Set(allTokens)];

  return uniqueTokens;
};
