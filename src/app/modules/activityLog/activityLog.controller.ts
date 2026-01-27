import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { getActivityLogs } from "./activityLog.service";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { ActivityLog } from "./activityLog.model";

export const logActivity = async (p: {
  actorId: string;
  actorRole: string;

  action: string;
  entityType: string;
  entityId?: string;

  message?: string;
  status?: "SUCCESS" | "FAILED";

  ip?: string;
  userAgent?: string;

  meta?: any;
  before?: any;
  after?: any;
}) => {
  return ActivityLog.create({
    actorId: new Types.ObjectId(p.actorId),
    actorRole: p.actorRole,
    action: p.action,
    entityType: p.entityType,
    entityId: p.entityId ? new Types.ObjectId(p.entityId) : undefined,
    message: p.message,
    status: p.status ?? "SUCCESS",
    ip: p.ip,
    userAgent: p.userAgent,
    meta: p.meta,
    before: p.before,
    after: p.after,
  });
};

export const activityLogController = {
  list: CatchAsync(async (req: Request, res: Response) => {
    const result = await getActivityLogs(req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Activity logs fetched",
      meta: result.meta,
      data: result.data,
    });
  }),
};
