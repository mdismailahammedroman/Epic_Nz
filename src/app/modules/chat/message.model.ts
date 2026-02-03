import { Schema, model, Types } from "mongoose";

const messageSchema = new Schema(
  {
    chat: { type: Types.ObjectId, ref: "Chat", required: true },
    sender: { type: Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Message = model("Message", messageSchema);
