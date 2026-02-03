import { JwtPayload } from "jsonwebtoken";

import { Message } from "./message.model";
import AppError from "../../errorHelper/AppError";
import { getIo } from "../socket/socket.store";
import User from "../user/user.model";
import { IMessage } from "./chat.interface";

const sendMessageService = async (
  user: JwtPayload,
  receiverId: string,
  payload: Partial<IMessage>,
) => {
  const senderId = user.userId;
  const isReceiverExist = await User.findById(receiverId);
  if (!isReceiverExist) {
    throw new AppError(404, "Receiver not found");
  }

  const sendMessage = await Message.create({
    sender: senderId,
    receiver: receiverId,
    message: {
      text: payload.message?.text,
      image: payload.message?.image,
    },
    status: payload.status,
  });

  const io = getIo();

  io.to(receiverId).emit("message", sendMessage);

  return sendMessage;
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
