import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CatchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/SendResponse";
import { getActivityLogs } from "./activityLog.service";

const getActivityLogList = CatchAsync(async (req: Request, res: Response) => {
  const result = await getActivityLogs(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Activity logs fetched",
    meta: result.meta,
    data: result.data,
  });
});
export const activityLogController = {
  getActivityLogList,
};
