import { userServices } from "./../user/user.service";
import { JwtPayload } from "jsonwebtoken";
import { Role } from "../user/user.interface";
import { Chat } from "./chat.model";
import { Message } from "./message.model";
import AppError from "../../errorHelper/AppError";
import { getIo } from "../socket/socket.store";

const sendMessageService = async (
  sender: JwtPayload,
  chatId: string | undefined,
  text: string,
) => {
  // 1) extract real sender ID
  const senderIdValue =
    typeof sender === "string" ? sender : (sender.userId as string); // ensure JWT payload has userId property

  if (!senderIdValue) {
    throw new AppError(400, "Sender ID not provided");
  }

  let finalChatId = chatId;

  // 2) auto create chat if not exists
  if (!finalChatId) {
    const admin = await userServices.getAdminForUser();
    const adminId = admin._id.toString();

    const existingChat = await Chat.findOne({
      user: senderIdValue,
      admin: adminId,
    });

    if (existingChat) {
      finalChatId = existingChat._id.toString();
    } else {
      const newChat = await Chat.create({
        user: senderIdValue,
        admin: adminId,
      });
      finalChatId = newChat._id.toString();
    }
  }

  // 3) Verify finalChat exists
  const chat = await Chat.findById(finalChatId);
  if (!chat) throw new AppError(404, "Chat not found");

  // 4) Check sender is in chat
  if (
    chat.user.toString() !== senderIdValue &&
    chat.admin.toString() !== senderIdValue
  ) {
    throw new AppError(403, "You cannot send message to this chat");
  }

  // 5) Create and save message
  const message = await Message.create({
    chat: chat._id,
    sender: senderIdValue,
    text,
  });

  chat.lastMessage = message._id;
  await chat.save();

  // 6) populate other party
  await chat.populate({
    path: chat.user.toString() === senderIdValue ? "admin" : "user",
    select: "name email",
  });

  return { chat, message };
};

const getConversationsService = async (
  userId: string,
  role: Role.USER | Role.ADMIN | Role.SUPER_ADMIN,
) => {
  let chats;

  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    chats = await Chat.find({ admin: userId })
      .populate("user", "name email") // get user info
      .sort({ updatedAt: -1 }); // newest first
  } else {
    chats = await Chat.find({ user: userId })
      .populate("admin", "name email") // get admin info
      .sort({ updatedAt: -1 });
  }

  // Populate **all messages** for each chat
  const chatsWithMessages = await Promise.all(
    chats.map(async (chat) => {
      const messages = await Message.find({ chat: chat._id }).sort({
        createdAt: 1,
      });
      return {
        ...chat.toObject(),
        messages,
      };
    }),
  );

  return chatsWithMessages;
};

// Get messages for a chat
const getMessagesService = async (chatId: string, userId: string) => {
  // 1️⃣ Validate input
  if (!userId) {
    throw new AppError(401, "Unauthorized");
  }

  // 2️⃣ Check chat exists
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new AppError(404, "Chat not found");
  }

  // 3️⃣ Check user belongs to chat (user or admin)
  const isAllowed =
    chat.user.toString() === userId || chat.admin.toString() === userId;
  if (!isAllowed) {
    throw new AppError(403, "You are not allowed to view this chat");
  }

  // 4️⃣ Fetch all messages for this chat
  const messages = await Message.find({ chat: chatId })
    .sort({ createdAt: 1 }) // oldest first
    .populate("sender", "name email role"); // populate sender info

  // 5️⃣ Return
  return {
    chatId: chat._id,
    user: chat.user,
    admin: chat.admin,
    messages,
  };
};

// Mark messages as read
const markMessagesAsReadService = async (chatId: string, userId: string) => {
  const result = await Message.updateMany(
    { chat: chatId, sender: { $ne: userId }, isRead: false },
    { $set: { isRead: true } },
  );
  const io = getIo();
  io.to(chatId).emit("messages-read", {
    chatId,
    readerId: userId,
  });
  return result;
};

export const chatService = {
  sendMessageService,
  getConversationsService,
  getMessagesService,
  markMessagesAsReadService,
};
