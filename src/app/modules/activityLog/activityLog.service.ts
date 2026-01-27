/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActivityLog } from "./activityLog.model";

export const getActivityLogs = async (query: any) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (query.action) filter.action = query.action;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.status) filter.status = query.status;
  if (query.actorRole) filter.actorRole = query.actorRole;

  if (query.search) {
    filter.$or = [
      { message: { $regex: query.search, $options: "i" } },
      { action: { $regex: query.search, $options: "i" } },
      { "meta.targetName": { $regex: query.search, $options: "i" } },
    ];
  }

  const [data, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorId", "full_name email role"),
    ActivityLog.countDocuments(filter),
  ]);

  return { data, meta: { page, limit, total } };
};
