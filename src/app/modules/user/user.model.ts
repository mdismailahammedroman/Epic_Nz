import { Schema, model } from "mongoose";
import {
  IUser,
  Role,
  UserStatus,
  Plan,
  SubscriptionStatus,
  AuthProviderType,
} from "./user.interface";

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

    notifications_enabled: {
      type: Boolean,
      default: true,
    },

    preferences: {
      language: { type: String, default: "en" },
      theme: { type: String, default: "light" },
      categories: { type: [String], default: [] },
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
    subscription: {
      plan_type: {
        type: String,
        enum: Object.values(Plan),
        default: Plan.TRIAL,
      },

      start_date: {
        type: Date,
        default: Date.now,
      },

      end_date: {
        type: Date,
        default: null,
      },

      status: {
        type: String,
        enum: Object.values(SubscriptionStatus),
        default: SubscriptionStatus.ACTIVE,
      },

      ai_features_access: {
        type: Boolean,
        default: false,
      },

      ads_free: {
        type: Boolean,
        default: false,
      },

      payment_method: {
        type: String,
      },

      renewal_date: {
        type: Date,
      },

      total_spent: {
        type: Number,
        default: 0,
      },

      auto_renew: {
        type: Boolean,
        default: true,
      },
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
