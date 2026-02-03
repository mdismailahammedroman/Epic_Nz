import { Schema, model, Types } from "mongoose";
import { IMessage, MessageStatus } from "./chat.interface";

// const messageSchema = new Schema(
//   {
//     chat: { type: Types.ObjectId, ref: "Chat", required: true },
//     sender: { type: Types.ObjectId, ref: "User", required: true },
//     text: { type: String, required: true },
//     isRead: { type: Boolean, default: false },
//   },
//   { timestamps: true },
// );

// export const Message = model("Message", messageSchema);

const subSchema = new Schema(
  {
    text: { type: String },
    image: { type: String },
  },
  {
    versionKey: false,
    timestamps: false,
    _id: false,
  },
);

const messageSchema = new Schema<IMessage>(
  {
    receiver: { type: Types.ObjectId, ref: "User", required: true },
    sender: { type: Types.ObjectId, ref: "User", required: true },
    message: subSchema,
    status: { type: String, enum: [...Object.keys(MessageStatus)] },
    replyTo: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Message = model<IMessage>("Message", messageSchema);
