import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

const NotificationSchema: Schema<INotification> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["location", "weather", "category", "system"],
      required: true,
    },
    metadata: { type: Object },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<INotification>("Notification", NotificationSchema);
