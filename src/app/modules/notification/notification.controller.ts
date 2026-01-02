import { Request, Response } from "express";
import { CatchAsync } from "../../utils/catchAsync";
import { notificationService } from "./notification.service";
import { sendResponse } from "../../utils/SendResponse";
import { StatusCodes } from "http-status-codes";

// Admin sends category-wise notification
const sendNotification = CatchAsync(async (req: Request, res: Response) => {
  const { message, category } = req.body;

  if (!message || !category) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Message and category are required" });
    return;
  }

  const result = await notificationService.sendNotification({
    message,
    category,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Notification sent successfully",
    data: result,
  });
});

export const notificationController = { sendNotification };
