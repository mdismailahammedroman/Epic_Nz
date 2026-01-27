/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { ActivityLog } from "../modules/activityLog/activityLog.model";

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
