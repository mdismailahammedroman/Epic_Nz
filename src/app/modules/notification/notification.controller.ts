import httpStatus from "http-status-codes";

import { JwtPayload } from "jsonwebtoken";
import { CatchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import { sendResponse } from "../../utils/SendResponse";

// Get user's notification preferences (using)
const getUserNotificationPreferences = CatchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user?.userId;

    const result = await NotificationService.getUserNotificationPreferences(
      userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification preferences retrieved successfully",
      data: result,
    });
  }
);

// Update notification preferences (bulk update) (using)
const updateNotificationPreferences = CatchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user?.userId;
    const payload = req.body;

    const result = await NotificationService.updateNotificationPreferences(
      userId,
      payload
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification preferences updated successfully",
      data: result,
    });
  }
);

// Get user's notification preferences (using)
const getUserNotifications = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const query = req.query as Record<string, string>;
  const result = await NotificationService.getusersNotificationService(
    userId,
    query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification retrieved successfully",
    data: result,
  });
});

export const NotificationController = {
  getUserNotificationPreferences,
  updateNotificationPreferences,
  getUserNotifications,
};
