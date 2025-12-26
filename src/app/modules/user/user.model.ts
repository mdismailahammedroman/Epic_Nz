import mongoose, { Schema } from "mongoose";
import {
  AuthProviderType,
  IAuthProvider,
  IUser,
  Role,
  userStatus,
} from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>({
  provider: {
    type: String,
    enum: Object.values(AuthProviderType),
    required: true,
  },
  providerID: { type: String, required: true },
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
      default: Role.USER,
    },
    phone: { type: String },
    picture: { type: String },
    address: { type: String },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    IsActive: {
      type: String,
      enum: Object.values(userStatus), //
      default: userStatus.PENDING,
    },
    isDeleted: { type: Boolean, default: false },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: false,
    },
    auths: [authProviderSchema],
    approved: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.virtual("id").get(function () {
  return this._id.toString();
});

export const User = mongoose.model<IUser>("User", userSchema);
