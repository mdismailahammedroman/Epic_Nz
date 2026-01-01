import { Schema, model } from "mongoose";
import { IUser, Role, UserStatus, AuthProviderType } from "./user.interface";

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
      required: false, // optional for OAuth users
      select: false, // 🔐 IMPORTANT: never return password by default
    },
    profile_picture: {
      type: String,
    },

    /* 🔐 AUTH PROVIDERS */
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

    /* 🌍 LOCATION */
    location: {
      lat: { type: Number },
      long: { type: Number },
    },

    /* ⚙️ PREFERENCES */
    preferences: {
      language: { type: String, default: "en" },
      theme: { type: String, default: "light" },
      app_notifications: { type: Boolean, default: true },
      email_notifications: { type: Boolean, default: true },
      notifications_enabled: { type: Boolean, default: true },
      location_access: { type: Boolean, default: false },
    },

    /* 👤 ROLE & STATUS */
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

    /* ❤️ SAVED LOCATIONS */
    savedLocations: [
      {
        type: Schema.Types.ObjectId,
        ref: "Location",
      },
    ],

    /* 🔑 FORGOT PASSWORD FIELDS (NEW) */
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
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
