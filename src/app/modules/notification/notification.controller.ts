/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { StatusCodes } from "http-status-codes";
import { NotificationService } from "./notification.service";

const myNotifications = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const result = await NotificationService.getMyNotifications(
    userId,
    req.query as any,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Notifications fetched",
    meta: result.meta,
    data: result.data,
  });
});

const markRead = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const { notificationId } = req.params;

  await NotificationService.markAsRead(userId, notificationId as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Notification marked as read",
    data: null,
  });
});

const markAllRead = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;

  const result = await NotificationService.markAllRead(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All notifications marked as read",
    data: result,
  });
});

const deleteNotificationController = CatchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await NotificationService.deleteNotification(id as string);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Notification deleted successfully",
      data: null,
    });
  },
);

const getAllNotifications = CatchAsync(async (req: Request, res: Response) => {
  const { page = "1", limit = "20" } = req.query;

  const result = await NotificationService.getAllNotifications({
    page: Number(page),
    limit: Number(limit),
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "All notifications fetched",
    meta: result.meta,
    data: result.data,
  });
});

export const NotificationController = {
  myNotifications,
  markRead,
  markAllRead,
  deleteNotificationController,
  getAllNotifications,
};
