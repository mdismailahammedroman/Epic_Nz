import { model, Schema } from "mongoose";
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

// Define User Schema
const userSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
      default: Role.GUEST,
    },
    phone: { type: String },
    picture: { type: String },
    address: { type: String },
    nationalId: { type: String },
    profileImage: { type: String },
    dateOfBirth: { type: Date },
    isVerified: { type: Boolean, default: false },
    userStatus: {
      type: String,
      enum: Object.values(userStatus),
      default: userStatus.PENDING, // Defaulting to PENDING
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

// Virtual for `id`
userSchema.virtual("id").get(function () {
  return this._id.toString();
});

// Create model
export const User = model<IUser>("User", userSchema);
