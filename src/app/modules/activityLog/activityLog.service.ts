/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActivityLog } from "./activityLog.model";

export const getActivityLogs = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {}; // your filters...

  const [data, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(total / limit);

  return {
    data,
    meta: { page, limit, total, totalPage }, // ✅ added totalPage
  };
};
