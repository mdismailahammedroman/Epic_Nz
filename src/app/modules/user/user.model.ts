import { Schema, model } from "mongoose";
import { IAuthProvider, IUser, Role, UserStatus } from "./user.interface";

const authProviderSchema = new Schema<IAuthProvider>(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
  },
  {
    versionKey: false,
    _id: false,
  }
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
    auth_providers: [authProviderSchema],
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
      placeName: { type: String },
    },
    preferences: {
      language: { type: String, default: "en" },
      theme: { type: String, default: "light" },
      app_notifications: { type: Boolean, default: true },
      email_notifications: { type: Boolean, default: true },
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
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

userSchema.index({ "location.coordinates": "2dsphere" });

// userSchema.pre("save", function (next: NextFunction) {
//   // Example: Remove duplicate fcmTokens when user saves a new token
//   if (this.isModified("fcmTokens")) {
//     this.fcmTokens = [...new Set(this.fcmTokens)]; // Ensure no duplicates
//   }
//   next();
// });

const User = model<IUser>("User", userSchema);
export default User;
