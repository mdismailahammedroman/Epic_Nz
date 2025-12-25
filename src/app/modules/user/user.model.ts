import mongoose, { Schema } from "mongoose";
import {
  AuthProviderType,
  IAuthProvider,
  IUser,
  Role,
  userStatus,
} from "./user.interface";

// Auth provider schema to handle different authentication methods
const authProviderSchema = new Schema<IAuthProvider>({
  provider: {
    type: String,
    enum: Object.values(AuthProviderType),
    required: true,
  },
  providerID: { type: String, required: true },
});

// Define the User Schema
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // This will be used only for email-based login
    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
      default: Role.USER,
    },
    phone: { type: String },
    picture: { type: String }, // Optional image URL
    address: { type: String },
    profileImage: { type: String }, // URL to Cloudinary or other image hosting service
    isVerified: { type: Boolean, default: false },
    userStatus: {
      type: String,
      enum: Object.values(userStatus),
      default: userStatus.PENDING, // Initial status could be 'PENDING'
    },
    isDeleted: { type: Boolean, default: false },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet", // Reference to the Wallet model (if required)
      required: false,
    },
    auths: [authProviderSchema], // Store the different authentication methods
    approved: { type: Boolean, default: false }, // Admin approval flag
    commissionRate: { type: Number, default: 0 }, // Commission for this user (if applicable)
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
    versionKey: false, // Disable versioning (_v field)
  }
);

// Virtual for `id` to get the string representation of the `_id`
userSchema.virtual("id").get(function () {
  return this._id.toString();
});

// Create the User model based on the schema
export const User = mongoose.model<IUser>("User", userSchema);
