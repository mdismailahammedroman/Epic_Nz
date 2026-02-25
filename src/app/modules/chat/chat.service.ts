/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload } from "jsonwebtoken";

import { Message } from "./message.model";
import AppError from "../../errorHelper/AppError";
import { getIo } from "../socket/socket.store";
import User from "../user/user.model";
import { IMessage, MessageStatus } from "./chat.interface";
import { NotificationService } from "../notification/notification.service";
import { Types } from "mongoose";

const sendMessageService = async (
  user: JwtPayload,
  receiverId: string,
  payload: Partial<IMessage>,
) => {
  const senderId = user.userId;

  // Block sending message to self
  if (String(senderId) === String(receiverId)) {
    throw new AppError(400, "Cannot send message to yourself");
  }

  // Load sender + receiver roles
  const [senderUser, receiverUser] = await Promise.all([
    User.findById(senderId).select("_id full_name role"),
    User.findById(receiverId).select("_id full_name role"),
  ]);

  if (!senderUser) throw new AppError(401, "Invalid sender");
  if (!receiverUser) throw new AppError(404, "Receiver not found");

  const senderRole = String((senderUser as any).role || "USER");
  const receiverRole = String((receiverUser as any).role || "USER");

  /**
   * ✅ Core rule:
   * - USER can message only ADMIN
   * - ADMIN can message anyone
   */
  if (senderRole !== "ADMIN" && receiverRole !== "ADMIN") {
    throw new AppError(403, "Users can only message admin");
  }

  // Create message document
  const messageDoc = await Message.create({
    sender: new Types.ObjectId(senderId),
    receiver: new Types.ObjectId(receiverId),
    message: {
      text: payload.message?.text || "",
      image: payload.message?.image || "",
    },
    status: payload.status || MessageStatus.SENT,
    replyTo: payload.replyTo,
  });

  const io = getIo();

  // Emit only to receiver room
  io.to(String(receiverId)).emit("message", messageDoc);

  // Notify receiver
  await NotificationService.notifyChatMessage(
    receiverId,
    senderUser,
    messageDoc,
  );

  return messageDoc;
};




const getConversationsService = async (user: JwtPayload) => {
  const userId = user.userId;

  // Find all messages where user is sender or receiver
  const messages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .populate("sender", "full_name email profile_picture")
    .populate("receiver", "full_name email profile_picture")
    .sort({ createdAt: -1 });

  // Map to store unique conversations
  const conversationsMap = new Map<string, any>();

  messages.forEach((msg) => {
    const sender = msg.sender as any;
    const receiver = msg.receiver as any;

    // Determine the "other user"
    const otherUser = sender?._id.toString() === userId ? receiver : sender;

    if (!otherUser) return; // skip if somehow undefined

    if (!conversationsMap.has(otherUser._id.toString())) {
      conversationsMap.set(otherUser._id.toString(), {
        user: otherUser,
        lastMessage: msg,
      });
    }
  });

  // Convert Map to array
  const conversations = Array.from(conversationsMap.values());

  return conversations;
};

const getMessagesService = async (user: JwtPayload, otherUserId: string) => {
  const userId = user.userId;

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: otherUserId },
      { sender: otherUserId, receiver: userId },
    ],
  })
    .populate("sender", "full_name email profile_picture")
    .populate("receiver", "full_name email profile_picture")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "full_name email" },
    })
    .sort({ createdAt: 1 });

  return messages;
};

export const chatService = {
  sendMessageService,
  getConversationsService,
  getMessagesService,
};
