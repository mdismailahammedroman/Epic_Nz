/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import User from "../user/user.model";
import { Role } from "../user/user.interface";
import { Notification } from "./notification.model";
import { INotificationData, NotificationType } from "./notification.interface";
import { getIo } from "../socket/socket.store";
import { sendPushToTokens } from "../../utils/sendPushNotification";

const NOTI_ROOM = (userId: string) => `notification_${userId}`;

// ✅ socket emit to notification room
const emitNotification = (
  userIds: (string | Types.ObjectId)[],
  payload: any,
) => {
  try {
    const io = getIo();
    userIds.forEach((id) => {
      io.to(NOTI_ROOM(String(id))).emit("notification", payload);
    });
  } catch {
    // socket not initialized
  }
};

const createInApp = async (
  userIds: Types.ObjectId[],
  type: NotificationType,
  title: string,
  body: string,
  data?: INotificationData,
) => {
  if (!userIds.length) return [];

  const docs = userIds.map((id) => ({
    user: id,
    type,
    title,
    body,
    data,
    isRead: false,
  }));

  return Notification.insertMany(docs);
};

const pushToUserIds = async (
  userIds: Types.ObjectId[],
  title: string,
  body: string,
  data?: INotificationData,
) => {
  const users = await User.find({ _id: { $in: userIds } }).select("fcmTokens");
  const tokens = users.flatMap((u: any) => u.fcmTokens || []).filter(Boolean);

  if (!tokens.length) return { successCount: 0, failureCount: 0 };

  // ✅ important: data must be string or firebase will fail
  return sendPushToTokens(tokens, title, body, data);
};

// ✅ 1) user submit -> notify all admins
const notifyAdminsLocationSubmitted = async (location: any) => {
  const admins = await User.find({
    role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] },
  }).select("_id fcmTokens");

  const adminIds = admins.map((a: any) => a._id as Types.ObjectId);

  const title = "New Location Submitted";
  const body = `"${location.name}" is waiting for approval.`;

  const data: INotificationData = {
    locationId: String(location._id),
    deepLink: `/location/${location._id}`,
  };

  const saved = await createInApp(
    adminIds,
    NotificationType.LOCATION_SUBMITTED,
    title,
    body,
    data,
  );

  const pushed = await pushToUserIds(adminIds, title, body, data);

  emitNotification(adminIds, {
    type: NotificationType.LOCATION_SUBMITTED,
    title,
    body,
    data,
  });

  return { inAppCount: saved.length, ...pushed };
};

// ✅ 2) admin approve -> notify creator
const notifyCreatorLocationApproved = async (location: any) => {
  const creatorId = new Types.ObjectId(location.userId);

  const title = "Location Approved";
  const body = `Your location "${location.name}" has been approved.`;

  const data: INotificationData = {
    locationId: String(location._id),
    deepLink: `/location/${location._id}`,
  };

  const saved = await createInApp(
    [creatorId],
    NotificationType.LOCATION_APPROVED,
    title,
    body,
    data,
  );

  const pushed = await pushToUserIds([creatorId], title, body, data);

  emitNotification([creatorId], {
    type: NotificationType.LOCATION_APPROVED,
    title,
    body,
    data,
  });

  return { inAppCount: saved.length, ...pushed };
};

// ✅ 3) admin approve -> notify other users (excluding creator)
const notifyUsersNewApprovedLocation = async (location: any) => {
  const creatorObjectId = new Types.ObjectId(String(location.userId));

  const users = await User.find({
    role: Role.USER,
    _id: { $ne: creatorObjectId }, // ✅ safe ObjectId compare
  }).select("_id fcmTokens");

  const userIds = users.map((u: any) => u._id as Types.ObjectId);

  const title = "New Location Added";
  const body = `"${location.name}" is now available.`;

  const data: INotificationData = {
    locationId: String(location._id),
    deepLink: `/location/${location._id}`,
  };

  const saved = await createInApp(
    userIds,
    NotificationType.NEW_LOCATION_APPROVED,
    title,
    body,
    data,
  );

  const pushed = await pushToUserIds(userIds, title, body, data);

  emitNotification(userIds, {
    type: NotificationType.NEW_LOCATION_APPROVED,
    title,
    body,
    data,
  });

  return { inAppCount: saved.length, ...pushed };
};

// ✅ 4) chat message -> notify receiver
const notifyChatMessage = async (
  receiverId: string,
  sender: any,
  messageDoc: any,
) => {
  const receiverObjectId = new Types.ObjectId(receiverId);

  const title = "New Message";
  const body = `${sender?.full_name || "Someone"} sent you a message`;

  const data: INotificationData = {
    senderId: String(sender?._id),
    receiverId,
    chatId: String(messageDoc?._id),
    deepLink: `/chat/${sender?._id}`,
  };

  const saved = await createInApp(
    [receiverObjectId],
    NotificationType.CHAT_MESSAGE,
    title,
    body,
    data,
  );

  const pushed = await pushToUserIds([receiverObjectId], title, body, data);

  emitNotification([receiverObjectId], {
    type: NotificationType.CHAT_MESSAGE,
    title,
    body,
    data,
  });

  return { inAppCount: saved.length, ...pushed };
};

const getMyNotifications = async (
  userId: string,
  query: Record<string, string>,
) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: userId }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit), // ✅ FIXED KEY
    },
    data,
  };
};

const markAsRead = async (userId: string, notificationId: string) => {
  await Notification.updateOne(
    { _id: notificationId, user: userId },
    { $set: { isRead: true } },
  );
  return null;
};

const deleteNotification = async (notificationId: string) => {
  const result = await Notification.deleteOne({
    notificationId,
  });

  return result;
};

const markAllRead = async (userId: string) => {
  // ✅ update all notifications for this user to isRead = true
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } },
  );

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};
// In notification.service.ts
const notifyAdminsFeedbackSubmitted = async (feedback: any) => {
  // Get admins
  const admins = await User.find({
    role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] },
  }).select("_id fcmTokens");

  const adminIds = admins.map((a: any) => a._id as Types.ObjectId);

  if (!adminIds.length)
    return { inAppCount: 0, successCount: 0, failureCount: 0 };

  const title = "New Feedback Submitted";
  const body = `"${feedback.title}" has been submitted by a user.`;

  const data: INotificationData = {
    feedbackId: String(feedback._id),
    deepLink: `/feedback/${feedback._id}`,
  };

  const saved = await createInApp(
    adminIds,
    NotificationType.FEEDBACK_SUBMITTED,
    title,
    body,
    data,
  );
  const pushed = await pushToUserIds(adminIds, title, body, data);

  emitNotification(adminIds, {
    type: NotificationType.FEEDBACK_SUBMITTED,
    title,
    body,
    data,
  });

  return { inAppCount: saved.length, ...pushed };
};

const getAllNotifications = async ({
  page = 1,
  limit = 20,
}: {
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Notification.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

export const NotificationService = {
  notifyAdminsLocationSubmitted,
  notifyCreatorLocationApproved,
  notifyUsersNewApprovedLocation,
  notifyAdminsFeedbackSubmitted,
  notifyChatMessage,
  getMyNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  getAllNotifications,
};
