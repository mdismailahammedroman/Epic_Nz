import { Schema, model } from "mongoose";
import { IAuthProvider, IUser, Role, UserStatus } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerID: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false,
  },
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    full_name: { type: String, required: true, trim: true },
    password: { type: String, required: false, select: false },
    profile_picture: { type: String },
    coverPicture: { type: String },
    auth_providers: [authProviderSchema],
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
      placeName: { type: String },
    },
    preferences: {
      language: { type: String, default: "en" },
      app_notifications: { type: Boolean, default: true },
      notifications_enabled: { type: Boolean, default: true },
      location_access: { type: Boolean, default: false },
    },
    role: { type: String, enum: Object.values(Role), default: Role.USER },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    is_verified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    savedLocations: [{ type: Schema.Types.ObjectId, ref: "Location" }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    notification: { type: Schema.Types.ObjectId, ref: "Notification" }, // Link to the Notification model
    offline_maps: { type: Boolean, default: false }, // Flag for offline map access
    help_support: { type: Boolean, default: false }, // Flag for helpl & support access
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const User = model<IUser>("User", userSchema);
export default User;
