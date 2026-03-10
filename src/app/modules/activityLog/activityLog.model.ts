import { Schema, model, Types } from "mongoose";

const activityLogSchema = new Schema(
  {
    actorId: { type: Types.ObjectId, ref: "User", index: true },
    actorRole: { type: String,  index: true },

    action: { type: String,  index: true }, // e.g. LOCATION_SUBMITTED
    entityType: { type: String,  index: true }, // e.g. Location
    entityId: { type: Types.ObjectId, index: true },

    message: { type: String },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
      index: true,
    },

    ip: { type: String },
    userAgent: { type: String },

    meta: { type: Schema.Types.Mixed }, // targetName etc
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ "meta.targetName": 1 });

export const ActivityLog = model("ActivityLog", activityLogSchema);
