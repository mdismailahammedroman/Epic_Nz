/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { chatService } from "./chat.service";
import { JwtPayload } from "jsonwebtoken";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { StatusCodes } from "http-status-codes";
import User from "../user/user.model";

const sendMessage = CatchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { receiverId } = req.params;
    const user = req.user as JwtPayload;

    const result = await chatService.sendMessageService(
      user,
      receiverId as string,
      req.body,
    );

    // send response
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Message sent successfully!",
      data: result,
    });
  },
);

const getConversations = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const chats = await chatService.getConversationsService(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Conversations fetched successfully",
    data: chats,
  });
});

const getMessages = CatchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { otherUserId } = req.params;

  const messages = await chatService.getMessagesService(
    user,
    otherUserId as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Messages fetched successfully",
    data: messages,
  });
});

const getAdmin = async (req: Request, res: Response) => {
 const admins = await User.find({ role: "ADMIN" }).select("_id full_name role")

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Admins fetched successfully",
    data: admins,
  });
};
export const ChatController = {
  sendMessage, // assuming this is defined elsewhere
  getConversations,
  getMessages,
  getAdmin,
};
