/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { feedbackService } from "./feedback.service";

const createFeedback = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;

  const created = await feedbackService.createFeedback(
    userId, // Pass the string ID
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "Feedback submitted successfully",
    data: created,
  });
});

const getAllFeedbacks = CatchAsync(async (req: Request, res: Response) => {
  // Cast req.query to the record type expected by the service
  const result = await feedbackService.getAllFeedbacks(
    req.query as Record<string, string>,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Feedback list fetched",
    meta: result.meta,
    data: result.data,
  });
});

const getMyFeedbacks = CatchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user as JwtPayload;

  const result = await feedbackService.getMyFeedbacks(userId, req.query as any);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "My feedbacks fetched",
    meta: result.meta,
    data: result.data,
  });
});

export const feedbackController = {
  createFeedback,
  getAllFeedbacks,
  getMyFeedbacks,
};
