import { Schema, model } from "mongoose";
import { IUser, Role, UserStatus, AuthProviderType } from "./user.interface"; // Ensure user.interface is defined correctly

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Password is optional if using third-party auth
    },
    profile_picture: {
      type: String,
    },
    auth_providers: [
      {
        provider: {
          type: String,
          enum: Object.values(AuthProviderType),
          required: true,
        },
        providerID: {
          type: String,
          required: true,
        },
      },
    ],
    location: {
      lat: { type: Number },
      long: { type: Number },
    },
    preferences: {
      language: {
        type: String,
        default: "en",
      },
      theme: {
        type: String,
        default: "light",
      },
      app_notifications: {
        type: Boolean,
        default: true,
      },
      email_notifications: {
        type: Boolean,
        default: true,
      },
      notifications_enabled: {
        type: Boolean,
        default: true,
      },
      location_access: {
        type: Boolean,
        default: false,
      },
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    savedLocations: [
      {
        type: Schema.Types.ObjectId,
        ref: "Location", // Reference to the Location model if required
      },
    ],
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const User = model<IUser>("User", userSchema);

export default User;
