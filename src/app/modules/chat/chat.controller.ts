/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { chatService } from "./chat.service";
import { getIo } from "../socket/socket.store";
import { JwtPayload } from "jsonwebtoken";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { StatusCodes } from "http-status-codes";
import { getMaxListeners } from "node:cluster";

const sendMessage = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { chatId, text } = req.body;
    const sender = req.user as JwtPayload;
    const senderId = sender.userId;

    const { chat, message } = await chatService.sendMessageService(
      senderId,
      chatId, // optional
      text,
    );

    const io = getIo();

    // Emit message to room
    io.to(chat._id.toString()).emit("message", message);

    const receiverId =
      chat.user.toString() === sender.userId
        ? chat.admin.toString()
        : chat.user.toString();

    io.to(`notification_${receiverId}`).emit("notification", {
      type: "NEW_MESSAGE",
      chatId: chat._id,
      message,
    });

    // send response
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Message sent successfully!",
      data: { chat, message },
    });
  },
);

const getConversations = CatchAsync(async (req: Request, res) => {
  const user = req.user as JwtPayload;
  const userId = user.userId;
  const conversations = await chatService.getConversationsService(
    userId,
    user.role,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Conversations fetched successfully",
    data: conversations,
  });
});

// GET MESSAGES FOR A CHAT
const getMessages = CatchAsync(async (req: Request, res) => {
  const { chatId } = req.params;
  const user = req.user as JwtPayload;
  const userId = user.userId;

  const conversation = await chatService.getMessagesService(chatId, userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Messages fetched successfully",
    data: conversation,
  });
});

// MARK MESSAGES AS READ
const markMessagesAsRead = CatchAsync(async (req: Request, res) => {
  const { chatId } = req.params;
  const user = req.user as JwtPayload;
  const result = await chatService.markMessagesAsReadService(chatId, user._id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Messages marked as read",
    data: result,
  });
});

export const ChatController = {
  sendMessage, // assuming this is defined elsewhere
  getConversations,
  getMessages,
  markMessagesAsRead,
};
