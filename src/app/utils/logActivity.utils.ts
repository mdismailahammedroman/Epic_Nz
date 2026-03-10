/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { ActivityLog } from "../modules/activityLog/activityLog.model";

export const logActivity = async (p: {
  actorId?: string;
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
  const actorObjectId =
    p.actorId && Types.ObjectId.isValid(p.actorId)
      ? new Types.ObjectId(p.actorId)
      : undefined;

  const entityObjectId =
    p.entityId && Types.ObjectId.isValid(p.entityId)
      ? new Types.ObjectId(p.entityId)
      : undefined;

  return ActivityLog.create({
    actorId: actorObjectId,
    actorRole: p.actorRole,
    action: p.action,
    entityType: p.entityType,
    entityId: entityObjectId,
    message: p.message,
    status: p.status ?? "SUCCESS",
    ip: p.ip,
    userAgent: p.userAgent,
    meta: p.meta,
    before: p.before,
    after: p.after,
  });
};
