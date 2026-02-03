import { Types } from "mongoose";

export enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  SEEN = "SEEN",
}

export interface IMessage {
  _id?: Types.ObjectId;
  sender: Types.ObjectId;
  receiver?: Types.ObjectId;
  message: {
    text: string;
    image: string;
  };
  status: MessageStatus;
  replyTo?: Types.ObjectId;
}
