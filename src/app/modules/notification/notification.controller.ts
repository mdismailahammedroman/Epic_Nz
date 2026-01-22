import httpStatus from "http-status-codes";

import { JwtPayload } from "jsonwebtoken";
import { CatchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import { sendResponse } from "../../utils/SendResponse";
import Location from "../location/location.model";
import AppError from "../../errorHelper/AppError";

const notifyNearbyUsers = CatchAsync(async (req: Request, res: Response) => {
  const { locationId } = req.body;

  if (!locationId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Location ID is required");
  }

  const location = await Location.findById(locationId);

  if (!location) {
    throw new AppError(httpStatus.NOT_FOUND, "Location not found");
  }

  const result = await NotificationService.notifyNearbyUsers(location);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Nearby users notified successfully",
    data: result,
  });
});

// Get user's notification preferences (using)
const getUserNotificationPreferences = CatchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user?.userId;

    const result =
      await NotificationService.getUserNotificationPreferences(userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification preferences retrieved successfully",
      data: result,
    });
  },
);

// Update notification preferences (bulk update) (using)
const updateNotificationPreferences = CatchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const userId = user?.userId;
    const payload = req.body;

    const result = await NotificationService.updateNotificationPreferences(
      userId,
      payload,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification preferences updated successfully",
      data: result,
    });
  },
);

// Get user's notification preferences (using)
const getUserNotifications = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;
  const query = req.query as Record<string, string>;
  const result = await NotificationService.getUsersNotificationService(
    userId,
    query,
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
  notifyNearbyUsers,
};
